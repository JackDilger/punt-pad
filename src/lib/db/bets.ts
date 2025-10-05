import { supabase } from '@/integrations/supabase/client';

export interface BetSelection {
  event: string;
  horse: string;
  odds: string;
  is_win: boolean;
}

export interface Bet {
  bet_type: 'Single' | 'Accumulator';
  stake: number;
  total_odds: string;
  is_each_way: boolean;
  place_terms: number; // 0.25 for 1/4, 0.20 for 1/5
  is_free_bet: boolean;
  selections: BetSelection[];
}

export const createBet = async (bet: Bet) => {
  try {
    // Validate stake
    if (!bet.stake || bet.stake <= 0 || bet.stake > 100000) {
      throw new Error('Stake must be between £0.01 and £100,000');
    }

    // Validate selections
    if (!bet.selections || bet.selections.length === 0) {
      throw new Error('At least one selection is required');
    }

    if (bet.selections.length > 20) {
      throw new Error('Maximum 20 selections allowed');
    }

    // Validate and sanitize selection inputs
    bet.selections.forEach((selection, index) => {
      if (!selection.event || selection.event.trim().length === 0) {
        throw new Error(`Selection ${index + 1}: Event name is required`);
      }
      if (selection.event.length > 200) {
        throw new Error(`Selection ${index + 1}: Event name too long (max 200 characters)`);
      }
      if (!selection.horse || selection.horse.trim().length === 0) {
        throw new Error(`Selection ${index + 1}: Horse/selection name is required`);
      }
      if (selection.horse.length > 200) {
        throw new Error(`Selection ${index + 1}: Horse/selection name too long (max 200 characters)`);
      }
      if (!selection.odds || selection.odds.trim().length === 0) {
        throw new Error(`Selection ${index + 1}: Odds are required`);
      }
    });

    // Validate total odds
    const winOdds = parseFloat(bet.total_odds);
    if (isNaN(winOdds) || winOdds <= 0 || winOdds > 10000) {
      throw new Error('Invalid odds value');
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    // Calculate potential returns
    let potentialReturn = bet.stake * winOdds;
    
    if (bet.is_each_way) {
      const placeOdds = winOdds * (bet.place_terms || 0.25);
      potentialReturn += bet.stake * placeOdds;
    }

    // Create bet record
    const { data: betData, error: betError } = await supabase
      .from('bets')
      .insert({
        user_id: userData.user.id,
        bet_type: bet.bet_type,
        stake: bet.stake,
        total_odds: bet.total_odds,
        is_each_way: bet.is_each_way,
        place_terms: bet.place_terms || 0.25,
        is_free_bet: bet.is_free_bet,
        potential_return: potentialReturn,
        status: "Pending"
      })
      .select()
      .single();

    if (betError) {
      console.error('Error creating bet record:', betError);
      throw betError;
    }

    console.log('Created bet record:', betData);

    // Create selections array
    const selectionsToInsert = [];

    // For each-way bets, add both win and place selections
    if (bet.is_each_way) {
      bet.selections.forEach(selection => {
        // Add win part
        selectionsToInsert.push({
          bet_id: betData.id,
          event: selection.event,
          horse: selection.horse,
          odds: selection.odds,
          status: "Pending",
          is_win: true
        });
        // Add place part
        selectionsToInsert.push({
          bet_id: betData.id,
          event: selection.event,
          horse: selection.horse,
          odds: selection.odds,
          status: "Pending",
          is_win: false
        });
      });
    } else {
      // For regular bets, just add win selections
      bet.selections.forEach(selection => {
        selectionsToInsert.push({
          bet_id: betData.id,
          event: selection.event,
          horse: selection.horse,
          odds: selection.odds,
          status: "Pending",
          is_win: true
        });
      });
    }

    console.log('Inserting selections:', selectionsToInsert);

    const { error: selectionsError } = await supabase
      .from('bet_selections')
      .insert(selectionsToInsert);

    if (selectionsError) {
      console.error('Error creating selections:', selectionsError);
      await supabase.from('bets').delete().eq('id', betData.id);
      throw selectionsError;
    }

    return betData;
  } catch (error) {
    console.error('Error in createBet:', error);
    throw error;
  }
};
