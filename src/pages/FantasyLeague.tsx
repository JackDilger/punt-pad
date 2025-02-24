import { AuthLayout } from "@/components/layout/AuthLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

interface FestivalDay {
  id: string;
  day_number: number;
  date: string;
  is_published: boolean;
  cutoff_time: string;
}

export default function FantasyLeague() {
  const [selectedDay, setSelectedDay] = useState("1");
  const [festivalDays, setFestivalDays] = useState<FestivalDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFestivalDays = async () => {
      try {
        const { data, error } = await supabase
          .from("fantasy_festival_days")
          .select("*")
          .order("day_number");

        if (error) throw error;
        
        // For testing purposes, set all days as published
        if (data && data.length > 0) {
          const updatedData = data.map((day) => ({
            ...day,
            is_published: true // All days are published for testing
          }));
          setFestivalDays(updatedData);
        }
      } catch (error) {
        console.error("Error fetching festival days:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFestivalDays();
  }, []);

  const handleDayChange = (day: string) => {
    console.log("Changing to day:", day);
    setSelectedDay(day);
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
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Day {dayNumber} Races</h2>
                    {loading ? (
                      <p>Loading...</p>
                    ) : (
                      <div className="bg-muted/50 rounded-lg p-8 text-center">
                        <p>Content for Day {dayNumber} will appear here</p>
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
