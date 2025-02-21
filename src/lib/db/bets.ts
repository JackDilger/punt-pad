import { supabase } from '@/integrations/supabase/client';

export interface BetSelection {
  event: string;
  horse: string;
  odds: string;
  isWin: boolean;
}

export interface Bet {
  betType: 'Single' | 'Accumulator';
  stake: number;
  totalOdds: string;
  isEachWay: boolean;
  isFreeBet: boolean;
  selections: BetSelection[];
}

export const createBet = async (bet: Bet) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data: betData, error: betError } = await supabase
    .from('bets')
    .insert({
      user_id: userData.user.id,
      bet_type: bet.betType,
      stake: bet.stake,
      total_odds: bet.totalOdds,
      is_each_way: bet.isEachWay,
      is_free_bet: bet.isFreeBet,
      // Calculate potential return based on stake and odds
      potential_return: bet.stake * (parseFloat(bet.totalOdds) + (bet.isEachWay ? 0.25 : 0))
    })
    .select()
    .single();

  if (betError) throw betError;

  // Insert all selections for this bet
  const selectionsToInsert = bet.selections.map(selection => ({
    bet_id: betData.id,
    event: selection.event,
    horse: selection.horse,
    odds: selection.odds,
    is_win: selection.isWin
  }));

  const { error: selectionsError } = await supabase
    .from('bet_selections')
    .insert(selectionsToInsert);

  if (selectionsError) throw selectionsError;

  return betData;
};
