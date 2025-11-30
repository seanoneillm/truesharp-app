import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { globalStyles } from '../../styles/globalStyles';
import { adminService } from '../../services/adminService';
import { MainStackParamList } from '../../types';
import UsersTab from '../../components/admin/UsersTab';
import StrategiesTab from '../../components/admin/StrategiesTab';
import MarketingTab from '../../components/admin/MarketingTab';

type NavigationProp = StackNavigationProp<MainStackParamList>;
type TabType = 'users' | 'strategies' | 'marketing';

export default function AdminScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('users');

  useEffect(() => {
    validateAccess();
  }, [user]);

  const validateAccess = async () => {
    try {
      setIsLoading(true);
      
      // Double-check admin access when entering the screen
      const isValidAdmin = await adminService.validateAdminAccess(user);
      
      if (!isValidAdmin) {
        // User is not an admin - show error and navigate back
        Alert.alert(
          'Access Denied',
          'You do not have permission to access this admin area.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
        return;
      }

      setHasAccess(true);
    } catch (error) {
      console.error('Error validating admin access:', error);
      Alert.alert(
        'Error',
        'Failed to validate admin access. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    {
      id: 'users' as TabType,
      title: 'Users',
      icon: 'people-outline',
      activeIcon: 'people',
    },
    {
      id: 'strategies' as TabType,
      title: 'Strategies',
      icon: 'bulb-outline',
      activeIcon: 'bulb',
    },
    {
      id: 'marketing' as TabType,
      title: 'Marketing',
      icon: 'megaphone-outline',
      activeIcon: 'megaphone',
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UsersTab />;
      case 'strategies':
        return <StrategiesTab />;
      case 'marketing':
        return <MarketingTab />;
      default:
        return <UsersTab />;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Validating admin access...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasAccess) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <View style={styles.errorContainer}>
          <Ionicons 
            name="shield-off-outline" 
            size={64} 
            color={theme.colors.status.error} 
          />
          <Text style={styles.errorTitle}>Access Denied</Text>
          <Text style={styles.errorMessage}>
            You do not have permission to access this admin area.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Header with Navigation */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Image 
            source={require('../../assets/truesharp-logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Admin</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.adminBadge}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.status.success} />
            <Text style={styles.adminBadgeText}>Admin</Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton,
                activeTab === tab.id && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={activeTab === tab.id ? tab.activeIcon : tab.icon}
                size={20}
                color={
                  activeTab === tab.id
                    ? theme.colors.primary
                    : theme.colors.text.secondary
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.tabTextActive,
                ]}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    ...globalStyles.body,
    marginTop: theme.spacing.md,
    textAlign: 'center',
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorTitle: {
    ...globalStyles.h2,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    color: theme.colors.status.error,
    textAlign: 'center',
  },
  errorMessage: {
    ...globalStyles.body,
    textAlign: 'center',
    color: theme.colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingTop: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButtonText: {
    fontSize: 16,
    marginLeft: theme.spacing.xs,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    flexShrink: 1,
  },
  logo: {
    width: 28,
    height: 28,
    flexShrink: 0,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.xs,
    borderWidth: 1,
    borderColor: theme.colors.status.success,
  },
  adminBadgeText: {
    fontSize: 11,
    marginLeft: 3,
    color: theme.colors.status.success,
    fontWeight: '600',
  },
  tabContainer: {
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 4,
  },
  tabButtonActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
});