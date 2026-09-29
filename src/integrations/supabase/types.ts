export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      careers: {
        Row: {
          board_confidence: number
          board_objective: string
          cash_eur: number
          club_name: string
          club_slug: string
          created_at: string
          draws: number
          fan_mood: number
          goals_against: number
          goals_for: number
          id: string
          intro_done: boolean
          league_position: number
          losses: number
          manager_name: string
          matchday: number
          next_opponent: string | null
          played: number
          points: number
          reputation: number
          season: number
          squad_morale: number
          titles: number
          total_matches: number
          transfer_budget_eur: number
          transfer_window_closes_at: number
          transfer_window_open: boolean
          updated_at: string
          user_id: string
          wage_budget_eur: number
          weekly_wages_eur: number
          wins: number
        }
        Insert: {
          board_confidence?: number
          board_objective?: string
          cash_eur?: number
          club_name: string
          club_slug: string
          created_at?: string
          draws?: number
          fan_mood?: number
          goals_against?: number
          goals_for?: number
          id?: string
          intro_done?: boolean
          league_position?: number
          losses?: number
          manager_name: string
          matchday?: number
          next_opponent?: string | null
          played?: number
          points?: number
          reputation?: number
          season?: number
          squad_morale?: number
          titles?: number
          total_matches?: number
          transfer_budget_eur?: number
          transfer_window_closes_at?: number
          transfer_window_open?: boolean
          updated_at?: string
          user_id: string
          wage_budget_eur?: number
          weekly_wages_eur?: number
          wins?: number
        }
        Update: {
          board_confidence?: number
          board_objective?: string
          cash_eur?: number
          club_name?: string
          club_slug?: string
          created_at?: string
          draws?: number
          fan_mood?: number
          goals_against?: number
          goals_for?: number
          id?: string
          intro_done?: boolean
          league_position?: number
          losses?: number
          manager_name?: string
          matchday?: number
          next_opponent?: string | null
          played?: number
          points?: number
          reputation?: number
          season?: number
          squad_morale?: number
          titles?: number
          total_matches?: number
          transfer_budget_eur?: number
          transfer_window_closes_at?: number
          transfer_window_open?: boolean
          updated_at?: string
          user_id?: string
          wage_budget_eur?: number
          weekly_wages_eur?: number
          wins?: number
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount_eur: number
          budget: string
          career_id: string
          category: string
          created_at: string
          description: string
          id: string
          matchday: number
          season: number
          user_id: string
        }
        Insert: {
          amount_eur: number
          budget?: string
          career_id: string
          category: string
          created_at?: string
          description: string
          id?: string
          matchday?: number
          season?: number
          user_id: string
        }
        Update: {
          amount_eur?: number
          budget?: string
          career_id?: string
          category?: string
          created_at?: string
          description?: string
          id?: string
          matchday?: number
          season?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
        ]
      }
      fixtures: {
        Row: {
          away_club: string
          away_goals: number | null
          career_id: string
          competition: string
          created_at: string
          home_club: string
          home_goals: number | null
          id: string
          is_user_match: boolean
          matchday: number
          played: boolean
          season: number
          user_id: string
        }
        Insert: {
          away_club: string
          away_goals?: number | null
          career_id: string
          competition?: string
          created_at?: string
          home_club: string
          home_goals?: number | null
          id?: string
          is_user_match?: boolean
          matchday: number
          played?: boolean
          season?: number
          user_id: string
        }
        Update: {
          away_club?: string
          away_goals?: number | null
          career_id?: string
          competition?: string
          created_at?: string
          home_club?: string
          home_goals?: number | null
          id?: string
          is_user_match?: boolean
          matchday?: number
          played?: boolean
          season?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixtures_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
        ]
      }
      incoming_offers: {
        Row: {
          bonus_eur: number
          career_id: string
          created_at: string
          fee_eur: number
          from_club: string
          id: string
          matchday: number
          offer_type: string
          player_id: string
          player_interest: number
          player_name: string
          status: string
          user_id: string
          wage_offered_eur: number
        }
        Insert: {
          bonus_eur?: number
          career_id: string
          created_at?: string
          fee_eur?: number
          from_club: string
          id?: string
          matchday?: number
          offer_type?: string
          player_id: string
          player_interest?: number
          player_name: string
          status?: string
          user_id: string
          wage_offered_eur?: number
        }
        Update: {
          bonus_eur?: number
          career_id?: string
          created_at?: string
          fee_eur?: number
          from_club?: string
          id?: string
          matchday?: number
          offer_type?: string
          player_id?: string
          player_interest?: number
          player_name?: string
          status?: string
          user_id?: string
          wage_offered_eur?: number
        }
        Relationships: [
          {
            foreignKeyName: "incoming_offers_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
        ]
      }
      injuries: {
        Row: {
          career_id: string
          created_at: string
          id: string
          injury_type: string
          player_id: string
          player_name: string
          recovered: boolean
          returns_matchday: number
          severity: string
          started_matchday: number
          user_id: string
        }
        Insert: {
          career_id: string
          created_at?: string
          id?: string
          injury_type: string
          player_id: string
          player_name: string
          recovered?: boolean
          returns_matchday: number
          severity?: string
          started_matchday: number
          user_id: string
        }
        Update: {
          career_id?: string
          created_at?: string
          id?: string
          injury_type?: string
          player_id?: string
          player_name?: string
          recovered?: boolean
          returns_matchday?: number
          severity?: string
          started_matchday?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "injuries_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "injuries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "squad_players"
            referencedColumns: ["id"]
          },
        ]
      }
      lineups: {
        Row: {
          bench: Json
          captain_id: string | null
          career_id: string
          created_at: string
          formation: string
          id: string
          match_id: string | null
          matchday: number
          set_pieces: Json
          starters: Json
          user_id: string
        }
        Insert: {
          bench?: Json
          captain_id?: string | null
          career_id: string
          created_at?: string
          formation?: string
          id?: string
          match_id?: string | null
          matchday: number
          set_pieces?: Json
          starters?: Json
          user_id: string
        }
        Update: {
          bench?: Json
          captain_id?: string | null
          career_id?: string
          created_at?: string
          formation?: string
          id?: string
          match_id?: string | null
          matchday?: number
          set_pieces?: Json
          starters?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lineups_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lineups_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      market_players: {
        Row: {
          age: number
          career_id: string
          created_at: string
          current_club: string
          efootball_player_value: number | null
          expected_wage_eur: number
          foot: string
          id: string
          league: string | null
          market_value_eur: number
          name: string
          nationality: string | null
          overall: number
          position: string
          potential: number
          region: string
          traits: string | null
          user_id: string
        }
        Insert: {
          age?: number
          career_id: string
          created_at?: string
          current_club?: string
          efootball_player_value?: number | null
          expected_wage_eur?: number
          foot?: string
          id?: string
          league?: string | null
          market_value_eur: number
          name: string
          nationality?: string | null
          overall?: number
          position?: string
          potential?: number
          region?: string
          traits?: string | null
          user_id: string
        }
        Update: {
          age?: number
          career_id?: string
          created_at?: string
          current_club?: string
          efootball_player_value?: number | null
          expected_wage_eur?: number
          foot?: string
          id?: string
          league?: string | null
          market_value_eur?: number
          name?: string
          nationality?: string | null
          overall?: number
          position?: string
          potential?: number
          region?: string
          traits?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_players_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
        ]
      }
      match_events: {
        Row: {
          assist_player_id: string | null
          assist_player_name: string | null
          career_id: string
          created_at: string
          detail: string | null
          event_type: string
          id: string
          match_id: string
          minute: number | null
          player_id: string | null
          player_name: string | null
          user_id: string
        }
        Insert: {
          assist_player_id?: string | null
          assist_player_name?: string | null
          career_id: string
          created_at?: string
          detail?: string | null
          event_type: string
          id?: string
          match_id: string
          minute?: number | null
          player_id?: string | null
          player_name?: string | null
          user_id: string
        }
        Update: {
          assist_player_id?: string | null
          assist_player_name?: string | null
          career_id?: string
          created_at?: string
          detail?: string | null
          event_type?: string
          id?: string
          match_id?: string
          minute?: number | null
          player_id?: string | null
          player_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_events_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          assists: string | null
          career_id: string
          competition: string
          created_at: string
          goals_against: number
          goals_for: number
          home: boolean
          id: string
          league_position_after: number | null
          locked: boolean
          matchday: number
          motm_player_id: string | null
          notes: string | null
          opponent: string
          result: string
          scorers: string | null
          user_id: string
        }
        Insert: {
          assists?: string | null
          career_id: string
          competition?: string
          created_at?: string
          goals_against?: number
          goals_for?: number
          home?: boolean
          id?: string
          league_position_after?: number | null
          locked?: boolean
          matchday: number
          motm_player_id?: string | null
          notes?: string | null
          opponent: string
          result?: string
          scorers?: string | null
          user_id: string
        }
        Update: {
          assists?: string | null
          career_id?: string
          competition?: string
          created_at?: string
          goals_against?: number
          goals_for?: number
          home?: boolean
          id?: string
          league_position_after?: number | null
          locked?: boolean
          matchday?: number
          motm_player_id?: string | null
          notes?: string | null
          opponent?: string
          result?: string
          scorers?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
        ]
      }
      news_feed: {
        Row: {
          body: string | null
          career_id: string
          created_at: string
          id: string
          image_url: string | null
          kind: string
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          career_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          kind?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          career_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          kind?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_feed_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
        ]
      }
      press_conferences: {
        Row: {
          answer: string | null
          board_delta: number
          career_id: string
          context: string | null
          created_at: string
          fan_delta: number
          id: string
          matchday: number
          question: string
          reaction: string | null
          squad_delta: number
          user_id: string
        }
        Insert: {
          answer?: string | null
          board_delta?: number
          career_id: string
          context?: string | null
          created_at?: string
          fan_delta?: number
          id?: string
          matchday?: number
          question: string
          reaction?: string | null
          squad_delta?: number
          user_id: string
        }
        Update: {
          answer?: string | null
          board_delta?: number
          career_id?: string
          context?: string | null
          created_at?: string
          fan_delta?: number
          id?: string
          matchday?: number
          question?: string
          reaction?: string | null
          squad_delta?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "press_conferences_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
        ]
      }
      scouting: {
        Row: {
          career_id: string
          created_at: string
          id: string
          market_player_id: string | null
          notes: string | null
          player_name: string
          user_id: string
        }
        Insert: {
          career_id: string
          created_at?: string
          id?: string
          market_player_id?: string | null
          notes?: string | null
          player_name: string
          user_id: string
        }
        Update: {
          career_id?: string
          created_at?: string
          id?: string
          market_player_id?: string | null
          notes?: string | null
          player_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scouting_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scouting_market_player_id_fkey"
            columns: ["market_player_id"]
            isOneToOne: false
            referencedRelation: "market_players"
            referencedColumns: ["id"]
          },
        ]
      }
      social_comments: {
        Row: {
          author_handle: string
          author_name: string
          author_type: string
          body: string
          career_id: string
          created_at: string
          id: string
          likes: number
          post_id: string
          user_id: string
        }
        Insert: {
          author_handle: string
          author_name: string
          author_type?: string
          body: string
          career_id: string
          created_at?: string
          id?: string
          likes?: number
          post_id: string
          user_id: string
        }
        Update: {
          author_handle?: string
          author_name?: string
          author_type?: string
          body?: string
          career_id?: string
          created_at?: string
          id?: string
          likes?: number
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_comments_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          author_handle: string
          author_name: string
          author_type: string
          body: string
          career_id: string
          context: string | null
          created_at: string
          id: string
          likes: number
          matchday: number
          user_id: string
        }
        Insert: {
          author_handle: string
          author_name: string
          author_type?: string
          body: string
          career_id: string
          context?: string | null
          created_at?: string
          id?: string
          likes?: number
          matchday?: number
          user_id: string
        }
        Update: {
          author_handle?: string
          author_name?: string
          author_type?: string
          body?: string
          career_id?: string
          context?: string | null
          created_at?: string
          id?: string
          likes?: number
          matchday?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_players: {
        Row: {
          age: number
          appearances: number
          assists: number
          attack: number
          career_id: string
          clean_sheets: number
          club_slug: string
          contract_until_season: number
          created_at: string
          defense: number
          efootball_player_value: number | null
          face_url: string | null
          foot: string
          goals: number
          id: string
          injured: boolean
          injury_returns_at_matchday: number | null
          injury_severity: string | null
          injury_type: string | null
          is_captain: boolean
          loan_returns_at_matchday: number | null
          loan_to_club: string | null
          market_value_eur: number
          minutes: number
          morale: number
          motm: number
          name: string
          nationality: string | null
          on_loan: boolean
          original_wage_eur: number
          overall: number
          physical: number
          position: string
          potential: number
          rating_sum: number
          red_cards_season: number
          secondary_positions: string | null
          signing_bonus_eur: number
          squad_role: string
          suspended_matches: number
          technique: number
          user_id: string
          weekly_wage_eur: number
          yellow_cards_season: number
        }
        Insert: {
          age?: number
          appearances?: number
          assists?: number
          attack?: number
          career_id: string
          clean_sheets?: number
          club_slug: string
          contract_until_season?: number
          created_at?: string
          defense?: number
          efootball_player_value?: number | null
          face_url?: string | null
          foot?: string
          goals?: number
          id?: string
          injured?: boolean
          injury_returns_at_matchday?: number | null
          injury_severity?: string | null
          injury_type?: string | null
          is_captain?: boolean
          loan_returns_at_matchday?: number | null
          loan_to_club?: string | null
          market_value_eur?: number
          minutes?: number
          morale?: number
          motm?: number
          name: string
          nationality?: string | null
          on_loan?: boolean
          original_wage_eur?: number
          overall?: number
          physical?: number
          position?: string
          potential?: number
          rating_sum?: number
          red_cards_season?: number
          secondary_positions?: string | null
          signing_bonus_eur?: number
          squad_role?: string
          suspended_matches?: number
          technique?: number
          user_id: string
          weekly_wage_eur?: number
          yellow_cards_season?: number
        }
        Update: {
          age?: number
          appearances?: number
          assists?: number
          attack?: number
          career_id?: string
          clean_sheets?: number
          club_slug?: string
          contract_until_season?: number
          created_at?: string
          defense?: number
          efootball_player_value?: number | null
          face_url?: string | null
          foot?: string
          goals?: number
          id?: string
          injured?: boolean
          injury_returns_at_matchday?: number | null
          injury_severity?: string | null
          injury_type?: string | null
          is_captain?: boolean
          loan_returns_at_matchday?: number | null
          loan_to_club?: string | null
          market_value_eur?: number
          minutes?: number
          morale?: number
          motm?: number
          name?: string
          nationality?: string | null
          on_loan?: boolean
          original_wage_eur?: number
          overall?: number
          physical?: number
          position?: string
          potential?: number
          rating_sum?: number
          red_cards_season?: number
          secondary_positions?: string | null
          signing_bonus_eur?: number
          squad_role?: string
          suspended_matches?: number
          technique?: number
          user_id?: string
          weekly_wage_eur?: number
          yellow_cards_season?: number
        }
        Relationships: [
          {
            foreignKeyName: "squad_players_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
        ]
      }
      standings: {
        Row: {
          career_id: string
          club_name: string
          club_slug: string
          draws: number
          goals_against: number
          goals_for: number
          id: string
          losses: number
          played: number
          points: number
          season: number
          user_id: string
          wins: number
        }
        Insert: {
          career_id: string
          club_name: string
          club_slug: string
          draws?: number
          goals_against?: number
          goals_for?: number
          id?: string
          losses?: number
          played?: number
          points?: number
          season?: number
          user_id: string
          wins?: number
        }
        Update: {
          career_id?: string
          club_name?: string
          club_slug?: string
          draws?: number
          goals_against?: number
          goals_for?: number
          id?: string
          losses?: number
          played?: number
          points?: number
          season?: number
          user_id?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "standings_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
        ]
      }
      suspensions: {
        Row: {
          active: boolean
          career_id: string
          created_at: string
          id: string
          matches_served: number
          matches_total: number
          player_id: string
          player_name: string
          reason: string
          started_matchday: number
          user_id: string
        }
        Insert: {
          active?: boolean
          career_id: string
          created_at?: string
          id?: string
          matches_served?: number
          matches_total?: number
          player_id: string
          player_name: string
          reason?: string
          started_matchday: number
          user_id: string
        }
        Update: {
          active?: boolean
          career_id?: string
          created_at?: string
          id?: string
          matches_served?: number
          matches_total?: number
          player_id?: string
          player_name?: string
          reason?: string
          started_matchday?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suspensions_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suspensions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "squad_players"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_offers: {
        Row: {
          bonus_eur: number
          career_id: string
          club_response: string | null
          contract_years: number
          created_at: string
          deal_type: string
          direction: string
          fee_eur: number
          id: string
          loan_buy_option_eur: number
          loan_months: number
          loan_obligation: boolean
          negotiation_round: number
          other_club: string
          player_id: string | null
          player_name: string
          player_response: string | null
          rounds_used: number
          status: string
          user_id: string
          wage_eur: number
          wage_share_pct: number
        }
        Insert: {
          bonus_eur?: number
          career_id: string
          club_response?: string | null
          contract_years?: number
          created_at?: string
          deal_type?: string
          direction: string
          fee_eur?: number
          id?: string
          loan_buy_option_eur?: number
          loan_months?: number
          loan_obligation?: boolean
          negotiation_round?: number
          other_club: string
          player_id?: string | null
          player_name: string
          player_response?: string | null
          rounds_used?: number
          status?: string
          user_id: string
          wage_eur?: number
          wage_share_pct?: number
        }
        Update: {
          bonus_eur?: number
          career_id?: string
          club_response?: string | null
          contract_years?: number
          created_at?: string
          deal_type?: string
          direction?: string
          fee_eur?: number
          id?: string
          loan_buy_option_eur?: number
          loan_months?: number
          loan_obligation?: boolean
          negotiation_round?: number
          other_club?: string
          player_id?: string | null
          player_name?: string
          player_response?: string | null
          rounds_used?: number
          status?: string
          user_id?: string
          wage_eur?: number
          wage_share_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "transfer_offers_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
