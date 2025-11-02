import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MainStackParamList } from '../types';

import TabNavigator from './TabNavigator';
import TopHeader from '../components/common/TopHeader';
import SettingsScreen from '../screens/main/SettingsScreen';
import HelpScreen from '../screens/main/HelpScreen';
import FeedbackScreen from '../screens/main/FeedbackScreen';

const Stack = createStackNavigator<MainStackParamList>();

export default function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        header: () => <TopHeader />,
        cardStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
    </Stack.Navigator>
  );
}