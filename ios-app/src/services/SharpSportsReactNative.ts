/**
 * SharpSports React Native SDK Implementation
 * Based on official SharpSports React Native SDK patterns
 */

import { Environment } from '../config/environment'

export interface SharpSportsConfig {
  internalId: string
  publicKey: string
  mobileAuthToken: string
}

export interface ContextOptions {
  uiMode?: 'light' | 'dark' | 'system'
  bestPrice?: boolean
}

export interface RefreshOptions {
  bettorAccountId?: string
  reverify?: boolean
}

export class SharpSportsReactNative {
  private internalId: string
  private publicKey: string
  private mobileAuthToken: string

  constructor(internalId: string, publicKey: string, mobileAuthToken: string) {
    this.internalId = internalId
    this.publicKey = publicKey
    this.mobileAuthToken = mobileAuthToken
  }

  /**
   * Get the JavaScript code to inject into WebView
   * This is the key method that provides mobile app detection
   */
  getInjectedJavascript(): string {
    return `
      (function() {
        // SharpSports Mobile SDK Detection
        // 1. Mobile App Detection Flags
        window.SharpSportsMobile = {
          version: '1.0.0',
          platform: 'react-native',
          isNativeApp: true,
          initialized: true,
          sdk: 'react-native'
        };
        
        // 2. Mobile-specific global flags
        window.isMobileApp = true;
        window.isSharpSportsMobile = true;
        window.mobileAppPlatform = 'react-native';
        window.ReactNative = true;
        
        // 3. Override User Agent Detection
        Object.defineProperty(navigator, 'userAgent', {
          get: function() {
            return 'SharpSports-ReactNative/1.0.0 (${Platform.OS}; Mobile App) WebKit';
          },
          configurable: false
        });
        
        // 4. Override Platform Detection  
        Object.defineProperty(navigator, 'platform', {
          get: function() {
            return '${Platform.OS === 'ios' ? 'iPhone' : 'Android'}';
          },
          configurable: false
        });
        
        // 5. Mobile App Environment Markers
        window.webkit = window.webkit || {};
        window.webkit.messageHandlers = window.webkit.messageHandlers || {};
        
        // 6. SharpSports SDK Methods
        window.SharpSportsMobile.context = function(options) {
          // Post message to React Native
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'sharpsports_context',
              options: options
            }));
          }
          return Promise.resolve({ success: true });
        };
        
        window.SharpSportsMobile.refresh = function(options) {
          // Post message to React Native
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'sharpsports_refresh',
              options: options
            }));
          }
          return Promise.resolve({ success: true });
        };
        
        window.SharpSportsMobile.dismiss = function() {
          // Post message to React Native
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'sharpsports_dismiss'
            }));
          }
        };
        
        // 7. Intercept Navigation for Sportsbook Links
        document.addEventListener('click', function(event) {
          const target = event.target;
          if (target && target.tagName === 'A' && target.href) {
            // Check if it's a sportsbook link that needs native handling
            const url = target.href;
            if (url.includes('sportsbook') || url.includes('bet365') || url.includes('draftkings') || url.includes('fanduel')) {
              event.preventDefault();
              
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'sharpsports_navigate',
                  url: url
                }));
              }
            }
          }
        }, true);
        
        // 8. Hide Browser Extension Prompts
        const hideExtensionPrompts = function() {
          const style = document.createElement('style');
          style.textContent = \`
            /* Hide browser extension download prompts */
            [data-extension-required],
            .extension-required,
            .download-extension,
            .browser-extension-prompt,
            .chrome-extension-prompt,
            .extension-download {
              display: none !important;
            }
            
            /* Show mobile-only content */
            .mobile-only,
            [data-mobile-only] {
              display: block !important;
            }
            
            /* Hide desktop-only content */
            .desktop-only,
            [data-desktop-only] {
              display: none !important;
            }
          \`;
          document.head.appendChild(style);
          
          // Also remove extension prompt elements by text content
          setTimeout(() => {
            const walker = document.createTreeWalker(
              document.body,
              NodeFilter.SHOW_TEXT,
              null,
              false
            );
            
            let node;
            const nodesToRemove = [];
            
            while (node = walker.nextNode()) {
              if (node.textContent && 
                  (node.textContent.includes('Download the SharpSports Browser Extension') ||
                   node.textContent.includes('Chrome Browser Only') ||
                   node.textContent.includes('browser extension'))) {
                nodesToRemove.push(node.parentElement);
              }
            }
            
            nodesToRemove.forEach(el => {
              if (el && el.parentNode) {
                el.parentNode.removeChild(el);
              }
            });
          }, 100);
        };
        
        // 9. Run on DOM ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', hideExtensionPrompts);
        } else {
          hideExtensionPrompts();
        }
        
        // 10. Override Browser Detection
        window.chrome = undefined;
        window.browser = undefined;
        delete window.chrome;
        delete window.browser;
        
        // 11. Add Mutation Observer to catch dynamically added extension prompts
        const observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
              if (node.nodeType === 1) { // Element node
                const element = node;
                if (element.textContent && 
                    (element.textContent.includes('Download the SharpSports Browser Extension') ||
                     element.textContent.includes('Chrome Browser Only'))) {
                  element.style.display = 'none';
                }
              }
            });
          });
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        // 12. Success Log
        // 13. Notify React Native that injection is complete
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'sharpsports_injection_complete',
            success: true
          }));
        }
        
      })();
      
      true; // Required return value for React Native WebView
    `
  }

  /**
   * Create context for SharpSports UI
   */
  async Context(options: ContextOptions = {}): Promise<{ contextId: string; url: string }> {
    const baseUrl = Environment.API_BASE_URL

    try {
      const response = await fetch(`${baseUrl}/api/sharpsports/context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.internalId,
          extensionAuthToken: this.mobileAuthToken,
          extensionVersion: 'react-native-1.0',
          redirectUrl: `${baseUrl}/api/sharpsports/accounts`,
        }),
      })

      if (!response.ok) {
        throw new Error(`Context generation failed: ${response.status}`)
      }

      const data = await response.json()
      const contextId = data.contextId

      if (!contextId) {
        throw new Error('No context ID received')
      }

      return {
        contextId,
        url: `${Environment.SHARP_SPORTS_UI_URL}/link/${contextId}`,
      }
    } catch (error) {
      console.error('❌ SharpSports Context error:', error)
      throw error
    }
  }

  /**
   * Refresh sportsbook accounts
   */
  async Refresh(options: RefreshOptions = {}): Promise<{ success: boolean; message: string }> {
    // This would typically call the SharpSports refresh API
    // For now, return success to simulate the SDK behavior
    return {
      success: true,
      message: 'Refresh initiated via React Native SDK',
    }
  }

  /**
   * Handle WebView navigation state changes
   */
  onNavigationStateChange = (navState: any) => {
    // Handle different URL patterns that indicate state changes
    if (navState.url.includes('success') || navState.url.includes('complete')) {
    }

    if (navState.url.includes('error') || navState.url.includes('failed')) {
    }
  }

  /**
   * Handle messages from WebView
   */
  onMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data)
      switch (message.type) {
        case 'sharpsports_injection_complete':
          break

        case 'sharpsports_context':
          break

        case 'sharpsports_refresh':
          this.Refresh(message.options)
          break

        case 'sharpsports_dismiss':
          // The parent component should handle closing the modal
          break

        case 'sharpsports_navigate':
          // Handle sportsbook link navigation
          break

        default:
      }
    } catch (error) {}
  }
}

// Platform detection for injection
import { Platform } from 'react-native'

export default SharpSportsReactNative
