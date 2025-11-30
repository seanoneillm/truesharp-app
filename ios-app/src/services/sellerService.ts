import { supabase } from '../lib/supabase';
import { stripeService } from './stripeService';

export interface SellerProfile {
  id: string;
  email: string;
  username?: string;
  is_seller: boolean;
  stripe_connect_account_id?: string;
  display_name?: string;
  profile_picture_url?: string;
  bio?: string;
}

export interface SellerStatus {
  isSeller: boolean;
  hasStripeAccount: boolean;
  stripeAccountReady: boolean;
  canMonetizeStrategies: boolean;
  requiresOnboarding: boolean;
  errors?: string[];
}

class SellerService {
  // Get seller profile and status
  async getSellerStatus(userId: string): Promise<SellerStatus & { profile?: SellerProfile }> {
    try {
      // Get user profile from database (use maybeSingle to avoid PGRST116 errors)
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, username, is_seller, stripe_connect_account_id, display_name, profile_picture_url, bio')
        .eq('id', userId)
        .maybeSingle();
      // If profile doesn't exist, try to create it (handled by auth service)
      if (!profile && (!profileError || profileError?.code === 'PGRST116')) {
        // Import and use auth service to create profile
        const { authService } = await import('../lib/auth');
        const newProfile = await authService.createProfile(userId);
        
        if (newProfile) {
          profile = newProfile;
          profileError = null;
        } else {
        }
      }

      if (profileError || !profile) {
        console.error('❌ Error fetching user profile:', {
          error: profileError,
          errorCode: profileError?.code,
          errorMessage: profileError?.message,
          errorDetails: profileError?.details,
          userId: userId,
          profileData: profile
        });
        return {
          isSeller: false,
          hasStripeAccount: false,
          stripeAccountReady: false,
          canMonetizeStrategies: false,
          requiresOnboarding: true,
          errors: [`User profile error: ${profileError?.message || 'Profile not found'}`],
        };
      }

      // Check if user has Stripe Connect account in profile
      const hasStripeConnectId = !!profile.stripe_connect_account_id;
      
      // If user is marked as seller and has stripe connect ID, verify account completeness with Stripe
      if (profile.is_seller && hasStripeConnectId) {
        // Actually check Stripe account status via the API
        const stripeStatus = await stripeService.checkSellerStatus(userId);
        
        
        return {
          isSeller: true,
          hasStripeAccount: stripeStatus.hasStripeAccount,
          stripeAccountReady: stripeStatus.accountReady,
          canMonetizeStrategies: stripeStatus.hasStripeAccount && stripeStatus.accountReady,
          requiresOnboarding: !stripeStatus.accountReady,
          profile,
          errors: stripeStatus.errors,
        };
      }
      
      // If user is not a seller at all
      if (!profile.is_seller) {
        return {
          isSeller: false,
          hasStripeAccount: hasStripeConnectId,
          stripeAccountReady: false,
          canMonetizeStrategies: false,
          requiresOnboarding: true,
          profile,
        };
      }

      // User is seller but no Stripe Connect account - needs onboarding
      const status: SellerStatus = {
        isSeller: true,
        hasStripeAccount: hasStripeConnectId,
        stripeAccountReady: false,
        canMonetizeStrategies: false,
        requiresOnboarding: true,
        errors: hasStripeConnectId ? ['Stripe account setup incomplete'] : ['Stripe Connect account required'],
      };

      return {
        ...status,
        profile,
      };
    } catch (error) {
      console.error('Error checking seller status:', error);
      return {
        isSeller: false,
        hasStripeAccount: false,
        stripeAccountReady: false,
        canMonetizeStrategies: false,
        requiresOnboarding: true,
        errors: ['Network error checking seller status'],
      };
    }
  }

  // Enable seller status for user
  async enableSellerStatus(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_seller: true })
        .eq('id', userId);

      if (error) {
        console.error('❌ Error enabling seller status:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      console.error('Error enabling seller status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Start seller onboarding process
  async startSellerOnboarding(userId: string): Promise<{
    success: boolean;
    onboardingUrl?: string;
    error?: string;
  }> {
    try {
      // Check current status first
      const currentStatus = await this.getSellerStatus(userId);
      
      // If user can already monetize, return success
      if (currentStatus.canMonetizeStrategies) {
        return { 
          success: true, 
          error: 'Account already set up for monetization' 
        };
      }

      // First, ensure user is marked as seller
      const enableResult = await this.enableSellerStatus(userId);
      if (!enableResult.success) {
        return { success: false, error: enableResult.error };
      }

      // Check if user already has a Stripe Connect account ID (either verified or incomplete)
      if (currentStatus.profile?.stripe_connect_account_id) {
        // User has account ID but needs to complete onboarding (account may be restricted/incomplete)
        
        // Try to get account management URL instead of onboarding link
        // This works with the existing production backend
        const accountResult = await stripeService.getAccountManagementUrl();
        
        if (accountResult.success && accountResult.url) {
          return {
            success: true,
            onboardingUrl: accountResult.url,
          };
        }
        
        // If account management fails, try the onboarding link as fallback
        const stripeResult = await stripeService.createOnboardingLink(currentStatus.profile.stripe_connect_account_id);
        
        if ('error' in stripeResult) {
          console.error('Failed to create onboarding link for existing account:', {
            error: stripeResult.error,
            accountId: currentStatus.profile.stripe_connect_account_id,
          });
          
          // Final fallback: provide a manual URL for Stripe Connect dashboard
          const manualUrl = 'https://connect.stripe.com/express/login';
          
          return {
            success: true,
            onboardingUrl: manualUrl,
          };
        }

        return {
          success: true,
          onboardingUrl: stripeResult.onboarding_url,
        };
      }

      // Create new Stripe Connect account
      const stripeResult = await stripeService.createStripeConnectAccount();
      
      if ('error' in stripeResult) {
        return { success: false, error: stripeResult.error };
      }

      return {
        success: true,
        onboardingUrl: stripeResult.onboarding_url,
      };
    } catch (error) {
      console.error('Error starting seller onboarding:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Validate if user can create monetized strategies
  async validateMonetizationEligibility(userId: string): Promise<{
    eligible: boolean;
    reasons: string[];
    requirements: string[];
  }> {
    const status = await this.getSellerStatus(userId);

    const reasons: string[] = [];
    const requirements: string[] = [];

    if (!status.isSeller) {
      reasons.push('User is not registered as a seller');
      requirements.push('Enable seller status in your profile');
    }

    if (!status.hasStripeAccount) {
      reasons.push('No Stripe Connect account found');
      requirements.push('Create a Stripe Connect account for payouts');
    }

    if (status.hasStripeAccount && !status.stripeAccountReady) {
      reasons.push('Stripe Connect account setup incomplete');
      requirements.push('Complete Stripe onboarding process');
    }

    if (status.errors && status.errors.length > 0) {
      reasons.push(...status.errors);
    }

    return {
      eligible: status.canMonetizeStrategies,
      reasons,
      requirements,
    };
  }

  // Get seller metrics and stats
  async getSellerMetrics(userId: string): Promise<{
    totalStrategies: number;
    monetizedStrategies: number;
    totalSubscribers: number;
    monthlyRevenue: number;
    retentionRate: number;
  }> {
    try {
      // Get strategy counts
      const { data: strategies, error: strategiesError } = await supabase
        .from('strategies')
        .select('id, monetized')
        .eq('user_id', userId);

      if (strategiesError) {
        console.error('Error fetching seller strategies:', strategiesError);
      }

      const totalStrategies = strategies?.length || 0;
      const monetizedStrategies = strategies?.filter(s => s.monetized).length || 0;

      // Get subscription counts (active subscriptions)
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('id, price, frequency, created_at')
        .eq('seller_id', userId)
        .eq('status', 'active');

      if (subscriptionsError) {
        console.error('Error fetching seller subscriptions:', subscriptionsError);
      }

      const totalSubscribers = subscriptions?.length || 0;

      // Calculate monthly revenue (convert all to monthly equivalent)
      let monthlyRevenue = 0;
      if (subscriptions) {
        monthlyRevenue = subscriptions.reduce((total, sub) => {
          const price = sub.price || 0;
          switch (sub.frequency) {
            case 'weekly':
              return total + (price * 4.33); // ~4.33 weeks per month
            case 'monthly':
              return total + price;
            case 'yearly':
              return total + (price / 12);
            default:
              return total;
          }
        }, 0);
      }

      // Calculate retention rate (simplified - % of subscribers from last month still active)
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const lastMonthSubscribers = subscriptions?.filter(sub => 
        new Date(sub.created_at) <= lastMonth
      ).length || 0;

      const retentionRate = lastMonthSubscribers > 0 
        ? (totalSubscribers / lastMonthSubscribers) * 100 
        : 0;

      return {
        totalStrategies,
        monetizedStrategies,
        totalSubscribers,
        monthlyRevenue,
        retentionRate: Math.min(100, retentionRate), // Cap at 100%
      };
    } catch (error) {
      console.error('Error fetching seller metrics:', error);
      return {
        totalStrategies: 0,
        monetizedStrategies: 0,
        totalSubscribers: 0,
        monthlyRevenue: 0,
        retentionRate: 0,
      };
    }
  }
}

export const sellerService = new SellerService();
export default sellerService;