export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          placeterms: number
          is_free_bet: boolean
          status: 'Pending' | 'Won' | 'Lost' | 'Void' | 'Placed'
          potential_return: number | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          bet_type: 'Single' | 'Accumulator'
          stake: number
          total_odds: string
          is_each_way?: boolean
          placeterms?: number
          is_free_bet?: boolean
          status?: 'Pending' | 'Won' | 'Lost' | 'Void' | 'Placed'
          potential_return?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          bet_type?: 'Single' | 'Accumulator'
          stake?: number
          total_odds?: string
          is_each_way?: boolean
          placeterms?: number
          is_free_bet?: boolean
          status?: 'Pending' | 'Won' | 'Lost' | 'Void' | 'Placed'
          potential_return?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      bet_selections: {
        Row: {
          id: string
          bet_id: string
          event: string
          horse: string
          odds: string
          is_win: boolean
          status: 'Pending' | 'Won' | 'Lost' | 'Void'
        }
        Insert: {
          id?: string
          bet_id: string
          event: string
          horse: string
          odds: string
          is_win?: boolean
          status?: 'Pending' | 'Won' | 'Lost' | 'Void'
        }
        Update: {
          id?: string
          bet_id?: string
          event?: string
          horse?: string
          odds?: string
          is_win?: boolean
          status?: 'Pending' | 'Won' | 'Lost' | 'Void'
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
      fantasy_selections: {
        Row: {
          id: string
          user_id: string
          horse_id: string
          race_id: string
          day_id: string
          created_at: string
          submitted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          horse_id: string
          race_id: string
          day_id: string
          created_at?: string
          submitted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          horse_id?: string
          race_id?: string
          day_id?: string
          created_at?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fantasy_selections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fantasy_selections_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "fantasy_horses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fantasy_selections_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "fantasy_races"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fantasy_selections_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "fantasy_festival_days"
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
          cutoff_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          day_number: number
          date: string
          is_published?: boolean
          cutoff_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          day_number?: number
          date?: string
          is_published?: boolean
          cutoff_time?: string | null
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
          points_if_places: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          race_id: string
          name?: string | null
          fixed_odds?: number | null
          points_if_wins?: number | null
          points_if_places?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          race_id?: string
          name?: string | null
          fixed_odds?: number | null
          points_if_wins?: number | null
          points_if_places?: number | null
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          updated_at: string
          username: string | null
          role: 'admin' | 'user' | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          updated_at?: string
          username?: string | null
          role?: 'admin' | 'user' | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          username?: string | null
          role?: 'admin' | 'user' | null
        }
        Relationships: []
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
