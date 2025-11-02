import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, AuthUser, LoginCredentials, SignupCredentials, subscribeToAuthChanges } from '../lib/auth';
import { AuthContextType } from '../types';
import { pushNotificationService } from '../services/pushNotificationService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app start
    checkCurrentSession();

    // Subscribe to auth state changes
    const { data: { subscription } } = subscribeToAuthChanges(async (user) => {
      setUser(user);
      setLoading(false);
      
      // Register for push notifications and sync subscription when user logs in
      if (user) {
        await pushNotificationService.registerForPushNotifications();
        // Note: Subscription sync will be handled by SubscriptionProvider
      } else {
        // Clear push token when user logs out
        await pushNotificationService.clearPushToken();
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const checkCurrentSession = async () => {
    try {
      const session = await authService.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      const { user } = await authService.signIn(credentials);
      setUser(user);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (credentials: SignupCredentials) => {
    try {
      setLoading(true);
      const result = await authService.signUp(credentials);
      
      if (result.needsEmailVerification) {
        setLoading(false);
        throw new Error('Please check your email to verify your account before signing in.');
      }
      
      // If no email verification needed, they're logged in
      if (result.user) {
        const profile = await authService.getProfile(result.user.id);
        setUser({
          id: result.user.id,
          email: result.user.email!,
          username: profile?.username,
          profile,
        });
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!user?.id) return;
    
    try {
      const profile = await authService.getProfile(user.id);
      setUser({
        ...user,
        profile,
        username: profile?.username,
      });
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await authService.resetPassword(email);
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}