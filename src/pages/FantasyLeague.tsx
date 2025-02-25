import React, { useState, useEffect } from "react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Pencil, HelpCircle, Rocket, Target, Scale } from "lucide-react";
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
  const [selectedSection, setSelectedSection] = useState<string>("selections");
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
  const { toast } = useToast();
  const { isAdmin } = useAuth();

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
          *,
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

      const selections = selectionsData;
      const hasSubmittedSelections = selections.some(s => s.submitted_at !== null);

      // Map races to their respective days
      const days = daysData.map(day => {
        const dayRaces = racesData
          .filter(race => race.day_id === day.id)
          .map(race => ({
            ...race,
            horses: race.horses || [],
            selected_horse_id: selections.find(s => s.race_id === race.id)?.horse_id,
            chip: selections.find(s => s.race_id === race.id)?.chip
          }));

        return {
          ...day,
          races: dayRaces,
          selections_submitted: hasSubmittedSelections,
          name: `Day ${day.day_number}` // Add computed name property
        };
      });

      console.log("Final processed days:", days);
      setFestivalDays(days);
      setSelections(selections);
    } catch (error) {
      console.error("Error fetching festival days:", error);
    } finally {
      setLoading(false);
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

    if (activeChip) {
      // Apply chip to the selection
      const updatedSelections = selections.map(s => 
        s.race_id === raceId ? { ...s, horse_id: horseId, chip: activeChip } : s
      );
      setSelections(updatedSelections);

      // Update race in festival days to show chip
      setFestivalDays(days => days.map(day => ({
        ...day,
        races: day.races.map(race => 
          race.id === raceId 
            ? { ...race, selected_horse_id: horseId, chip: activeChip }
            : race
        )
      })));

      // Mark chip as used and reset active chip
      setChips(prevChips => prevChips.map(c => 
        c.id === activeChip ? { ...c, used: true } : c
      ));
      setActiveChip(null);
      
      toast({
        title: "Chip Applied",
        description: `${chips.find(c => c.id === activeChip)?.name} has been applied to your selection.`,
      });
      return;
    }

    // Regular selection handling
    const updatedSelections = selections.map(s => 
      s.race_id === raceId ? { ...s, horse_id: horseId } : s
    );
    setSelections(updatedSelections);

    // Update race in festival days
    setFestivalDays(days => days.map(day => ({
      ...day,
      races: day.races.map(race => 
        race.id === raceId 
          ? { ...race, selected_horse_id: horseId }
          : race
      )
    })));
  };

  const handleSubmitSelections = async () => {
    try {
      setIsSubmitting(true);
      const currentDay = festivalDays.find(day => day.id === selectedDay?.id);
      if (!currentDay) return;

      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;

      // Check if all races have selections
      const allRacesSelected = currentDay.races.every(race => race.selected_horse_id);
      if (!allRacesSelected) {
        alert("Please select a horse for all races before submitting.");
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

      alert("Your selections have been submitted successfully!");
    } catch (error) {
      console.error("Error submitting selections:", error);
      alert("There was an error submitting your selections. Please try again.");
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
          *,
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
    if (chips.find((c) => c.id === chipId)?.used) return;
    const chip = chips.find((c) => c.id === chipId);
    if (chip) {
      setSelectedChip(chip);
      setChipModalOpen(true);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Cheltenham Fantasy League 2025</h1>
          <Button 
            variant="default" 
            onClick={() => setRulesOpen(true)} 
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Rules & Points
          </Button>
        </div>

        <Tabs defaultValue={festivalDays[0]?.id} className="w-full" value={selectedSection} onValueChange={setSelectedSection}>
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
                        <span>{day.name}</span>
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
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl font-semibold">{day.name} Races</h2>
                          {activeChip && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>Click any selection to apply</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setActiveChip(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          {chips.map((chip) => (
                            <TooltipProvider key={chip.id}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Card
                                    className={cn(
                                      "cursor-pointer transition-colors hover:bg-accent",
                                      activeChip === chip.id && "bg-accent",
                                      chip.used && "opacity-50 cursor-not-allowed"
                                    )}
                                    onClick={() => handleChipClick(chip.id)}
                                  >
                                    <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                                      <p className="font-medium text-lg">{chip.name}</p>
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
                                    activeChip && "cursor-pointer hover:shadow-md transition-shadow",
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
                                  {selection?.chip && (
                                    <div className="absolute top-2 right-2">
                                      {/* <div className="p-1 rounded-full bg-primary/10">
                                        {React.createElement(chips.find(c => c.id === selection.chip)!.icon, {
                                          className: "h-4 w-4 text-primary"
                                        })}
                                      </div> */}
                                    </div>
                                  )}
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
                                        <p className="text-sm text-muted-foreground">
                                          {format(new Date(race.race_time), "HH:mm")}
                                        </p>
                                      </div>
                                      <Select
                                        value={race.selected_horse_id || ""}
                                        onValueChange={(value) => handleHorseSelect(race.id, value)}
                                        disabled={day.selections_submitted || (activeChip !== null && !selection?.chip)}
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

                            {!day.selections_submitted && (
                              <div className="flex justify-end mt-6">
                                <Button 
                                  onClick={handleSubmitSelections} 
                                  disabled={isSubmitting || !day.races.every(race => race.selected_horse_id)}
                                >
                                  {isSubmitting ? "Submitting..." : "Submit Selections"}
                                </Button>
                              </div>
                            )}
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
                {/* League Table content will go here */}
                <div className="text-muted-foreground">Coming soon...</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-xl">
              Rules & Points
            </DialogTitle>
            <DialogDescription className="text-center pt-4">
              Learn how the Fantasy League works and how points are awarded
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
              <ul className="list-disc pl-5 space-y-2">
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
    </AuthLayout>
  );
}
