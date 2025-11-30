import { supabase } from '../lib/supabase';
import { AnalyticsSettings } from '../components/analytics/AnalyticsSettingsModal';
import { BettorAccount } from '../lib/bankrollCalculation';

/**
 * Fetch analytics settings for a user
 * @param userId User ID
 * @returns Analytics settings or null if not found
 */
export const fetchAnalyticsSettings = async (userId: string): Promise<AnalyticsSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('analytics_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found, return default settings
        return {
          user_id: userId,
          unit_size: 1000, // $10 in cents
          show_truesharp_bets: true,
          odds_format: 'american',
        };
      }
      throw error;
    }

    return data as AnalyticsSettings;
  } catch (error) {
    console.error('Error fetching analytics settings:', error);
    throw error;
  }
};

/**
 * Save or update analytics settings for a user
 * @param settings Analytics settings to save
 * @returns Saved settings
 */
export const saveAnalyticsSettings = async (settings: AnalyticsSettings): Promise<AnalyticsSettings> => {
  try {
    const { data, error } = await supabase
      .from('analytics_settings')
      .upsert(
        {
          user_id: settings.user_id,
          unit_size: settings.unit_size,
          show_truesharp_bets: settings.show_truesharp_bets,
          odds_format: settings.odds_format,
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as AnalyticsSettings;
  } catch (error) {
    console.error('Error saving analytics settings:', error);
    throw error;
  }
};

/**
 * Fetch bettor accounts for bankroll calculation
 * @param userId User ID
 * @returns Array of bettor accounts
 */
export const fetchBettorAccounts = async (userId: string): Promise<BettorAccount[]> => {
  try {
    // First get the user's sharpsports_bettor_id from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('sharpsports_bettor_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw profileError;
    }

    if (!profile?.sharpsports_bettor_id) {
      // User doesn't have a sharpsports bettor ID yet
      return [];
    }

    // Fetch bettor accounts using the sharpsports_bettor_id
    const { data, error } = await supabase
      .from('bettor_accounts')
      .select('*')
      .eq('bettor_id', profile.sharpsports_bettor_id);

    if (error) {
      throw error;
    }

    return data as BettorAccount[];
  } catch (error) {
    console.error('Error fetching bettor accounts:', error);
    throw error;
  }
};

/**
 * Initialize default analytics settings for a new user
 * @param userId User ID
 * @returns Created settings
 */
export const initializeDefaultSettings = async (userId: string): Promise<AnalyticsSettings> => {
  try {
    const defaultSettings: AnalyticsSettings = {
      user_id: userId,
      unit_size: 1000, // $10 in cents
      show_truesharp_bets: true,
      odds_format: 'american',
    };

    return await saveAnalyticsSettings(defaultSettings);
  } catch (error) {
    console.error('Error initializing default settings:', error);
    throw error;
  }
};