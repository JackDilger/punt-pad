import { AuthLayout } from "@/components/layout/AuthLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";

interface FestivalDay {
  id: string;
  day_number: number;
  date: string;
  is_published: boolean;
  cutoff_time: string;
}

interface Race {
  id: string;
  name: string;
  race_time: string;
  race_order: number;
  status: 'upcoming' | 'in_progress' | 'finished';
  horses: Horse[];
}

interface Horse {
  id: string;
  name: string;
  fixed_odds: number;
  points_if_wins: number;
}

interface Selection {
  raceId: string;
  horseId: string;
}

export default function FantasyLeague() {
  const [selectedDay, setSelectedDay] = useState("1");
  const [festivalDays, setFestivalDays] = useState<FestivalDay[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRaceId, setEditingRaceId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFestivalDays = async () => {
      try {
        const { data, error } = await supabase
          .from("fantasy_festival_days")
          .select("*")
          .order("day_number");

        if (error) throw error;
        
        if (data && data.length > 0) {
          const updatedData = data.map((day) => ({
            ...day,
            is_published: true // All days are published for testing
          }));
          setFestivalDays(updatedData);
        }
      } catch (error) {
        console.error("Error fetching festival days:", error);
      }
    };

    fetchFestivalDays();
  }, []);

  useEffect(() => {
    const fetchRaces = async () => {
      setLoading(true);
      try {
        const currentDay = festivalDays.find(d => d.day_number.toString() === selectedDay);
        if (!currentDay) return;

        const { data: racesData, error: racesError } = await supabase
          .from("fantasy_races")
          .select(`
            *,
            horses: fantasy_horses (*)
          `)
          .eq("day_id", currentDay.id)
          .order("race_order");

        if (racesError) throw racesError;
        
        setRaces(racesData || []);
      } catch (error) {
        console.error("Error fetching races:", error);
      } finally {
        setLoading(false);
      }
    };

    if (festivalDays.length > 0) {
      fetchRaces();
    }
  }, [selectedDay, festivalDays]);

  const handleDayChange = (day: string) => {
    setSelectedDay(day);
    setEditingRaceId(null);
  };

  const handleHorseSelection = (raceId: string, horseId: string) => {
    setSelections(prev => {
      const newSelections = prev.filter(s => s.raceId !== raceId);
      return [...newSelections, { raceId, horseId }];
    });
  };

  const getSelectedHorse = (raceId: string) => {
    return selections.find(s => s.raceId === raceId)?.horseId || "";
  };

  const handleAddHorse = async (raceId: string) => {
    // TODO: Implement horse addition
  };

  const handleRemoveHorse = async (raceId: string, horseId: string) => {
    // TODO: Implement horse removal
  };

  const handleUpdateRace = async (raceId: string) => {
    // TODO: Implement race update
  };

  return (
    <AuthLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Cheltenham Festival Fantasy League</h1>
        
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Tabs value={selectedDay} onValueChange={handleDayChange} className="w-full">
              <TabsList className="grid w-full grid-cols-4 rounded-none bg-muted/50 p-0">
                {[1, 2, 3, 4].map((dayNumber) => {
                  const day = festivalDays.find(d => d.day_number === dayNumber);
                  const isPublished = day?.is_published || false;
                  
                  return (
                    <TabsTrigger 
                      key={dayNumber}
                      value={dayNumber.toString()}
                      disabled={false}
                      className="relative cursor-pointer data-[state=active]:bg-white border-0 px-0 py-0 h-full data-[state=active]:rounded-none data-[state=active]:shadow-none hover:bg-white/50"
                    >
                      <div className="flex flex-col items-center py-3 w-full">
                        <span>{`Day ${dayNumber}`}</span>
                        {!isPublished && (
                          <span className="text-xs text-muted-foreground mt-1">
                            Coming Soon
                          </span>
                        )}
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {[1, 2, 3, 4].map((dayNumber) => (
                <TabsContent key={dayNumber} value={dayNumber.toString()} className="p-6 pt-4 bg-white">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold">Day {dayNumber} Races</h2>
                      {festivalDays.find(d => d.day_number === dayNumber)?.cutoff_time && (
                        <p className="text-sm text-muted-foreground">
                          Selections close at {format(new Date(festivalDays.find(d => d.day_number === dayNumber)?.cutoff_time || ''), 'HH:mm')}
                        </p>
                      )}
                    </div>

                    {loading ? (
                      <p>Loading races...</p>
                    ) : races.length > 0 ? (
                      <div className="space-y-4">
                        {races.map((race) => (
                          <Card key={race.id} className="p-4">
                            <div className="space-y-4">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  {editingRaceId === race.id ? (
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor={`race-name-${race.id}`}>Race Name</Label>
                                        <Input
                                          id={`race-name-${race.id}`}
                                          defaultValue={race.name}
                                          className="w-[300px]"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor={`race-time-${race.id}`}>Race Time</Label>
                                        <Input
                                          id={`race-time-${race.id}`}
                                          type="time"
                                          defaultValue={format(new Date(race.race_time), 'HH:mm')}
                                          className="w-[200px]"
                                        />
                                      </div>
                                      <div className="flex space-x-2">
                                        <Button 
                                          variant="secondary" 
                                          size="sm"
                                          onClick={() => setEditingRaceId(null)}
                                        >
                                          Cancel
                                        </Button>
                                        <Button 
                                          size="sm"
                                          onClick={() => handleUpdateRace(race.id)}
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
                                          onClick={() => setEditingRaceId(race.id)}
                                        >
                                          <PencilIcon className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {format(new Date(race.race_time), 'HH:mm')}
                                      </p>
                                    </>
                                  )}
                                </div>
                                <Select
                                  value={getSelectedHorse(race.id)}
                                  onValueChange={(value) => handleHorseSelection(race.id, value)}
                                >
                                  <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Select a horse" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {race.horses?.map((horse) => (
                                      <SelectItem key={horse.id} value={horse.id}>
                                        <div className="flex justify-between items-center w-full">
                                          <span>{horse.name}</span>
                                          <span className="text-sm text-muted-foreground">
                                            {horse.fixed_odds} | {horse.points_if_wins}pts
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {editingRaceId === race.id && (
                                <div className="border-t pt-4 mt-4">
                                  <h4 className="font-medium mb-2">Horses</h4>
                                  <div className="space-y-2">
                                    {race.horses?.map((horse) => (
                                      <div key={horse.id} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                                        <div>
                                          <Input
                                            defaultValue={horse.name}
                                            className="w-[200px]"
                                          />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <Input
                                            type="number"
                                            defaultValue={horse.fixed_odds}
                                            className="w-[100px]"
                                          />
                                          <Input
                                            type="number"
                                            defaultValue={horse.points_if_wins}
                                            className="w-[100px]"
                                          />
                                          <Button
                                            variant="destructive"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleRemoveHorse(race.id, horse.id)}
                                          >
                                            <TrashIcon className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full"
                                      onClick={() => handleAddHorse(race.id)}
                                    >
                                      <PlusIcon className="h-4 w-4 mr-2" />
                                      Add Horse
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-muted/50 rounded-lg p-8 text-center">
                        <p>No races available for Day {dayNumber}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {festivalDays.find(d => d.day_number === dayNumber)?.is_published 
                            ? "Races will be displayed here once available"
                            : "This day's races are not yet published"}
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
