import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TabParamList } from '../types';
import { theme } from '../styles/theme';

import DashboardScreen from '../screens/main/DashboardScreen';
import AnalyticsScreen from '../screens/main/AnalyticsScreen';
import GamesScreen from '../screens/main/GamesScreen';
import MarketplaceScreen from '../screens/main/MarketplaceScreen';
import SellScreen from '../screens/main/SellScreen';
import SubscriptionsScreen from '../screens/main/SubscriptionsScreen';

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
            let iconName: string;

            switch (route.name) {
              case 'Dashboard':
                iconName = focused ? 'home' : 'home-outline';
                break;
              case 'Analytics':
                iconName = focused ? 'analytics' : 'analytics-outline';
                break;
              case 'Games':
                iconName = focused ? 'trophy' : 'trophy-outline';
                break;
              case 'Marketplace':
                iconName = focused ? 'storefront' : 'storefront-outline';
                break;
              case 'Sell':
                iconName = focused ? 'cash' : 'cash-outline';
                break;
              case 'Subscriptions':
                iconName = focused ? 'card' : 'card-outline';
                break;
              default:
                iconName = 'ellipse-outline';
            }

            return <Ionicons name={iconName as any} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.text.light,
          tabBarStyle: {
            backgroundColor: theme.colors.card,
            borderTopColor: theme.colors.border,
            borderTopWidth: 1,
            paddingBottom: Platform.OS === 'ios' ? 20 : 8,
            paddingTop: 8,
            height: Platform.OS === 'ios' ? 88 : 64,
            ...theme.shadows.sm,
          },
          tabBarLabelStyle: {
            fontSize: theme.typography.fontSize.xs,
            fontWeight: theme.typography.fontWeight.medium,
          },
        })}
      >
        <Tab.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{ tabBarLabel: 'Home' }}
        />
        <Tab.Screen 
          name="Analytics" 
          component={AnalyticsScreen}
          options={{ tabBarLabel: 'Stats' }}
        />
        <Tab.Screen name="Games" component={GamesScreen} />
        <Tab.Screen 
          name="Marketplace" 
          component={MarketplaceScreen}
          options={{ tabBarLabel: 'Market' }}
        />
        <Tab.Screen name="Sell" component={SellScreen} />
        <Tab.Screen 
          name="Subscriptions" 
          component={SubscriptionsScreen}
          options={{ tabBarLabel: 'Subs' }}
        />
      </Tab.Navigator>
  );
}