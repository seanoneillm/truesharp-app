import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const BACKGROUND_REFRESH_THRESHOLD = 10 * 60 * 1000; // 10 minutes

export function useSessionManager() {
  const { user, signOut, refreshProfile } = useAuth();
  const { refreshSubscriptionStatus } = useSubscription();
  const backgroundTimeRef = useRef<number | null>(null);
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Verify session is still valid
  const verifySession = async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.error('Session verification failed:', error);
        return false;
      }

      if (!session) {
        logger.warn('No active session found');
        return false;
      }

      // Check if token is close to expiring (within 5 minutes)
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const timeToExpiry = expiresAt - now;

      if (timeToExpiry < 300) { // Less than 5 minutes
        logger.info('Session token expires soon, refreshing...');
        
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          logger.error('Failed to refresh session:', refreshError);
          return false;
        }
        
        if (!data.session) {
          logger.error('Session refresh returned no session');
          return false;
        }

        logger.info('Session refreshed successfully');
      }

      return true;
    } catch (error) {
      logger.error('Session verification error:', error);
      return false;
    }
  };

  // Handle app state changes
  useEffect(() => {
    if (!user) return;

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const now = Date.now();
        const timeInBackground = backgroundTimeRef.current ? now - backgroundTimeRef.current : 0;
        
        logger.info(`App became active after ${timeInBackground}ms in background`);

        // If app was in background for more than threshold, verify session and refresh data
        if (timeInBackground > BACKGROUND_REFRESH_THRESHOLD) {
          logger.info('App was backgrounded for extended period, verifying session...');
          
          const isSessionValid = await verifySession();
          
          if (!isSessionValid) {
            logger.warn('Session is invalid, signing out user...');
            await signOut();
            return;
          }

          // Refresh critical data
          try {
            await refreshProfile();
            await refreshSubscriptionStatus();
            logger.info('Successfully refreshed app data after background period');
          } catch (error) {
            logger.error('Failed to refresh app data:', error);
          }
        }

        backgroundTimeRef.current = null;
      } else if (nextAppState.match(/inactive|background/)) {
        backgroundTimeRef.current = Date.now();
        logger.info('App moved to background');
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      appStateSubscription?.remove();
    };
  }, [user, signOut, refreshProfile, refreshSubscriptionStatus]);

  // Set up periodic session checks
  useEffect(() => {
    if (!user) {
      // Clear interval if no user
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }
      return;
    }

    // Set up periodic session validation
    sessionCheckIntervalRef.current = setInterval(async () => {
      if (AppState.currentState === 'active') {
        const isValid = await verifySession();
        if (!isValid) {
          logger.warn('Session check failed, signing out user...');
          await signOut();
        }
      }
    }, SESSION_CHECK_INTERVAL);

    return () => {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }
    };
  }, [user, signOut]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
    };
  }, []);
}