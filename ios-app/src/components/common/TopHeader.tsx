import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import { globalStyles } from '../../styles/globalStyles';
import { theme } from '../../styles/theme';
import TrueSharpLogo from './TrueSharpLogo';
import TrueSharpShield from './TrueSharpShield';
import { supabase } from '../../lib/supabase';
import { MainStackParamList } from '../../types';

type NavigationProp = StackNavigationProp<MainStackParamList>;

export default function TopHeader() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [showDropdown, setShowDropdown] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    fetchProfilePicture();
  }, [user]);

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
        {/* Left side - TrueSharp Shield */}
        <View style={styles.leftSection}>
          <TrueSharpShield size={28} variant="default" />
        </View>

        {/* Center - TrueSharp Logo */}
        <View style={styles.centerSection}>
          <TrueSharpLogo size="small" variant="horizontal" />
        </View>

        {/* Right side - Profile Picture */}
        <View style={styles.rightSection}>
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
  centerSection: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
    position: 'relative',
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
});