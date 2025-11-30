import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from './AuthContext';
import { useSubscription } from './SubscriptionContext';
import { logger } from '../utils/logger';

interface AppStateContextType {
  appState: AppStateStatus;
  isAppInForeground: boolean;
  timeSinceBackground: number | null;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

interface AppStateProviderProps {
  children: ReactNode;
}

export function AppStateProvider({ children }: AppStateProviderProps) {
  const [appState, setAppState] = useState(AppState.currentState);
  const [backgroundTime, setBackgroundTime] = useState<number | null>(null);
  const [timeSinceBackground, setTimeSinceBackground] = useState<number | null>(null);
  
  const { user, refreshProfile } = useAuth();
  const { refreshSubscriptionStatus } = useSubscription();

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      logger.info(`App state changing from ${appState} to ${nextAppState}`);
      
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        const now = Date.now();
        const timeInBackground = backgroundTime ? now - backgroundTime : 0;
        setTimeSinceBackground(timeInBackground);
        
        logger.info(`App returned to foreground after ${timeInBackground}ms in background`);
        
        // If app was in background for more than 5 minutes, refresh critical data
        const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes
        if (timeInBackground > REFRESH_THRESHOLD && user) {
          logger.info('App was backgrounded for extended period, refreshing critical data...');
          
          try {
            // Refresh auth session first
            await refreshProfile();
            
            // Then refresh subscription status
            await refreshSubscriptionStatus();
            
            logger.info('✅ Successfully refreshed app state after background');
          } catch (error) {
            logger.error('❌ Failed to refresh app state after background:', error);
          }
        }
        
        setBackgroundTime(null);
      } else if (nextAppState.match(/inactive|background/) && appState === 'active') {
        // App is going to background
        setBackgroundTime(Date.now());
        setTimeSinceBackground(null);
        logger.info('App moved to background');
      }
      
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [appState, backgroundTime, user, refreshProfile, refreshSubscriptionStatus]);

  const isAppInForeground = appState === 'active';

  const value: AppStateContextType = {
    appState,
    isAppInForeground,
    timeSinceBackground,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}