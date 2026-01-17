import { supabase, Profile } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleanupSubscriptionForAccountDeletion } from '../services/modern-storekit';
import { Platform } from 'react-native';

export interface AuthUser {
  id: string;
  email: string;
  username?: string | null;
  profile?: Profile | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupCredentials {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  verifyAge: boolean;
  creatorCode?: string;
}

// Authentication functions
export const authService = {
  // Login user
  async signIn({ email, password, rememberMe }: LoginCredentials) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Store remember me preference
      if (rememberMe) {
        await AsyncStorage.setItem('rememberMe', 'true');
      } else {
        await AsyncStorage.removeItem('rememberMe');
      }

      // Get user profile
      const profile = await this.getProfile(data.user.id);

      return {
        user: {
          id: data.user.id,
          email: data.user.email!,
          username: profile?.username,
          profile,
        } as AuthUser,
        session: data.session,
      };
    } catch (error) {
      throw error;
    }
  },

  // Sign up user
  async signUp({ email, username, password, confirmPassword, agreeToTerms, agreeToPrivacy, verifyAge, creatorCode }: SignupCredentials) {
    try {
      // Validation
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (!agreeToTerms || !agreeToPrivacy) {
        throw new Error('You must agree to the Terms of Service and Privacy Policy');
      }
      if (!verifyAge) {
        throw new Error('You must be 21 or older to use this service');
      }
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Validate creator code if provided
      let validatedCreatorCode: string | null = null;
      if (creatorCode && creatorCode.trim()) {
        try {
          const { Environment } = await import('../config/environment');
          const codeValidation = await fetch(`${Environment.API_BASE_URL}/api/creator-codes/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: creatorCode.trim() }),
          });

          if (!codeValidation.ok) {
            console.error('Creator code validation failed with status:', codeValidation.status);
            throw new Error('Invalid creator code');
          }

          const responseText = await codeValidation.text();
          if (!responseText) {
            throw new Error('Invalid creator code');
          }

          const codeResult = JSON.parse(responseText);
          if (!codeResult.valid) {
            throw new Error(codeResult.error || 'Invalid creator code');
          }
          validatedCreatorCode = codeResult.code; // Use canonical uppercase version
        } catch (error) {
          console.error('Creator code validation error:', error);
          throw new Error('Invalid creator code');
        }
      }

      // Check if username is available (using lowercase like web app)
      const { data: existingProfile, error: usernameCheckError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .maybeSingle(); // Use maybeSingle to avoid error if no results

      if (usernameCheckError && usernameCheckError.code !== 'PGRST116') {
        console.error('Username check error:', usernameCheckError);
        throw new Error('Database error checking username');
      }

      if (existingProfile) {
        throw new Error('Username is already taken');
      }

      // Create auth user (matching web app format exactly)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.toLowerCase(), // Store lowercase in metadata for trigger
            display_name: username, // Keep original case for display
          },
        },
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error('Signup failed - no user created');
      }

      // Profile creation is handled by database trigger automatically
      // But let's verify it exists for immediate signups and handle edge cases
      if (data.session) {
        // User is immediately logged in, profile should be created by trigger
        // Give the trigger a moment to execute, then verify profile exists and grant pro if creator code
        setTimeout(async () => {
          try {
            const profile = await this.getProfile(data.user.id);
            if (!profile) {
              await this.createProfile(data.user.id);
            }
            // Grant free Pro month if creator code was provided
            if (validatedCreatorCode) {
              const { Environment } = await import('../config/environment');
              const grantResponse = await fetch(`${Environment.API_BASE_URL}/api/creator-codes/grant-pro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  user_id: data.user.id,
                  creator_code: validatedCreatorCode
                }),
              });
              const grantResult = await grantResponse.json();
              if (grantResult.success) {
                console.log('✅ Free Pro month granted via creator code');
              } else {
                console.error('❌ Failed to grant Pro:', grantResult.error);
              }
            }
          } catch (error) {
            console.error('Profile verification failed:', error);
          }
        }, 1000);
      } else {
        // Email verification required - profile will be created by trigger after verification
      }

      return {
        user: data.user,
        session: data.session,
        needsEmailVerification: false,
      };
    } catch (error) {
      throw error;
    }
  },

  // Sign out user
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear AsyncStorage
      await AsyncStorage.multiRemove(['rememberMe', 'userSession']);
    } catch (error) {
      throw error;
    }
  },

  // Get current session
  async getSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const profile = await this.getProfile(session.user.id);
        return {
          user: {
            id: session.user.id,
            email: session.user.email!,
            username: profile?.username,
            profile,
          } as AuthUser,
          session,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  // Get user profile
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile doesn't exist, try to create it
        if (error.code === 'PGRST116') {
          return await this.createProfile(userId);
        }
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  },

  // Create user profile (matching web app exactly)
  async createProfile(userId: string): Promise<Profile | null> {
    try {
      // Get user data from auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || user.id !== userId) {
        console.error('Cannot create profile: user not authenticated');
        return null;
      }

      // Extract username from user metadata or email (use lowercase like web app)
      const username = user.user_metadata?.username || 
                      user.email?.split('@')[0] || 
                      `user_${userId.slice(-8)}`;

      // Match web app profile creation exactly
      const profileData = {
        id: userId,
        username: username.toLowerCase(), // Force lowercase like web app
        email: user.email,
        // Let other fields use their defaults from the database
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  },

  // Reset password
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'truesharp://reset-password',
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  // Update password
  async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  // Check if user is remembered
  async isRemembered(): Promise<boolean> {
    try {
      const rememberMe = await AsyncStorage.getItem('rememberMe');
      return rememberMe === 'true';
    } catch {
      return false;
    }
  },

  // Delete user account (including subscription cleanup)
  async deleteAccount(): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token || !session?.user?.id) {
        throw new Error('User not authenticated');
      }

      // Call the delete account API endpoint
      const { Environment } = await import('../config/environment')
      const response = await fetch(`${Environment.API_BASE_URL}/api/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: session.user.id,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to delete account');
      }

      // Clean up StoreKit subscription data (iOS only)
      if (Platform.OS === 'ios') {
        await cleanupSubscriptionForAccountDeletion(session.user.id);
      }

      // Clear local storage after successful deletion
      await AsyncStorage.multiRemove(['rememberMe', 'userSession']);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete account';
      console.error('❌ Account deletion failed:', errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  },
};

// Auth state listener
export const subscribeToAuthChanges = (callback: (user: AuthUser | null) => void) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const profile = await authService.getProfile(session.user.id);
      const user: AuthUser = {
        id: session.user.id,
        email: session.user.email!,
        username: profile?.username,
        profile,
      };
      callback(user);
    } else {
      callback(null);
    }
  });
};