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
import { X, Plus, Pencil, HelpCircle, Rocket, Target, Scale, AlertTriangle, Clock, CheckCircle2, Lock, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Database } from '@/integrations/supabase/types';
import { ChevronDown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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
  points_if_wins: number;
  points_if_places: number;
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
}

const toFractionalOdds = (decimal: number | null): string => {
  if (!decimal) return '';
  const odds: Record<number, string> = {
    2: '1/1',
    2.5: '6/4',
    3: '2/1',
    3.5: '5/2',
    4: '3/1',
    4.5: '7/2',
    5: '4/1',
    5.5: '9/2',
    6: '5/1',
    6.5: '11/2',
    7: '6/1',
    8: '7/1',
    9: '8/1',
    10: '9/1',
    11: '10/1',
    1.5: '1/2',
    1.67: '2/3',
    1.75: '3/4'
  };
  
  // Find the closest match
  const closest = Object.entries(odds).reduce((prev, [key, value]) => {
    const prevDiff = Math.abs(parseFloat(prev[0]) - decimal);
    const currDiff = Math.abs(parseFloat(key) - decimal);
    return currDiff < prevDiff ? [key, value] : prev;
  });

  return closest[1];
};

export default function FantasyLeague() {
  const [selectedDay, setSelectedDay] = useState<FestivalDay | null>(null);
  const [selectedDayTab, setSelectedDayTab] = useState<string | null>(null);
  const [festivalDays, setFestivalDays] = useState<FestivalDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRaceId, setEditingRaceId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<{
    name: string;
    race_time: string;
    horses: Horse[];
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [chipModalOpen, setChipModalOpen] = useState(false);
  const [selectedChip, setSelectedChip] = useState<Chip | null>(null);
  const [activeChip, setActiveChip] = useState<ChipType | null>(null);
  const [chipConfirmationOpen, setChipConfirmationOpen] = useState(false);
  const [pendingChipRace, setPendingChipRace] = useState<{raceId: string, horseId: string} | null>(null);
  const [chips, setChips] = useState<Chip[]>([
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
      used: false,
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
      used: false,
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
      used: false,
      buttonText: 'Play Triple Threat'
    }
  ]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [leagueStandings, setLeagueStandings] = useState<LeagueStanding[]>([]);
  const [loadingStandings, setLoadingStandings] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("selections");
  const { toast } = useToast();
  const { isAdmin } = useAuth();

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
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (activeTab === "league-table") {
      fetchLeagueStandings();
    }
  }, [activeTab]);

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
        .select('*')
        .eq('user_id', userId)
        .returns<Selection[]>();

      if (selectionsError) {
        console.error("Error fetching selections:", selectionsError);
        throw selectionsError;
      }

      console.log("DEBUG - Fetched selections:", selectionsData);

      const selections = selectionsData;
      const hasSubmittedSelections = selections.some(s => s.submitted_at !== null);

      // Update chips state based on selections
      const usedChips = new Set(selections.filter(s => s.chip).map(s => s.chip));
      setChips(prevChips => prevChips.map(chip => ({
        ...chip,
        used: usedChips.has(chip.id as ChipType)
      })));

      // Map races to their respective days
      const days = daysData.map(day => {
        const dayRaces = racesData
          .filter(race => race.day_id === day.id)
          .map(race => {
            const selection = selections.find(s => s.race_id === race.id);
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
          selections_submitted: hasSubmittedSelections,
          name: `Day ${day.day_number}` // Add computed name property
        };
      });

      console.log("DEBUG - Processed days:", days);
      setFestivalDays(days);
      setSelections(selections);
    } catch (error) {
      console.error("Error fetching festival days:", error);
      toast({
        title: "Error Loading Data",
        description: "There was a problem loading your selections. Please refresh the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeagueStandings = async () => {
    setLoadingStandings(true);
    try {
      // 1. First fetch all submitted selections to get active users
      const { data: selectionsData, error: selectionsError } = await supabase
        .from('fantasy_selections')
        .select(`
          id, 
          user_id, 
          horse_id, 
          race_id, 
          day_id, 
          submitted_at,
          chip,
          fantasy_horses!inner(
            id,
            name,
            points_if_wins,
            points_if_places
          ),
          fantasy_races!inner(
            id,
            name,
            status
          )
        `)
        .not('submitted_at', 'is', null);

      if (selectionsError) throw selectionsError;
      if (!selectionsData) return;

      // Get unique user IDs who have made selections
      const activeUserIds = [...new Set(selectionsData.map(s => s.user_id))];

      // 2. Then fetch profiles only for users who have made selections
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', activeUserIds)
        .order('username');

      if (profilesError) throw profilesError;
      if (!profilesData) return;

      // Prepare a map to store points by user
      const pointsByUser: Record<string, { 
        total_points: number; 
      }> = {};

      // Initialize with all profiles
      profilesData.forEach(profile => {
        pointsByUser[profile.id] = {
          total_points: 0,
        };
      });

      // Calculate points for each selection
      selectionsData.forEach(selection => {
        // Only count points for finished races
        const race = selection.fantasy_races;
        if (race.status !== 'finished') return;

        const horse = selection.fantasy_horses;
        const userId = selection.user_id;
        let points = 0;

        // For demonstration, assume all selected horses win
        // In a real scenario, you'd check the race result
        // and award points_if_wins or points_if_places accordingly
        points = horse.points_if_wins;

        // Apply chip effects
        if (selection.chip) {
          switch (selection.chip) {
            case 'superBoost':
              points *= 10; // 10x points
              break;
            case 'doubleChance':
              // For double chance, we'd normally check if it came second
              // and award win points, but here we're just assuming it wins
              break;
            case 'tripleThreat':
              points *= 3; // 3x points (or -3x if lost)
              break;
          }
        }

        // Add points to user's total
        if (pointsByUser[userId]) {
          pointsByUser[userId].total_points += points;
        }
      });

      // Convert to array format needed for display
      const standings: LeagueStanding[] = profilesData.map(profile => ({
        user_id: profile.id,
        username: profile.username || 'Unknown Player',
        avatar_url: profile.avatar_url,
        total_points: pointsByUser[profile.id]?.total_points || 0,
      }));

      // Sort by points (highest first)
      standings.sort((a, b) => b.total_points - a.total_points);

      setLeagueStandings(standings);
    } catch (error) {
      console.error('Error fetching league standings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load league standings. Please try again.',
        variant: 'destructive'
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
        variant: "destructive"
      });
      return;
    }

    setHasUnsavedChanges(true);
    if (activeChip) {
      // Check if this specific chip has been used
      const isChipAlreadyUsed = chips.find(c => c.id === activeChip)?.used;
      if (isChipAlreadyUsed) {
        toast({
          title: "Chip Already Used",
          description: "You have already used this chip. Each chip can only be used once during the festival.",
          variant: "destructive"
        });
        setActiveChip(null); // Reset active chip
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
          variant: "destructive"
        });
        setActiveChip(null); // Reset active chip
        return;
      }

      // Find the chip details for the confirmation dialog
      const chipDetails = chips.find(c => c.id === activeChip);
      setSelectedChip(chipDetails || null);
      
      // Show confirmation dialog before applying chip
      setPendingChipRace({ raceId, horseId });
      setChipConfirmationOpen(true);
    } else {
      // Regular selection without chip
      const updatedSelections = selections.map(s => 
        s.race_id === raceId ? { ...s, horse_id: horseId } : s
      );
      setSelections(updatedSelections);

      setFestivalDays(days => days.map(day => ({
        ...day,
        races: day.races.map(race => 
          race.id === raceId ? { ...race, selected_horse_id: horseId } : race
        )
      })));

      // Save the selection to the database
      try {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) {
          console.error("No user ID found");
          return;
        }

        // Find existing selection for this race
        const existingSelection = selections.find(s => s.race_id === raceId);
        
        if (existingSelection) {
          // Update existing selection
          console.log("Updating existing selection", { id: existingSelection.id, horseId });
          const { data, error } = await supabase
            .from('fantasy_selections')
            .update({ 
              horse_id: horseId 
            })
            .eq('id', existingSelection.id)
            .select();
            
          if (error) {
            console.error("Error updating selection:", error);
            toast({
              title: "Error",
              description: "There was an error saving your selection. Please try again.",
              variant: "destructive"
            });
          } else {
            console.log("Selection updated successfully", data);
            // Mark that changes have been saved
            setHasUnsavedChanges(false);
          }
        } else {
          // Create new selection
          console.log("Creating new selection", { userId, horseId, raceId, dayId: selectedDay.id });
          const { data, error } = await supabase
            .from('fantasy_selections')
            .insert({
              user_id: userId,
              horse_id: horseId,
              race_id: raceId,
              day_id: selectedDay.id
            })
            .select();
            
          if (error) {
            console.error("Error creating selection:", error);
            toast({
              title: "Error",
              description: "There was an error saving your selection. Please try again.",
              variant: "destructive"
            });
          } else {
            console.log("Selection created successfully", data);
            // Mark that changes have been saved
            setHasUnsavedChanges(false);
          }
        }
      } catch (error) {
        console.error("Error saving selection:", error);
        toast({
          title: "Error",
          description: "There was an error saving your selection. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const getSubmissionStatus = useCallback((day: FestivalDay) => {
    if (!day) return { canSubmit: false, emptySelections: [], isBeforeCutoff: false };
    
    const isBeforeCutoff = isBeforeCutoffTime(day);
    
    const emptySelections = day.races
      .filter(race => !race.selected_horse_id)
      .map(race => race.name);
    
    const canSubmit = emptySelections.length === 0 && isBeforeCutoff && !day.selections_submitted;
    
    return { canSubmit, emptySelections, isBeforeCutoff };
  }, [isBeforeCutoffTime]);

  const getSelectionProgress = useCallback((day: FestivalDay) => {
    if (!day) return 0;
    const totalRaces = day.races.length;
    const selectedRaces = day.races.filter(race => race.selected_horse_id).length;
    return (selectedRaces / totalRaces) * 100;
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
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

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
            variant: "destructive"
          });
        }
        return;
      }

      // Update all selections for the day with submitted_at
      const { error } = await supabase
        .from("fantasy_selections")
        .update({ submitted_at: new Date().toISOString() } satisfies Database['public']['Tables']['fantasy_selections']['Update'])
        .eq("day_id", currentDay.id)
        .eq("user_id", userId);

      if (error) throw error;

      // Update local state
      setFestivalDays(days => days.map(day => 
        day.id === currentDay.id 
          ? { ...day, selections_submitted: true }
          : day
      ));

      setHasUnsavedChanges(false);
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
        variant: "destructive"
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
          points_if_wins: 0,
          points_if_places: 0,
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
          race_time: currentDate.toISOString()
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
            points_if_wins: horse.points_if_wins || 0,
            points_if_places: horse.points_if_places || 0
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
            points_if_wins: horse.points_if_wins,
            points_if_places: horse.points_if_places
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
                    horses: updatedRace.horses || []
                  }
                : r
            )
          };
        }
        return day;
      }));

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
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChipClick = (chipId: ChipType) => {
    if (!selectedDay) return;

    console.log("DEBUG - handleChipClick - selectedDay:", selectedDay);

    // First check if this specific chip is already used
    const isChipAlreadyUsed = chips.find(c => c.id === chipId)?.used;
    if (isChipAlreadyUsed) {
      toast({
        title: "Chip Already Used",
        description: "You have already used this chip. Each chip can only be used once during the festival.",
        variant: "destructive"
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
        variant: "destructive"
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
    if (!pendingChipRace || !selectedChip || !selectedDay) {
      setChipConfirmationOpen(false);
      return;
    }

    // Check if past cutoff time
    if (!isBeforeCutoffTime(selectedDay)) {
      toast({
        title: "Selection Not Allowed",
        description: "The cutoff time for selections has passed.",
        variant: "destructive"
      });
      setChipConfirmationOpen(false);
      setPendingChipRace(null);
      setSelectedChip(null);
      return;
    }

    const { raceId, horseId } = pendingChipRace;
    const currentChip = selectedChip.id as ChipType;

    try {
      console.log("Starting chip application process", { raceId, horseId, chip: currentChip });
      
      // Apply chip to the selection
      const updatedSelections = selections.map(s => 
        s.race_id === raceId ? { ...s, horse_id: horseId, chip: currentChip } : s
      );
      setSelections(updatedSelections);

      // Update race in festival days to show chip
      setFestivalDays(days => days.map(day => ({
        ...day,
        races: day.races.map(race => 
          race.id === raceId 
            ? { ...race, selected_horse_id: horseId, chip: currentChip }
            : race
        )
      })));

      // Mark chip as used and reset active chip
      setChips(prevChips => prevChips.map(c => 
        c.id === currentChip ? { ...c, used: true } : c
      ));
      setActiveChip(null);

      // Get the current user
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        console.error("No user ID found");
        return;
      }

      // Find existing selection for this race
      const existingSelection = selections.find(s => s.race_id === raceId);
      
      console.log("Database operation details:", { 
        existingSelection, 
        raceId, 
        horseId, 
        chip: currentChip,
        dayId: selectedDay.id
      });

      if (existingSelection) {
        // Update existing selection with chip
        const { error } = await supabase
          .from('fantasy_selections')
          .update({ 
            horse_id: horseId,
            chip: currentChip
          })
          .eq('id', existingSelection.id);

        if (error) {
          console.error("Error updating selection with chip:", error);
          toast({
            title: "Error",
            description: "There was an error saving your selection with chip.",
            variant: "destructive"
          });
        }
      } else {
        // Create new selection with chip
        const { error } = await supabase
          .from('fantasy_selections')
          .insert({
            user_id: user.id,
            race_id: raceId,
            horse_id: horseId,
            day_id: selectedDay.id,
            chip: currentChip
          });

        if (error) {
          console.error("Error creating selection with chip:", error);
          toast({
            title: "Error",
            description: "There was an error saving your selection with chip.",
            variant: "destructive"
          });
        }
      }

      setHasUnsavedChanges(false);
      toast({
        title: `${selectedChip.name} Applied`,
        description: `Your ${selectedChip.name} has been applied to this race.`,
      });
    } catch (error) {
      console.error("Error in handleConfirmChip:", error);
      toast({
        title: "Error",
        description: "There was an error applying your chip.",
        variant: "destructive"
      });
    } finally {
      setChipConfirmationOpen(false);
      setPendingChipRace(null);
      setSelectedChip(null);
    }
  };

  const renderSubmissionDialog = () => {
    if (!selectedDay) return null;

    const { canSubmit, emptySelections, isBeforeCutoff } = getSubmissionStatus(selectedDay);
    const progress = getSelectionProgress(selectedDay);
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
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>

            {emptySelections.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You have {emptySelections.length} races without selections:
                  <ul className="list-disc list-inside mt-2">
                    {emptySelections.map(race => (
                      <li key={race}>{race}</li>
                    ))}
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

            {selectedDay.selections_submitted && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  You have already submitted selections for this day.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSubmissionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              className="text-white bg-primary hover:bg-primary/90"
              onClick={handleSubmitSelections}
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Selections"}
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Selection Progress</span>
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
          
          <Button
            variant="default"
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={() => setSubmissionDialogOpen(true)}
            disabled={day.selections_submitted || !isBeforeCutoff}
          >
            {day.selections_submitted 
              ? "Selections Submitted" 
              : !isBeforeCutoff 
                ? "Cutoff Time Passed" 
                : "Submit Selections"}
          </Button>
        </div>
        
        {!isBeforeCutoff && !day.selections_submitted && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              The cutoff time for this day has passed. You can no longer make or change selections.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-3 gap-4">
          {chips.map((chip) => (
            <TooltipProvider key={chip.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card
                    className={cn(
                      "cursor-pointer transition-all relative",
                      "hover:bg-accent hover:border-accent-foreground",
                      activeChip === chip.id && "bg-accent border-accent-foreground",
                      chip.used && "opacity-50 cursor-not-allowed hover:border-input hover:bg-transparent"
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
                    <CardContent className="flex flex-col items-center justify-center p-4 text-center space-y-2">
                      <p className="font-medium text-lg">{chip.name}</p>
                      {activeChip === chip.id && (
                        <p className="text-sm text-muted-foreground">Click a selection to apply</p>
                      )}
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p>{chip.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        {day.selections_submitted ? (
          <div className="bg-green-50 p-4 rounded-md mb-4">
            <p className="text-green-700">Your selections for {day.name} have been submitted and cannot be changed.</p>
          </div>
        ) : null}

        {loading ? (
          <p>Loading races...</p>
        ) : day.races.length > 0 ? (
          <div className="space-y-4">
            {day.races.map((race) => {
              const selection = festivalDays.find(d => d.id === selectedDay?.id)?.races.find(r => r.id === race.id);
              const selectedHorse = race.horses.find((h) => h.id === selection?.selected_horse_id);

              return (
                <Card 
                  key={race.id} 
                  className={cn(
                    "relative",
                    activeChip && "cursor-pointer hover:bg-accent/80 hover:border-accent-foreground transition-all",
                    selection?.chip && "border-primary/50"
                  )}
                  onClick={() => {
                    if (activeChip && !selection?.chip) {
                      const defaultHorse = race.horses[0];
                      if (defaultHorse) {
                        handleHorseSelect(race.id, defaultHorse.id);
                      }
                    }
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{race.name}</h3>
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
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>{format(new Date(race.race_time), 'HH:mm')}</span>
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
                      <div className="flex items-center gap-2">
                        {selection?.chip && (
                          <div className="flex-shrink-0">
                            {selection.chip === 'superBoost' && <span className="text-sm">🚀</span>}
                            {selection.chip === 'doubleChance' && <span className="text-sm">🎯</span>}
                            {selection.chip === 'tripleThreat' && <span className="text-sm">⚖️</span>}
                          </div>
                        )}
                        <Select
                          value={race.selected_horse_id?.toString() ?? ""}
                          onValueChange={(value) => handleHorseSelect(race.id, value)}
                          disabled={day.selections_submitted || (activeChip !== null && !selection?.chip) || !isBeforeCutoffTime(day)}
                        >
                          <SelectTrigger 
                            className={cn(
                              "w-[200px]",
                              race.selected_horse_id && "border-green-500"
                            )}
                          >
                            <SelectValue placeholder="Select a horse" />
                          </SelectTrigger>
                          <SelectContent>
                            {race.horses?.map((horse) => (
                              <SelectItem key={horse.id} value={horse.id}>
                                <div className="flex items-center w-full gap-2">
                                  <span className="flex-grow">{horse.name}</span>
                                  <span className="text-sm">
                                    {toFractionalOdds(horse.fixed_odds)}
                                  </span>
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
                        </div>
                        <div className="space-y-2">
                          {editingValues.horses.map((horse, index) => (
                            <div
                              key={horse.id}
                              className="mb-2 rounded-lg bg-muted/50 p-4 flex items-center justify-between"
                            >
                              <div className="flex-1 mr-4">
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <Input
                                      value={horse.name}
                                      onChange={(e) =>
                                        handleHorseFieldChange(horse.id, 'name', e.target.value)
                                      }
                                      className="mb-2"
                                      placeholder="Horse Name"
                                    />
                                    <div className="grid grid-cols-3 gap-4">
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
                                      <div>
                                        <Label>Points if Wins</Label>
                                        <Input
                                          type="number"
                                          value={horse.points_if_wins}
                                          onChange={(e) =>
                                            handleHorseFieldChange(
                                              horse.id,
                                              'points_if_wins',
                                              parseFloat(e.target.value)
                                            )
                                          }
                                          className="mt-1"
                                          placeholder="Points if Wins"
                                        />
                                      </div>
                                      <div>
                                        <Label>Points if Places</Label>
                                        <Input
                                          type="number"
                                          value={horse.points_if_places}
                                          onChange={(e) =>
                                            handleHorseFieldChange(
                                              horse.id,
                                              'points_if_places',
                                              parseFloat(e.target.value)
                                            )
                                          }
                                          className="mt-1"
                                          placeholder="Points if Places"
                                        />
                                      </div>
                                    </div>
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
          <div className="bg-muted/50 rounded-lg p-8 text-center">
            <p>No races available for {day.name}</p>
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

  const deleteAllSelections = async () => {
    try {
      // Get the current user
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        console.error("No user ID found");
        return;
      }
      
      // Delete all selections for this user
      const { error } = await supabase
        .from('fantasy_selections')
        .delete()
        .eq('user_id', user.id);
        
      if (error) {
        console.error("Error deleting selections:", error);
        toast({
          title: "Error",
          description: "There was an error deleting selections.",
          variant: "destructive"
        });
        return;
      }
      
      // Clear local state
      setSelections([]);
      
      // Clear UI state
      setFestivalDays(days => days.map(day => ({
        ...day,
        races: day.races.map(race => ({
          ...race,
          selected_horse_id: undefined,
          chip: undefined
        }))
      })));
      
      // Reset chip usage state
      setChips(prevChips => prevChips.map(c => ({
        ...c,
        used: false
      })));
      
      toast({
        title: "Debug: Selections Deleted",
        description: "All selections have been deleted for testing purposes.",
      });
      
      // Refresh data
      await fetchFestivalDays();
    } catch (error) {
      console.error("Error in deleteAllSelections:", error);
    }
  };

  const clearChipData = async () => {
    if (!selectedDay) return;
    
    try {
      console.log("Clearing chip data for debugging");
      
      // Get the current user
      const user = (await supabase.auth.getUser()).data.user;
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
        .eq('user_id', user.id);
        
      if (error) {
        console.error("Error clearing chip data:", error);
        toast({
          title: "Error",
          description: "There was an error clearing chip data.",
          variant: "destructive"
        });
        return;
      }
      
      // Refresh data
      await fetchFestivalDays();
      
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
      const user = (await supabase.auth.getUser()).data.user;
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
          variant: "destructive"
        });
        return;
      }
      
      console.log("Fixing chip issue for day 1:", day1.id);
      
      // Clear chip data for day 1 selections in the database
      const { error } = await supabase
        .from('fantasy_selections')
        .update({ chip: null })
        .eq('user_id', user.id)
        .eq('day_id', day1.id);
        
      if (error) {
        console.error("Error fixing day 1 chip issue:", error);
        toast({
          title: "Error",
          description: "There was an error fixing day 1 chip issue.",
          variant: "destructive"
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Cheltenham Fantasy League 2025</h1>
          <div className="flex gap-2">
            {process.env.NODE_ENV === 'development' && (
              <Button 
                variant="outline" 
                onClick={deleteAllSelections} 
                size="sm"
                className="text-xs"
              >
                Delete All Selections (Dev)
              </Button>
            )}
            {process.env.NODE_ENV === 'development' && (
              <Button 
                variant="outline" 
                onClick={clearChipData} 
                size="sm"
                className="text-xs"
              >
                Clear Chip Data (Dev)
              </Button>
            )}
            {process.env.NODE_ENV === 'development' && (
              <Button 
                variant="outline" 
                onClick={forceCheckChipData} 
                size="sm"
                className="text-xs"
              >
                Force Check Chip Data (Dev)
              </Button>
            )}
            {process.env.NODE_ENV === 'development' && (
              <Button 
                variant="outline" 
                onClick={fixDay1ChipIssue} 
                size="sm"
                className="text-xs"
              >
                Fix Day 1 Chip Issue (Dev)
              </Button>
            )}
            {process.env.NODE_ENV === 'development' && (
              <Button 
                variant="outline" 
                onClick={checkAllSelections} 
                size="sm"
                className="text-xs"
              >
                Check All Selections (Dev)
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => fetchFestivalDays()}
              size="sm"
              className="text-xs"
            >
              Refresh Data
            </Button>
            <Button
              variant="outline"
              onClick={() => setRulesOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Rules & Points
            </Button>
          </div>
        </div>

        <Tabs 
          defaultValue="selections" 
          value={activeTab}
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger 
              value="selections"
              className="data-[state=active]:bg-[#02a64f] data-[state=active]:text-white font-medium"
            >
              Selections
            </TabsTrigger>
            <TabsTrigger 
              value="my-stable"
              className="data-[state=active]:bg-[#02a64f] data-[state=active]:text-white font-medium"
            >
              My Stable
            </TabsTrigger>
            <TabsTrigger 
              value="league-table"
              className="data-[state=active]:bg-[#02a64f] data-[state=active]:text-white font-medium"
            >
              League Table
            </TabsTrigger>
          </TabsList>

          <TabsContent value="selections">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <Tabs value={selectedDayTab} onValueChange={setSelectedDayTab} className="w-full">
                  <TabsList className="w-full">
                    {festivalDays.map((day) => (
                      <TabsTrigger
                        key={day.id}
                        value={day.id}
                        onClick={() => setSelectedDay(day)}
                        className="flex-1 rounded-none data-[state=active]:bg-background flex flex-col items-center space-y-1 py-2"
                        disabled={loading}
                      >
                        <div className="flex items-center gap-1">
                          <span>{day.name}</span>
                          {!isBeforeCutoffTime(day) && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-50 text-red-700 rounded-full">
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
                    <TabsContent key={day.id} value={day.id} className="p-6 pt-4 bg-white">
                      {renderDayContent(day)}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-stable" className="space-y-4">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">My Stable</h2>
                <p className="text-sm text-muted-foreground">View all your selected horses and their performance</p>
              </CardHeader>
              <CardContent>
                {/* My Stable content will go here */}
                <div className="text-muted-foreground">Coming soon...</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="league-table" className="space-y-4">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">League Table</h2>
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
                      <div className="rounded-md border">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/50 border-b">
                              <th className="text-left p-2 pl-4 font-medium">Rank</th>
                              <th className="text-left p-2 font-medium">Player</th>
                              <th className="text-right p-2 font-medium">Points</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leagueStandings.map((standing, index) => (
                              <tr key={standing.user_id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                                <td className="p-2 pl-4">
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
                                <td className="p-2">
                                  <div className="flex items-center gap-2">
                                    {standing.avatar_url ? (
                                      <Avatar className="h-6 w-6">
                                        <AvatarImage src={standing.avatar_url} alt={standing.username} />
                                        <AvatarFallback>{standing.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                      </Avatar>
                                    ) : (
                                      <Avatar className="h-6 w-6">
                                        <AvatarFallback>{standing.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                      </Avatar>
                                    )}
                                    {standing.username}
                                  </div>
                                </td>
                                <td className="p-2 text-right font-medium">{standing.total_points}</td>
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
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
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
    </AuthLayout>
  );
}
