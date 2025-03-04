import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, X, Loader2, Star, Target, Zap, Rocket, Award, Flame, TrendingUp } from "lucide-react";
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
  odds?: number | string;
  chip?: 'superBoost' | 'doubleChance' | 'tripleThreat';
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
        
        // Fetch user's selections with race information
        const { data: selectionsData, error: selectionsError } = await supabase
          .from('fantasy_selections')
          .select(`
            id,
            user_id,
            horse_id,
            race_id,
            day_id,
            chip,
            horses:horse_id (
              id,
              name,
              result
            ),
            races:race_id (
              id,
              name,
              day_id
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
          // Get the odds for calculation
          const odds = oddsMap.get(selection.horses.id) || 2.0; // Default to 2.0 (evens) if not found
          
          // Calculate points based on result and chip
          let points = calculatePoints(
            selection.horses.result,
            odds,
            selection.chip
          );
          
          return {
            id: selection.horses.id,
            name: selection.horses.name,
            points: points,
            result: selection.horses.result,
            race_name: selection.races.name,
            odds: odds,
            chip: selection.chip,
          };
        });
        
        // Add achievements to top performers
        const horsesWithAchievements = [...horses].sort((a, b) => b.points - a.points);
        
        if (horsesWithAchievements.length > 0) {
          // Best performer is the horse with the most points
          horsesWithAchievements[0].achievement = 'best_performer';
          
          // Find an underdog (high odds winner)
          console.log("Looking for underdogs among:", horsesWithAchievements.map(h => ({ 
            name: h.name, 
            result: h.result, 
            odds: h.odds, 
            points: h.points 
          })));
          
          // Find winners with high odds
          const winners = horsesWithAchievements.filter(horse => horse.result === 'win');
          console.log("Winners:", winners.map(h => ({ name: h.name, odds: h.odds })));
          
          // Specific check for Readin Tommy Wrong
          const readinTommy = horsesWithAchievements.find(h => h.name.includes("Readin Tommy"));
          if (readinTommy) {
            console.log("Found Readin Tommy Wrong:", JSON.stringify(readinTommy, null, 2));
            console.log("Result type:", typeof readinTommy.result, "Result value:", readinTommy.result);
            console.log("Odds type:", typeof readinTommy.odds, "Odds value:", readinTommy.odds);
            
            // Check if odds are stored as a number
            if (readinTommy.result === 'win') {
              if (typeof readinTommy.odds === 'number' && readinTommy.odds >= 8) {
                console.log("Readin Tommy Wrong is an underdog (numeric odds)");
                readinTommy.achievement = 'underdog';
              } else if (typeof readinTommy.odds === 'string') {
                try {
                  const [numerator, denominator] = readinTommy.odds.split('/').map(Number);
                  if (!isNaN(numerator) && numerator >= 8) {
                    console.log("Readin Tommy Wrong is an underdog (string odds)");
                    readinTommy.achievement = 'underdog';
                  }
                } catch (error) {
                  console.error('Error parsing odds:', error);
                }
              }
            }
          } else {
            console.log("Could not find Readin Tommy Wrong");
          }
          
          // Find underdogs (winners with high odds)
          if (!readinTommy || readinTommy.achievement !== 'underdog') {
            for (const horse of winners) {
              if (horse.result === 'win') {
                // Check numeric odds
                if (typeof horse.odds === 'number' && horse.odds >= 8) {
                  console.log(`Found underdog: ${horse.name} with numeric odds ${horse.odds}`);
                  horse.achievement = 'underdog';
                  break;
                }
                // Check string odds
                else if (horse.odds && typeof horse.odds === 'string') {
                  try {
                    const [numerator, denominator] = horse.odds.split('/').map(Number);
                    if (!isNaN(numerator) && numerator >= 8) {
                      console.log(`Found underdog: ${horse.name} with string odds ${horse.odds}`);
                      horse.achievement = 'underdog';
                      break;
                    }
                  } catch (error) {
                    console.error(`Error parsing odds for ${horse.name}:`, error);
                  }
                }
              }
            }
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

  // Function to calculate points based on result, odds, and chip
  const calculatePoints = (result: 'win' | 'place' | 'loss' | null, odds: number, chip: 'superBoost' | 'doubleChance' | 'tripleThreat' | null = null) => {
    if (!result) return 0;
    
    let points = 0;
    let isWin = result === 'win';
    let isPlace = result === 'place';
    let isLoss = result === 'loss';

    // Handle Double Chance chip - converts place to win
    if (chip === 'doubleChance' && isPlace) {
      isWin = true;
      isPlace = false;
    }

    // Calculate points based on the odds ranges
    if (isWin) {
      // Win points based on odds ranges
      if (odds <= 3) { // Up to 2/1 (decimal 3.0)
        points = 15;
      } else if (odds <= 5) { // Up to 4/1 (decimal 5.0)
        points = 20;
      } else if (odds <= 9) { // Up to 8/1 (decimal 9.0)
        points = 25;
      } else { // Over 8/1 (decimal > 9.0)
        points = 30;
      }
    } else if (isPlace) {
      // Place points based on odds ranges
      if (odds <= 3) { // Up to 2/1
        points = 5;
      } else if (odds <= 5) { // Up to 4/1
        points = 7;
      } else if (odds <= 9) { // Up to 8/1
        points = 10;
      } else { // Over 8/1
        points = 12;
      }
    }

    // Apply chip multipliers
    if (chip === 'superBoost') {
      if (isWin || isPlace) {
        points *= 10; // 10x points for super boost win or place
      }
    } else if (chip === 'tripleThreat') {
      if (isWin) {
        points *= 3; // Triple points for win
      } else if (isLoss) {
        // For loss, use the win points but make them negative and triple them
        let lossPoints = 0;
        if (odds <= 3) lossPoints = 15;
        else if (odds <= 5) lossPoints = 20;
        else if (odds <= 9) lossPoints = 25;
        else lossPoints = 30;
        
        points = lossPoints * -3;
      }
    }

    return points;
  };

  // Function to format odds in fractional format
  const formatOdds = (odds: number | string): string => {
    // If odds is already a string in fractional format, return it
    if (typeof odds === 'string') {
      return odds;
    }

    // Convert decimal odds to fractional format
    if (odds === 2.0) return "Evens"; // Special case for evens
    
    if (odds < 2.0) {
      // For odds less than 2.0 (e.g., 1.5 which is 1/2)
      const denominator = Math.round(1 / (odds - 1));
      return `1/${denominator}`;
    } else {
      // For odds greater than 2.0 (e.g., 3.0 which is 2/1)
      const numerator = Math.round(odds - 1);
      return `${numerator}/1`;
    }
  };

  // Function to get chip icon
  const getChipIcon = (chip?: 'superBoost' | 'doubleChance' | 'tripleThreat') => {
    switch (chip) {
      case 'superBoost':
        return <span className="text-sm">🚀</span>;
      case 'doubleChance':
        return <span className="text-sm">🎯</span>;
      case 'tripleThreat':
        return <span className="text-sm">🏆</span>;
      default:
        return null;
    }
  };

  // Function to get chip name
  const getChipName = (chip?: 'superBoost' | 'doubleChance' | 'tripleThreat') => {
    switch (chip) {
      case 'superBoost':
        return "Super Boost";
      case 'doubleChance':
        return "Double Chance";
      case 'tripleThreat':
        return "Triple Threat";
      default:
        return null;
    }
  };

  // Function to get achievement icon
  const getAchievementIcon = (achievement?: 'best_performer' | 'consistent' | 'underdog') => {
    switch (achievement) {
      case 'best_performer':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'consistent':
        return <TrendingUp className="h-4 w-4 text-gray-400" />;
      case 'underdog':
        return <Award className="h-4 w-4 text-purple-500" />;
      default:
        return null;
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
                <div 
                  key={horse.id} 
                  className="animate-fadeIn relative z-0 hover:z-10" 
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <HoverCard>
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
                              : horse.points < 0
                                ? 'bg-red-600'
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
                                <div className="bg-gray-400 text-white p-1 rounded-full">
                                  <TrendingUp className="h-4 w-4" />
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
                          <div className="flex items-center justify-center gap-1 mt-1">
                            {getResultIcon(horse.result)}
                            <span className={`font-medium ${
                              horse.result === 'win' ? 'text-yellow-500' : 
                              horse.result === 'place' ? 'text-gray-400' : 
                              horse.result === 'loss' ? 'text-red-500' : ''
                            }`}>
                              {horse.result === 'win' ? 'Win' : horse.result === 'place' ? 'Place' : horse.result === 'loss' ? 'Loss' : 'TBD'}
                            </span>
                            {horse.chip && (
                              <div className="ml-1 flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                                {getChipIcon(horse.chip)}
                                <span className="text-xs">{getChipName(horse.chip)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-64 p-0">
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold">{horse.name}</h4>
                          {horse.chip && (
                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                              {getChipIcon(horse.chip)}
                              <span className="text-xs">{getChipName(horse.chip)}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{horse.race_name}</p>
                        <div className="flex justify-between">
                          <p className="font-medium">Odds: {horse.odds ? formatOdds(horse.odds) : 'N/A'}</p>
                          <p className="font-bold">{horse.points} pts</p>
                        </div>
                        {horse.achievement && (
                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                              {getAchievementIcon(horse.achievement)}
                              <span className="text-sm font-medium">
                                {horse.achievement === 'best_performer' ? 'Best Performer' :
                                 horse.achievement === 'consistent' ? 'Consistent Performer' :
                                 'Underdog'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
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
