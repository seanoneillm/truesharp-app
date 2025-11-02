import { NativeModules, NativeEventEmitter, EmitterSubscription } from 'react-native';
import { Environment } from '../config/environment';

interface SharpSportsModuleInterface {
  initializeWithKeys(
    publicKey: string,
    mobileAuthToken: string,
    internalId: string
  ): Promise<{
    success: boolean;
    message: string;
  }>;

  getContext(uiMode?: string): Promise<{
    success: boolean;
    contextId: string;
    url: string;
    isMock?: boolean;
  }>;

  presentWebView(url: string): Promise<{
    success: boolean;
    message: string;
  }>;

  refresh(
    bettorId?: string,
    bettorAccountId?: string,
    reverify?: boolean
  ): Promise<{
    success: boolean;
    message: string;
    isMock?: boolean;
  }>;

  dismissWebView(): Promise<{
    success: boolean;
    message: string;
  }>;
}

// React Native bridge to native SharpSports SDK
const { SharpSportsModule } = NativeModules;

// Check if native module is available (won't be in Expo Go)
const isNativeModuleAvailable = !!SharpSportsModule;

if (!isNativeModuleAvailable && __DEV__) {
}

// Create fallback module if native module isn't available
const createFallbackModule = (): SharpSportsModuleInterface => {
  // Store auth data for later use
  let storedAuthToken: string | null = null;
  let storedUserId: string | null = null;

  return {
    async initializeWithKeys(publicKey: string, mobileAuthToken: string, internalId: string) {
      // Store for context generation
      storedAuthToken = mobileAuthToken;
      storedUserId = internalId;
      
      return {
        success: true,
        message: 'SharpSports SDK initialized (fallback mode - native features require development build)'
      };
    },

    async getContext(uiMode?: string) {
      try {
        const baseUrl = Environment.API_BASE_URL;
        
        if (!storedAuthToken || !storedUserId) {
          throw new Error('SDK not initialized - no auth token or user ID');
        }

        // Call the real backend context API
        const response = await fetch(`${baseUrl}/api/sharpsports/context`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: storedUserId,
            extensionAuthToken: storedAuthToken, // Use as extension token for compatibility
            extensionVersion: 'ios-mobile-1.0',
            redirectUrl: `${baseUrl}/api/sharpsports/accounts`,
          }),
        });

        if (!response.ok) {
          throw new Error(`Context API failed: ${response.status}`);
        }

        const contextData = await response.json();
        const contextId = contextData.contextId;

        if (!contextId) {
          throw new Error('No context ID received from backend');
        }
        return {
          success: true,
          contextId: contextId,
          url: `${Environment.SHARP_SPORTS_UI_URL}/link/${contextId}`,
          isMock: false // This is actually real!
        };
      } catch (error) {
        console.error('❌ Fallback context generation failed:', error);
        throw error;
      }
    },

    async presentWebView(url: string) {
    // In Expo Go, we can't present native WebView, so we return false to trigger React Native modal
    return {
      success: false,
      message: 'Native WebView not available in Expo Go. Using React Native modal fallback.'
    };
  },

    async refresh(bettorId?: string, bettorAccountId?: string, reverify?: boolean) {
    return {
      success: true,
      message: 'Accounts refresh simulated (fallback mode)',
      isMock: true
    };
  },

    async dismissWebView() {
    return {
      success: true,
      message: 'WebView dismiss simulated (fallback mode)'
    };
  }
  };
};

const sharpSportsModule: SharpSportsModuleInterface = isNativeModuleAvailable 
  ? SharpSportsModule 
  : createFallbackModule();

// Event emitter for SDK events (only if native module is available)
const sharpSportsEventEmitter = isNativeModuleAvailable 
  ? new NativeEventEmitter(SharpSportsModule)
  : null;

export interface SharpSportsEventListeners {
  onReady?: (data: { success: boolean; message: string }) => void;
  onError?: (data: { error: string }) => void;
  onWebViewWillLoad?: () => void;
  onWebViewDidFinishLoading?: () => void;
  onPresentViewController?: () => void;
  onDismissWebView?: (data: { userInitiated: boolean }) => void;
  onVerificationSuccess?: () => void;
  onLinkingFailed?: (data: { error: string }) => void;
}

export class SharpSportsSDK {
  private static instance: SharpSportsSDK;
  private eventSubscriptions: EmitterSubscription[] = [];
  private isInitialized = false;
  private authToken: string | null = null;
  private userId: string | null = null;

  private constructor() {}

  static getInstance(): SharpSportsSDK {
    if (!SharpSportsSDK.instance) {
      SharpSportsSDK.instance = new SharpSportsSDK();
    }
    return SharpSportsSDK.instance;
  }

  /**
   * Initialize the SharpSports SDK with authentication keys
   */
  async initialize(
    publicKey: string,
    mobileAuthToken: string,
    internalId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await sharpSportsModule.initializeWithKeys(
        publicKey,
        mobileAuthToken,
        internalId
      );

      if (result.success) {
        this.isInitialized = true;
        this.authToken = mobileAuthToken;
        this.userId = internalId;
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to initialize SharpSports SDK:', error);
      throw error;
    }
  }

  /**
   * Get context ID for SharpSports UI
   */
  async getContext(uiMode: 'light' | 'dark' | 'system' = 'system'): Promise<{
    success: boolean;
    contextId: string;
    url: string;
    isMock?: boolean;
  }> {
    if (!this.isInitialized) {
      throw new Error('SharpSports SDK not initialized. Call initialize() first.');
    }

    try {
      const result = await sharpSportsModule.getContext(uiMode);
      
      if (result.success) {
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to get context:', error);
      throw error;
    }
  }

  /**
   * Present SharpSports portal in native WebView
   */
  async presentPortal(url: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await sharpSportsModule.presentWebView(url);
      
      if (result.success) {
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to present portal:', error);
      throw error;
    }
  }

  /**
   * Refresh SharpSports accounts
   */
  async refresh(options: {
    bettorId?: string;
    bettorAccountId?: string;
    reverify?: boolean;
  } = {}): Promise<{ success: boolean; message: string; isMock?: boolean }> {
    if (!this.isInitialized) {
      throw new Error('SharpSports SDK not initialized. Call initialize() first.');
    }

    try {
      const result = await sharpSportsModule.refresh(
        options.bettorId,
        options.bettorAccountId,
        options.reverify || false
      );
      
      if (result.success) {
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to refresh accounts:', error);
      throw error;
    }
  }

  /**
   * Dismiss the SharpSports portal
   */
  async dismissPortal(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await sharpSportsModule.dismissWebView();
      
      if (result.success) {
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to dismiss portal:', error);
      throw error;
    }
  }

  /**
   * Add event listeners for SDK events
   */
  addEventListener(listeners: SharpSportsEventListeners) {
    // Clear existing subscriptions
    this.removeAllEventListeners();

    if (!sharpSportsEventEmitter) {
      // Simulate onReady event for fallback mode
      if (listeners.onReady) {
        setTimeout(() => {
          listeners.onReady?.({
            success: true,
            message: 'Fallback mode active - native events not available'
          });
        }, 100);
      }
      return;
    }

    if (listeners.onReady) {
      this.eventSubscriptions.push(
        sharpSportsEventEmitter.addListener('onSharpSportsReady', listeners.onReady)
      );
    }

    if (listeners.onError) {
      this.eventSubscriptions.push(
        sharpSportsEventEmitter.addListener('onSharpSportsError', listeners.onError)
      );
    }

    if (listeners.onWebViewWillLoad) {
      this.eventSubscriptions.push(
        sharpSportsEventEmitter.addListener('onWebViewWillLoad', listeners.onWebViewWillLoad)
      );
    }

    if (listeners.onWebViewDidFinishLoading) {
      this.eventSubscriptions.push(
        sharpSportsEventEmitter.addListener('onWebViewDidFinishLoading', listeners.onWebViewDidFinishLoading)
      );
    }

    if (listeners.onPresentViewController) {
      this.eventSubscriptions.push(
        sharpSportsEventEmitter.addListener('onPresentViewController', listeners.onPresentViewController)
      );
    }

    if (listeners.onDismissWebView) {
      this.eventSubscriptions.push(
        sharpSportsEventEmitter.addListener('onDismissWebView', listeners.onDismissWebView)
      );
    }

    if (listeners.onVerificationSuccess) {
      this.eventSubscriptions.push(
        sharpSportsEventEmitter.addListener('onVerificationSuccess', listeners.onVerificationSuccess)
      );
    }

    if (listeners.onLinkingFailed) {
      this.eventSubscriptions.push(
        sharpSportsEventEmitter.addListener('onLinkingFailed', listeners.onLinkingFailed)
      );
    }
  }

  /**
   * Remove all event listeners
   */
  removeAllEventListeners() {
    this.eventSubscriptions.forEach(subscription => subscription.remove());
    this.eventSubscriptions = [];
  }

  /**
   * Check if SDK is initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const sharpSportsSDK = SharpSportsSDK.getInstance();
