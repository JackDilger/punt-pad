import React, { useState, useEffect, useCallback } from "react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isBefore } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Pencil, HelpCircle, Rocket, Target, Scale, AlertTriangle, Clock, CheckCircle2, Lock, Loader2, RefreshCw, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Database } from '@/integrations/supabase/types';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UpdateLeagueTable } from '@/components/UpdateLeagueTable';
import MyStable from '@/components/MyStable';

interface FestivalDay {
  id: string;
  day_number: number;
  date: string;
  is_published: boolean;
  cutoff_time: string | null;
  created_at: string;
  updated_at: string;
  races: Race[];
  selections_submitted: boolean;
  name: string;
}

interface Race {
  id: string;
  name: string;
  race_time: string;
  day_id: string;
  race_order: number;
  status: 'upcoming' | 'in_progress' | 'finished';
  distance: string | null;
  number_of_places: number;
  created_at: string;
  updated_at: string;
  horses: Horse[];
  selected_horse_id?: string;
  chip?: 'superBoost' | 'doubleChance' | 'tripleThreat';
}

interface Horse {
  id: string;
  race_id: string;
  name: string;
  fixed_odds: number;
  result: 'win' | 'place' | 'loss' | null;
  created_at: string;
  updated_at: string;
  _delete?: boolean;
}

interface Selection {
  id: string;
  user_id: string;
  horse_id: string;
  race_id: string;
  day_id: string;
  created_at: string;
  submitted_at: string | null;
  chip?: 'superBoost' | 'doubleChance' | 'tripleThreat';
}

type ChipType = 'superBoost' | 'doubleChance' | 'tripleThreat';

interface Chip {
  id: ChipType;
  name: string;
  description: string;
  howItWorks: string[];
  used: boolean;
  buttonText: string;
}

interface LeagueStanding {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_points: number;
  team_name: string | null;
  wins: number;
  places: number;
  chips: {
    superBoost: boolean;
    doubleChance: boolean;
    tripleThreat: boolean;
  };
}

interface EditingValues {
  name: string;
  race_time: string;
  number_of_places: number;
  horses: Horse[];
}

// Helper function to compute the greatest common divisor (GCD)
const gcd = (a: number, b: number): number => {
  return b === 0 ? a : gcd(b, a % b);
};

// Function to approximate a decimal as a fraction using denominators up to maxDenom (default 20)
const approximateFraction = (num: number, maxDenom: number = 20): [number, number] => {
  let bestNumerator = 0;
  let bestDenominator = 1;
  let bestDiff = Infinity;
  const tolerance = 1e-9; // Small tolerance for floating point comparisons

  for (let d = 1; d <= maxDenom; d++) {
    const n = Math.round(num * d);
    const diff = Math.abs(num - n / d);
    // If this fraction is a closer approximation, or the error is nearly equal but with a smaller denominator, update the best match
    if (diff < bestDiff - tolerance || (Math.abs(diff - bestDiff) < tolerance && d < bestDenominator)) {
      bestDiff = diff;
      bestNumerator = n;
      bestDenominator = d;
    }
  }

  // Simplify the fraction by dividing both parts by their GCD
  const divisor = gcd(bestNumerator, bestDenominator);
  return [bestNumerator / divisor, bestDenominator / divisor];
};

// Main function to convert decimal odds to fractional odds
const toFractionalOdds = (decimal: number | null): string => {
  if (decimal === null || decimal === undefined) return '';
  
  // The fractional odds represent the profit per unit stake
  const fractionalPart = decimal - 1;
  
  // Get the fraction approximation (with denominators up to 20 by default)
  const [numerator, denominator] = approximateFraction(fractionalPart, 20);
  
  return `${numerator}/${denominator}`;
};

export default function FantasyLeague() {
  const [selectedDay, setSelectedDay] = useState<FestivalDay | null>(null);
  const [selectedDayTab, setSelectedDayTab] = useState<string | null>(null);
  const [festivalDays, setFestivalDays] = useState<FestivalDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRaceId, setEditingRaceId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<EditingValues | null>(null);
  const [saving, setSaving] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [chipModalOpen, setChipModalOpen] = useState(false);
  const [selectedChip, setSelectedChip] = useState<Chip | null>(null);
  const [activeChip, setActiveChip] = useState<ChipType | null>(null);
  const [chipConfirmationOpen, setChipConfirmationOpen] = useState(false);
  const [pendingChipRaceId, setPendingChipRaceId] = useState<string | null>(null);
  const [chips, setChips] = useState<Chip[]>(() => {
    // Try to load used chips from localStorage
    const savedUsedChips = localStorage.getItem('fantasy_used_chips');
    const usedChips = savedUsedChips ? new Set(JSON.parse(savedUsedChips)) : new Set<ChipType>();

    return [
      {
        id: 'superBoost',
        name: '🚀 Super Boost',
        description: 'Take your points to the moon! Use the Super Boost chip to 10x your points on any single selection. Be strategic—this chip can only be used once during the festival, so choose wisely!',
        howItWorks: [
          'Activate the chip by clicking "Play Super Boost".',
          'Then, select the horse you want to apply it to.',
          "If your selection wins, you'll receive 10 times the standard points.",
          'Once played, the chip is locked and cannot be changed.',
        ],
        used: usedChips.has('superBoost'),
        buttonText: 'Play Super Boost'
      },
      {
        id: 'doubleChance',
        name: '🎯 Double Chance',
        description: 'Improve your odds! The Double Chance chip counts a second-place finish as a win, giving you the full win points even if your horse finishes just behind the leader.',
        howItWorks: [
          'Click "Play Double Chance" to activate the chip.',
          'Choose the race selection you want to apply it to.',
          'Earn full win points if your selection finishes first or second.',
          'Once applied, the chip cannot be moved to another selection.',
        ],
        used: usedChips.has('doubleChance'),
        buttonText: 'Play Double Chance'
      },
      {
        id: 'tripleThreat',
        name: '⚖️ Triple Threat',
        description: 'High risk, high reward! Use the Triple Threat chip to triple your points if your selection wins. However, if your horse loses, you\'ll get minus triple the potential points on offer!',
        howItWorks: [
          'Click "Play Triple Threat" to activate the chip.',
          'Assign the chip to your chosen selection.',
          'If your selection wins, you earn 3x the points. If it loses, you\'ll incur -3x the points.',
          'The chip is locked to your selection once played.',
          'Warning: Use this chip carefully—it can dramatically shift your position on the leaderboard!',
        ],
        used: usedChips.has('tripleThreat'),
        buttonText: 'Play Triple Threat'
      }
    ];
  });
  const [selections, setSelections] = useState<Selection[]>([]);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [leagueStandings, setLeagueStandings] = useState<LeagueStanding[]>([]);
  const [loadingStandings, setLoadingStandings] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("selections");
  const [teamNameRequired, setTeamNameRequired] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  // Create a reusable function to check if the current time is before the cutoff time
  const isBeforeCutoffTime = useCallback((day: FestivalDay | null) => {
    if (!day || !day.cutoff_time) return true;
    const now = new Date();
    const cutoffTime = new Date(day.cutoff_time);
    return isBefore(now, cutoffTime);
  }, []);

  useEffect(() => {
    fetchFestivalDays();
  }, []);

  useEffect(() => {
    if (festivalDays.length > 0) {
      if (!selectedDay) {
        setSelectedDay(festivalDays[0]);
      }
      if (!selectedDayTab) {
        setSelectedDayTab(festivalDays[0].id);
      }
    }
  }, [festivalDays]);

  useEffect(() => {
    if (activeTab === "league-table") {
      fetchLeagueStandings();
    }
  }, [activeTab]);

  useEffect(() => {
    if (user) {
      fetchFestivalDays();
      fetchLeagueStandings();
      checkUserTeamName();
    }
  }, [user]);

  const checkUserTeamName = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, team_name')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      
      setUserProfile(data);
      if (!data.team_name) {
        setTeamNameRequired(true);
      } else {
        setTeamName(data.team_name);
      }
    } catch (error) {
      console.error('Error checking team name:', error);
    }
  };

  const saveTeamName = async () => {
    if (!user || !teamName.trim()) return;
    
    try {
      // Update the team name in profiles
      const { error } = await supabase
        .from('profiles')
        .update({ team_name: teamName.trim() })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Create or update entry in fantasy_league_standings
      const { error: upsertError } = await supabase
        .from('fantasy_league_standings')
        .upsert(
          { 
            user_id: user.id,
            total_points: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          { 
            onConflict: 'user_id',
            ignoreDuplicates: true 
          }
        );

      if (upsertError) throw upsertError;
      
      setTeamNameRequired(false);
      toast({
        title: "Team name saved",
        description: "Welcome to the Fantasy League!",
      });
      
      // Refresh standings to show the new team name
      fetchLeagueStandings();
    } catch (error) {
      console.error('Error saving team name:', error);
      toast({
        title: "Error",
        description: "Failed to save team name. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchFestivalDays = async () => {
    setLoading(true);
    try {
      const { data: daysData, error: daysError } = await supabase
        .from("fantasy_festival_days")
        .select("*")
        .order("day_number");

      if (daysError) {
        console.error("Error fetching days:", daysError);
        throw daysError;
      }

      const { data: racesData, error: racesError } = await supabase
        .from('fantasy_races')
        .select(`
          id,
          name,
          race_time,
          day_id,
          race_order,
          status,
          distance,
          number_of_places,
          created_at,
          updated_at,
          horses:fantasy_horses(*)
        `)
        .order('race_order');

      if (racesError) {
        console.error("Error fetching races:", racesError);
        throw racesError;
      }

      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        console.error("No user ID found");
        return;
      }

      const { data: selectionsData, error: selectionsError } = await supabase
        .from('fantasy_selections')
        .select(`
          id,
          user_id,
          horse_id,
          race_id,
          day_id,
          chip,
          submitted_at,
          created_at
        `)
        .eq('user_id', userId)
        .returns<Selection[]>();

      if (selectionsError) throw selectionsError;

      console.log("DEBUG - Fetched selections:", selectionsData);

      const selections = selectionsData;
      
      // Get submitted selections grouped by day
      const submittedSelectionsByDay = selections.reduce((acc, selection) => {
        if (selection.submitted_at) {
          acc[selection.day_id] = true;
        }
        return acc;
      }, {} as Record<string, boolean>);

      console.log("DEBUG - Submitted selections by day:", submittedSelectionsByDay);

      // Update chips state based on both submitted selections and localStorage
      const usedChips = new Set<ChipType>();
      
      // First check submitted selections
      selections.forEach(s => {
        if (s.chip && s.submitted_at) {
          usedChips.add(s.chip);
        }
      });

      // Then check localStorage for unsubmitted selections with chips
      daysData.forEach(day => {
        const storageKey = `unsubmitted_selections_${day.id}`;
        const storedSelections = JSON.parse(localStorage.getItem(storageKey) || '{}');
        
        Object.entries(storedSelections).forEach(([key, value]) => {
          if (key.startsWith('chip_') && value) {
            usedChips.add(value as ChipType);
          }
        });
      });

      // Update chips state and persist to localStorage
      setChips(prevChips => {
        const updatedChips = prevChips.map(chip => ({
          ...chip,
          used: usedChips.has(chip.id as ChipType)
        }));

        // Store the used chips in localStorage
        localStorage.setItem('fantasy_used_chips', JSON.stringify(Array.from(usedChips)));
        
        return updatedChips;
      });

      // Map races to their respective days
      const days = daysData.map(day => {
        const dayRaces = racesData
          .filter(race => race.day_id === day.id)
          .map(race => {
            // Only apply selections from the same day
            const selection = selections.find(s => 
              s.race_id === race.id && 
              s.day_id === day.id
            );
            return {
              ...race,
              horses: race.horses || [],
              selected_horse_id: selection?.horse_id,
              chip: selection?.chip
            };
          });

        return {
          ...day,
          races: dayRaces,
          selections_submitted: submittedSelectionsByDay[day.id] || false,
          name: `Day ${day.day_number}` // Add computed name property
        };
      });

      console.log("DEBUG - Processed days:", days);
      setFestivalDays(loadUnsubmittedSelectionsFromStorage(days));
      if (selectionsData) {
        const typedSelections = selectionsData.map(s => ({
          ...s,
          chip: (s.chip as 'superBoost' | 'doubleChance' | 'tripleThreat' | undefined)
        }));
        setSelections(typedSelections);
      }
    } catch (error) {
      console.error("Error fetching festival days:", error);
      toast({
        title: "Error Loading Data",
        description: "There was a problem loading your selections. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeagueStandings = async () => {
    setLoadingStandings(true);
    try {
      // First get the win counts for each user
      const { data: winCountsData, error: winCountsError } = await supabase
        .from('fantasy_selections')
        .select(`
          user_id,
          horse_id,
          fantasy_horses!inner(result)
        `)
        .eq('fantasy_horses.result', 'win');

      if (winCountsError) throw winCountsError;

      // Get place counts for each user
      const { data: placeCountsData, error: placeCountsError } = await supabase
        .from('fantasy_selections')
        .select(`
          user_id,
          horse_id,
          fantasy_horses!inner(result)
        `)
        .eq('fantasy_horses.result', 'place');

      if (placeCountsError) throw placeCountsError;

      // Count wins and places per user
      const winCounts = new Map<string, number>();
      const placeCounts = new Map<string, number>();

      winCountsData?.forEach(selection => {
        const userId = selection.user_id;
        winCounts.set(userId, (winCounts.get(userId) || 0) + 1);
      });

      placeCountsData?.forEach(selection => {
        const userId = selection.user_id;
        placeCounts.set(userId, (placeCounts.get(userId) || 0) + 1);
      });

      // Get league standings
      const { data: standingsData, error: standingsError } = await supabase
        .from('fantasy_league_standings')
        .select(`
          id,
          user_id,
          total_points
        `)
        .order('total_points', { ascending: false });
      
      if (standingsError) throw standingsError;
      
      // Get user profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, team_name')
        .order('username');

      if (profilesError) throw profilesError;
      if (!profilesData) return;
      
      // Fetch chip usage data for all users
      const { data: chipData, error: chipError } = await supabase
        .from('fantasy_selections')
        .select(`
          user_id,
          chip
        `)
        .not('chip', 'is', null);
        
      if (chipError) throw chipError;
      
      // Create a map of user chips
      const userChips = new Map<string, { superBoost: boolean, doubleChance: boolean, tripleThreat: boolean }>();
      
      chipData?.forEach(selection => {
        if (!selection.chip) return;
        
        const userId = selection.user_id;
        const chip = selection.chip as ChipType;
        
        if (!userChips.has(userId)) {
          userChips.set(userId, {
            superBoost: false,
            doubleChance: false,
            tripleThreat: false
          });
        }
        
        const userChip = userChips.get(userId);
        if (userChip) {
          userChip[chip] = true;
        }
      });
      
      // Combine all data
      const standings: LeagueStanding[] = standingsData?.map((standing: any) => {
        const profile = profilesData.find(p => p.id === standing.user_id);
        
        // Get chip usage from the map, or use default empty values
        const chips = userChips.get(standing.user_id) || {
          superBoost: false,
          doubleChance: false,
          tripleThreat: false,
        };
        
        return {
          user_id: standing.user_id,
          username: profile?.username || 'Unknown User',
          avatar_url: profile?.avatar_url,
          team_name: profile?.team_name || 'Unnamed Team',
          total_points: standing.total_points,
          wins: winCounts.get(standing.user_id) || 0,
          places: placeCounts.get(standing.user_id) || 0,
          chips,
        };
      }) || [];

      setLeagueStandings(standings);
    } catch (error) {
      console.error('Error fetching league standings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch league standings",
        variant: "destructive",
      });
    } finally {
      setLoadingStandings(false);
    }
  };

  const handleDayChange = (dayId: string) => {
    const day = festivalDays.find((d) => d.id === dayId);
    if (day) {
      setSelectedDay(day);
    }
  };

  const handleHorseSelect = async (raceId: string, horseId: string) => {
    if (!selectedDay) return;

    // Check if past cutoff time
    if (!isBeforeCutoffTime(selectedDay)) {
      toast({
        title: "Selection Not Allowed",
        description: "The cutoff time for selections has passed.",
        variant: "destructive",
      });
      return;
    }

    // If a chip is active, open the confirmation dialog instead of just selecting the horse
    if (activeChip) {
      // Find the chip object to display in the confirmation dialog
      const chipToApply = chips.find(c => c.id === activeChip);
      if (chipToApply) {
        setSelectedChip(chipToApply);
        setPendingChipRaceId(raceId);
        setChipConfirmationOpen(true);
        return; // Don't proceed with normal selection
      }
    }

    try {
      // Get the race to preserve any existing chip
      const race = selectedDay.races.find(r => r.id === raceId);
      const existingChip = race?.chip;

      // Update selections in state
      const updatedSelections = selections.map(s => 
        s.race_id === raceId ? { ...s, horse_id: horseId } : s
      );
      setSelections(updatedSelections);

      // Update festival days state
      setFestivalDays(days => days.map(day => ({
        ...day,
        races: day.races.map(race => 
          race.id === raceId 
            ? { ...race, selected_horse_id: horseId } : race
        )
      })));

      // Save to localStorage
      const dayId = selectedDay?.id;
      if (dayId) {
        const storageKey = `unsubmitted_selections_${dayId}`;
        const storedSelections = JSON.parse(localStorage.getItem(storageKey) || '{}');
        storedSelections[raceId] = horseId;
        // Save chip data if it exists
        if (existingChip) {
          storedSelections[`chip_${raceId}`] = existingChip;
        }
        localStorage.setItem(storageKey, JSON.stringify(storedSelections));
      }
    } catch (error) {
      console.error("Error in handleHorseSelect:", error);
      toast({
        title: "Error",
        description: "There was an error processing your selection.",
        variant: "destructive",
      });
    }
  };

  const loadUnsubmittedSelectionsFromStorage = (days: FestivalDay[]) => {
    return days.map(day => {
      const storageKey = `unsubmitted_selections_${day.id}`;
      const storedSelections = JSON.parse(localStorage.getItem(storageKey) || '{}');
      
      return {
        ...day,
        races: day.races.map(race => {
          // Check for chip data in localStorage (with the chip_ prefix)
          const chipKey = `chip_${race.id}`;
          const chipFromStorage = storedSelections[chipKey] as ChipType | undefined;
          
          return {
            ...race,
            selected_horse_id: storedSelections[race.id] || race.selected_horse_id,
            chip: chipFromStorage || race.chip // Use chip from storage if available
          };
        })
      };
    });
  };

  const clearUnsubmittedSelectionsFromStorage = (dayId: string) => {
    const storageKey = `unsubmitted_selections_${dayId}`;
    localStorage.removeItem(storageKey);
  };

  const getSubmissionStatus = useCallback((day: FestivalDay) => {
    if (!day) return { canSubmit: false, emptySelections: [], isBeforeCutoff: false };
    
    const isBeforeCutoff = isBeforeCutoffTime(day);
    
    // Only show empty selections if we have at least one selection
    const hasAnySelections = day.races.some(race => race.selected_horse_id);
    
    const emptySelections = hasAnySelections 
      ? day.races
          .filter(race => !race.selected_horse_id)
          .map(race => race.name)
      : [];
    
    const canSubmit = hasAnySelections && emptySelections.length === 0 && isBeforeCutoff && !day.selections_submitted;
    
    return { canSubmit, emptySelections, isBeforeCutoff };
  }, [isBeforeCutoffTime]);

  const getSelectionProgress = useCallback((day: FestivalDay) => {
    if (!day) return 0;
    const totalRaces = day.races.length;
    const selectedRaces = day.races.filter(race => race.selected_horse_id).length;
    return (selectedRaces / totalRaces) * 100;
  }, []);

  const handleSubmitSelections = async () => {
    try {
      setIsSubmitting(true);
      const currentDay = festivalDays.find(day => day.id === selectedDay?.id);
      if (!currentDay) return;

      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;

      const { canSubmit, isBeforeCutoff } = getSubmissionStatus(currentDay);
      
      if (!canSubmit) {
        if (!isBeforeCutoff) {
          toast({
            title: "Submission Failed",
            description: "The cutoff time for submissions has passed.",
            variant: "destructive",
          });
        }
        return;
      }

      // Get selections from localStorage
      const storageKey = `unsubmitted_selections_${currentDay.id}`;
      const storedSelections = JSON.parse(localStorage.getItem(storageKey) || '{}');

      // Create selections array from current day's races and stored selections
      const selectionsToSubmit = currentDay.races.map(race => ({
        user_id: userId,
        horse_id: storedSelections[race.id] || race.selected_horse_id,
        race_id: race.id,
        day_id: currentDay.id,
        chip: race.chip,
        submitted_at: new Date().toISOString()
      })).filter(selection => selection.horse_id); // Only submit selections that have a horse

      if (selectionsToSubmit.length === 0) {
        toast({
          title: "No Selections",
          description: "Please make your selections before submitting.",
          variant: "destructive",
        });
        return;
      }

      // Insert all selections at once
      const { error: insertError } = await supabase
        .from('fantasy_selections')
        .insert(selectionsToSubmit);

      if (insertError) throw insertError;

      // Clear localStorage for this day
      localStorage.removeItem(storageKey);

      // Fetch fresh data to ensure everything is in sync
      await fetchFestivalDays();

      setSubmissionDialogOpen(false);
      
      toast({
        title: "Success!",
        description: "Your selections have been submitted successfully.",
      });
    } catch (error) {
      console.error("Error submitting selections:", error);
      toast({
        title: "Error",
        description: "There was an error submitting your selections. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEditing = (race: Race) => {
    setEditingRaceId(race.id);
    setEditingValues({
      name: race.name,
      race_time: format(new Date(race.race_time), 'HH:mm'),
      number_of_places: race.number_of_places,
      horses: [...race.horses]
    });
  };

  const handleCancelEditing = () => {
    setEditingRaceId(null);
    setEditingValues(null);
  };

  const handleHorseFieldChange = (horseId: string, field: keyof Horse, value: string | number | null) => {
    if (!editingValues) return;
    
    setEditingValues({
      ...editingValues,
      horses: editingValues.horses.map(horse => {
        if (horse.id === horseId) {
          return {
            ...horse,
            [field]: value
          };
        }
        return horse;
      })
    });
  };

  const handleAddHorse = () => {
    if (!editingValues) return;

    const tempId = `temp-${Date.now()}`;
    setEditingValues({
      ...editingValues,
      horses: [
        ...editingValues.horses,
        {
          id: tempId,
          race_id: editingRaceId!,
          name: '',
          fixed_odds: 0,
          result: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    });
  };

  const handleDeleteHorse = async (horseId: string) => {
    if (!editingValues) return;

    // Just remove from local state if it's a temporary horse
    if (horseId.startsWith('temp-')) {
      setEditingValues({
        ...editingValues,
        horses: editingValues.horses.filter(h => h.id !== horseId)
      });
      return;
    }

    // Otherwise, mark it for deletion when saving
    setEditingValues({
      ...editingValues,
      horses: editingValues.horses.map(h => 
        h.id === horseId ? { ...h, _delete: true } : h
      ).filter(h => !h._delete)
    });
  };

  const handleUpdateRace = async (raceId: string) => {
    if (!editingValues) return;
    
    try {
      setSaving(true);
      const currentDay = festivalDays.find(day => 
        day.races.some(race => race.id === raceId)
      );
      const race = currentDay?.races.find(r => r.id === raceId);
      if (!currentDay || !race) return;

      // Parse the time input (HH:mm) and combine with the existing date
      const currentDate = new Date(race.race_time);
      const [hours, minutes] = editingValues.race_time.split(':');
      currentDate.setHours(parseInt(hours, 10));
      currentDate.setMinutes(parseInt(minutes, 10));

      // Update race details
      const { error: raceError } = await supabase
        .from('fantasy_races')
        .update({
          name: editingValues.name,
          race_time: currentDate.toISOString(),
          number_of_places: editingValues.number_of_places
        })
        .eq('id', raceId);

      if (raceError) throw raceError;

      // Get horses marked for deletion
      const horsesToDelete = race.horses
        .filter(h => !editingValues.horses.some(eh => eh.id === h.id))
        .map(h => h.id);

      // Delete horses marked for deletion
      if (horsesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('fantasy_horses')
          .delete()
          .in('id', horsesToDelete);

        if (deleteError) throw deleteError;
      }

      // Handle new horses
      const newHorses = editingValues.horses.filter(h => h.id.startsWith('temp-'));
      for (const horse of newHorses) {
        const { error: insertError } = await supabase
          .from('fantasy_horses')
          .insert({
            race_id: raceId,
            name: horse.name || '',
            fixed_odds: horse.fixed_odds || 0,
            result: horse.result
          });

        if (insertError) throw insertError;
      }

      // Update existing horses
      const existingHorses = editingValues.horses.filter(h => !h.id.startsWith('temp-'));
      for (const horse of existingHorses) {
        const { error: horseError } = await supabase
          .from('fantasy_horses')
          .update({
            name: horse.name,
            fixed_odds: horse.fixed_odds,
            result: horse.result
          })
          .eq('id', horse.id);

        if (horseError) throw horseError;
      }

      // Refresh the races data to get updated horses
      const { data: updatedRace, error: fetchError } = await supabase
        .from('fantasy_races')
        .select(`
          id,
          name,
          race_time,
          day_id,
          race_order,
          status,
          distance,
          number_of_places,
          created_at,
          updated_at,
          horses:fantasy_horses(*)
        `)
        .eq('id', raceId)
        .single();

      if (fetchError) throw fetchError;

      // Update local state with the fresh data
      setFestivalDays(days => days.map(day => {
        if (day.id === currentDay.id) {
          return {
            ...day,
            races: day.races.map(r => 
              r.id === raceId 
                ? {
                    ...updatedRace,
                    horses: updatedRace.horses || [],
                    selected_horse_id: r.selected_horse_id, // Preserve selection
                    chip: r.chip // Preserve chip
                  }
                : r
            )
          };
        }
        return day;
      }));

      // Fetch and update selections to ensure UI stays in sync
      const { data: updatedSelections, error: selectionsError } = await supabase
        .from('fantasy_selections')
        .select(`
          id,
          user_id,
          horse_id,
          race_id,
          day_id,
          chip,
          submitted_at,
          created_at
        `);

      if (selectionsError) throw selectionsError;
      if (updatedSelections) {
        const typedSelections = updatedSelections.map(s => ({
          ...s,
          chip: (s.chip as 'superBoost' | 'doubleChance' | 'tripleThreat' | undefined)
        }));
        setSelections(typedSelections);
      }

      setEditingRaceId(null);
      setEditingValues(null);
      toast({
        title: "Success",
        description: "Race details updated successfully",
      });
    } catch (error) {
      console.error('Error updating race:', error);
      toast({
        title: "Error",
        description: "Failed to update race details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChipClick = (chipId: ChipType) => {
    if (!selectedDay) return;

    console.log("DEBUG - handleChipClick - selectedDay:", selectedDay);

    // Check if selections for this day have already been submitted
    if (selectedDay.selections_submitted) {
      toast({
        title: "Selections Already Submitted",
        description: "You cannot apply chips to selections that have already been submitted.",
        variant: "destructive",
      });
      return;
    }

    // First check if this specific chip is already used
    const isChipAlreadyUsed = chips.find(c => c.id === chipId)?.used;
    if (isChipAlreadyUsed) {
      toast({
        title: "Chip Already Used",
        description: "You have already used this chip. Each chip can only be used once during the festival, so choose wisely!",
        variant: "destructive",
      });
      return;
    }

    // Check if any race on the current day already has a chip
    const hasChipForCurrentDay = selectedDay.races.some(race => {
      const hasChip = race.chip !== undefined;
      if (hasChip) {
        console.log("DEBUG - Found race with chip:", race);
      }
      return hasChip;
    });

    console.log("DEBUG - hasChipForCurrentDay from races:", hasChipForCurrentDay);

    // Also check selections for this day that might not be reflected in the UI yet
    const selectionsWithChips = selections.filter(s => 
      // Only check selections for the current day
      s.day_id === selectedDay.id && 
      // And that have a chip
      s.chip !== undefined
    );
    
    const hasChipInSelections = selectionsWithChips.length > 0;
    
    console.log("DEBUG - selections for current day with chips:", selectionsWithChips);
    console.log("DEBUG - hasChipInSelections:", hasChipInSelections);

    if (hasChipForCurrentDay || hasChipInSelections) {
      toast({
        title: "Chip Already Used",
        description: "You can only use one chip per day. You have already used a chip for this day's selections.",
        variant: "destructive",
      });
      return;
    }

    // If we get here, we can activate the chip
    setActiveChip(chipId);
    toast({
      title: `${chips.find(c => c.id === chipId)?.name} Activated`,
      description: "Select a horse to apply this chip. Click the chip again to cancel.",
    });
  };

  const handleConfirmChip = async () => {
    if (!pendingChipRaceId || !selectedChip || !selectedDay) {
      setChipConfirmationOpen(false);
      return;
    }

    // Check if cutoff time has passed
    if (!isBeforeCutoffTime(selectedDay)) {
      toast({
        title: "Selections closed",
        description: "The cutoff time for selections has passed.",
        variant: "destructive",
      });
      setChipConfirmationOpen(false);
      setPendingChipRaceId(null);
      setSelectedChip(null);
      return;
    }

    const raceId = pendingChipRaceId;
    const currentChip = selectedChip.id as ChipType;

    try {
      console.log("Starting chip application process", { raceId, chip: currentChip });
      
      // Find the race
      const race = selectedDay.races.find(r => r.id === raceId);
      if (!race) return;

      // Check localStorage for selection
      const storageKey = `unsubmitted_selections_${selectedDay.id}`;
      const storedSelections = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const hasStoredSelection = storedSelections[raceId];
      
      // Check if we have a selection either in race state or localStorage
      if (!race.selected_horse_id && !hasStoredSelection) {
        toast({
          title: "No Horse Selected",
          description: "Please select a horse before applying a chip.",
          variant: "destructive",
        });
        setChipConfirmationOpen(false);
        setPendingChipRaceId(null);
        setSelectedChip(null);
        return;
      }

      // Update selections in state
      const updatedSelections = selections.map(s => 
        s.race_id === raceId ? { ...s, chip: currentChip } : s
      );
      setSelections(updatedSelections);

      // Update race in festival days to show chip
      setFestivalDays(days => days.map(day => ({
        ...day,
        races: day.races.map(race => 
          race.id === raceId 
            ? { ...race, chip: currentChip }
            : race
        )
      })));

      // Save to localStorage
      storedSelections[`chip_${raceId}`] = currentChip;
      localStorage.setItem(storageKey, JSON.stringify(storedSelections));

      // Mark chip as used and reset active chip
      setChips(prevChips => {
        const updatedChips = prevChips.map(c => 
          c.id === currentChip ? { ...c, used: true } : c
        );

        // Update localStorage with used chips
        const usedChips = updatedChips
          .filter(c => c.used)
          .map(c => c.id);
        localStorage.setItem('fantasy_used_chips', JSON.stringify(usedChips));

        return updatedChips;
      });
      setActiveChip(null);

      toast({
        title: `${selectedChip.name} Applied`,
        description: `Your ${selectedChip.name} has been applied to this race.`,
      });
    } catch (error) {
      console.error("Error in handleConfirmChip:", error);
      toast({
        title: "Error",
        description: "There was an error applying your chip.",
        variant: "destructive",
      });
    } finally {
      setChipConfirmationOpen(false);
      setPendingChipRaceId(null);
      setSelectedChip(null);
    }
  };

  const openSubmissionDialog = () => {
    // Force a state refresh by updating selectedDay from festivalDays
    if (selectedDay) {
      const currentDay = festivalDays.find(day => day.id === selectedDay.id);
      if (currentDay) {
        setSelectedDay(currentDay);
      }
    }
    setSubmissionDialogOpen(true);
  };

  const renderSubmissionDialog = () => {
    if (!selectedDay) return null;

    // Calculate progress and empty selections directly here to ensure latest state
    const totalRaces = selectedDay.races.length;
    const selectedRaces = selectedDay.races.filter(race => race.selected_horse_id).length;
    const progress = totalRaces > 0 ? (selectedRaces / totalRaces) * 100 : 0;

    // Get empty races for display
    const emptyRaces = selectedDay.races
      .filter(race => !race.selected_horse_id)
      .map(race => race.name);

    const isBeforeCutoff = isBeforeCutoffTime(selectedDay);
    const cutoffTime = selectedDay.cutoff_time ? format(new Date(selectedDay.cutoff_time), 'h:mm a') : 'Not set';

    return (
      <Dialog open={submissionDialogOpen} onOpenChange={setSubmissionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Selections for {selectedDay.name}</DialogTitle>
            <DialogDescription>
              Please review your selections before submitting. Once submitted, selections cannot be changed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Selection Progress</span>
                <span className="text-sm font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>

            {selectedRaces > 0 && emptyRaces.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You have {emptyRaces.length} races without selections:
                  <ul className="list-disc list-inside mt-2">
                    {emptyRaces.map(race => (
                      <li key={race}>{race}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {selectedRaces > 0 && (
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>
                  Selections made for {selectedRaces} out of {totalRaces} races:
                  <ul className="list-disc list-inside mt-2">
                    {selectedDay.races
                      .filter(race => race.selected_horse_id)
                      .map(race => {
                        const selectedHorse = race.horses.find(h => h.id === race.selected_horse_id);
                        return (
                          <li key={race.id}>
                            {race.name} - {selectedHorse?.name}
                            {race.chip && ` (${race.chip})`}
                          </li>
                        );
                      })}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>Submission cutoff time: {cutoffTime}</span>
            </div>

            {!isBeforeCutoff && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  The cutoff time for submissions has passed.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSubmissionDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmitSelections}
              disabled={isSubmitting || !selectedRaces || emptyRaces.length > 0 || !isBeforeCutoff || selectedDay.selections_submitted}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Selections'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const renderDayContent = (day: FestivalDay) => {
    const progress = getSelectionProgress(day);
    const { canSubmit, isBeforeCutoff } = getSubmissionStatus(day);
    
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between bg-muted/10 p-4 rounded-lg">
          <div className="space-y-2 flex-1 max-w-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Selection Progress</span>
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
          
          <Button
            variant="default"
            className="bg-primary hover:bg-primary/90 text-white ml-6"
            onClick={openSubmissionDialog}
            disabled={day.selections_submitted || !isBeforeCutoff}
          >
            {day.selections_submitted 
              ? <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Selections Submitted</span> 
              : !isBeforeCutoff 
                ? <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Cutoff Time Passed</span>
                : <span className="flex items-center gap-1.5"><Check className="h-4 w-4" /> Submit Selections</span>}
          </Button>
        </div>
        
        {!isBeforeCutoff && !day.selections_submitted && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              The cutoff time for this day has passed. You can no longer make or change selections.
            </AlertDescription>
          </Alert>
        )}
        
        {day.selections_submitted && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Your selections for {day.name} have been submitted and cannot be changed.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-3 gap-6">
          {chips.map((chip) => (
            <TooltipProvider key={chip.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card
                    className={cn(
                      "cursor-pointer transition-all relative overflow-hidden",
                      "hover:bg-accent hover:border-accent-foreground hover:shadow-md",
                      activeChip === chip.id && "bg-accent border-accent-foreground shadow-md",
                      chip.used && "opacity-60 cursor-not-allowed hover:border-input hover:bg-transparent"
                    )}
                    onClick={() => handleChipClick(chip.id)}
                  >
                    {activeChip === chip.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 hover:bg-muted-foreground/20 hover:text-muted-foreground transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveChip(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                      <p className="font-medium text-lg">{chip.name}</p>
                      {activeChip === chip.id && (
                        <p className="text-sm text-muted-foreground mt-1 bg-background/80 px-2 py-1 rounded-md">Click a selection to apply</p>
                      )}
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[250px] p-4">
                  <p className="font-medium mb-1">{chip.name}</p>
                  <p className="text-sm">{chip.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : day.races.length > 0 ? (
          <div className="space-y-6">
            {day.races.map((race) => {
              const selectedHorse = race.horses.find((h) => h.id === race.selected_horse_id);

              return (
                <Card 
                  key={race.id} 
                  className={cn(
                    "relative border-muted/60 shadow-sm transition-all",
                    activeChip && "cursor-pointer hover:bg-accent/80 hover:border-accent-foreground hover:shadow-md",
                    race.chip && "border-primary/50"
                  )}
                  onClick={() => {
                    if (activeChip && !race.chip) {
                      const defaultHorse = race.horses[0];
                      if (defaultHorse) {
                        handleHorseSelect(race.id, defaultHorse.id);
                      }
                    }
                  }}
                >
                  {race.chip && (
                    <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-t-primary border-l-[40px] border-l-transparent"></div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-lg">{race.name}</h3>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleStartEditing(race)}
                              className="h-6 w-6"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <span className="font-medium">{format(new Date(race.race_time), 'HH:mm')}</span>
                          {race.distance && (
                            <>
                              <span className="mx-1">·</span>
                              <span>{race.distance}</span>
                            </>
                          )}
                          <span>·</span>
                          <span>{race.number_of_places} places</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {race.chip && (
                          <div className="flex-shrink-0 bg-primary/10 rounded-full p-1.5 mr-1">
                            {race.chip === 'superBoost' && <span className="text-lg">🚀</span>}
                            {race.chip === 'doubleChance' && <span className="text-lg">🎯</span>}
                            {race.chip === 'tripleThreat' && <span className="text-lg">⚖️</span>}
                          </div>
                        )}
                        <Select
                          value={race.selected_horse_id?.toString() ?? ""}
                          onValueChange={(value) => handleHorseSelect(race.id, value)}
                          disabled={day.selections_submitted || (activeChip !== null && !race.chip) || !isBeforeCutoffTime(day)}
                        >
                          <SelectTrigger 
                            className={cn(
                              "w-[280px] transition-colors",
                              race.selected_horse_id && "border-green-500 bg-green-50"
                            )}
                          >
                            <SelectValue placeholder="Select a horse">
                              {race.horses?.find(h => h.id === race.selected_horse_id)?.name && (
                                <div className="flex items-center justify-between w-full">
                                  <span className="truncate mr-4">
                                    {race.horses?.find(h => h.id === race.selected_horse_id)?.name}
                                  </span>
                                  <span className="flex-shrink-0 text-muted-foreground">
                                    {toFractionalOdds(race.horses?.find(h => h.id === race.selected_horse_id)?.fixed_odds)}
                                  </span>
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {race.horses?.map((horse) => (
                              <SelectItem key={horse.id} value={horse.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span className="flex-grow truncate mr-4">{horse.name}</span>
                                  <span className="flex-shrink-0 text-muted-foreground">{toFractionalOdds(horse.fixed_odds)}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingRaceId === race.id && editingValues && (
                      <div className="border-t pt-4 mt-4">
                        <div className="mb-4">
                          <Label>Number of Places</Label>
                          <Input
                            type="number"
                            min="1"
                            value={editingValues.number_of_places}
                            onChange={(e) => setEditingValues({...editingValues, number_of_places: parseInt(e.target.value) || 1})}
                            className="mt-1 w-full md:w-1/3"
                          />
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Horses</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddHorse}
                            className="mb-4"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Horse
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMarkAllAsLost}
                            className="text-sm"
                          >
                            Mark all as lost
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {editingValues.horses.map((horse, index) => (
                            <div
                              key={horse.id}
                              className="mb-2 rounded-lg bg-muted/50 p-4 flex items-center justify-between"
                            >
                              <div className="flex-1 mr-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Horse Name</Label>
                                    <Input
                                      value={horse.name}
                                      onChange={(e) =>
                                        handleHorseFieldChange(horse.id, 'name', e.target.value)
                                      }
                                      className="mt-1"
                                      placeholder="Horse Name"
                                    />
                                  </div>
                                  <div>
                                    <Label>Fixed Odds</Label>
                                    <Input
                                      type="number"
                                      value={horse.fixed_odds}
                                      onChange={(e) =>
                                        handleHorseFieldChange(
                                          horse.id,
                                          'fixed_odds',
                                          parseFloat(e.target.value)
                                        )
                                      }
                                      className="mt-1"
                                      placeholder="Fixed Odds"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Result</Label>
                                    <Select
                                      value={horse.result || 'null'}
                                      onValueChange={(value) =>
                                        handleHorseFieldChange(
                                          horse.id,
                                          'result',
                                          value === 'null' ? null : value
                                        )
                                      }
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select result" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="null">No result</SelectItem>
                                        <SelectItem value="win">Win</SelectItem>
                                        <SelectItem value="place">Place</SelectItem>
                                        <SelectItem value="loss">Loss</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteHorse(horse.id)}
                                className="h-8 w-8 flex-shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEditing}
                            disabled={saving}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateRace(race.id)}
                            disabled={saving}
                          >
                            {saving ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

          </div>
        ) : (
          <div className="bg-muted/20 rounded-lg p-8 text-center">
            <p className="text-lg font-medium text-muted-foreground">No races available for {day.name}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {day.selections_submitted 
                ? "Selections have already been submitted for this day"
                : "Races will be displayed here once available"}
            </p>
          </div>
        )}
      </div>
    );
  };

  const handleMarkAllAsLost = () => {
    if (!editingValues) return;
    
    setEditingValues({
      ...editingValues,
      horses: editingValues.horses.map(horse => ({
        ...horse,
        result: 'loss'
      }))
    });
  };

  const clearAllSelections = async () => {
    try {
      // Get the current user
      const user = (await supabase.auth.getUser()).data.user?.id;
      if (!user) {
        console.error("No user ID found");
        return;
      }

      // Clear selections from the database - for dev, delete all selections regardless of submission status
      const { error } = await supabase
        .from('fantasy_selections')
        .delete()
        .eq('user_id', user);

      if (error) {
        console.error("Error clearing selections:", error);
        toast({
          title: "Error",
          description: "There was an error clearing your selections.",
          variant: "destructive",
        });
        return;
      }

      // Reset points in the league standings table
      const { error: resetPointsError } = await supabase
        .from('fantasy_league_standings')
        .update({ total_points: 0 })
        .eq('user_id', user);

      if (resetPointsError) {
        console.error("Error resetting points:", resetPointsError);
        toast({
          title: "Warning",
          description: "Selections were cleared but there was an error resetting points.",
          variant: "destructive",
        });
      }

      // Clear local state - for dev, clear all selections
      setSelections([]);

      // Clear selected_horse_id from festivalDays state
      setFestivalDays(days => days.map(day => ({
        ...day,
        races: day.races.map(race => ({
          ...race,
          selected_horse_id: undefined,
          chip: undefined
        }))
      })));

      // Clear localStorage for all days
      festivalDays.forEach(day => {
        const storageKey = `unsubmitted_selections_${day.id}`;
        localStorage.removeItem(storageKey);
      });

      // Refresh the league standings to show the updated points
      fetchLeagueStandings();

      toast({
        title: "Success",
        description: "All selections have been cleared.",
      });
    } catch (error) {
      console.error("Error in clearAllSelections:", error);
      toast({
        title: "Error",
        description: "There was an error clearing your selections.",
        variant: "destructive",
      });
    }
  };

  const deleteAllSelections = async () => {
    try {
      await clearAllSelections();
    } catch (error) {
      console.error("Error in deleteAllSelections:", error);
    }
  };

  const clearChipData = async () => {
    if (!selectedDay) return;
    
    try {
      console.log("Clearing chip data for debugging");
      
      // Get the current user
      const user = (await supabase.auth.getUser()).data.user?.id;
      if (!user) {
        console.error("No user ID found");
        return;
      }
      
      // Clear chips from UI state
      setFestivalDays(days => days.map(day => ({
        ...day,
        races: day.races.map(race => ({
          ...race,
          chip: undefined
        }))
      })));

      // Reset chip usage state
      setChips(prevChips => prevChips.map(c => ({
        ...c,
        used: false
      })));

      // Clear selections from local state
      setSelections(prev => prev.map(s => ({
        ...s,
        chip: undefined
      })));

      // Clear chip data from selections in the database
      const { error } = await supabase
        .from('fantasy_selections')
        .update({ chip: null })
        .eq('user_id', user);
        
      if (error) {
        console.error("Error clearing chip data:", error);
        toast({
          title: "Error",
          description: "There was an error clearing chip data.",
          variant: "destructive",
        });
        return;
      }
      
      // Refresh data
      await fetchFestivalDays();
      
      // Update the league standings to reflect the changes in points
      await fetchLeagueStandings();
      
      toast({
        title: "Debug: Chips Cleared",
        description: "All chip data has been cleared for testing purposes.",
      });
    } catch (error) {
      console.error("Error in clearChipData:", error);
    }
  };

  const forceCheckChipData = async () => {
    try {
      // Get the current user
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        console.error("No user found");
        return;
      }
      
      // Get user's selections with chip data
      const { data, error } = await supabase
        .from('fantasy_selections')
        .select('*')
        .eq('user_id', user.id)
        .not('chip', 'is', null);
      
      if (error) {
        console.error('Error checking chip data:', error);
        return;
      }
      
      console.log("DEBUG - Selections with chip data:", data);
      
      if (data && data.length > 0) {
        toast({
          title: "Chip Data Found",
          description: `Found ${data.length} selections with chip data. Use the Clear Chip Data button to reset.`,
        });
      } else {
        toast({
          title: "No Chip Data",
          description: "No selections with chip data found in the database.",
        });
      }
    } catch (error) {
      console.error('Error in forceCheckChipData:', error);
    }
  };

  const fixDay1ChipIssue = async () => {
    try {
      // Get the current user
      const user = (await supabase.auth.getUser()).data.user?.id;
      if (!user) {
        console.error("No user ID found");
        return;
      }
      
      // Get day 1 ID
      const day1 = festivalDays.find(day => day.day_number === 1);
      if (!day1) {
        console.error("Day 1 not found");
        toast({
          title: "Error",
          description: "Day 1 not found in festival days.",
          variant: "destructive",
        });
        return;
      }
      
      console.log("Fixing chip issue for day 1:", day1.id);
      
      // Clear chip data for day 1 selections in the database
      const { error } = await supabase
        .from('fantasy_selections')
        .update({ chip: null })
        .eq('user_id', user)
        .eq('day_id', day1.id);
        
      if (error) {
        console.error("Error fixing day 1 chip issue:", error);
        toast({
          title: "Error",
          description: "There was an error fixing day 1 chip issue.",
          variant: "destructive",
        });
        return;
      }
      
      // Update UI state for day 1
      setFestivalDays(days => days.map(day => {
        if (day.day_number === 1) {
          return {
            ...day,
            races: day.races.map(race => ({
              ...race,
              chip: undefined
            }))
          };
        }
        return day;
      }));

      // Update local selections state
      setSelections(prev => prev.map(s => {
        if (s.day_id === day1.id) {
          return {
            ...s,
            chip: undefined
          };
        }
        return s;
      }));

      toast({
        title: "Day 1 Chip Issue Fixed",
        description: "Chip data for day 1 has been cleared.",
      });
      
      // Refresh data
      await fetchFestivalDays();
    } catch (error) {
      console.error("Error in fixDay1ChipIssue:", error);
    }
  };

  const checkAllSelections = async () => {
    try {
      // Get the current user
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        console.error("No user found");
        return;
      }
      
      // Get all user's selections
      const { data, error } = await supabase
        .from('fantasy_selections')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error checking selections:', error);
        return;
      }
      
      console.log("DEBUG - All user selections:", data);
      
      // Count selections by day
      const selectionsByDay: Record<string, { total: number }> = {};
      
      data?.forEach(selection => {
        if (!selectionsByDay[selection.day_id]) {
          selectionsByDay[selection.day_id] = { total: 0 };
        }
        
        selectionsByDay[selection.day_id].total++;
      });
      
      console.log("DEBUG - Selections by day:", selectionsByDay);
      
      // Show toast with summary
      if (data && data.length > 0) {
        const dayInfo = Object.entries(selectionsByDay).map(([dayId, counts]) => {
          const day = festivalDays.find(d => d.id === dayId);
          return `Day ${day?.day_number || '?'}: ${counts.total} selections`;
        }).join('\n');
        
        toast({
          title: `Found ${data.length} Selections`,
          description: dayInfo,
        });
      } else {
        toast({
          title: "No Selections",
          description: "No selections found in the database.",
        });
      }
    } catch (error) {
      console.error('Error in checkAllSelections:', error);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between border-b pb-4">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Cheltenham Fantasy League 2025</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRulesOpen(true)}
              className="font-medium"
            >
              Rules & Points
            </Button>
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteAllSelections}
                >
                  Delete All Selections (Dev)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearChipData}
                >
                  Clear Chip Data (Dev)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fixDay1ChipIssue}
                >
                  Fix Day 1 Chip Issue
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={forceCheckChipData}
                >
                  Force Check Chip Data
                </Button>
                <UpdateLeagueTable onUpdate={fetchLeagueStandings} />
                <Button
                  variant="outline"
                  onClick={() => fetchFestivalDays()}
                  size="sm"
                  className="text-xs"
                >
                  Refresh Data
                </Button>
              </>
            )}
          </div>
        </div>

        <Tabs 
          defaultValue="selections" 
          value={activeTab}
          onValueChange={(value) => setActiveTab(value)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/30 p-0.5 rounded-lg">
            <TabsTrigger 
              value="selections"
              className="data-[state=active]:bg-primary data-[state=active]:text-white font-medium rounded-md py-1.5 text-sm"
            >
              Selections
            </TabsTrigger>
            <TabsTrigger 
              value="my-stable"
              className="data-[state=active]:bg-primary data-[state=active]:text-white font-medium rounded-md py-1.5 text-sm"
            >
              My Stable
            </TabsTrigger>
            <TabsTrigger 
              value="league-table"
              className="data-[state=active]:bg-primary data-[state=active]:text-white font-medium rounded-md py-1.5 text-sm"
            >
              League Table
            </TabsTrigger>
          </TabsList>

          <TabsContent value="selections">
            <Card className="overflow-hidden min-h-[500px] border-muted/60 shadow-sm">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center h-[500px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Tabs value={selectedDayTab} onValueChange={setSelectedDayTab} className="w-full">
                    <TabsList className="w-full bg-muted/20 p-0 rounded-none border-b">
                      {festivalDays.map((day) => (
                        <TabsTrigger
                          key={day.id}
                          value={day.id}
                          onClick={() => setSelectedDay(day)}
                          className="flex-1 rounded-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary flex flex-col items-center space-y-1 py-2 px-3 transition-all"
                          disabled={loading}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={day.id === selectedDayTab ? "text-primary font-medium" : "font-medium"}>
                              {day.name}
                            </span>
                            {!isBeforeCutoffTime(day) && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-red-50 text-red-700 rounded-full">
                                      <Lock className="h-3 w-3" />
                                      Locked
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Selections closed at {format(new Date(day.cutoff_time), 'h:mmaaa')}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <span>{format(new Date(day.date), 'EEE do MMM')}</span>
                            {day.cutoff_time && (
                              <>
                                <span className="mx-1">·</span>
                                <span>Deadline {format(new Date(day.cutoff_time), 'h:mmaaa')}</span>
                              </>
                            )}
                          </div>
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {festivalDays.map((day) => (
                      <TabsContent key={day.id} value={day.id} className="p-6">
                        {renderDayContent(day)}
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-stable" className="space-y-4">
            <Card className="border-muted/60 shadow-sm">
              <CardContent className="pt-6">
                <MyStable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="league-table" className="space-y-4">
            <Card className="border-muted/60 shadow-sm">
              <CardHeader className="pb-2">
                <h2 className="text-xl font-semibold text-primary">League Table</h2>
                <p className="text-sm text-muted-foreground">See how you rank against other players</p>
              </CardHeader>
              <CardContent>
                {loadingStandings ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Rankings</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchLeagueStandings()}
                        className="flex items-center gap-1"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Refresh
                      </Button>
                    </div>
                    
                    {leagueStandings.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No standings available yet.</p>
                        <p className="text-sm">Standings will appear once races are completed and points are awarded.</p>
                      </div>
                    ) : (
                      <div className="rounded-lg border overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/30 border-b">
                              <th className="text-left p-3 pl-4 font-medium">Rank</th>
                              <th className="text-left p-3 font-medium">Team</th>
                              <th className="text-right p-3 font-medium">Wins</th>
                              <th className="text-right p-3 font-medium">Places</th>
                              <th className="text-right p-3 pr-4 font-medium">Points</th>
                              <th className="text-right p-3 pr-4 font-medium">Chips</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leagueStandings.map((standing, index) => (
                              <tr key={standing.user_id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}>
                                <td className="p-3 pl-4">
                                  {index === 0 ? (
                                    <span className="inline-flex items-center justify-center bg-yellow-400 text-yellow-950 w-6 h-6 rounded-full font-bold">1</span>
                                  ) : index === 1 ? (
                                    <span className="inline-flex items-center justify-center bg-gray-300 text-gray-700 w-6 h-6 rounded-full font-bold">2</span>
                                  ) : index === 2 ? (
                                    <span className="inline-flex items-center justify-center bg-amber-700 text-amber-100 w-6 h-6 rounded-full font-bold">3</span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center text-muted-foreground w-6 h-6">{index + 1}</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <span>{standing.team_name || 'Unnamed Team'}</span>
                                </td>
                                <td className="p-3 text-right">
                                  <span>{standing.wins}</span>
                                </td>
                                <td className="p-3 text-right">
                                  <span>{standing.places}</span>
                                </td>
                                <td className="p-3 pr-4 text-right font-medium">{standing.total_points}</td>
                                <td className="p-3 pr-4 flex justify-end gap-1.5">
                                  {standing.chips.superBoost && (
                                    <span className="cursor-help" title="Super Boost Used">🚀</span>
                                  )}
                                  {standing.chips.doubleChance && (
                                    <span className="cursor-help" title="Double Chance Used">🎯</span>
                                  )}
                                  {standing.chips.tripleThreat && (
                                    <span className="cursor-help" title="Triple Threat Used">⚖️</span>
                                  )}
                                  {!standing.chips.superBoost && !standing.chips.doubleChance && !standing.chips.tripleThreat && (
                                    <span className="text-muted-foreground text-sm">None</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {renderSubmissionDialog()}
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-xl">
              Rules & Points
            </DialogTitle>
            <DialogDescription className="text-center pt-4">
              Learn how to play and earn points in the fantasy horse racing league
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">How it Works</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Select one horse from each race throughout the festival</li>
                <li>Points are awarded for both wins and places</li>
                <li>Points available vary based on the horse's odds</li>
                <li>Make your selections before the cutoff time each day</li>
                <li>The player with the most points at the end of the festival wins</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">Points System</h3>
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-2">Odds</th>
                      <th className="text-left p-2">Win Points</th>
                      <th className="text-left p-2">Place Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2">Up to 2/1</td>
                      <td className="p-2">15</td>
                      <td className="p-2">5</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Up to 4/1</td>
                      <td className="p-2">20</td>
                      <td className="p-2">7</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Up to 8/1</td>
                      <td className="p-2">25</td>
                      <td className="p-2">10</td>
                    </tr>
                    <tr>
                      <td className="p-2">Over 8/1</td>
                      <td className="p-2">30</td>
                      <td className="p-2">12</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Additional Rules</h3>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>Selections must be made before each day's cutoff time</li>
                <li>Once submitted, selections cannot be changed</li>
                <li>Points are awarded based on official race results</li>
                <li>In case of a dead heat, points will be split accordingly</li>
                <li>Non-runners will receive 0 points</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={chipModalOpen} onOpenChange={setChipModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center">
            <DialogTitle className="flex items-center justify-center gap-2 text-xl">
              {selectedChip?.name}
            </DialogTitle>
            <DialogDescription className="text-center pt-4">
              {selectedChip?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">How It Works:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {selectedChip?.howItWorks.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-muted-foreground text-center italic">
              Reminder: You can only play one chip per day.
            </p>
            <div className="flex justify-center pt-2">
              <Button 
                onClick={() => {
                  setActiveChip(selectedChip?.id ?? null);
                  setChipModalOpen(false);
                }}
                className="w-full sm:w-auto"
              >
                {selectedChip?.buttonText}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={chipConfirmationOpen} onOpenChange={setChipConfirmationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Chip Application</DialogTitle>
            <DialogDescription>
              Please review the details before locking your chip.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 border rounded-md bg-muted/30">
              <h3 className="font-medium mb-2">{selectedChip?.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{selectedChip?.description}</p>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Important Rules:</h4>
                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                  <li>Once applied, this chip will be <span className="font-semibold">permanently locked</span> to this race</li>
                  <li>You can still change your horse selection until you submit</li>
                  <li>This action cannot be undone, even if you refresh the page</li>
                  <li>You can only use one chip per day</li>
                </ul>
              </div>
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm">Are you sure you want to apply the {selectedChip?.name} to this race?</p>
            </Alert>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setChipConfirmationOpen(false);
                setActiveChip(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="default" onClick={handleConfirmChip}>
              Yes, Lock Chip to Race
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {teamNameRequired && (
        <Dialog open={true} onOpenChange={() => setTeamNameRequired(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter Your Team Name</DialogTitle>
              <DialogDescription>
                Please enter a team name to participate in the Fantasy League
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter your team name"
              />
              <Button variant="default" onClick={saveTeamName}>
                Save Team Name
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AuthLayout>
  );
}
