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

interface Selection {
  event: string;
  horse: string;
  odds: string;
}

export const BetEntry = () => {
  const [betType, setBetType] = useState<"Single" | "Accumulator">("Single");
  const [selections, setSelections] = useState<Selection[]>([{ event: "", horse: "", odds: "" }]);
  const [isEachWay, setIsEachWay] = useState(false);
  const [isFreeBet, setIsFreeBet] = useState(false);
  const [usesFractionalOdds, setUsesFractionalOdds] = useState(true);

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
    setSelections([...selections, { event: "", horse: "", odds: "" }]);
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

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Enter Horse Racing Bet</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          {/* Bet Type Selection */}
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

          {/* Selections */}
          <div className="space-y-3">
            {selections.map((selection, index) => (
              <div key={index} className="bg-muted border rounded-lg p-3">
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
                    <Label htmlFor={`horse-${index}`} className="text-sm">Horse & Bet</Label>
                    <Input
                      id={`horse-${index}`}
                      placeholder="e.g., Constitution Hill to win"
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
                    <Label htmlFor="stake" className="text-sm">Stake</Label>
                    <Input id="stake" type="number" step="0.01" placeholder="10.00" />
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

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="each-way"
                  checked={isEachWay}
                  onCheckedChange={(checked) => setIsEachWay(checked as boolean)}
                />
                <Label htmlFor="each-way">Each Way</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="free-bet"
                  checked={isFreeBet}
                  onCheckedChange={(checked) => setIsFreeBet(checked as boolean)}
                />
                <Label htmlFor="free-bet">Free Bet</Label>
              </div>
            </div>

            <Button type="submit">Add Bet</Button>
          </div>

          {/* Total Odds Display for Accumulators */}
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
