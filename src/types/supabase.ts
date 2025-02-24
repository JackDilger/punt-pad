export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      bets: {
        Row: {
          id: string
          user_id: string
          created_at: string
          bet_type: 'Single' | 'Accumulator'
          stake: number
          total_odds: string
          is_each_way: boolean
          is_free_bet: boolean
          status: 'Pending' | 'Won' | 'Lost' | 'Void'
          potential_return: number
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          bet_type: 'Single' | 'Accumulator'
          stake: number
          total_odds: string
          is_each_way?: boolean
          is_free_bet?: boolean
          status?: 'Pending' | 'Won' | 'Lost' | 'Void'
          potential_return?: number
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          bet_type?: 'Single' | 'Accumulator'
          stake?: number
          total_odds?: string
          is_each_way?: boolean
          is_free_bet?: boolean
          status?: 'Pending' | 'Won' | 'Lost' | 'Void'
          potential_return?: number
        }
        Relationships: [
          {
            foreignKeyName: "bets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      bet_selections: {
        Row: {
          id: string
          bet_id: string
          horse_name: string
          fixed_odds: string
          result: 'Pending' | 'Won' | 'Lost' | 'Void'
          created_at: string
        }
        Insert: {
          id?: string
          bet_id: string
          horse_name: string
          fixed_odds: string
          result?: 'Pending' | 'Won' | 'Lost' | 'Void'
          created_at?: string
        }
        Update: {
          id?: string
          bet_id?: string
          horse_name?: string
          fixed_odds?: string
          result?: 'Pending' | 'Won' | 'Lost' | 'Void'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bet_selections_bet_id_fkey"
            columns: ["bet_id"]
            isOneToOne: false
            referencedRelation: "bets"
            referencedColumns: ["id"]
          }
        ]
      }
      fantasy_festival_days: {
        Row: {
          id: string
          day_number: number
          date: string
          is_published: boolean
          cutoff_time: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          day_number: number
          date: string
          is_published?: boolean
          cutoff_time: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          day_number?: number
          date?: string
          is_published?: boolean
          cutoff_time?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      fantasy_races: {
        Row: {
          id: string
          name: string
          race_time: string
          day_id: string
          race_order: number
          status: 'upcoming' | 'in_progress' | 'finished'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          race_time: string
          day_id: string
          race_order: number
          status?: 'upcoming' | 'in_progress' | 'finished'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          race_time?: string
          day_id?: string
          race_order?: number
          status?: 'upcoming' | 'in_progress' | 'finished'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fantasy_races_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "fantasy_festival_days"
            referencedColumns: ["id"]
          }
        ]
      }
      fantasy_horses: {
        Row: {
          id: string
          race_id: string
          name: string | null
          fixed_odds: number | null
          points_if_wins: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          race_id: string
          name?: string | null
          fixed_odds?: number | null
          points_if_wins?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          race_id?: string
          name?: string | null
          fixed_odds?: number | null
          points_if_wins?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fantasy_horses_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "fantasy_races"
            referencedColumns: ["id"]
          }
        ]
      }
      fantasy_league_entries: {
        Row: {
          id: string
          user_id: string
          entry_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          entry_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          entry_name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fantasy_league_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      fantasy_league_entry_selections: {
        Row: {
          id: string
          entry_id: string
          horse_id: string
          created_at: string
        }
        Insert: {
          id?: string
          entry_id: string
          horse_id: string
          created_at?: string
        }
        Update: {
          id?: string
          entry_id?: string
          horse_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fantasy_league_entry_selections_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "fantasy_league_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fantasy_league_entry_selections_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "fantasy_horses"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          username: string
          created_at: string
        }
        Insert: {
          id: string
          username: string
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
