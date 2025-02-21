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
    id: string;
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
  const [editingBetId, setEditingBetId] = useState<string | null>(null);
  const [editingBet, setEditingBet] = useState<BetWithSelections | null>(null);
  const { toast } = useToast();

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
    console.log('Calculating profit/loss for bet:', bet);
    if (bet.status === "Pending" || bet.status === "Void") {
      return 0;
    }
    if (bet.status === "Lost") {
      return -bet.stake;
    }
    if (bet.status === "Won") {
      // For winning bets:
      // If odds are "2.0", this means for every £1 staked, you get £2 back
      // So profit is (stake × odds) - stake
      const decimalOdds = typeof bet.total_odds === 'string' ? 
        fractionalToDecimal(bet.total_odds) : 
        parseFloat(bet.total_odds);
      console.log('Decimal odds:', decimalOdds);
      const totalReturn = bet.stake * decimalOdds;
      const profit = totalReturn - bet.stake;
      console.log('Total return:', totalReturn, 'Profit:', profit);
      return profit;
    }
    return 0;
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

      // First update the bet
      const { data: updatedBet, error: betError } = await supabase
        .from("bets")
        .update({
          status: editingBet.status,
          stake: editingBet.stake,
          total_odds: editingBet.total_odds,
          is_each_way: editingBet.is_each_way,
          is_free_bet: editingBet.is_free_bet,
        })
        .eq('id', editingBet.id)
        .select('*')
        .single();

      if (betError) {
        console.error('Error updating bet:', betError);
        throw betError;
      }

      console.log('Successfully updated bet:', updatedBet);

      // Then update all selections
      const selectionPromises = editingBet.selections.map(async (selection) => {
        const { data, error: selectionError } = await supabase
          .from("bet_selections")
          .update({
            event: selection.event,
            horse: selection.horse,
            odds: selection.odds,
            status: editingBet.status, // Use the bet's status
          })
          .eq('id', selection.id)
          .select('*')
          .single();

        if (selectionError) {
          console.error('Error updating selection:', selectionError);
          throw selectionError;
        }

        return data;
      });

      const updatedSelections = await Promise.all(selectionPromises);
      console.log('Successfully updated selections:', updatedSelections);

      // Update local state
      setBets(prevBets => 
        prevBets.map(bet => 
          bet.id === editingBet.id 
            ? { ...updatedBet, selections: updatedSelections }
            : bet
        )
      );

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

  const handleStatusChange = (value: "Pending" | "Won" | "Lost" | "Void", index: number) => {
    if (!editingBet) return;

    console.log('Changing status to:', value);
    
    const newSelections = editingBet.selections.map((selection, i) => ({
      ...selection,
      status: i === index ? value : selection.status,
    }));

    setEditingBet({
      ...editingBet,
      status: value,
      selections: newSelections,
    });
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

                return (
                  <TableRow key={bet.id}>
                    <TableCell>
                      {isEditing ? (
                        <div className="space-y-2">
                          {editedBet.selections.map((selection, index) => (
                            <Input
                              key={selection.id}
                              value={selection.event}
                              onChange={(e) => {
                                const newSelections = [...editedBet.selections];
                                newSelections[index] = {
                                  ...newSelections[index],
                                  event: e.target.value,
                                };
                                setEditingBet({
                                  ...editedBet,
                                  selections: newSelections,
                                });
                              }}
                              className="w-full"
                            />
                          ))}
                        </div>
                      ) : (
                        editedBet.selections.map((s) => s.event).join(", ")
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="space-y-2">
                          {editedBet.selections.map((selection, index) => (
                            <Input
                              key={selection.id}
                              value={selection.horse}
                              onChange={(e) => {
                                const newSelections = [...editedBet.selections];
                                newSelections[index] = {
                                  ...newSelections[index],
                                  horse: e.target.value,
                                };
                                setEditingBet({
                                  ...editedBet,
                                  selections: newSelections,
                                });
                              }}
                              className="w-full"
                            />
                          ))}
                        </div>
                      ) : (
                        editedBet.selections.map((s) => s.horse).join(", ")
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="space-y-2">
                          {editedBet.selections.map((selection, index) => (
                            <Input
                              key={selection.id}
                              value={selection.odds}
                              onChange={(e) => {
                                const newSelections = [...editedBet.selections];
                                newSelections[index] = {
                                  ...newSelections[index],
                                  odds: e.target.value,
                                };
                                setEditingBet({
                                  ...editedBet,
                                  selections: newSelections,
                                });
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
                          {editedBet.selections.map((selection, index) => (
                            <Select
                              key={selection.id}
                              value={selection.status}
                              onValueChange={(value: "Pending" | "Won" | "Lost" | "Void") => 
                                handleStatusChange(value, index)
                              }
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Won">Won</SelectItem>
                                <SelectItem value="Lost">Lost</SelectItem>
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
                              : ""
                          }
                        >
                          {bet.status === "Won" ? "+" : bet.status === "Lost" ? "-" : ""}£
                          {Math.abs(calculateProfitLoss(bet)).toFixed(2)}
                        </span>
                      ) : (
                        <span
                          className={
                            editingBet?.status === "Won"
                              ? "text-green-600"
                              : editingBet?.status === "Lost"
                              ? "text-red-600"
                              : ""
                          }
                        >
                          {editingBet?.status === "Won" ? "+" : editingBet?.status === "Lost" ? "-" : ""}£
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
