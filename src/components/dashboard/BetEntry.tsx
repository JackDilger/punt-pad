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
      // If decimal odds, store as is
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
      <CardHeader>
        <CardTitle>Enter Horse Racing Bet</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          {/* Bet Type Selection */}
          <div className="space-y-2">
            <Label>Bet Type</Label>
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
          <div className="space-y-4">
            {selections.map((selection, index) => (
              <div key={index} className="space-y-4 p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Selection {index + 1}</span>
                  {betType === "Accumulator" && selections.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSelection(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`event-${index}`}>Race</Label>
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

                <div className="space-y-2">
                  <Label htmlFor={`horse-${index}`}>Horse & Bet</Label>
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

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor={`odds-${index}`}>Odds</Label>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="odds-format" className="text-sm">Fractional</Label>
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

          {/* Stake Input */}
          <div className="space-y-2">
            <Label htmlFor="stake">Stake</Label>
            <Input id="stake" type="number" step="0.01" placeholder="10.00" />
          </div>

          {/* Each Way & Free Bet Options */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="each-way"
                checked={isEachWay}
                onCheckedChange={(checked) => setIsEachWay(checked as boolean)}
              />
              <Label htmlFor="each-way">Each Way</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="free-bet"
                checked={isFreeBet}
                onCheckedChange={(checked) => setIsFreeBet(checked as boolean)}
              />
              <Label htmlFor="free-bet">Free Bet</Label>
            </div>
          </div>

          {/* Total Odds Display for Accumulators */}
          {betType === "Accumulator" && selections.length > 1 && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium">Total Odds</div>
              <div className="text-2xl font-bold">{calculateTotalOdds()}</div>
            </div>
          )}

          <Button type="submit" className="w-full">
            Add Bet
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
