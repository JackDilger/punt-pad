import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { fractionalToDecimal, decimalToFractional, isFractionalOdds } from "@/lib/utils/odds";
import { Plus, X } from "lucide-react";
import { createBet } from "@/lib/db/bets";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Selection {
  event: string;
  horse: string;
  odds: string;
  isWin: boolean;
}

export const BetEntry = () => {
  const [betType, setBetType] = useState<"Single" | "Accumulator">("Single");
  const [selections, setSelections] = useState<Selection[]>([{ event: "", horse: "", odds: "", isWin: true }]);
  const [isEachWay, setIsEachWay] = useState(false);
  const [placeTerms, setPlaceTerms] = useState<0.20 | 0.25>(0.25); // Default to 1/4 odds
  const [isFreeBet, setIsFreeBet] = useState(false);
  const [usesFractionalOdds, setUsesFractionalOdds] = useState(true);
  const [stake, setStake] = useState<string>("");
  const { toast } = useToast();

  const handleOddsChange = (index: number, value: string) => {
    const newSelections = [...selections];
    if (usesFractionalOdds) {
      newSelections[index].odds = value;
    } else {
      newSelections[index].odds = value;
    }
    setSelections(newSelections);
  };

  const addSelection = () => {
    setSelections([...selections, { event: "", horse: "", odds: "", isWin: true }]);
  };

  const removeSelection = (index: number) => {
    if (selections.length > 1) {
      const newSelections = selections.filter((_, i) => i !== index);
      setSelections(newSelections);
    }
  };

  const calculateTotalOdds = (): string => {
    if (betType === "Single" || selections.length === 1) return selections[0].odds;

    const decimalOdds = selections.map(s => {
      if (!s.odds) return 1;
      return usesFractionalOdds ? fractionalToDecimal(s.odds) : parseFloat(s.odds);
    });

    const total = decimalOdds.reduce((acc, curr) => acc * curr, 1);
    return usesFractionalOdds ? decimalToFractional(total) : total.toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!stake || parseFloat(stake) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid stake amount",
        variant: "destructive",
      });
      return;
    }

    if (selections.some(s => !s.event || !s.horse || !s.odds)) {
      toast({
        title: "Error",
        description: "Please fill in all selection details",
        variant: "destructive",
      });
      return;
    }

    try {
      const totalOdds = calculateTotalOdds();
      console.log('Calculated total odds:', totalOdds);

      // Create bet object using snake_case for database fields
      const bet = {
        bet_type: betType,
        stake: parseFloat(stake),
        total_odds: totalOdds,
        is_each_way: isEachWay,
        place_terms: isEachWay ? placeTerms : 0.25,
        is_free_bet: isFreeBet,
        selections: selections.map(s => ({
          event: s.event,
          horse: s.horse,
          odds: s.odds,
          is_win: true
        }))
      };

      console.log('Submitting bet:', bet);
      const result = await createBet(bet);
      console.log('Bet created:', result);

      // Reset form
      setBetType("Single");
      setSelections([{ event: "", horse: "", odds: "", isWin: true }]);
      setIsEachWay(false);
      setPlaceTerms(0.25);
      setIsFreeBet(false);
      setStake("");

      toast({
        title: "Success",
        description: "Bet created successfully",
      });
    } catch (error) {
      console.error('Error creating bet:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create bet",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Place a Bet</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <Label className="w-20">Bet Type</Label>
            <RadioGroup
              defaultValue="Single"
              onValueChange={(value) => setBetType(value as "Single" | "Accumulator")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Single" id="single" />
                <Label htmlFor="single">Single</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Accumulator" id="accumulator" />
                <Label htmlFor="accumulator">Accumulator</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            {selections.map((selection, index) => (
              <div key={index} className="bg-muted rounded-lg p-3 relative">
                {betType === "Accumulator" && selections.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => removeSelection(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor={`event-${index}`} className="text-sm">Race</Label>
                    <Input
                      id={`event-${index}`}
                      placeholder="e.g., Cheltenham 3:30"
                      value={selection.event}
                      onChange={(e) => {
                        const newSelections = [...selections];
                        newSelections[index].event = e.target.value;
                        setSelections(newSelections);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`horse-${index}`} className="text-sm">Selection</Label>
                    <Input
                      id={`horse-${index}`}
                      placeholder="e.g., Constitution Hill"
                      value={selection.horse}
                      onChange={(e) => {
                        const newSelections = [...selections];
                        newSelections[index].horse = e.target.value;
                        setSelections(newSelections);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label htmlFor={`odds-${index}`} className="text-sm">Odds</Label>
                      <div className="flex items-center gap-2 text-sm">
                        <Label htmlFor="odds-format">Fractional</Label>
                        <Switch
                          id="odds-format"
                          checked={usesFractionalOdds}
                          onCheckedChange={setUsesFractionalOdds}
                        />
                      </div>
                    </div>
                    <Input
                      id={`odds-${index}`}
                      placeholder={usesFractionalOdds ? "e.g., 5/1" : "e.g., 6.0"}
                      value={selection.odds}
                      onChange={(e) => handleOddsChange(index, e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="stake" className="text-sm">Stake</Label>
                      <div className="flex items-center gap-2 text-sm">
                        <Label htmlFor="free-bet">Free Bet</Label>
                        <Checkbox
                          id="free-bet"
                          checked={isFreeBet}
                          onCheckedChange={(checked) => setIsFreeBet(checked as boolean)}
                        />
                      </div>
                    </div>
                    <Input 
                      id="stake" 
                      type="number" 
                      step="0.01" 
                      placeholder="10.00"
                      value={stake}
                      onChange={(e) => setStake(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            {betType === "Accumulator" && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={addSelection}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Selection
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isEachWay"
                  checked={isEachWay}
                  onCheckedChange={(checked) => setIsEachWay(checked as boolean)}
                />
                <label
                  htmlFor="isEachWay"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Each Way
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="win"
                  checked={selections[0].isWin}
                  onCheckedChange={(checked) => {
                    const newSelections = [...selections];
                    newSelections[0].isWin = checked as boolean;
                    setSelections(newSelections);
                  }}
                />
                <label
                  htmlFor="win"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Win
                </label>
              </div>

              {isEachWay && (
                <div className="flex items-center space-x-2">
                  <label
                    htmlFor="placeTerms"
                    className="text-sm font-medium leading-none"
                  >
                    Place Terms:
                  </label>
                  <Select
                    value={placeTerms.toString()}
                    onValueChange={(value) => setPlaceTerms(parseFloat(value) as 0.20 | 0.25)}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Select terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.25">1/4 odds</SelectItem>
                      <SelectItem value="0.20">1/5 odds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <Button 
              type="submit"
              className="bg-green-600 hover:bg-green-700"
            >
              Add Bet
            </Button>
          </div>

          {betType === "Accumulator" && selections.length > 1 && (
            <div className="text-sm font-medium">
              Total Odds: <span className="font-bold">{calculateTotalOdds()}</span>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
