import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { modernStoreKitService, SubscriptionStatus } from '../services/modern-storekit';
import { useAuth } from './AuthContext';
import { logger } from '../utils/logger';
import { supabase } from '../lib/supabase';

interface SubscriptionContextType {
  subscriptionStatus: SubscriptionStatus;
  isLoading: boolean;
  refreshSubscriptionStatus: () => Promise<void>;
  isProUser: boolean;
  // Add convenience methods
  checkAndSyncSubscription: () => Promise<void>;
  lastChecked: Date | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isActive: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const { user } = useAuth();

  /**
   * Refresh subscription status from multiple sources
   */
  const refreshSubscriptionStatus = useCallback(async () => {
    if (!user) {
      setSubscriptionStatus({ isActive: false });
      setIsLoading(false);
      setLastChecked(null);
      return;
    }

    try {
      setIsLoading(true);
      logger.info('🔄 Refreshing subscription status for user:', user.id);

      // Get status from modern StoreKit service (checks both DB and Apple)
      const status = await modernStoreKitService.getSubscriptionStatus();
      
      setSubscriptionStatus(status);
      setLastChecked(new Date());
      
      logger.info('✅ Subscription status updated:', {
        isActive: status.isActive,
        productId: status.productId,
        expirationDate: status.expirationDate,
        isTrialPeriod: status.isTrialPeriod
      });

    } catch (error) {
      logger.error('❌ Error refreshing subscription status:', error);
      
      // Fallback: Check profile.pro field directly
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('pro')
          .eq('id', user.id)
          .single();

        if (!profileError && profile) {
          setSubscriptionStatus({
            isActive: profile.pro === 'yes'
          });
          logger.info('📋 Fallback: Used profile.pro status:', profile.pro === 'yes');
        } else {
          setSubscriptionStatus({ isActive: false });
          logger.warn('⚠️ Could not determine subscription status, defaulting to inactive');
        }
      } catch (fallbackError) {
        logger.error('❌ Fallback status check failed:', fallbackError);
        setSubscriptionStatus({ isActive: false });
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Check and sync subscription with backend
   * This handles cases where purchases may have been made on other devices
   */
  const checkAndSyncSubscription = useCallback(async () => {
    if (!user) return;

    try {
      logger.info('🔄 Syncing subscription status with backend...');
      
      // Initialize StoreKit if needed
      await modernStoreKitService.initialize();
      
      // For iOS, try to restore any recent purchases that might not be synced
      try {
        const restoredPurchases = await modernStoreKitService.restorePurchases();
        if (restoredPurchases.length > 0) {
          logger.info('🎉 Found and restored purchases during sync:', restoredPurchases.length);
        }
      } catch (restoreError) {
        logger.warn('⚠️ Could not restore purchases during sync (this is normal):', restoreError);
      }

      // Refresh status after potential restoration
      await refreshSubscriptionStatus();
      
    } catch (error) {
      logger.error('❌ Error during subscription sync:', error);
      // Still refresh to get current status
      await refreshSubscriptionStatus();
    }
  }, [user, refreshSubscriptionStatus]);

  // Initialize subscription status when user changes
  useEffect(() => {
    refreshSubscriptionStatus();
  }, [refreshSubscriptionStatus]);

  // Set up real-time subscription updates from Supabase
  useEffect(() => {
    if (!user) return;

    // Listen for profile changes (pro field updates)
    const profileSubscription = supabase
      .channel('profile-subscription-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          logger.info('📱 Profile subscription status changed:', payload);
          
          // Update local state immediately
          const newProfile = payload.new as any;
          if (newProfile && typeof newProfile.pro === 'string') {
            setSubscriptionStatus(prev => ({
              ...prev,
              isActive: newProfile.pro === 'yes'
            }));
            setLastChecked(new Date());
          }
        }
      )
      .subscribe();

    // Listen for pro_subscriptions table changes
    const subscriptionTableSubscription = supabase
      .channel('pro-subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pro_subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          logger.info('📱 Pro subscription table changed:', payload);
          // Refresh full status when subscription records change
          refreshSubscriptionStatus();
        }
      )
      .subscribe();

    return () => {
      profileSubscription.unsubscribe();
      subscriptionTableSubscription.unsubscribe();
    };
  }, [user, refreshSubscriptionStatus]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    if (!user) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        logger.info('📱 App became active, refreshing subscription status...');
        refreshSubscriptionStatus();
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Auto-refresh subscription status periodically when app is active
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        logger.info('⏰ Auto-refreshing subscription status...');
        refreshSubscriptionStatus();
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => {
      appStateSubscription?.remove();
      clearInterval(interval);
    };
  }, [user, refreshSubscriptionStatus]);

  // Computed properties for convenience
  const isProUser = subscriptionStatus.isActive;

  const value: SubscriptionContextType = {
    subscriptionStatus,
    isLoading,
    refreshSubscriptionStatus,
    isProUser,
    checkAndSyncSubscription,
    lastChecked,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

/**
 * Hook for checking if user has pro access
 * This is a convenience hook for components that only need to know pro status
 */
export function useProAccess() {
  const { isProUser, isLoading } = useSubscription();
  return { isProUser, isLoading };
}

/**
 * Hook for subscription management operations
 * This provides methods for purchase, restore, etc.
 */
export function useSubscriptionActions() {
  const { refreshSubscriptionStatus, checkAndSyncSubscription } = useSubscription();
  
  const purchaseSubscription = async (productId: string) => {
    try {
      logger.info('🛒 Starting subscription purchase:', productId);
      
      const result = await modernStoreKitService.purchaseSubscription(productId);
      
      if (result.success) {
        // Refresh subscription status after successful purchase
        await refreshSubscriptionStatus();
      }
      
      return result;
    } catch (error) {
      logger.error('❌ Purchase failed:', error);
      throw error;
    }
  };

  const restorePurchases = async () => {
    try {
      logger.info('🔄 Restoring purchases...');
      
      const results = await modernStoreKitService.restorePurchases();
      
      if (results.length > 0) {
        // Refresh subscription status after restoration
        await refreshSubscriptionStatus();
      }
      
      return results;
    } catch (error) {
      logger.error('❌ Restore failed:', error);
      throw error;
    }
  };

  return {
    purchaseSubscription,
    restorePurchases,
    checkAndSyncSubscription,
    refreshSubscriptionStatus,
  };
}