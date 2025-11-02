import { Ionicons } from '@expo/vector-icons'
import React, { useRef } from 'react'
import { Alert, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { Environment } from '../../config/environment'
import { theme } from '../../styles/theme'

interface StripeConnectBrowserProps {
  visible: boolean
  url: string | null
  onClose: () => void
}

export default function StripeConnectBrowser({ visible, url, onClose }: StripeConnectBrowserProps) {
  const webViewRef = useRef<WebView>(null)
  const hasShownCompletionAlert = useRef(false)

  const handleNavigationStateChange = (navState: any) => {
    // Check if user completed Stripe onboarding or is returning to our app
    if (
      navState.url.includes('truesharp.io') ||
      navState.url.includes('localhost') ||
      navState.url.includes(Environment.API_BASE_URL)
    ) {
      if (!hasShownCompletionAlert.current) {
        hasShownCompletionAlert.current = true
        Alert.alert(
          'Account Updated',
          'Your Stripe Connect account has been updated successfully.',
          [
            {
              text: 'Close',
              onPress: onClose,
            },
          ]
        )
      }
    }
  }

  const handleError = (error: any) => {
    console.error('WebView error:', error)
    Alert.alert('Loading Error', 'Failed to load the page. Please try again.', [
      { text: 'Retry', onPress: () => webViewRef.current?.reload() },
      { text: 'Close', onPress: onClose },
    ])
  }

  const handleClose = () => {
    hasShownCompletionAlert.current = false
    onClose()
  }

  if (!url) return null

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleClose}
              accessibilityLabel="Close browser"
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Stripe Connect
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Account Management
            </Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => webViewRef.current?.goBack()}
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* WebView */}
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          onError={handleError}
          startInLoadingState={true}
          allowsBackForwardNavigationGestures={true}
          decelerationRate="normal"
          domStorageEnabled={true}
          javaScriptEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="compatibility"
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          // Allow Stripe to handle authentication and redirects
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
        />

        {/* Footer with additional controls */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => webViewRef.current?.reload()}
            accessibilityLabel="Reload page"
          >
            <Ionicons name="refresh" size={20} color={theme.colors.text.secondary} />
            <Text style={styles.footerButtonText}>Reload</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => webViewRef.current?.goForward()}
            accessibilityLabel="Go forward"
          >
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
            <Text style={styles.footerButtonText}>Forward</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.footerButton}
            onPress={handleClose}
            accessibilityLabel="Done"
          >
            <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
            <Text style={[styles.footerButtonText, { color: theme.colors.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    minHeight: 60,
  },
  headerLeft: {
    width: 50,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  headerRight: {
    width: 50,
    alignItems: 'flex-end',
  },
  headerButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  disabledButton: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
  webview: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  footerButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  footerButtonText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  disabledText: {
    color: theme.colors.text.light,
  },
})
