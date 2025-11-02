import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { supabase } from '../../lib/supabase';

interface ProfileDropdownProps {
  size?: number;
  showDropdown?: boolean;
  onPress?: () => void;
}

export default function ProfileDropdown({ 
  size = 36, 
  showDropdown = false,
  onPress 
}: ProfileDropdownProps) {
  const { user } = useAuth();
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

  return (
    <TouchableOpacity
      style={[styles.container, { width: size, height: size }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {profilePicture ? (
        <Image
          source={{ uri: profilePicture }}
          style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
          <Ionicons
            name="person"
            size={size * 0.6}
            color={theme.colors.text.light}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});