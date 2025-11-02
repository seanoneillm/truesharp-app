import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Configure notifications behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class PushNotificationService {
  private static instance: PushNotificationService;
  private pushToken: string | null = null;
  private tokenEnvironment: 'development' | 'production' = 'development';

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Determine the push token environment based on build type
   */
  private getPushTokenEnvironment(): 'development' | 'production' {
    // In Expo Go, we're always in development
    if (Constants.appOwnership === 'expo') {
      return 'development';
    }

    // In TestFlight or production builds, we're in production
    // Check if it's a development build vs production build
    if (__DEV__) {
      return 'development';
    }

    return 'production';
  }

  /**
   * Request permissions and register for push notifications
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        return null;
      }
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return null;
      }
      // Get push token with proper project configuration for TestFlight/production
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      
      const token = tokenData.data;
      this.pushToken = token;
      this.tokenEnvironment = this.getPushTokenEnvironment();
      // Save token to user profile
      const saveResult = await this.savePushTokenToProfile(token);
      if (!saveResult) {
        console.error('📱 Failed to save push token to profile, but token was generated');
      }

      return token;
    } catch (error) {
      console.error('📱 Error registering for push notifications:', error);
      
      // Log specific error types
      if (error instanceof Error) {
        if (error.message.includes('ExponentPushToken')) {
          console.error('📱 Expo push token error - check project configuration');
        } else if (error.message.includes('permission')) {
          console.error('📱 Permission error - user may have denied notifications');
        } else if (error.message.includes('network')) {
          console.error('📱 Network error - check internet connection');
        }
      }
      
      return null;
    }
  }

  /**
   * Save push token to user profile in Supabase
   */
  private async savePushTokenToProfile(token: string): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('📱 Auth error while saving push token:', authError);
        return false;
      }
      
      if (!user) {
        console.error('📱 No authenticated user to save push token for');
        return false;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          expo_push_token: token,
          notifications_enabled: true,
          push_token_environment: this.tokenEnvironment
        })
        .eq('id', user.id);

      if (error) {
        console.error('📱 Error saving push token to profile:', error);
        
        // Log specific database errors
        if (error.code === 'PGRST116') {
          console.error('📱 Profile not found for user - may need to create profile first');
        } else if (error.code === '23505') {
          console.error('📱 Duplicate push token constraint violation');
        } else if (error.message.includes('RLS')) {
          console.error('📱 Row Level Security policy preventing push token update');
        }
        
        return false;
      } else {
        return true;
      }
    } catch (error) {
      console.error('📱 Unexpected error in savePushTokenToProfile:', error);
      return false;
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationSettings(enabled: boolean): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user to update notification settings for');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ notifications_enabled: enabled })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating notification settings:', error);
      } else {
      }
    } catch (error) {
      console.error('Error in updateNotificationSettings:', error);
    }
  }

  /**
   * Handle notification taps
   */
  addNotificationResponseListener(handler: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(handler);
  }

  /**
   * Handle notifications received while app is in foreground
   */
  addNotificationReceivedListener(handler: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(handler);
  }

  /**
   * Get current push token
   */
  getCurrentPushToken(): string | null {
    return this.pushToken;
  }

  /**
   * Clear push token from profile (on logout)
   */
  async clearPushToken(): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
      }
      
      if (!user) {
        this.pushToken = null;
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ expo_push_token: null })
        .eq('id', user.id);

      if (error) {
        console.error('📱 Error clearing push token from profile:', error);
        // Still clear local token even if database update fails
      } else {
      }

      this.pushToken = null;
      this.tokenEnvironment = 'development'; // Reset to default
    } catch (error) {
      console.error('📱 Unexpected error in clearPushToken:', error);
      // Always clear local token
      this.pushToken = null;
    }
  }
}

export const pushNotificationService = PushNotificationService.getInstance();