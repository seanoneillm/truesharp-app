import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput,
  Alert,
  ActivityIndicator 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { supabase } from '../../lib/supabase';
import TrueSharpShield from '../common/TrueSharpShield';

interface SellerProfileData {
  id: string;
  user_id: string;
  bio: string | null;
  profile_img: string | null;
  banner_img: string | null;
  // From profiles table
  display_name?: string | null;
  username?: string | null;
  profile_picture_url?: string | null;
}

interface EditSellerProfileModalProps {
  visible: boolean;
  userId: string;
  onClose: () => void;
  onSave?: () => void;
}

export default function EditSellerProfileModal({ 
  visible, 
  userId, 
  onClose, 
  onSave 
}: EditSellerProfileModalProps) {
  const [profile, setProfile] = useState<SellerProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImg, setProfileImg] = useState('');
  const [bannerImg, setBannerImg] = useState('');
  
  // Static preview data (doesn't update with form changes)
  const [previewData, setPreviewData] = useState({
    displayName: '',
    bio: '',
    profileImg: '',
    bannerImg: '',
    username: ''
  });

  // Load seller profile data
  const loadProfileData = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      // Get basic profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('display_name, username, profile_picture_url')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      // Get seller profile data
      const { data: sellerData, error: sellerError } = await supabase
        .from('seller_profiles')
        .select('id, user_id, bio, profile_img, banner_img')
        .eq('user_id', userId)
        .single();

      // If no seller profile exists, create one
      if (sellerError && sellerError.code === 'PGRST116') {
        const { data: newSellerProfile, error: createError } = await supabase
          .from('seller_profiles')
          .insert({
            user_id: userId,
            bio: null,
            profile_img: profileData?.profile_picture_url || null,
            banner_img: null
          })
          .select('id, user_id, bio, profile_img, banner_img')
          .single();

        if (createError) {
          console.error('Error creating seller profile:', createError);
          throw createError;
        }

        sellerData = newSellerProfile;
      } else if (sellerError) {
        console.error('Error fetching seller profile:', sellerError);
        throw sellerError;
      }

      // Combine the data
      const combinedProfile = {
        ...sellerData,
        ...profileData
      };

      setProfile(combinedProfile);
      
      // Set form fields
      setDisplayName(combinedProfile.display_name || '');
      setBio(combinedProfile.bio || '');
      setProfileImg(combinedProfile.profile_img || combinedProfile.profile_picture_url || '');
      setBannerImg(combinedProfile.banner_img || '');

      // Set static preview data
      setPreviewData({
        displayName: combinedProfile.display_name || '',
        bio: combinedProfile.bio || '',
        profileImg: combinedProfile.profile_img || combinedProfile.profile_picture_url || '',
        bannerImg: combinedProfile.banner_img || '',
        username: combinedProfile.username || ''
      });
    } catch (err) {
      console.error('Error loading profile data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Convert image to data URL (like the web app does when storage isn't configured)
  const convertImageToDataUrl = async (imageUri: string): Promise<string | null> => {
    try {
      // Fetch the image as blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Convert blob to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          reject(new Error('Failed to convert image to data URL'));
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to data URL:', error);
      return null;
    }
  };

  // Save profile changes
  const saveProfile = async () => {
    if (!profile || !userId) return;

    try {
      setSaving(true);
      setError(null);

      let finalProfileImg = profileImg;
      let finalBannerImg = bannerImg;

      // Convert local image files to data URLs (like the web app does)
      if (profileImg && profileImg.startsWith('file://')) {
        const dataUrl = await convertImageToDataUrl(profileImg);
        if (dataUrl) {
          finalProfileImg = dataUrl;
        } else {
          throw new Error('Failed to process profile image');
        }
      }

      if (bannerImg && bannerImg.startsWith('file://')) {
        const dataUrl = await convertImageToDataUrl(bannerImg);
        if (dataUrl) {
          finalBannerImg = dataUrl;
        } else {
          throw new Error('Failed to process banner image');
        }
      }

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName || null,
          profile_picture_url: finalProfileImg || null
        })
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      // Update seller_profiles table
      const { error: sellerError } = await supabase
        .from('seller_profiles')
        .update({
          bio: bio || null,
          profile_img: finalProfileImg || null,
          banner_img: finalBannerImg || null
        })
        .eq('user_id', userId);

      if (sellerError) {
        console.error('Error updating seller profile:', sellerError);
        throw sellerError;
      }
      Alert.alert('Success', 'Your profile has been updated successfully!');
      onSave?.();
      onClose();
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to save profile');
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (visible && userId) {
      loadProfileData();
    }
  }, [visible, userId]);

  // Update preview with current form data
  const updatePreview = () => {
    setPreviewData({
      displayName: displayName,
      bio: bio,
      profileImg: profileImg,
      bannerImg: bannerImg,
      username: previewData.username
    });
  };

  // Pick profile image
  const pickProfileImage = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfileImg(imageUri);
        
        // Optionally update preview immediately
        setPreviewData(prev => ({
          ...prev,
          profileImg: imageUri
        }));
      }
    } catch (error) {
      console.error('Error picking profile image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Pick banner image
  const pickBannerImage = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setBannerImg(imageUri);
        
        // Optionally update preview immediately
        setPreviewData(prev => ({
          ...prev,
          bannerImg: imageUri
        }));
      }
    } catch (error) {
      console.error('Error picking banner image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const renderProfilePicture = (imageUrl: string, showEdit: boolean = false) => {
    if (imageUrl) {
      return (
        <View style={styles.profilePictureWrapper}>
          <Image 
            source={{ uri: imageUrl }}
            style={styles.profilePicture}
            onError={() => {
            }}
          />
          {showEdit && (
            <TouchableOpacity style={styles.editPhotoButton} onPress={pickProfileImage}>
              <Ionicons name="camera" size={12} color="white" />
            </TouchableOpacity>
          )}
        </View>
      );
    }
    
    const initials = previewData.username ? previewData.username.substring(0, 2).toUpperCase() : '??';
    return (
      <View style={styles.profilePictureWrapper}>
        <View style={[styles.profilePicture, styles.initialsContainer]}>
          <Text style={styles.initialsText}>{initials}</Text>
        </View>
        {showEdit && (
          <TouchableOpacity style={styles.editPhotoButton} onPress={pickProfileImage}>
            <Ionicons name="camera" size={12} color="white" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Error Loading Profile</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProfileData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!profile) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color={theme.colors.text.light} />
          <Text style={styles.errorTitle}>Profile Not Found</Text>
          <Text style={styles.errorMessage}>Unable to load your profile data.</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Profile Section */}
        <View style={styles.currentProfileSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Current Profile</Text>
          </View>
          
          {/* Banner Image Display */}
          <View style={styles.bannerContainer}>
            {previewData.bannerImg ? (
              <View style={styles.bannerImageContainer}>
                <Image source={{ uri: previewData.bannerImg }} style={styles.bannerImage} />
                <TouchableOpacity style={styles.editBannerButton} onPress={pickBannerImage}>
                  <Ionicons name="image" size={16} color="white" />
                  <Text style={styles.editBannerText}>Edit Banner</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.bannerImageContainer}>
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primaryDark]}
                  style={styles.bannerPlaceholder}
                >
                  <TrueSharpShield size={40} variant="light" />
                </LinearGradient>
                <TouchableOpacity style={styles.editBannerButton} onPress={pickBannerImage}>
                  <Ionicons name="image" size={16} color="white" />
                  <Text style={styles.editBannerText}>Add Banner</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Profile Picture Overlay */}
            <View style={styles.profilePictureContainer}>
              {renderProfilePicture(previewData.profileImg, true)}
            </View>
          </View>

          {/* Profile Info Display */}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {previewData.displayName || previewData.username || 'No Name'}
            </Text>
            <Text style={styles.profileUsername}>@{previewData.username || 'username'}</Text>
            {previewData.bio && (
              <Text style={styles.profileBio}>{previewData.bio}</Text>
            )}
          </View>
        </View>

        {/* Edit Fields */}
        <View style={styles.editSection}>
          <Text style={styles.sectionTitle}>Edit Information</Text>

          {/* Display Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your display name"
                placeholderTextColor={theme.colors.text.light}
              />
              <Ionicons name="person-outline" size={20} color={theme.colors.text.light} style={styles.inputIcon} />
            </View>
          </View>

          {/* Bio */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Bio</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.textInput, styles.bioInput]}
                value={bio}
                onChangeText={(text) => {
                  if (text.length <= 500) {
                    setBio(text);
                  }
                }}
                placeholder="Tell others about yourself and your betting expertise..."
                placeholderTextColor={theme.colors.text.light}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
              <Ionicons name="document-text-outline" size={20} color={theme.colors.text.light} style={[styles.inputIcon, styles.bioIcon]} />
            </View>
            <Text style={styles.characterCount}>{bio.length}/500</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={onClose}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
            onPress={saveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark" size={16} color="white" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
        <View style={styles.keyboardSpacer} />
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        {renderContent()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  errorMessage: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: 'white',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
  },
  currentProfileSection: {
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  bannerContainer: {
    position: 'relative',
    height: 120,
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    overflow: 'visible',
    marginBottom: 35, // Add space for profile picture
  },
  bannerImageContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBannerButton: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  editBannerText: {
    marginLeft: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
    color: 'white',
    fontWeight: theme.typography.fontWeight.medium,
  },
  profilePictureContainer: {
    position: 'absolute',
    bottom: -25,
    left: theme.spacing.lg,
  },
  profilePictureWrapper: {
    position: 'relative',
  },
  profilePicture: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: 'white',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  initialsContainer: {
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: 'white',
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  profileInfo: {
    marginHorizontal: theme.spacing.md,
    marginTop: 5,
    paddingBottom: theme.spacing.sm,
  },
  profileName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  profileUsername: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  profileBio: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  editSection: {
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  fieldContainer: {
    marginBottom: theme.spacing.md,
  },
  fieldLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  inputContainer: {
    position: 'relative',
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingRight: 45,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    backgroundColor: 'white',
    ...theme.shadows.sm,
  },
  inputIcon: {
    position: 'absolute',
    right: theme.spacing.md,
    top: theme.spacing.sm + 2,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.sm,
  },
  bioIcon: {
    top: theme.spacing.sm + 2,
  },
  characterCount: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.light,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: 'white',
  },
  bottomSpacer: {
    height: theme.spacing.sm,
  },
  keyboardSpacer: {
    height: 300, // Large padding for keyboard visibility
  },
});