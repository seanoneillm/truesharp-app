import { supabase } from '../lib/supabase';

export interface BettorAccount {
  id: string;
  user_id: string;
  book_name: string;
  book_abbr?: string;
  region_name?: string;
  region_abbr?: string;
  balance: number;
  verified: boolean;
  access: boolean;
  paused: boolean;
  latest_refresh_status?: string;
  latest_refresh_time?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch connected sportsbook accounts for a user
 */
export const fetchBettorAccounts = async (userId: string): Promise<BettorAccount[]> => {
  try {
    // First, get the user's sharpsports_bettor_id from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('sharpsports_bettor_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw profileError;
    }

    const bettorId = profileData?.sharpsports_bettor_id;
    if (!bettorId) {
      // User hasn't linked SharpSports yet
      return [];
    }

    // Now fetch the bettor_accounts for this bettor_id
    const { data, error } = await supabase
      .from('bettor_accounts')
      .select('*')
      .eq('bettor_id', bettorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bettor accounts:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchBettorAccounts:', error);
    throw error;
  }
};

/**
 * Refresh sportsbook account data
 */
export const refreshSportsbookAccounts = async (userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    // This would integrate with SharpSports API in the future
    // For now, return a placeholder response
    return {
      success: true,
      message: 'Sportsbook accounts refreshed successfully'
    };
  } catch (error) {
    console.error('Error refreshing sportsbook accounts:', error);
    return {
      success: false,
      message: 'Failed to refresh sportsbook accounts'
    };
  }
};

/**
 * Get status badge info for account statuses
 */
export const getStatusBadgeInfo = (verified: boolean, access: boolean, paused: boolean) => {
  if (!verified) {
    return {
      text: 'Unverified',
      color: '#EF4444', // Red
      bgColor: '#FEF2F2', // Light red
    };
  }
  
  if (paused) {
    return {
      text: 'Paused',
      color: '#F59E0B', // Yellow
      bgColor: '#FFFBEB', // Light yellow
    };
  }
  
  if (!access) {
    return {
      text: 'No Access',
      color: '#EF4444', // Red
      bgColor: '#FEF2F2', // Light red
    };
  }
  
  return {
    text: 'Active',
    color: '#10B981', // Green
    bgColor: '#F0FDF4', // Light green
  };
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format refresh time for display
 */
export const formatRefreshTime = (refreshTime?: string): string => {
  if (!refreshTime) return 'Never';
  
  try {
    const date = new Date(refreshTime);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Unknown';
  }
};