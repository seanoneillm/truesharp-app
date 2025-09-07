// src/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Server client function - only use in server components/API routes
export async function createServerClient() {
  const { createServerClient: createSSRClient } = await import('@supabase/ssr')
  const { cookies } = await import('next/headers')

  const cookieStore = await cookies()

  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Alternative server client for API routes with explicit request
export async function createServerClientFromRequest(request: Request) {
  const { createServerClient: createSSRClient } = await import('@supabase/ssr')

  // Extract cookies from request headers
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = new Map<string, string>()

  // Parse cookie header
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, ...rest] = cookie.split('=')
      if (name && rest.length > 0) {
        cookies.set(name.trim(), rest.join('=').trim())
      }
    })
  }

  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Array.from(cookies.entries()).map(([name, value]) => ({ name, value }))
        },
        setAll() {
          // No-op for API routes
        },
      },
    }
  )
}

// Service role client for admin operations (bypasses RLS)
export async function createServiceRoleClient() {
  const { createClient } = await import('@supabase/supabase-js')

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export type Database = {
  public: {
    Tables: {
      games: {
        Row: {
          id: string
          sport: string
          league: string
          home_team: string
          away_team: string
          home_team_name: string
          away_team_name: string
          game_time: string
          status: string
          home_score: number | null
          away_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          sport: string
          league: string
          home_team: string
          away_team: string
          home_team_name: string
          away_team_name: string
          game_time: string
          status?: string
          home_score?: number | null
          away_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sport?: string
          league?: string
          home_team?: string
          away_team?: string
          home_team_name?: string
          away_team_name?: string
          game_time?: string
          status?: string
          home_score?: number | null
          away_score?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      odds: {
        Row: {
          id: string
          eventid: string | null
          sportsbook: string
          marketname: string
          statid: string | null
          bettypeid: string | null
          closebookodds: number | null
          bookodds: number | null
          odds_type: string | null
          fetched_at: string | null
          created_at: string | null
          leagueid: string | null
          hometeam: string | null
          awayteam: string | null
          oddid: string | null
          playerid: string | null
          periodid: string | null
          sideid: string | null
          fanduelodds: number | null
          fanduellink: string | null
          espnbetodds: number | null
          espnbetlink: string | null
          ceasarsodds: number | null
          ceasarslink: string | null
          mgmodds: number | null
          mgmlink: string | null
          fanaticsodds: number | null
          fanaticslink: string | null
          draftkingsodds: number | null
          draftkingslink: string | null
          score: string | null
        }
        Insert: {
          id?: string
          eventid?: string | null
          sportsbook: string
          marketname: string
          statid?: string | null
          bettypeid?: string | null
          closebookodds?: number | null
          bookodds?: number | null
          odds_type?: string | null
          fetched_at?: string | null
          created_at?: string | null
          leagueid?: string | null
          hometeam?: string | null
          awayteam?: string | null
          oddid?: string | null
          playerid?: string | null
          periodid?: string | null
          sideid?: string | null
          fanduelodds?: number | null
          fanduellink?: string | null
          espnbetodds?: number | null
          espnbetlink?: string | null
          ceasarsodds?: number | null
          ceasarslink?: string | null
          mgmodds?: number | null
          mgmlink?: string | null
          fanaticsodds?: number | null
          fanaticslink?: string | null
          draftkingsodds?: number | null
          draftkingslink?: string | null
          score?: string | null
        }
        Update: {
          id?: string
          eventid?: string | null
          sportsbook?: string
          marketname?: string
          statid?: string | null
          bettypeid?: string | null
          closebookodds?: number | null
          bookodds?: number | null
          odds_type?: string | null
          fetched_at?: string | null
          created_at?: string | null
          leagueid?: string | null
          hometeam?: string | null
          awayteam?: string | null
          oddid?: string | null
          playerid?: string | null
          periodid?: string | null
          sideid?: string | null
          fanduelodds?: number | null
          fanduellink?: string | null
          espnbetodds?: number | null
          espnbetlink?: string | null
          ceasarsodds?: number | null
          ceasarslink?: string | null
          mgmodds?: number | null
          mgmlink?: string | null
          fanaticsodds?: number | null
          fanaticslink?: string | null
          draftkingsodds?: number | null
          draftkingslink?: string | null
          score?: string | null
        }
      }
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
      strategies: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_active: boolean
          is_public: boolean
          is_monetized: boolean
          price: number | null
          sports: string[] | null
          leagues: string[] | null
          teams: string[] | null
          bet_types: string[] | null
          markets: string[] | null
          monetization_settings: Record<string, unknown> | null
          subscription_tiers: string[] | null
          total_bets: number
          winning_bets: number
          losing_bets: number
          push_bets: number
          roi_percentage: number
          win_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          is_active?: boolean
          is_public?: boolean
          is_monetized?: boolean
          price?: number | null
          sports?: string[] | null
          leagues?: string[] | null
          teams?: string[] | null
          bet_types?: string[] | null
          markets?: string[] | null
          monetization_settings?: Record<string, unknown> | null
          subscription_tiers?: string[] | null
          total_bets?: number
          winning_bets?: number
          losing_bets?: number
          push_bets?: number
          roi_percentage?: number
          win_rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          is_public?: boolean
          is_monetized?: boolean
          price?: number | null
          sports?: string[] | null
          leagues?: string[] | null
          teams?: string[] | null
          bet_types?: string[] | null
          markets?: string[] | null
          monetization_settings?: Record<string, unknown> | null
          subscription_tiers?: string[] | null
          total_bets?: number
          winning_bets?: number
          losing_bets?: number
          push_bets?: number
          roi_percentage?: number
          win_rate?: number
          created_at?: string
          updated_at?: string
        }
      }
      picks: {
        Row: {
          id: string
          user_id: string
          title: string
          sport: string
          description: string
          odds: string
          confidence: number
          tier: string
          status: string
          game_time: string | null
          posted_at: string
          is_manual: boolean | null
          result: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          sport: string
          description: string
          odds: string
          confidence: number
          tier: string
          status: string
          game_time?: string | null
          posted_at: string
          is_manual?: boolean | null
          result?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          sport?: string
          description?: string
          odds?: string
          confidence?: number
          tier?: string
          status?: string
          game_time?: string | null
          posted_at?: string
          is_manual?: boolean | null
          result?: string | null
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
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      feedback: {
        Row: {
          id: string
          feedback_text: string
          created_at: string | null
        }
        Insert: {
          id?: string
          feedback_text: string
          created_at?: string | null
        }
        Update: {
          id?: string
          feedback_text?: string
          created_at?: string | null
        }
      }
    }
  }
}
