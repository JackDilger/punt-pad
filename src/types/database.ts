export type BetType = 'single' | 'accumulator';
export type BetStatus = 'pending' | 'won' | 'lost' | 'void';

export interface Selection {
  id: string;
  race_name: string;
  horse_name: string;
  odds_decimal: number;
  odds_fractional: string;
  created_at: string;
  updated_at: string;
}

export interface Bet {
  id: string;
  user_id: string;
  bet_type: BetType;
  stake: number;
  total_odds_decimal: number;
  total_odds_fractional: string;
  is_each_way: boolean;
  is_free_bet: boolean;
  status: BetStatus;
  potential_return: number;
  actual_return: number | null;
  created_at: string;
  updated_at: string;
  selections?: Selection[]; // Joined from bet_selections
}

export interface BetSelection {
  bet_id: string;
  selection_id: string;
  selection_order: number;
}
