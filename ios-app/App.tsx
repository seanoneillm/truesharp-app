// Critical polyfills must be imported first
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';

// Make Buffer available globally for SharpSports SDK
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState, useRef, useCallback } from 'react'
// import 'react-native-gesture-handler' // Removed due to iOS pod conflicts
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { View, Image, Animated, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import * as SplashScreen from 'expo-splash-screen'
import * as Linking from 'expo-linking'
import { NavigationContainerRef } from '@react-navigation/native'

import { AuthProvider } from './src/contexts/AuthContext'
import { SubscriptionProvider } from './src/contexts/SubscriptionContext'
import { AppStateProvider } from './src/contexts/AppStateContext'
import RootNavigator from './src/navigation/RootNavigator'
import { pushNotificationService } from './src/services/pushNotificationService'
import { theme } from './src/styles/theme'
import SessionManager from './src/components/common/SessionManager'

const LoadingScreen = () => {
  const fadeValue = new Animated.Value(0)
  const scaleValue = new Animated.Value(0.9)

  useEffect(() => {
    const animate = () => {
      Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(fadeValue, {
              toValue: 1,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(fadeValue, {
              toValue: 0.4,
              duration: 1200,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleValue, {
              toValue: 1,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(scaleValue, {
              toValue: 0.95,
              duration: 1200,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start()
    }
    animate()
  }, [fadeValue, scaleValue])

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.surface, theme.colors.surfaceSecondary]}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      locations={[0, 0.7, 1]}
    >
      <View style={{ alignItems: 'center' }}>
        <Image 
          source={require('./assets/truesharp-logo.png')} 
          style={{ 
            width: 160, 
            height: 160, 
            marginBottom: 40,
            ...theme.shadows.lg,
            shadowColor: theme.colors.primary
          }}
          resizeMode="contain"
        />
        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
          <Animated.Text 
            style={{ 
              fontSize: theme.typography.fontSize['3xl'], 
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.primary,
              opacity: fadeValue,
              letterSpacing: 1,
              textAlign: 'center'
            }}
          >
            TrueSharp
          </Animated.Text>
        </Animated.View>
        <View style={{
          marginTop: 20,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {[0, 1, 2].map((index) => (
            <LoadingDot key={index} delay={index * 200} />
          ))}
        </View>
      </View>
    </LinearGradient>
  )
}

const LoadingDot = ({ delay }: { delay: number }) => {
  const animValue = new Animated.Value(0)

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start()
    }
    animate()
  }, [animValue, delay])

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  })

  const scale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.2],
  })

  return (
    <Animated.View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary,
        marginHorizontal: 4,
        opacity,
        transform: [{ scale }],
      }}
    />
  )
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true)
  const navigationRef = useRef<NavigationContainerRef<any> | null>(null)

  const handleDeepLink = useCallback((url: string) => {

    const parsed = Linking.parse(url)
    const { hostname, path, queryParams } = parsed

    if (hostname === 'subscriptions' || path === '/subscriptions') {
      const strategyId = queryParams?.strategy

      // Navigate to subscriptions tab
      if (navigationRef.current?.isReady()) {
        navigationRef.current.navigate('Main', {
          screen: 'Tabs',
          params: {
            screen: 'Subscriptions',
            params: strategyId ? { strategyId } : undefined
          }
        })
      }
    }
  }, [])

  const handleNotificationResponse = useCallback((response: { notification: { request: { content: { data?: Record<string, any> } } } }) => {

    // Handle notification tap based on type
    const { type, deepLink, strategyId } = response.notification.request.content.data || {}

    if (type === 'strategy_bets') {
      if (deepLink) {
        handleDeepLink(deepLink)
      } else if (strategyId) {
        // Fallback navigation
        handleDeepLink(`truesharp://subscriptions?strategy=${strategyId}`)
      }
    }
  }, [handleDeepLink])

  useEffect(() => {
    // Hide the native splash screen immediately
    SplashScreen.hideAsync()
    
    // ✅ Confirm PassKit removal for App Store compliance
    // PassKit fully removed. StoreKit verified as sole payment framework.
    
    // Set up notification response listeners
    const responseListener = pushNotificationService.addNotificationResponseListener(handleNotificationResponse)

    const receivedListener = pushNotificationService.addNotificationReceivedListener(
      () => {
        // Notification received while app in foreground
      }
    )

    // Handle deep links when app is already open
    const linkingListener = Linking.addEventListener('url', (event: { url: string }) => {
      handleDeepLink(event.url)
    })

    // Handle deep links when app is opened from closed state
    Linking.getInitialURL().then((url: string | null) => {
      if (url) {
        handleDeepLink(url)
      }
    })

    // Simulate loading time
    setTimeout(() => {
      setIsLoading(false)
    }, 3000)

    return () => {
      responseListener.remove()
      receivedListener.remove()
      linkingListener.remove()
    }
  }, [handleDeepLink, handleNotificationResponse])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <AppStateProvider>
            <SessionManager />
            <RootNavigator navigationRef={navigationRef} />
            <StatusBar style="dark" />
          </AppStateProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
