import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatDistance } from "date-fns";
import { fractionalToDecimal } from "@/lib/utils/odds";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { useAuth } from "@/hooks/useAuth";

interface BetWithSelections {
  id: string;
  created_at: string;
  bet_type: "Single" | "Accumulator";
  stake: number;
  total_odds: string;
  is_each_way: boolean;
  is_free_bet: boolean;
  status: "Pending" | "Won" | "Lost" | "Void";
  potential_return: number | null;
  selections: {
    event: string;
    horse: string;
    odds: string;
    is_win: boolean;
    status: "Pending" | "Won" | "Lost" | "Void";
  }[];
}

export default function MyBets() {
  const { session } = useAuth();
  const [bets, setBets] = useState<BetWithSelections[]>([]);
  const [sortBy, setSortBy] = useState<"date" | "status" | "profit">("date");
  const [filterBetType, setFilterBetType] = useState<"all" | "Single" | "Accumulator">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "Pending" | "Won" | "Lost" | "Void">("all");
  const { toast } = useToast();

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  const fetchBets = async () => {
    try {
      // Fetch bets
      const { data: betsData, error: betsError } = await supabase
        .from("bets")
        .select("*")
        .order("created_at", { ascending: false });

      if (betsError) throw betsError;

      // Fetch selections for each bet
      const betsWithSelections = await Promise.all(
        betsData.map(async (bet) => {
          const { data: selectionsData, error: selectionsError } = await supabase
            .from("bet_selections")
            .select("*")
            .eq("bet_id", bet.id);

          if (selectionsError) throw selectionsError;

          return {
            ...bet,
            selections: selectionsData,
          };
        })
      );

      setBets(betsWithSelections);
    } catch (error) {
      console.error("Error fetching bets:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load bets. Please try again.",
      });
    }
  };

  useEffect(() => {
    fetchBets();
  }, []);

  const calculateProfitLoss = (bet: BetWithSelections) => {
    if (bet.status === "Pending" || bet.status === "Void") return 0;
    if (bet.status === "Lost") return -bet.stake;
    if (bet.status === "Won") {
      const decimalOdds = fractionalToDecimal(bet.total_odds);
      const winnings = bet.stake * decimalOdds;
      return winnings - bet.stake;
    }
    return 0;
  };

  const sortedAndFilteredBets = bets
    .filter((bet) => {
      if (filterBetType !== "all" && bet.bet_type !== filterBetType) return false;
      if (filterStatus !== "all" && bet.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "status") {
        return a.status.localeCompare(b.status);
      }
      if (sortBy === "profit") {
        return calculateProfitLoss(b) - calculateProfitLoss(a);
      }
      return 0;
    });

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Bets</h1>
          <div className="flex gap-4">
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="profit">Profit/Loss</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterBetType}
              onValueChange={(value: any) => setFilterBetType(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Single">Single</SelectItem>
                <SelectItem value="Accumulator">Accumulator</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterStatus}
              onValueChange={(value: any) => setFilterStatus(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Won">Won</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
                <SelectItem value="Void">Void</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Selection</TableHead>
                <TableHead>Odds</TableHead>
                <TableHead>Stake</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Profit/Loss</TableHead>
                <TableHead className="text-right">Date Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredBets.map((bet) => (
                <TableRow key={bet.id}>
                  <TableCell>
                    {bet.selections.map((s) => s.event).join(", ")}
                  </TableCell>
                  <TableCell>
                    {bet.selections.map((s) => s.horse).join(", ")}
                  </TableCell>
                  <TableCell>{bet.total_odds}</TableCell>
                  <TableCell>
                    £{bet.stake.toFixed(2)}
                    {bet.is_free_bet && (
                      <span className="ml-2 text-xs text-muted-foreground">(Free)</span>
                    )}
                    {bet.is_each_way && (
                      <span className="ml-2 text-xs text-muted-foreground">(E/W)</span>
                    )}
                  </TableCell>
                  <TableCell>{bet.bet_type}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          bet.status === "Won"
                            ? "bg-green-50 text-green-700"
                            : bet.status === "Lost"
                            ? "bg-red-50 text-red-700"
                            : bet.status === "Void"
                            ? "bg-gray-50 text-gray-700"
                            : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {bet.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        calculateProfitLoss(bet) > 0
                          ? "text-green-600"
                          : calculateProfitLoss(bet) < 0
                          ? "text-red-600"
                          : ""
                      }
                    >
                      {calculateProfitLoss(bet) > 0 && "+"}£
                      {Math.abs(calculateProfitLoss(bet)).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatDistance(new Date(bet.created_at), new Date(), {
                      addSuffix: true,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AuthLayout>
  );
}
