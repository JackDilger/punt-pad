import { AuthLayout } from "@/components/layout/AuthLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, formatDistance } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PencilIcon, PlusIcon, TrashIcon, ChevronDownIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Database } from '@/integrations/supabase/types';

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
}

interface Selection {
  id: string;
  user_id: string;
  horse_id: string;
  race_id: string;
  day_id: string;
  created_at: string;
  submitted_at: string | null;
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
  let closest = Object.entries(odds).reduce((prev, [key, value]) => {
    const prevDiff = Math.abs(parseFloat(prev[0]) - decimal);
    const currDiff = Math.abs(parseFloat(key) - decimal);
    return currDiff < prevDiff ? [key, value] : prev;
  });

  return closest[1];
};

export default function FantasyLeague() {
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [festivalDays, setFestivalDays] = useState<FestivalDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRaceId, setEditingRaceId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<{
    name: string;
    time: string;
    horses: Horse[];
  } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFestivalDays();
  }, []);

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
            selected_horse_id: selections.find(s => s.race_id === race.id)?.horse_id
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
      if (days.length > 0) {
        setSelectedDay(days[0].id);
      }
    } catch (error) {
      console.error("Error fetching festival days:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDayChange = (value: string) => {
    setSelectedDay(value);
  };

  const handleHorseSelection = async (raceId: string, horseId: string) => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;

      const currentDay = festivalDays.find(day => 
        day.races.some(race => race.id === raceId)
      );
      if (!currentDay) return;

      // Check if a selection already exists
      const { data: existingSelection } = await supabase
        .from('fantasy_selections')
        .select()
        .eq('user_id', userId)
        .eq('race_id', raceId)
        .single();

      if (existingSelection) {
        // Update existing selection
        const { error: updateError } = await supabase
          .from('fantasy_selections')
          .update({ horse_id: horseId } satisfies Database['public']['Tables']['fantasy_selections']['Update'])
          .eq('id', existingSelection.id);

        if (updateError) throw updateError;
      } else {
        // Create new selection
        const { error: insertError } = await supabase
          .from('fantasy_selections')
          .insert({
            user_id: userId,
            horse_id: horseId,
            race_id: raceId,
            day_id: currentDay.id
          } satisfies Database['public']['Tables']['fantasy_selections']['Insert']);

        if (insertError) throw insertError;
      }

      // Get race details
      const { data: raceData, error: raceError } = await supabase
        .from('fantasy_races')
        .select(`
          *,
          horses:fantasy_horses(*)
        `)
        .eq('id', raceId)
        .single();

      if (raceError) {
        console.error("Error fetching race:", raceError);
        throw raceError;
      }

      // Add horses to race
      const race = {
        ...raceData,
        horses: raceData.horses || [],
        selected_horse_id: horseId
      } as Race;

      // Update festival days state
      setFestivalDays(days => days.map(day => {
        if (!day.races.some(r => r.id === raceId)) return day;
        return {
          ...day,
          races: day.races.map(r => r.id === raceId ? race : r)
        };
      }));
    } catch (error) {
      console.error('Error updating selection:', error);
    }
  };

  const handleSubmitSelections = async () => {
    try {
      setIsSubmitting(true);
      const currentDay = festivalDays.find(day => day.id === selectedDay);
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
      time: format(new Date(race.race_time), 'HH:mm'),
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
      const [hours, minutes] = editingValues.time.split(':');
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

      // Update all horses
      for (const horse of editingValues.horses) {
        const { error: horseError } = await supabase
          .from('fantasy_horses')
          .update({
            name: horse.name,
            fixed_odds: horse.fixed_odds,
            points_if_wins: horse.points_if_wins
          })
          .eq('id', horse.id);

        if (horseError) throw horseError;
      }

      // Refresh the races data
      const { data: updatedRace, error: fetchError } = await supabase
        .from('fantasy_races')
        .select(`
          *,
          horses:fantasy_horses(*)
        `)
        .eq('id', raceId)
        .single();

      if (fetchError) throw fetchError;

      // Update local state
      setFestivalDays(days => days.map(day => {
        if (day.id === currentDay.id) {
          return {
            ...day,
            races: day.races.map(race => race.id === raceId ? {
              ...updatedRace,
              time: updatedRace.race_time,
              horses: updatedRace.horses || [],
              selected_horse_id: race.selected_horse_id
            } : race)
          };
        }
        return day;
      }));

      handleCancelEditing();
    } catch (error) {
      console.error('Error updating race:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddHorse = async (raceId: string) => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('fantasy_horses')
        .insert({
          race_id: raceId,
          name: null,
          fixed_odds: null,
          points_if_wins: null
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setFestivalDays(days => days.map(day => {
        return {
          ...day,
          races: day.races.map(race => {
            if (race.id === raceId) {
              return {
                ...race,
                horses: [...race.horses, data]
              };
            }
            return race;
          })
        };
      }));
    } catch (error) {
      console.error('Error adding horse:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveHorse = async (raceId: string, horseId: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('fantasy_horses')
        .delete()
        .eq('id', horseId);

      if (error) throw error;

      // Update local state
      setFestivalDays(days => days.map(day => {
        return {
          ...day,
          races: day.races.map(race => {
            if (race.id === raceId) {
              return {
                ...race,
                horses: race.horses.filter(h => h.id !== horseId)
              };
            }
            return race;
          })
        };
      }));
    } catch (error) {
      console.error('Error removing horse:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Cheltenham Festival Fantasy League</h1>
        
        <Collapsible>
          <Card className="mb-6">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Rules & Points</h2>
                  <ChevronDownIcon className="h-5 w-5" />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-6">
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
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Tabs value={selectedDay} onValueChange={handleDayChange} className="w-full">
              <TabsList className="grid w-full grid-cols-4 rounded-none bg-muted/50 p-0">
                {festivalDays.map((day) => (
                  <TabsTrigger 
                    key={day.id}
                    value={day.id}
                    disabled={false}
                    className="relative cursor-pointer data-[state=active]:bg-white border-0 px-0 py-0 h-full data-[state=active]:rounded-none data-[state=active]:shadow-none hover:bg-white/50"
                  >
                    <div className="flex flex-col items-center py-3 w-full">
                      <span>{day.name}</span>
                      {day.selections_submitted && (
                        <span className="text-xs text-muted-foreground mt-1">
                          Selections submitted
                        </span>
                      )}
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>

              {festivalDays.map((day) => (
                <TabsContent key={day.id} value={day.id} className="p-6 pt-4 bg-white">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold">{day.name} Races</h2>
                      {day.date && (
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(day.date), 'do MMMM yyyy')}
                        </p>
                      )}
                    </div>

                    {loading ? (
                      <p>Loading races...</p>
                    ) : day.races.length > 0 ? (
                      <div className="space-y-4">
                        {day.selections_submitted ? (
                          <div className="bg-green-50 p-4 rounded-md mb-4">
                            <p className="text-green-700">Your selections for {day.name} have been submitted and cannot be changed.</p>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 p-4 rounded-md mb-4">
                            <p className="text-yellow-700">
                              Selections close at {format(new Date(day.cutoff_time), "HH:mm")}. 
                              Make sure to submit your selections before then.
                            </p>
                          </div>
                        )}

                        {day.races.map((race) => (
                          <Card key={race.id} className="p-4">
                            <div className="space-y-4">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  {editingRaceId === race.id && editingValues ? (
                                    <div className="space-y-2">
                                      <div>
                                        <Label htmlFor={`race-name-${race.id}`}>Race Name</Label>
                                        <Input
                                          id={`race-name-${race.id}`}
                                          value={editingValues.name}
                                          onChange={(e) => setEditingValues({
                                            ...editingValues,
                                            name: e.target.value
                                          })}
                                          className="w-[300px]"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor={`race-time-${race.id}`}>Race Time</Label>
                                        <Input
                                          id={`race-time-${race.id}`}
                                          type="time"
                                          value={editingValues.time}
                                          onChange={(e) => setEditingValues({
                                            ...editingValues,
                                            time: e.target.value
                                          })}
                                          className="w-[200px]"
                                        />
                                      </div>
                                      <div className="flex space-x-2">
                                        <Button 
                                          variant="secondary" 
                                          size="sm"
                                          onClick={handleCancelEditing}
                                        >
                                          Cancel
                                        </Button>
                                        <Button 
                                          size="sm"
                                          onClick={() => handleUpdateRace(race.id)}
                                          disabled={saving}
                                        >
                                          Save Changes
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-center space-x-2">
                                        <h3 className="font-medium">{race.name}</h3>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() => handleStartEditing(race)}
                                        >
                                          <PencilIcon className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {format(new Date(race.race_time), "HH:mm")}
                                      </div>
                                    </>
                                  )}
                                </div>
                                <Select
                                  value={race.selected_horse_id || ""}
                                  onValueChange={(value) => handleHorseSelection(race.id, value)}
                                  disabled={day.selections_submitted}
                                >
                                  <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Select a horse" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {race.horses?.map((horse) => (
                                      <SelectItem key={horse.id} value={horse.id}>
                                        <div className="flex items-center w-full gap-2">
                                          <span className="flex-grow">{horse.name}</span>
                                          <span className="text-sm text-muted-foreground">
                                            {toFractionalOdds(horse.fixed_odds)}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {editingRaceId === race.id && editingValues && (
                              <div className="border-t pt-4 mt-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium">Horses</h4>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAddHorse(race.id)}
                                    disabled={saving}
                                  >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Add Horse
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {editingValues.horses.map((horse) => (
                                    <div key={horse.id} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                                      <Input
                                        value={horse.name || ''}
                                        onChange={(e) => handleHorseFieldChange(horse.id, 'name', e.target.value)}
                                        className="w-[200px]"
                                        placeholder="Enter horse name"
                                      />
                                      <div className="flex items-center space-x-2">
                                        <Input
                                          type="number"
                                          value={horse.fixed_odds || ''}
                                          onChange={(e) => handleHorseFieldChange(horse.id, 'fixed_odds', e.target.value ? parseFloat(e.target.value) : null)}
                                          className="w-[100px]"
                                          step="0.01"
                                          min="1"
                                          placeholder="e.g. 2.50"
                                        />
                                        <Input
                                          type="number"
                                          value={horse.points_if_wins || ''}
                                          onChange={(e) => handleHorseFieldChange(horse.id, 'points_if_wins', e.target.value ? parseInt(e.target.value) : null)}
                                          className="w-[100px]"
                                          min="1"
                                          placeholder="Win pts"
                                        />
                                        <Button
                                          variant="destructive"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() => handleRemoveHorse(race.id, horse.id)}
                                          disabled={saving}
                                        >
                                          <TrashIcon className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </Card>
                        ))}

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
      </div>
    </AuthLayout>
  );
}
