import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import { globalStyles } from '../../styles/globalStyles';
import { theme } from '../../styles/theme';
import TrueSharpLogo from './TrueSharpLogo';
import { supabase } from '../../lib/supabase';
import { MainStackParamList } from '../../types';
import { adminService } from '../../services/adminService';

type NavigationProp = StackNavigationProp<MainStackParamList>;

export default function TopHeader() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [showDropdown, setShowDropdown] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchProfilePicture();
    checkAdminAccess();
    fetchUnreadCount();
  }, [user]);

  // Refresh unread count when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUnreadCount();
    }, [user])
  );

  const fetchUnreadCount = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) {
        console.error('Error fetching unread count:', error);
        return;
      }

      setUnreadCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const checkAdminAccess = async () => {
    try {
      const hasAdminAccess = await adminService.validateAdminAccess(user);
      setIsAdmin(hasAdminAccess);
    } catch (error) {
      console.error('Error checking admin access:', error);
      setIsAdmin(false);
    }
  };

  const fetchProfilePicture = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('profile_picture_url')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile picture:', error);
        return;
      }

      setProfilePicture(data?.profile_picture_url || null);
    } catch (error) {
      console.error('Error fetching profile picture:', error);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDropdownAction = (action: string) => {
    setShowDropdown(false);
    
    switch (action) {
      case 'admin':
        navigation.navigate('Admin');
        break;
      case 'settings':
        navigation.navigate('Settings');
        break;
      case 'feedback':
        navigation.navigate('Feedback');
        break;
      case 'help':
        navigation.navigate('Help');
        break;
      case 'logout':
        handleSignOut();
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        {/* Left side - TrueSharp Logo */}
        <View style={styles.leftSection}>
          <Image 
            source={require('../../assets/truesharp-logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Center - TrueSharp Logo */}
        <View style={styles.centerSection}>
          <TrueSharpLogo size="small" variant="horizontal" />
        </View>

        {/* Right side - Notifications and Profile Picture */}
        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={theme.colors.text.secondary}
            />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.profileContainer}
            onPress={() => setShowDropdown(!showDropdown)}
            activeOpacity={0.7}
          >
            {profilePicture ? (
              <Image
                source={{ uri: profilePicture }}
                style={styles.avatar as any}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons
                  name="person"
                  size={20}
                  color={theme.colors.text.light}
                />
              </View>
            )}
          </TouchableOpacity>

          {/* Dropdown Menu */}
          {showDropdown && (
            <View style={styles.dropdown}>
              {/* Admin button - only show for admin users */}
              {isAdmin && (
                <>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => handleDropdownAction('admin')}
                  >
                    <Ionicons name="shield-outline" size={20} color={theme.colors.primary} />
                    <Text style={[styles.dropdownText, styles.adminText]}>Admin</Text>
                  </TouchableOpacity>
                  <View style={styles.separator} />
                </>
              )}
              
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleDropdownAction('settings')}
              >
                <Ionicons name="settings-outline" size={20} color={theme.colors.text.secondary} />
                <Text style={styles.dropdownText}>Settings</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleDropdownAction('feedback')}
              >
                <Ionicons name="chatbubble-outline" size={20} color={theme.colors.text.secondary} />
                <Text style={styles.dropdownText}>Feedback</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleDropdownAction('help')}
              >
                <Ionicons name="help-circle-outline" size={20} color={theme.colors.text.secondary} />
                <Text style={styles.dropdownText}>Help</Text>
              </TouchableOpacity>
              
              <View style={styles.separator} />
              
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleDropdownAction('logout')}
              >
                <Ionicons name="log-out-outline" size={20} color={theme.colors.status.error} />
                <Text style={[styles.dropdownText, styles.logoutText]}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    zIndex: 1000,
    ...theme.shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    height: 60,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  notificationButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.xs,
    borderRadius: 20,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  profileContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xs,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.lg,
    minWidth: 160,
    marginTop: theme.spacing.xs,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  dropdownText: {
    ...globalStyles.body,
    marginLeft: theme.spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.sm,
  },
  logoutText: {
    color: theme.colors.status.error,
  },
  adminText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});