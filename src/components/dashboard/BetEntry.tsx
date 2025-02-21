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

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Enter Horse Racing Bet</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
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

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4">
              {selections.map((selection, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Checkbox
                    id={`win-${index}`}
                    checked={selection.isWin}
                    onCheckedChange={(checked) => {
                      const newSelections = [...selections];
                      newSelections[index].isWin = checked as boolean;
                      setSelections(newSelections);
                    }}
                  />
                  <Label htmlFor={`win-${index}`}>Win</Label>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="each-way"
                  checked={isEachWay}
                  onCheckedChange={(checked) => setIsEachWay(checked as boolean)}
                />
                <Label htmlFor="each-way">Each Way</Label>
              </div>
            </div>

            <Button 
              type="button"
              onClick={async () => {
                try {
                  // Validate form
                  if (!stake || parseFloat(stake) <= 0) {
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description: "Please enter a valid stake amount",
                    });
                    return;
                  }

                  if (selections.some(s => !s.event || !s.horse || !s.odds)) {
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description: "Please fill in all selection details",
                    });
                    return;
                  }

                  // Create bet
                  await createBet({
                    betType,
                    stake: parseFloat(stake),
                    totalOdds: calculateTotalOdds(),
                    isEachWay,
                    isFreeBet,
                    selections
                  });

                  // Reset form
                  setSelections([{ event: "", horse: "", odds: "", isWin: true }]);
                  setStake("");
                  setBetType("Single");
                  setIsEachWay(false);
                  setIsFreeBet(false);

                  toast({
                    title: "Success",
                    description: "Bet has been added successfully",
                  });
                } catch (error) {
                  console.error('Error saving bet:', error);
                  toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to save bet. Please try again.",
                  });
                }
              }}
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
