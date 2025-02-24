import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/components/ui/use-toast";
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
import { formatDistance } from "date-fns";
import { fractionalToDecimal } from "@/lib/utils/odds";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Input } from "@/components/ui/input";
import { Pencil, Save, Trash2, Check, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BetSelection {
  id: string;
  bet_id: string;
  event: string;
  horse: string;
  odds: string;
  is_win: boolean;
  status: 'Pending' | 'Won' | 'Lost' | 'Void';
}

interface BetWithSelections {
  id: string;
  user_id: string;
  created_at: string;
  bet_type: 'Single' | 'Accumulator';
  stake: number;
  total_odds: string;
  is_each_way: boolean;
  place_terms: number;
  is_free_bet: boolean;
  status: 'Pending' | 'Won' | 'Lost' | 'Void' | 'Placed';
  potential_return: number | null;
  selections: BetSelection[];
}

export default function MyBets() {
  const { session } = useAuth();
  const [bets, setBets] = useState<BetWithSelections[]>([]);
  const [sortBy, setSortBy] = useState<"date" | "status" | "profit">("date");
  const [filterBetType, setFilterBetType] = useState<"all" | "Single" | "Accumulator">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "Pending" | "Won" | "Lost" | "Void" | "Placed">("all");
  const [editingBetId, setEditingBetId] = useState<string | null>(null);
  const [editingBet, setEditingBet] = useState<BetWithSelections | null>(null);
  const { toast } = useToast();

  const fetchBets = async () => {
    try {
      // Fetch bets with selections
      const { data: betsData } = await supabase
        .from('bets')
        .select('*, bet_selections(*)')
        .eq('user_id', session.user.id)
        .returns<(Database['public']['Tables']['bets']['Row'] & {
          bet_selections: Database['public']['Tables']['bet_selections']['Row'][];
        })[]>();

      if (!betsData) return null;

      // Map the data to our interface
      const mappedBets: BetWithSelections[] = betsData.map(bet => ({
        ...bet,
        place_terms: bet.placeterms,
        selections: bet.bet_selections.map(selection => ({
          id: selection.id,
          bet_id: selection.bet_id,
          event: selection.event,
          horse: selection.horse,
          odds: selection.odds,
          is_win: selection.is_win,
          status: selection.status
        }))
      }));

      setBets(mappedBets);
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
    console.log('Calculating profit/loss for bet:', bet);
    if (bet.status === "Pending" || bet.status === "Void") {
      return 0;
    }

    // For each way bets, we need to consider both win and place parts
    const effectiveStake = bet.is_each_way ? bet.stake * 2 : bet.stake;

    if (bet.status === "Lost") {
      // For lost bets, we lose the total stake (both win and place parts for each way)
      return bet.is_free_bet ? 0 : -effectiveStake;
    }

    const decimalOdds = typeof bet.total_odds === 'string' ? 
      fractionalToDecimal(bet.total_odds) : 
      parseFloat(bet.total_odds);
    console.log('Decimal odds:', decimalOdds);

    if (bet.is_free_bet) {
      // For free bets, only count winnings
      const winnings = bet.stake * (decimalOdds - 1); // Subtract 1 to get just the profit
      console.log('Free bet winnings:', winnings);
      return winnings;
    }

    let totalReturn = 0;

    // Calculate returns based on status
    if (bet.status === "Won") {
      // Full win - both win and place parts if each way
      totalReturn = bet.stake * decimalOdds; // This includes stake return
      if (bet.is_each_way) {
        const placeOdds = ((decimalOdds - 1) * bet.place_terms) + 1; // Convert to place odds properly
        totalReturn += bet.stake * placeOdds; // This includes stake return
      }
    } else if (bet.status === "Placed") {
      // Only the place part won
      if (bet.is_each_way) {
        const placeOdds = ((decimalOdds - 1) * bet.place_terms) + 1; // Convert to place odds properly
        totalReturn = bet.stake * placeOdds; // This includes stake return
      }
    }

    const profit = totalReturn - effectiveStake;
    console.log('Total return:', totalReturn, 'Effective stake:', effectiveStake, 'Profit:', profit);
    return profit;
  };

  const handleEdit = (bet: BetWithSelections) => {
    console.log('Starting edit for bet:', bet);
    setEditingBetId(bet.id);
    setEditingBet({ ...bet }); // Create a new object to avoid reference issues
  };

  const handleSave = async () => {
    if (!editingBet) return;

    try {
      console.log('Saving bet with status:', editingBet.status);

      // Update bet details
      const { error: updateError } = await supabase
        .from('bets')
        .update({
          stake: editingBet.stake,
          total_odds: editingBet.total_odds,
          is_each_way: editingBet.is_each_way,
          placeterms: editingBet.place_terms,
          is_free_bet: editingBet.is_free_bet,
          potential_return: editingBet.potential_return
        } satisfies Database['public']['Tables']['bets']['Update'])
        .eq('id', editingBet.id);

      if (updateError) {
        console.error('Error updating bet:', updateError);
        throw updateError;
      }

      // Update local state
      setBets(prevBets => prevBets.map(bet => 
        bet.id === editingBet.id ? editingBet : bet
      ));

      // Then update all selections
      const selectionPromises = editingBet.selections.map(async (selection) => {
        const { data, error: updateError } = await supabase
          .from('bet_selections')
          .update({
            event: selection.event,
            horse: selection.horse,
            odds: selection.odds,
            status: selection.status
          } satisfies Database['public']['Tables']['bet_selections']['Update'])
          .eq('id', selection.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return data;
      });

      const updatedSelections = await Promise.all(selectionPromises);

      // Update local state
      setBets(prevBets => prevBets.map(bet => {
        if (bet.id === editingBet.id) {
          return {
            ...bet,
            selections: updatedSelections.map(selection => ({
              ...selection,
              status: selection.status
            }))
          } as BetWithSelections;
        }
        return bet;
      }));

      setEditingBetId(null);
      setEditingBet(null);

      toast({
        title: "Success",
        description: "Bet updated successfully.",
      });
    } catch (error) {
      console.error("Error updating bet:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update bet. Please try again.",
      });
    }
  };

  const handleStatusChange = async (betId: string, selectionId: string, newStatus: BetSelection['status'] | 'Placed') => {
    if (!editingBet) return;

    try {
      // Update the bet selection status
      const { error: updateError } = await supabase
        .from('bet_selections')
        .update({
          status: newStatus === 'Placed' ? 'Pending' : newStatus
        } satisfies Database['public']['Tables']['bet_selections']['Update'])
        .eq('id', selectionId);

      if (updateError) {
        console.error('Error updating selection:', updateError);
        throw updateError;
      }

      // Update local state
      setBets(prevBets => prevBets.map(bet => {
        if (bet.id === editingBet.id) {
          return {
            ...bet,
            selections: bet.selections.map(selection => 
              selection.id === selectionId 
                ? { ...selection, status: newStatus === 'Placed' ? 'Pending' : newStatus }
                : selection
            )
          } as BetWithSelections;
        }
        return bet;
      }));

      // If status is 'Placed', update the bet status as well
      if (newStatus === 'Placed') {
        const { error: betUpdateError } = await supabase
          .from('bets')
          .update({
            status: 'Placed'
          } satisfies Database['public']['Tables']['bets']['Update'])
          .eq('id', betId);

        if (betUpdateError) {
          console.error('Error updating bet:', betUpdateError);
          throw betUpdateError;
        }

        // Update local state for bet status
        setBets(prevBets => prevBets.map(bet => 
          bet.id === betId 
            ? { ...bet, status: 'Placed' } 
            : bet
        ));
      }
    } catch (error) {
      console.error("Error updating bet status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update bet status. Please try again.",
      });
    }
  };

  const handleCancel = () => {
    setEditingBetId(null);
    setEditingBet(null);
  };

  const handleDelete = async (betId: string) => {
    try {
      // Delete bet (cascade will handle selections)
      const { error } = await supabase
        .from("bets")
        .delete()
        .eq("id", betId);

      if (error) throw error;

      // Update local state
      setBets(bets.filter(bet => bet.id !== betId));

      toast({
        title: "Success",
        description: "Bet deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting bet:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete bet. Please try again.",
      });
    }
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
                <SelectItem value="Placed">Placed</SelectItem>
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
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredBets.map((bet) => {
                const isEditing = editingBetId === bet.id;
                const editedBet = isEditing ? editingBet : bet;
                if (!editedBet) return null;

                // Filter to only show win selections for display
                const displaySelections = editedBet.selections.filter(s => s.is_win);

                return (
                  <TableRow key={bet.id}>
                    <TableCell>
                      {isEditing ? (
                        <div className="space-y-2">
                          {displaySelections.map((selection, index) => (
                            <Input
                              key={selection.id}
                              value={selection.event}
                              onChange={(e) => {
                                const newSelections = [...editedBet.selections];
                                const winIndex = newSelections.findIndex(s => s.id === selection.id);
                                if (winIndex !== -1) {
                                  newSelections[winIndex] = {
                                    ...newSelections[winIndex],
                                    event: e.target.value,
                                  };
                                  // If it's each way, update the place selection too
                                  if (editedBet.is_each_way) {
                                    const placeIndex = newSelections.findIndex(s => !s.is_win && s.horse === selection.horse);
                                    if (placeIndex !== -1) {
                                      newSelections[placeIndex] = {
                                        ...newSelections[placeIndex],
                                        event: e.target.value,
                                      };
                                    }
                                  }
                                  setEditingBet({
                                    ...editedBet,
                                    selections: newSelections,
                                  });
                                }
                              }}
                              className="w-full"
                            />
                          ))}
                        </div>
                      ) : (
                        displaySelections.map((s) => s.event).join(", ")
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="space-y-2">
                          {displaySelections.map((selection, index) => (
                            <Input
                              key={selection.id}
                              value={selection.horse}
                              onChange={(e) => {
                                const newSelections = [...editedBet.selections];
                                const winIndex = newSelections.findIndex(s => s.id === selection.id);
                                if (winIndex !== -1) {
                                  newSelections[winIndex] = {
                                    ...newSelections[winIndex],
                                    horse: e.target.value,
                                  };
                                  // If it's each way, update the place selection too
                                  if (editedBet.is_each_way) {
                                    const placeIndex = newSelections.findIndex(s => !s.is_win && s.event === selection.event);
                                    if (placeIndex !== -1) {
                                      newSelections[placeIndex] = {
                                        ...newSelections[placeIndex],
                                        horse: e.target.value,
                                      };
                                    }
                                  }
                                  setEditingBet({
                                    ...editedBet,
                                    selections: newSelections,
                                  });
                                }
                              }}
                              className="w-full"
                            />
                          ))}
                        </div>
                      ) : (
                        displaySelections.map((s) => s.horse).join(", ")
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="space-y-2">
                          {displaySelections.map((selection, index) => (
                            <Input
                              key={selection.id}
                              value={selection.odds}
                              onChange={(e) => {
                                const newSelections = [...editedBet.selections];
                                const winIndex = newSelections.findIndex(s => s.id === selection.id);
                                if (winIndex !== -1) {
                                  newSelections[winIndex] = {
                                    ...newSelections[winIndex],
                                    odds: e.target.value,
                                  };
                                  // If it's each way, update the place selection too
                                  if (editedBet.is_each_way) {
                                    const placeIndex = newSelections.findIndex(s => !s.is_win && s.event === selection.event);
                                    if (placeIndex !== -1) {
                                      newSelections[placeIndex] = {
                                        ...newSelections[placeIndex],
                                        odds: e.target.value,
                                      };
                                    }
                                  }
                                  setEditingBet({
                                    ...editedBet,
                                    selections: newSelections,
                                  });
                                }
                              }}
                              className="w-full"
                            />
                          ))}
                        </div>
                      ) : (
                        editedBet.total_odds
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editedBet.stake}
                          onChange={(e) =>
                            setEditingBet({
                              ...editedBet,
                              stake: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-24"
                        />
                      ) : (
                        <>
                          £{editedBet.stake.toFixed(2)}
                          {editedBet.is_free_bet && (
                            <span className="ml-2 text-xs text-muted-foreground">(Free)</span>
                          )}
                          {editedBet.is_each_way && (
                            <span className="ml-2 text-xs text-muted-foreground">(E/W)</span>
                          )}
                        </>
                      )}
                    </TableCell>
                    <TableCell>{editedBet.bet_type}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="space-y-2">
                          {displaySelections.map((selection, index) => (
                            <Select
                              key={selection.id}
                              value={selection.status}
                              onValueChange={(value: "Pending" | "Won" | "Lost" | "Void" | "Placed") => 
                                handleStatusChange(editingBetId, selection.id, value)
                              }
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Won">Won</SelectItem>
                                <SelectItem value="Lost">Lost</SelectItem>
                                <SelectItem value="Placed">Placed</SelectItem>
                                <SelectItem value="Void">Void</SelectItem>
                              </SelectContent>
                            </Select>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              editedBet.status === "Won"
                                ? "bg-green-50 text-green-700"
                                : editedBet.status === "Lost"
                                ? "bg-red-50 text-red-700"
                                : editedBet.status === "Void"
                                ? "bg-gray-50 text-gray-700"
                                : editedBet.status === "Placed"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-yellow-50 text-yellow-700"
                            }`}
                          >
                            {editedBet.status}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!editingBetId || editingBetId !== bet.id ? (
                        <span
                          className={
                            bet.status === "Won"
                              ? "text-green-600"
                              : bet.status === "Lost"
                              ? "text-red-600"
                              : bet.status === "Placed"
                              ? "text-blue-600"
                              : ""
                          }
                        >
                          {bet.status === "Won" ? "+" : bet.status === "Lost" ? "-" : bet.status === "Placed" ? "+" : ""}£
                          {Math.abs(calculateProfitLoss(bet)).toFixed(2)}
                        </span>
                      ) : (
                        <span
                          className={
                            editingBet?.status === "Won"
                              ? "text-green-600"
                              : editingBet?.status === "Lost"
                              ? "text-red-600"
                              : editingBet?.status === "Placed"
                              ? "text-blue-600"
                              : ""
                          }
                        >
                          {editingBet?.status === "Won" ? "+" : editingBet?.status === "Lost" ? "-" : editingBet?.status === "Placed" ? "+" : ""}£
                          {Math.abs(calculateProfitLoss(editingBet)).toFixed(2)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDistance(new Date(editedBet.created_at), new Date(), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="flex space-x-2">
                          <Button
                            onClick={handleSave}
                            size="sm"
                            className="h-8 px-2"
                          >
                            <Save className="h-4 w-4" />
                            <span className="sr-only">Save</span>
                          </Button>
                          <Button
                            onClick={handleCancel}
                            variant="outline"
                            size="sm"
                            className="h-8 px-2"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(bet)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Bet</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this bet? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-500 hover:bg-red-600"
                                  onClick={() => handleDelete(bet.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </AuthLayout>
  );
}
