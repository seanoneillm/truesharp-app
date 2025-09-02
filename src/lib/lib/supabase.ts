// src/lib/supabase.ts
import {
  createClientComponentClient,
  createServerComponentClient,
} from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export function createClient() {
  return createClientComponentClient()
}

export function createServerClient() {
  return createServerComponentClient({ cookies })
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          email: string | null
          avatar_url: string | null
          bio: string | null
          location: string | null
          website: string | null
          is_verified: boolean
          seller_enabled: boolean
          verification_status: string
          total_followers: number
          total_following: number
          join_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          display_name?: string | null
          email?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          website?: string | null
          is_verified?: boolean
          seller_enabled?: boolean
          verification_status?: string
          total_followers?: number
          total_following?: number
          join_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          display_name?: string | null
          email?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          website?: string | null
          is_verified?: boolean
          seller_enabled?: boolean
          verification_status?: string
          total_followers?: number
          total_following?: number
          join_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      bets: {
        Row: {
          id: string
          user_id: string
          sport: string
          league: string | null
          bet_type: string
          prop_type: string | null
          home_team: string
          away_team: string
          team_bet_on: string
          player_name: string | null
          home_away: string | null
          description: string
          line_value: number | null
          odds: number
          stake: number
          potential_payout: number
          actual_payout: number | null
          profit_loss: number | null
          result: string
          placed_at: string
          game_date: string
          sportsbook: string
          opening_spread_home: number | null
          closing_spread_home: number | null
          opening_total: number | null
          closing_total: number | null
          opening_moneyline_home: number | null
          closing_moneyline_home: number | null
          opening_moneyline_away: number | null
          closing_moneyline_away: number | null
          clv: number | null
          line_movement: string | null
          steam_move: boolean | null
          reverse_line_movement: boolean | null
          public_betting_percentage: number | null
          sharp_money_indicator: boolean | null
          bet_timing: string | null
          days_rest_home: number | null
          days_rest_away: number | null
          weather_condition: string | null
          temperature: number | null
          confidence_level: number | null
          bet_strategy: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sport: string
          league?: string | null
          bet_type: string
          prop_type?: string | null
          home_team: string
          away_team: string
          team_bet_on: string
          player_name?: string | null
          home_away?: string | null
          description: string
          line_value?: number | null
          odds: number
          stake: number
          potential_payout: number
          actual_payout?: number | null
          profit_loss?: number | null
          result: string
          placed_at: string
          game_date: string
          sportsbook: string
          opening_spread_home?: number | null
          closing_spread_home?: number | null
          opening_total?: number | null
          closing_total?: number | null
          opening_moneyline_home?: number | null
          closing_moneyline_home?: number | null
          opening_moneyline_away?: number | null
          closing_moneyline_away?: number | null
          clv?: number | null
          line_movement?: string | null
          steam_move?: boolean | null
          reverse_line_movement?: boolean | null
          public_betting_percentage?: number | null
          sharp_money_indicator?: boolean | null
          bet_timing?: string | null
          days_rest_home?: number | null
          days_rest_away?: number | null
          weather_condition?: string | null
          temperature?: number | null
          confidence_level?: number | null
          bet_strategy?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sport?: string
          league?: string | null
          bet_type?: string
          prop_type?: string | null
          home_team?: string
          away_team?: string
          team_bet_on?: string
          player_name?: string | null
          home_away?: string | null
          description?: string
          line_value?: number | null
          odds?: number
          stake?: number
          potential_payout?: number
          actual_payout?: number | null
          profit_loss?: number | null
          result?: string
          placed_at?: string
          game_date?: string
          sportsbook?: string
          opening_spread_home?: number | null
          closing_spread_home?: number | null
          opening_total?: number | null
          closing_total?: number | null
          opening_moneyline_home?: number | null
          closing_moneyline_home?: number | null
          opening_moneyline_away?: number | null
          closing_moneyline_away?: number | null
          clv?: number | null
          line_movement?: string | null
          steam_move?: boolean | null
          reverse_line_movement?: boolean | null
          public_betting_percentage?: number | null
          sharp_money_indicator?: boolean | null
          bet_timing?: string | null
          days_rest_home?: number | null
          days_rest_away?: number | null
          weather_condition?: string | null
          temperature?: number | null
          confidence_level?: number | null
          bet_strategy?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          subscriber_id: string
          seller_id: string
          tier: string
          price: number
          status: string
          started_at: string
          expires_at: string | null
          stripe_subscription_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          subscriber_id: string
          seller_id: string
          tier: string
          price: number
          status: string
          started_at: string
          expires_at?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          subscriber_id?: string
          seller_id?: string
          tier?: string
          price?: number
          status?: string
          started_at?: string
          expires_at?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
        }
      }
    }
  }
}
