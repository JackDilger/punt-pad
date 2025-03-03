import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, X, Loader2, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HorseIcon from "./HorseIcon";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import raceIds from "@/data/race-ids.json";
// Dynamic import of confetti will be used inside component

interface Horse {
  id: string;
  name: string;
  race_name: string;
  result?: 'win' | 'place' | 'loss';
  points: number;
  achievement?: 'best_performer' | 'consistent' | 'underdog';
  odds: number | null;
}

interface StableData {
  team_name: string;
  horses: Horse[];
}

export default function MyStable() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [stableData, setStableData] = useState<StableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [showConfetti, setShowConfetti] = useState(false);

  // State for day filter
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  // Use day IDs from the race-ids.json file with day numbers
  const days = [
    { id: raceIds.days.day1.id, name: `1: ${raceIds.days.day1.name}` },
    { id: raceIds.days.day2.id, name: `2: ${raceIds.days.day2.name}` },
    { id: raceIds.days.day3.id, name: `3: ${raceIds.days.day3.name}` },
    { id: raceIds.days.day4.id, name: `4: ${raceIds.days.day4.name}` }
  ];
  const [selectionsData, setSelectionsData] = useState<any[]>([]);

  useEffect(() => {
    const fetchStableData = async () => {
      setLoading(true);
      
      try {
        const session = await supabase.auth.getSession();
        if (!session.data.session) {
          throw new Error("No active session");
        }
        
        // Fetch user profile to get team name
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('team_name')
          .eq('id', session.data.session?.user.id)
          .single();
          
        if (profileError) throw profileError;
        
        // Fetch user selections with horse and race data
        const { data: selectionsData, error: selectionsError } = await supabase
          .from('fantasy_selections')
          .select(`
            id,
            horse_id,
            race_id,
            day_id,
            horses:horse_id (
              id,
              name,
              result
            ),
            races:race_id (
              id,
              name
            )
          `)
          .eq('user_id', session.data.session?.user.id);

        if (selectionsError) {
          console.error("Error fetching stable data:", selectionsError);
          throw selectionsError;
        }

        // Store selections data for filtering by day
        setSelectionsData(selectionsData || []);

        // Fetch odds data for all horses
        const horseIds = selectionsData.map((selection: any) => selection.horse_id);
        const { data: oddsData, error: oddsError } = await supabase
          .from('fantasy_horses')
          .select('id, fixed_odds')
          .in('id', horseIds);
          
        if (oddsError) {
          console.error("Error fetching odds data:", oddsError);
        }
        
        // Create a map of horse IDs to odds
        const oddsMap = new Map();
        if (oddsData) {
          oddsData.forEach((horse: any) => {
            oddsMap.set(horse.id, horse.fixed_odds);
          });
        }
        
        // Transform the data
        const horses: Horse[] = selectionsData.map((selection: any) => {
          // Calculate points based on result
          let points = 0;
          if (selection.horses.result === 'win') {
            points = 10;
          } else if (selection.horses.result === 'place') {
            points = 5;
          }
          
          return {
            id: selection.horses.id,
            name: selection.horses.name,
            points: points,
            result: selection.horses.result,
            race_name: selection.races.name,
            odds: oddsMap.get(selection.horses.id) || null,
          };
        });
        
        // Add achievements to top performers
        const horsesWithAchievements = [...horses].sort((a, b) => b.points - a.points);
        
        if (horsesWithAchievements.length > 0) {
          // Best performer is the horse with the most points
          horsesWithAchievements[0].achievement = 'best_performer';
          
          // Find an underdog (a horse that won despite odds)
          const underdogIndex = horsesWithAchievements.findIndex(
            (horse) => horse.result === 'win' && horse.points > 0 && horse !== horsesWithAchievements[0]
          );
          
          if (underdogIndex !== -1) {
            horsesWithAchievements[underdogIndex].achievement = 'underdog';
          }
          
          // Find a consistent performer (multiple places)
          const consistentIndex = horsesWithAchievements.findIndex(
            (horse) => horse.result === 'place' && horse !== horsesWithAchievements[0]
          );
          
          if (consistentIndex !== -1) {
            horsesWithAchievements[consistentIndex].achievement = 'consistent';
          }
        }
        
        setStableData({
          team_name: profileData.team_name || 'My',
          horses: horsesWithAchievements,
        });
      } catch (error) {
        console.error("Error fetching stable data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load your stable. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (session) {
      fetchStableData();
    }
  }, [session, toast]);

  const getResultIcon = (result?: 'win' | 'place' | 'loss') => {
    switch (result) {
      case 'win':
        return <Star className="h-5 w-5 text-yellow-500" />;
      case 'place':
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 'loss':
        return (
          <div className="bg-red-500 rounded-full p-0.5">
            <X className="h-4 w-4 text-white" />
          </div>
        );
      default:
        return null;
    }
  };

  const getResultColor = (result?: 'win' | 'place' | 'loss') => {
    if (!result) return 'bg-gray-300';
    
    switch (result) {
      case 'win':
        return 'bg-yellow-500';
      case 'place':
        return 'bg-gray-500';
      case 'loss':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  // Function to trigger confetti effect
  const triggerConfetti = () => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    try {
      import('canvas-confetti').then((confettiModule) => {
        const confetti = confettiModule.default;
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      });
    } catch (error) {
      console.error("Failed to load confetti:", error);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Trigger confetti when switching to winners tab
    if (value === "winners") {
      triggerConfetti();
    }
  };

  const handleHorseClick = async (horse: any) => {
    if (horse.result === 'win' && typeof window !== 'undefined') {
      try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') return;
        
        // Dynamically import confetti only when needed
        const confettiModule = await import('canvas-confetti');
        const confetti = confettiModule.default;
        
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (error) {
        console.error("Failed to load confetti:", error);
      }
    }
  };

  // Filter horses by selected day and tab
  const filteredHorses = useMemo(() => {
    // First filter by day
    let filtered = stableData?.horses || [];
    
    if (selectedDay) {
      console.log("Filtering by day:", selectedDay);
      
      filtered = filtered.filter(horse => {
        // Find the original selection to check its day_id
        const selection = selectionsData?.find((s: any) => s.horse_id === horse.id);
        console.log("Horse:", horse.name, "Selection day_id:", selection?.day_id);
        
        // Compare as strings to ensure proper comparison
        return selection?.day_id === selectedDay;
      });
    }
    
    // Then filter by tab
    if (activeTab === "all") return filtered;
    if (activeTab === "winners") return filtered.filter(horse => horse.result === 'win');
    if (activeTab === "placed") return filtered.filter(horse => horse.result === 'place');
    if (activeTab === "losers") return filtered.filter(horse => horse.result === 'loss');
    
    return filtered;
  }, [stableData, selectedDay, selectionsData, activeTab]);

  const formatResult = (result: 'win' | 'place' | 'loss') => {
    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  const formatAchievement = (achievement: 'best_performer' | 'consistent' | 'underdog') => {
    switch (achievement) {
      case 'best_performer':
        return 'Top Performer';
      case 'consistent':
        return 'Consistent';
      case 'underdog':
        return 'Underdog';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6 overflow-visible">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center">
            <Trophy className="mr-2 h-6 w-6 text-primary animate-pulse" />
            {stableData?.team_name} Stable
          </h1>
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">Filter by day:</p>
            <Select value={selectedDay || "all"} onValueChange={(value) => setSelectedDay(value === "all" ? null : value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All days</SelectItem>
                {days.map((day) => (
                  <SelectItem key={day.id} value={day.id}>{day.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <Tabs 
        defaultValue="all" 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="w-full overflow-visible"
      >
        <TabsList className="w-full max-w-md mx-auto grid grid-cols-4 h-14 p-1 bg-muted/20 rounded-full">
          <TabsTrigger 
            value="all" 
            className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all"
          >
            All
          </TabsTrigger>
          <TabsTrigger 
            value="winners" 
            className="rounded-full data-[state=active]:bg-yellow-500 data-[state=active]:text-white transition-all"
          >
            Winners
          </TabsTrigger>
          <TabsTrigger 
            value="placed" 
            className="rounded-full data-[state=active]:bg-gray-500 data-[state=active]:text-white transition-all"
          >
            Placed
          </TabsTrigger>
          <TabsTrigger 
            value="losers" 
            className="rounded-full data-[state=active]:bg-red-500 data-[state=active]:text-white transition-all"
          >
            Losers
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-8 overflow-visible">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-muted/50 animate-pulse mb-3"></div>
                  <div className="h-4 w-20 bg-muted/50 animate-pulse rounded-md"></div>
                </div>
              ))}
            </div>
          ) : filteredHorses && filteredHorses.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 pt-10 overflow-visible">
              {filteredHorses.map((horse, index) => (
                <HoverCard key={horse.id} className="animate-fadeIn" style={{ animationDelay: `${index * 100}ms` }}>
                  <HoverCardTrigger asChild>
                    <div className="flex flex-col items-center">
                      <div 
                        className={`relative flex items-center justify-center w-24 h-24 mx-auto rounded-full bg-white shadow-md
                          hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer
                          ${horse.result === 'win' ? 'border-4 border-yellow-500' : ''}
                          ${horse.result === 'loss' ? 'border-4 border-red-500' : ''}
                          ${horse.result === 'place' ? 'border-4 border-gray-400' : ''}
                          ${!horse.result ? 'border-4 border-transparent' : ''}
                        `}
                        onClick={() => handleHorseClick(horse)}
                      >
                        {/* Points circle */}
                        <div className={`absolute -top-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          horse.points > 0 
                            ? 'bg-green-600' 
                            : 'bg-gray-500'
                        } ${horse.points > 0 ? 'animate-bounce-subtle' : ''}`}>
                          {horse.points}
                        </div>
                        
                        {/* Result icon */}
                        <div className="absolute -bottom-2 -right-2">
                          {getResultIcon(horse.result)}
                        </div>
                        
                        {/* Achievement badge */}
                        {horse.achievement && (
                          <div className="absolute -top-2 -left-2">
                            {horse.achievement === 'best_performer' && (
                              <div className="bg-yellow-500 text-white p-1 rounded-full">
                                <Trophy className="h-4 w-4" />
                              </div>
                            )}
                            {horse.achievement === 'consistent' && (
                              <div className="bg-blue-500 text-white p-1 rounded-full">
                                <Medal className="h-4 w-4" />
                              </div>
                            )}
                            {horse.achievement === 'underdog' && (
                              <div className="bg-purple-500 text-white p-1 rounded-full">
                                <Award className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Horse icon */}
                        <HorseIcon className="text-3xl text-gray-800" />
                      </div>
                      <div className="mt-3 text-center">
                        <h3 className="font-semibold text-sm truncate max-w-[120px]">{horse.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 truncate max-w-[120px]">{horse.race_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">Odds: {horse.odds ? `${horse.odds}/1` : 'N/A'}</p>
                      </div>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-72 p-0">
                    <div className="p-4 space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-full ${getResultColor(horse.result)}`}></div>
                        <h4 className="font-bold">{horse.name}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{horse.race_name}</p>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Result</p>
                          <p className={`font-medium truncate ${
                            horse.result === 'win' 
                              ? 'text-yellow-600' 
                              : horse.result === 'place'
                              ? 'text-gray-600'
                              : horse.result === 'loss'
                              ? 'text-red-600'
                              : ''
                          }`}>
                            {horse.result ? formatResult(horse.result) : 'Unknown'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground">Points</p>
                          <p className="font-medium truncate">{horse.points}</p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground">Odds</p>
                          <p className="font-medium truncate">{horse.odds ? `${horse.odds}/1` : 'N/A'}</p>
                        </div>
                        
                        {horse.achievement && (
                          <div>
                            <p className="text-xs text-muted-foreground">Achievement</p>
                            <p className="font-medium truncate">
                              {formatAchievement(horse.achievement)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Award className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No horses found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {activeTab === "all" 
                  ? "You haven't selected any horses yet." 
                  : `You don't have any ${activeTab.slice(0, -1)} horses.`}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
