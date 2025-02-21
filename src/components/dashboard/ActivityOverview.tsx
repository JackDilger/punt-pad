import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { formatDistance } from "date-fns";
import { Pencil, Trash2, Check, X } from "lucide-react";

interface BetWithSelections {
  id: string;
  status: "Pending" | "Won" | "Lost" | "Void" | "Placed";
  stake: number;
  total_odds: string;
  created_at: string;
  bet_type: string;
  is_each_way: boolean;
  place_terms: number;
  is_free_bet: boolean;
  selections: {
    id: string;
    event: string;
    horse: string;
    odds: string;
    status: "Pending" | "Won" | "Lost" | "Void" | "Placed";
    is_win: boolean;
  }[];
}

const fractionalToDecimal = (fractional: string): number => {
  // If the odds are already in decimal format, return as number
  if (!fractional.includes('/')) {
    return parseFloat(fractional);
  }

  // Convert fractional odds to decimal
  const [numerator, denominator] = fractional.split('/').map(Number);
  return numerator / denominator + 1;
};

export const ActivityOverview = () => {
  const [bets, setBets] = useState<BetWithSelections[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    const fetchBets = async () => {
      try {
        const { data: betsData, error: betsError } = await supabase
          .from("bets")
          .select("*, selections:bet_selections(*)")
          .order("created_at", { ascending: false });

        if (betsError) throw betsError;

        setBets(betsData || []);
      } catch (error) {
        console.error("Error fetching bets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBets();
  }, []);

  const calculateStats = () => {
    // Calculate total stake including both parts of each way bets
    const totalStake = bets.reduce((sum, bet) => {
      const effectiveStake = bet.is_each_way ? bet.stake * 2 : bet.stake;
      return sum + (bet.is_free_bet ? 0 : effectiveStake);
    }, 0);

    const completedBets = bets.filter(bet => bet.status !== "Pending" && bet.status !== "Void");
    const wonBets = bets.filter(bet => bet.status === "Won" || bet.status === "Placed");
    
    let totalProfit = 0;
    bets.forEach(bet => {
      if (bet.status === "Won" || bet.status === "Placed") {
        const decimalOdds = fractionalToDecimal(bet.total_odds);
        
        if (bet.is_free_bet) {
          // For free bets, only count winnings (not stake return)
          if (bet.status === "Won") {
            totalProfit += bet.stake * (decimalOdds - 1);
          } else if (bet.status === "Placed" && bet.is_each_way) {
            const placeOdds = ((decimalOdds - 1) * bet.place_terms) + 1;
            totalProfit += bet.stake * (placeOdds - 1);
          }
        } else {
          let returns = 0;
          
          if (bet.status === "Won") {
            // Full win - calculate both win and place parts
            returns = bet.stake * decimalOdds; // Includes stake return
            if (bet.is_each_way) {
              const placeOdds = ((decimalOdds - 1) * bet.place_terms) + 1;
              returns += bet.stake * placeOdds; // Includes stake return
            }
          } else if (bet.status === "Placed" && bet.is_each_way) {
            // Only place part won
            const placeOdds = ((decimalOdds - 1) * bet.place_terms) + 1;
            returns = bet.stake * placeOdds; // Includes stake return
          }
          
          // Subtract total stake (both win and place parts for each way)
          const effectiveStake = bet.is_each_way ? bet.stake * 2 : bet.stake;
          totalProfit += returns - effectiveStake;
        }
      } else if (bet.status === "Lost" && !bet.is_free_bet) {
        // Subtract total stake for lost bets (both parts for each way)
        const effectiveStake = bet.is_each_way ? bet.stake * 2 : bet.stake;
        totalProfit -= effectiveStake;
      }
    });

    const winRate = completedBets.length > 0 
      ? (wonBets.length / completedBets.length) * 100 
      : 0;

    const roi = totalStake > 0 
      ? (totalProfit / totalStake) * 100 
      : 0;

    return {
      totalStake,
      winRate,
      totalProfit,
      roi
    };
  };

  const stats = calculateStats();

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Activity Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted rounded-lg p-3">
              <div className="text-sm font-medium">Total Units Staked</div>
              <div className="text-2xl font-bold">£{stats.totalStake.toFixed(2)}</div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="text-sm font-medium">Win Rate</div>
              <div className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="text-sm font-medium">Profit/Loss</div>
              <div className={`text-2xl font-bold ${
                stats.totalProfit > 0 
                  ? "text-green-600" 
                  : stats.totalProfit < 0 
                  ? "text-red-600" 
                  : ""
              }`}>
                {stats.totalProfit > 0 ? "+" : stats.totalProfit < 0 ? "-" : ""}£
                {Math.abs(stats.totalProfit).toFixed(2)}
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="text-sm font-medium">ROI</div>
              <div className={`text-2xl font-bold ${
                stats.roi > 0 
                  ? "text-green-600" 
                  : stats.roi < 0 
                  ? "text-red-600" 
                  : ""
              }`}>
                {stats.roi > 0 ? "+" : stats.roi < 0 ? "-" : ""}
                {Math.abs(stats.roi).toFixed(1)}%
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Recent Activity</h3>
            {loading ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                Loading...
              </div>
            ) : bets.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                No bets recorded yet
              </div>
            ) : (
              <div className="space-y-2">
                {bets.slice(0, 5).map((bet) => (
                  <div
                    key={bet.id}
                    className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded"
                  >
                    <div>
                      <div className="font-medium">
                        {bet.selections[0]?.horse || "Unknown Horse"}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {formatDistance(new Date(bet.created_at), new Date(), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div>£{bet.stake.toFixed(2)}</div>
                      <div
                        className={`px-2 py-1 rounded text-xs ${
                          bet.status === "Won"
                            ? "bg-green-100 text-green-700"
                            : bet.status === "Lost"
                            ? "bg-red-100 text-red-700"
                            : bet.status === "Placed"
                            ? "bg-blue-100 text-blue-700"
                            : bet.status === "Void"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {bet.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
