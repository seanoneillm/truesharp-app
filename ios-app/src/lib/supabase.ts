import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Environment variables for Supabase
const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || 'https://trsogafrxpptszxydycn.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyc29nYWZyeHBwdHN6eHlkeWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MjQ0OTQsImV4cCI6MjA2NjMwMDQ5NH0.STgM-_-9tTwI-Tr-gajQnfsA9cEZplw7W5uPWmn-SwA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types (simplified version from web app)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          email: string | null;
          profile_picture_url: string | null;
          bio: string | null;
          is_verified: boolean;
          is_seller: boolean;
          pro: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          email?: string | null;
          profile_picture_url?: string | null;
          bio?: string | null;
          is_verified?: boolean;
          is_seller?: boolean;
          pro?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          email?: string | null;
          profile_picture_url?: string | null;
          bio?: string | null;
          is_verified?: boolean;
          is_seller?: boolean;
          pro?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bets: {
        Row: {
          id: string;
          user_id: string;
          sport: string;
          bet_type: string;
          description: string;
          odds: number;
          stake: number;
          result: string;
          created_at: string;
        };
      };
      strategies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          roi_percentage: number;
          win_rate: number;
          total_bets: number;
          created_at: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          subscriber_id: string;
          seller_id: string;
          tier: string;
          status: string;
          created_at: string;
        };
      };
    };
  };
};

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Bet = Database['public']['Tables']['bets']['Row'];
export type Strategy = Database['public']['Tables']['strategies']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];