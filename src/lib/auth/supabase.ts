// FILE: src/lib/auth/supabase.ts
// Supabase client configuration and database types

import { createClient } from '@supabase/supabase-js'

// Database types based on our schema
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          bio: string | null
          profile_picture_url: string | null
          email: string | null
          is_seller: boolean | null
          is_verified_seller: boolean | null
          pro: string | null
          public_profile: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          username?: string | null
          bio?: string | null
          profile_picture_url?: string | null
          email?: string | null
          is_seller?: boolean | null
          is_verified_seller?: boolean | null
          pro?: string | null
          public_profile?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          bio?: string | null
          profile_picture_url?: string | null
          email?: string | null
          is_seller?: boolean | null
          is_verified_seller?: boolean | null
          pro?: string | null
          public_profile?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      bets: {
        Row: {
          id: string
          user_id: string
          external_bet_id: string
          sportsbook_id: string
          sport: string
          league: string
          bet_type: 'spread' | 'moneyline' | 'total' | 'prop'
          description: string
          odds: number
          stake: number
          potential_payout: number
          actual_payout: number | null
          status: 'pending' | 'won' | 'lost' | 'void' | 'cancelled'
          placed_at: string
          settled_at: string | null
          game_date: string
          teams: { home: string; away: string }
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          external_bet_id: string
          sportsbook_id: string
          sport: string
          league: string
          bet_type: 'spread' | 'moneyline' | 'total' | 'prop'
          description: string
          odds: number
          stake: number
          potential_payout: number
          actual_payout?: number | null
          status?: 'pending' | 'won' | 'lost' | 'void' | 'cancelled'
          placed_at: string
          settled_at?: string | null
          game_date: string
          teams: { home: string; away: string }
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          external_bet_id?: string
          sportsbook_id?: string
          sport?: string
          league?: string
          bet_type?: 'spread' | 'moneyline' | 'total' | 'prop'
          description?: string
          odds?: number
          stake?: number
          potential_payout?: number
          actual_payout?: number | null
          status?: 'pending' | 'won' | 'lost' | 'void' | 'cancelled'
          placed_at?: string
          settled_at?: string | null
          game_date?: string
          teams?: { home: string; away: string }
          is_public?: boolean
          created_at?: string
        }
      }
      picks: {
        Row: {
          id: string
          user_id: string
          bet_id: string | null
          sport: string
          title: string
          description: string
          analysis: string | null
          confidence: number
          odds: string
          tier: 'free' | 'bronze' | 'silver' | 'premium'
          status: 'pending' | 'won' | 'lost' | 'void'
          result: string | null
          posted_at: string
          game_time: string
          is_manual: boolean
          views: number
          likes: number
          comments: number
          shares: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bet_id?: string | null
          sport: string
          title: string
          description: string
          analysis?: string | null
          confidence: number
          odds: string
          tier?: 'free' | 'bronze' | 'silver' | 'premium'
          status?: 'pending' | 'won' | 'lost' | 'void'
          result?: string | null
          posted_at?: string
          game_time: string
          is_manual?: boolean
          views?: number
          likes?: number
          comments?: number
          shares?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bet_id?: string | null
          sport?: string
          title?: string
          description?: string
          analysis?: string | null
          confidence?: number
          odds?: string
          tier?: 'free' | 'bronze' | 'silver' | 'premium'
          status?: 'pending' | 'won' | 'lost' | 'void'
          result?: string | null
          posted_at?: string
          game_time?: string
          is_manual?: boolean
          views?: number
          likes?: number
          comments?: number
          shares?: number
          created_at?: string
        }
      }
      sportsbooks: {
        Row: {
          id: string
          name: string
          display_name: string
          logo: string | null
          is_active: boolean
          api_endpoint: string | null
          auth_type: 'oauth' | 'credentials' | 'scraping'
          supported_markets: string[]
          created_at: string
        }
        Insert: {
          id: string
          name: string
          display_name: string
          logo?: string | null
          is_active?: boolean
          api_endpoint?: string | null
          auth_type?: 'oauth' | 'credentials' | 'scraping'
          supported_markets?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          logo?: string | null
          is_active?: boolean
          api_endpoint?: string | null
          auth_type?: 'oauth' | 'credentials' | 'scraping'
          supported_markets?: string[]
          created_at?: string
        }
      }
      sportsbook_connections: {
        Row: {
          id: string
          user_id: string
          sportsbook_id: string
          status: 'connected' | 'disconnected' | 'error' | 'pending'
          last_sync: string | null
          total_bets_tracked: number
          connection_date: string
          error: string | null
          credentials_encrypted: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sportsbook_id: string
          status?: 'connected' | 'disconnected' | 'error' | 'pending'
          last_sync?: string | null
          total_bets_tracked?: number
          connection_date?: string
          error?: string | null
          credentials_encrypted?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sportsbook_id?: string
          status?: 'connected' | 'disconnected' | 'error' | 'pending'
          last_sync?: string | null
          total_bets_tracked?: number
          connection_date?: string
          error?: string | null
          credentials_encrypted?: string | null
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          subscriber_id: string
          seller_id: string
          tier: 'bronze' | 'silver' | 'premium'
          price: number
          status: 'active' | 'cancelled' | 'expired' | 'paused'
          started_at: string
          expires_at: string | null
          stripe_subscription_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          subscriber_id: string
          seller_id: string
          tier: 'bronze' | 'silver' | 'premium'
          price: number
          status?: 'active' | 'cancelled' | 'expired' | 'paused'
          started_at?: string
          expires_at?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          subscriber_id?: string
          seller_id?: string
          tier?: 'bronze' | 'silver' | 'premium'
          price?: number
          status?: 'active' | 'cancelled' | 'expired' | 'paused'
          started_at?: string
          expires_at?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
        }
      }
      user_performance_cache: {
        Row: {
          user_id: string
          total_bets: number
          total_wins: number
          total_losses: number
          win_rate: number
          roi: number
          profit: number
          avg_bet_size: number
          variance: number
          current_streak_type: string | null
          current_streak_count: number
          longest_win_streak: number
          longest_loss_streak: number
          last_calculated: string
        }
        Insert: {
          user_id: string
          total_bets?: number
          total_wins?: number
          total_losses?: number
          win_rate?: number
          roi?: number
          profit?: number
          avg_bet_size?: number
          variance?: number
          current_streak_type?: string | null
          current_streak_count?: number
          longest_win_streak?: number
          longest_loss_streak?: number
          last_calculated?: string
        }
        Update: {
          user_id?: string
          total_bets?: number
          total_wins?: number
          total_losses?: number
          win_rate?: number
          roi?: number
          profit?: number
          avg_bet_size?: number
          variance?: number
          current_streak_type?: string | null
          current_streak_count?: number
          longest_win_streak?: number
          longest_loss_streak?: number
          last_calculated?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_user_performance: {
        Args: { user_uuid: string }
        Returns: {
          total_bets: number
          total_wins: number
          total_losses: number
          win_rate: number
          roi: number
          profit: number
          avg_bet_size: number
        }[]
      }
      update_user_performance_cache: {
        Args: { user_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client for browser/client components
export const createBrowserClient = () => createClient<Database>(supabaseUrl, supabaseAnonKey)

// Direct client (for API routes)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Export alias for backward compatibility
export { createClient } from '@supabase/supabase-js'

// Export types for use in components
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Bet = Database['public']['Tables']['bets']['Row']
export type Pick = Database['public']['Tables']['picks']['Row']
export type Sportsbook = Database['public']['Tables']['sportsbooks']['Row']
export type SportsbookConnection = Database['public']['Tables']['sportsbook_connections']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type UserPerformance = Database['public']['Tables']['user_performance_cache']['Row']
