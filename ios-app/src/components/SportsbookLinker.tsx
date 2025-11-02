import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import SharpSports from '@sharpsports/sharpsports-mobile';
import { Environment, SHARPSPORTS_PUBLIC_KEY } from '../config/environment';
import { theme } from '../styles/theme';

interface SportsbookLinkerProps {
  internalId: string;
  onLinkingComplete?: () => void;
}

const SportsbookLinker: React.FC<SportsbookLinkerProps> = ({ 
  internalId, 
  onLinkingComplete 
}) => {
  const [mobileAuthToken, setMobileAuthToken] = useState<string | null>(null);
  const [sharpsports, setSharpSports] = useState<SharpSports | null>(null);
  const [webviewUrl, setWebviewUrl] = useState<string | null>(null);
  const [cid, setCid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch mobile auth token from backend
  useEffect(() => {
    const fetchMobileAuthToken = async () => {
      try {
        const response = await fetch(`${Environment.API_BASE_URL}/api/sharpsports/mobile-auth-token?userId=${internalId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to get mobile auth token: ${response.status}`);
        }

        const { mobileAuthToken: token } = await response.json();
        setMobileAuthToken(token);
      } catch (err) {
        console.error('Failed to fetch mobile auth token:', err);
        setError(err instanceof Error ? err.message : 'Failed to authenticate');
      }
    };

    fetchMobileAuthToken();
  }, [internalId]);

  // Initialize SharpSports with mobile auth token
  useEffect(() => {
    if (mobileAuthToken) {
      try {
        const ss = new SharpSports(internalId, SHARPSPORTS_PUBLIC_KEY, mobileAuthToken);
        setSharpSports(ss);
        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize SharpSports:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize SharpSports');
        setLoading(false);
      }
    }
  }, [mobileAuthToken, internalId]);

  // Auto-open SharpSports UI when component mounts
  useEffect(() => {
    if (sharpsports && !webviewUrl && !error) {
      openSharpSportsUI();
    }
  }, [sharpsports]);

  const openSharpSportsUI = async () => {
    if (!sharpsports) return;

    try {
      const response = await sharpsports.Context({ uiMode: 'system' });
      const data = await response.json();
      setCid(data.cid);
      const url = `https://ui.sharpsports.io/link/${data.cid}`;
      setWebviewUrl(url);
    } catch (err) {
      console.error('Failed to open SharpSports UI:', err);
      setError(err instanceof Error ? err.message : 'Failed to open sportsbook linker');
    }
  };

  const _onMessage = (event: any) => {
    try {
      // Early return if basic requirements not met
      if (!sharpsports || !cid || !event) {
        return;
      }
      
      // Check if nativeEvent exists before accessing it
      const nativeEvent = event.nativeEvent;
      if (!nativeEvent) {
        return;
      }
      
      // Check if data exists before accessing it
      const data = nativeEvent.data;
      if (!data) {
        return;
      }
      
      sharpsports.onMessage(data, cid);
    } catch (error) {
      // Silently ignore message errors to prevent spam
    }
  };

  const _onNavigationStateChange = (event: any) => {
    const { url } = event;
    // Update webview URL for JS injection (required per README)
    setWebviewUrl(url);
    
    // Call SharpSports navigation handler
    if (sharpsports) {
      sharpsports.onNavigationStateChange(event);
    }
    
    // Check if we've reached the completion URL
    if (url && url.includes('https://ui.sharpsports.io/done')) {
      onLinkingComplete?.();
    }
  };

  const handleWebViewError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('❌ SharpSports WebView error:', nativeEvent);
    setError('Failed to load SharpSports portal. Please try again.');
  };

  // Show WebView when URL is available
  if (webviewUrl && sharpsports) {
    return (
      <WebView
        source={{ uri: webviewUrl }}
        injectedJavaScript={sharpsports.getInjectedJavascript()}
        onNavigationStateChange={_onNavigationStateChange}
        onMessage={_onMessage}
        onError={handleWebViewError}
        style={styles.webview}
        thirdPartyCookiesEnabled={true}
        userAgent={sharpsports.getUserAgent()}
        mediaPlaybackRequiresUserAction={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.webviewLoading}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
            <Text style={styles.loadingText}>Loading SharpSports...</Text>
          </View>
        )}
      />
    );
  }

  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={styles.loadingText}>Initializing SharpSports...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Default loading state (shouldn't reach here normally)
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
  webviewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: theme.spacing.lg,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#991B1B',
    fontSize: theme.typography.fontSize.base,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default SportsbookLinker;