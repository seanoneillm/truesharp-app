import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Image,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import LegalModals from '../../components/auth/LegalModals'
import InputField from '../../components/common/InputField'
import LoadingButton from '../../components/common/LoadingButton'
import UpgradeToProModal from '../../components/upgrade/UpgradeToProModal'
import { useAuth } from '../../contexts/AuthContext'
import { authService } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { modernStoreKitService } from '../../services/modern-storekit'
import { stripeService } from '../../services/stripeService'
import { globalStyles } from '../../styles/globalStyles'
import { theme } from '../../styles/theme'
import { MainStackParamList } from '../../types'

type NavigationProp = StackNavigationProp<MainStackParamList>

interface UserProfile {
  id: string
  username: string | null
  bio: string | null
  is_seller: boolean | null
  created_at: string | null
  updated_at: string | null
  is_verified_seller: boolean | null
  email: string | null
  pro: string | null
  profile_picture_url: string | null
  public_profile: boolean | null
  sharpsports_bettor_id: string | null
  display_name: string | null
}

interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  timezone: string
  currency: string
  email_notifications: {
    subscriptions: boolean
    followers: boolean
    weekly_summary: boolean
    marketing: boolean
  }
}

type SettingsSection = 'account' | 'notifications' | 'privacy' | 'billing'

export default function SettingsScreen() {
  const { user, signOut } = useAuth()
  const navigation = useNavigation<NavigationProp>()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedSection, setSelectedSection] = useState<SettingsSection | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showLegalModals, setShowLegalModals] = useState(false)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [proSubscription, setProSubscription] = useState<any>(null)
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'light',
    timezone: 'America/New_York',
    currency: 'USD',
    email_notifications: {
      subscriptions: true,
      followers: true,
      weekly_summary: true,
      marketing: true,
    },
  })

  const [profileForm, setProfileForm] = useState({
    username: '',
    display_name: '',
    bio: '',
  })

  const loadUserData = useCallback(async () => {
    if (!user?.id) return

    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error loading profile:', profileError)
        return
      }

      if (profileData) {
        setProfile(profileData)
        setProfileForm({
          username: profileData.username || '',
          display_name: profileData.display_name || '',
          bio: profileData.bio || '',
        })
      }

      // Load user settings
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (settingsData) {
        setSettings({
          theme: settingsData.theme || 'light',
          timezone: settingsData.timezone || 'America/New_York',
          currency: settingsData.currency || 'USD',
          email_notifications: settingsData.email_notifications || {
            subscriptions: true,
            followers: true,
            weekly_summary: true,
            marketing: true,
          },
        })
      }

      // Load subscriptions
      const { data: subscriptionsData } = await supabase
        .from('subscriptions')
        .select(
          `
          *,
          strategies:strategy_id (
            id,
            name,
            description
          )
        `
        )
        .eq('subscriber_id', user.id)
        .order('created_at', { ascending: false })

      if (subscriptionsData) {
        setSubscriptions(subscriptionsData)
      }

      // Load pro subscription
      const { data: proSubscriptionData } = await supabase
        .from('pro_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (proSubscriptionData) {
        setProSubscription(proSubscriptionData)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadUserData()
  }, [loadUserData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadUserData()
    setRefreshing(false)
  }, [loadUserData])

  const openModal = (section: SettingsSection) => {
    setSelectedSection(section)
    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
    setSelectedSection(null)
  }

  const handleProfileImagePicker = async () => {
    Alert.alert('Change Profile Picture', 'Choose an option', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Take Photo', onPress: () => pickImage('camera') },
      { text: 'Choose from Library', onPress: () => pickImage('library') },
    ])
  }

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!')
        return
      }

      let result
      if (source === 'camera') {
        const cameraPermissionResult = await ImagePicker.requestCameraPermissionsAsync()
        if (cameraPermissionResult.granted === false) {
          Alert.alert('Permission Required', 'Permission to access camera is required!')
          return
        }

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions?.Images || 'images',
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        })
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions?.Images || 'images',
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        })
      }

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri
        await uploadProfileImage(imageUri)
      }
    } catch (error) {
      console.error('Error picking profile image:', error)
      Alert.alert('Error', 'Failed to pick image. Please try again.')
    }
  }

  const uploadProfileImage = async (imageUri: string) => {
    if (!user?.id) return

    try {
      setSaving(true)

      // Get file extension from URI
      const fileExt = imageUri.split('.').pop() || 'jpg'
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      // For React Native, we need to create a FormData object
      const formData = new FormData()
      formData.append('file', {
        uri: imageUri,
        type: `image/${fileExt}`,
        name: fileName,
      } as any)

      // Upload using the Supabase storage upload method with ArrayBuffer/Uint8Array
      // First, read the file as a binary array
      const response = await fetch(imageUri)
      const arrayBuffer = await response.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, uint8Array, {
          cacheControl: '3600',
          upsert: true,
          contentType: `image/${fileExt}`,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      // Get the public URL for the uploaded image
      const {
        data: { publicUrl },
      } = supabase.storage.from('profile-pictures').getPublicUrl(fileName)

      // Update the user's profile with the new profile picture URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          profile_picture_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Profile update error:', updateError)
        throw updateError
      }

      // Refresh the profile data to show the new image
      await loadUserData()
      Alert.alert('Success', 'Profile picture updated successfully')
    } catch (error) {
      console.error('Error uploading profile image:', error)
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const saveProfile = async () => {
    if (!user?.id) return

    try {
      setSaving(true)

      const { error } = await supabase
        .from('profiles')
        .update({
          username: profileForm.username.trim() || null,
          display_name: profileForm.display_name.trim() || null,
          bio: profileForm.bio.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      Alert.alert('Success', 'Profile updated successfully')
      await loadUserData()
    } catch (error) {
      console.error('Error saving profile:', error)
      Alert.alert('Error', 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const saveSettings = async () => {
    if (!user?.id) return

    try {
      setSaving(true)

      const { error } = await supabase.from('user_settings').upsert({
        user_id: user.id,
        theme: settings.theme,
        timezone: settings.timezone,
        currency: settings.currency,
        email_notifications: settings.email_notifications,
      })

      if (error) throw error

      Alert.alert('Success', 'Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      Alert.alert('Error', 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut()
            navigation.reset({
              index: 0,
              routes: [{ name: 'Tabs' }],
            })
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out')
          }
        },
      },
    ])
  }

  const openBillingPortal = async () => {
    try {
      const result = await stripeService.getCustomerBillingPortalUrl()

      if (!result.success) {
        // Handle specific error cases with user-friendly messages
        if (
          result.error?.includes('No payment account') ||
          result.error?.includes('payment account')
        ) {
          Alert.alert(
            'No Active Subscriptions',
            'You currently have no active subscriptions to manage.\n\nDiscover profitable betting strategies and subscribe to top-performing bettors on our marketplace at truesharp.io',
            [
              { text: 'Visit Marketplace', onPress: () => Linking.openURL('https://truesharp.io') },
              { text: 'OK', style: 'cancel' },
            ]
          )
        } else if (result.error?.includes('not found')) {
          Alert.alert(
            'Billing Information Not Available',
            "Your billing information could not be found. This usually means you haven't made any purchases yet.\n\nExplore our marketplace at truesharp.io to find profitable betting strategies.",
            [
              { text: 'Visit Marketplace', onPress: () => Linking.openURL('https://truesharp.io') },
              { text: 'OK', style: 'cancel' },
            ]
          )
        } else {
          // Generic error fallback
          Alert.alert('Unable to Open Billing Portal', result.error || 'Please try again later.', [
            { text: 'OK' },
          ])
        }
      } else if (result.url) {
        Linking.openURL(result.url)
      }
    } catch (error) {
      console.error('Error opening billing portal:', error)
      Alert.alert('Error', 'Failed to open billing portal')
    }
  }

  const handleRestorePurchases = async () => {
    try {
      setSaving(true)
      const results = await modernStoreKitService.restorePurchases()

      if (results.length > 0) {
        Alert.alert(
          'Purchases Restored! 🎉',
          'Your previous purchases have been restored successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                setModalVisible(false)
                loadUserData()
              },
            },
          ]
        )
      } else {
        Alert.alert(
          'No Purchases Found',
          'No previous purchases were found to restore. If you believe this is an error, please contact support.',
          [{ text: 'OK' }]
        )
      }
    } catch (error) {
      console.error('Error restoring purchases:', error)
      Alert.alert(
        'Restore Failed',
        'Could not restore purchases. Please try again or contact support if the issue persists.',
        [{ text: 'OK' }]
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This will:\n\n• Delete all your personal data\n• Cancel all subscriptions\n• Remove all bets and strategies\n• Cannot be undone\n\nType "DELETE" to confirm.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => showDeleteConfirmation(),
        },
      ]
    )
  }

  const showDeleteConfirmation = () => {
    // Show a text input confirmation dialog
    Alert.prompt(
      'Final Confirmation',
      'Type "DELETE" to permanently delete your account:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: (text: string) => {
            if (text === 'DELETE') {
              executeAccountDeletion()
            } else {
              Alert.alert('Error', 'You must type "DELETE" exactly to confirm account deletion.')
            }
          },
        },
      ],
      'plain-text'
    )
  }

  const executeAccountDeletion = async () => {
    try {
      setSaving(true)

      // Call the delete account function from auth service
      const result = await authService.deleteAccount()

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete account')
      }

      Alert.alert('Account Deleted', 'Your account has been permanently deleted.', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back to auth flow
            navigation.getParent()?.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            })
          },
        },
      ])
    } catch (error) {
      console.error('Error deleting account:', error)
      Alert.alert(
        'Deletion Failed',
        'Failed to delete your account. Please try again or contact support at info@truesharp.io if the problem persists.'
      )
    } finally {
      setSaving(false)
    }
  }

  const sections = [
    {
      id: 'account' as SettingsSection,
      title: 'Account Information',
      icon: 'person-outline',
      description: 'Manage your profile and account details',
    },
    {
      id: 'notifications' as SettingsSection,
      title: 'Notifications',
      icon: 'notifications-outline',
      description: 'Configure your notification preferences',
    },
    {
      id: 'privacy' as SettingsSection,
      title: 'Privacy & Security',
      icon: 'shield-outline',
      description: 'Manage your privacy and security settings',
    },
    {
      id: 'billing' as SettingsSection,
      title: 'Billing & Subscriptions',
      icon: 'card-outline',
      description: 'Manage your billing and subscriptions',
    },
  ]

  const renderModalContent = () => {
    if (!selectedSection) return null

    switch (selectedSection) {
      case 'account':
        return (
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Account Information</Text>

            {/* Profile Picture */}
            <View style={styles.profilePictureSection}>
              <TouchableOpacity
                onPress={handleProfileImagePicker}
                style={styles.profilePictureContainer}
              >
                {profile?.profile_picture_url ? (
                  <Image
                    source={{ uri: profile.profile_picture_url }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <Ionicons name="person" size={40} color={theme.colors.text.light} />
                  </View>
                )}
                <View style={styles.profilePictureOverlay}>
                  <Ionicons name="camera" size={20} color={theme.colors.text.inverse} />
                </View>
              </TouchableOpacity>
              <Text style={styles.profilePictureLabel}>Tap to change photo</Text>
            </View>

            <View style={styles.disabledField}>
              <Text style={globalStyles.label}>Username</Text>
              <View style={styles.disabledInput}>
                <Text style={styles.disabledInputText}>{profile?.username || ''}</Text>
              </View>
            </View>

            <InputField
              label="Display Name"
              value={profileForm.display_name}
              onChangeText={text => setProfileForm({ ...profileForm, display_name: text })}
              placeholder="Enter display name"
            />

            <InputField
              label="Bio"
              value={profileForm.bio}
              onChangeText={text => setProfileForm({ ...profileForm, bio: text })}
              placeholder="Tell others about yourself..."
            />

            <View style={styles.disabledField}>
              <Text style={globalStyles.label}>Email</Text>
              <View style={styles.disabledInput}>
                <Text style={styles.disabledInputText}>{profile?.email || ''}</Text>
              </View>
            </View>

            <Text style={styles.supportContactText}>
              To update your account details, contact support at info@truesharp.io
            </Text>

            <LoadingButton
              title="Save Changes"
              onPress={saveProfile}
              loading={saving}
              style={styles.saveButton}
            />

            {/* Delete Account Section */}
            <View style={styles.deleteAccountSection}>
              <Text style={styles.deleteAccountTitle}>Danger Zone</Text>
              <Text style={styles.deleteAccountDescription}>
                Permanently delete your account and all associated data. This action cannot be
                undone.
              </Text>
              <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
                <Ionicons name="trash-outline" size={20} color={theme.colors.status.error} />
                <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bottomPadding} />
          </ScrollView>
        )

      case 'notifications':
        return (
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Notification Preferences</Text>

            {Object.entries(settings.email_notifications)
              .filter(([key]) => key !== 'followers')
              .map(([key, value]) => (
                <View key={key} style={styles.switchRow}>
                  <View style={styles.switchTextContainer}>
                    <Text style={styles.switchTitle}>
                      {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                    <Text style={styles.switchDescription}>
                      {key === 'subscriptions' && 'Receive notifications about your subscriptions'}
                      {key === 'weekly_summary' && 'Weekly performance summaries'}
                      {key === 'marketing' && 'Product updates and promotional emails'}
                    </Text>
                  </View>
                  <Switch
                    value={value}
                    onValueChange={newValue => {
                      setSettings({
                        ...settings,
                        email_notifications: {
                          ...settings.email_notifications,
                          [key]: newValue,
                        },
                      })
                    }}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    thumbColor={value ? theme.colors.card : theme.colors.text.light}
                  />
                </View>
              ))}

            <LoadingButton
              title="Save Preferences"
              onPress={saveSettings}
              loading={saving}
              style={styles.saveButton}
            />
          </ScrollView>
        )

      case 'privacy':
        return (
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Privacy & Security</Text>

            <View style={styles.privacyCard}>
              <View style={styles.privacyItem}>
                <Ionicons name="document-text-outline" size={24} color={theme.colors.primary} />
                <View style={styles.privacyTextContainer}>
                  <Text style={styles.privacyTitle}>Privacy Policy</Text>
                  <Text style={styles.privacyDescription}>
                    View our privacy policy and data handling practices
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.privacyAction}
                  onPress={() => setShowLegalModals(true)}
                >
                  <Text style={styles.privacyActionText}>View Policy</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.privacyItem}>
                <Ionicons name="shield-checkmark-outline" size={24} color={theme.colors.primary} />
                <View style={styles.privacyTextContainer}>
                  <Text style={styles.privacyTitle}>Two-Factor Authentication</Text>
                  <Text style={styles.privacyDescription}>Add extra security to your account</Text>
                </View>
                <TouchableOpacity
                  style={styles.privacyAction}
                  onPress={() => {
                    Alert.alert(
                      'Two-Factor Authentication',
                      'To enable two-factor authentication, please contact support at info@truesharp.io',
                      [{ text: 'OK' }]
                    )
                  }}
                >
                  <Text style={styles.privacyActionText}>Contact Support</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.securityContactText}>
              To change your password or update account security, contact info@truesharp.io
            </Text>
          </ScrollView>
        )

      case 'billing':
        return (
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Billing & Subscriptions</Text>

            {/* Pro Subscription */}
            <View style={styles.billingCard}>
              <View style={styles.billingHeader}>
                <View>
                  <Text style={styles.billingTitle}>TrueSharp Pro</Text>
                  <Text style={styles.billingStatus}>
                    {proSubscription ? 'Active Subscription' : 'Free Plan'}
                  </Text>
                  {proSubscription && (
                    <Text style={styles.billingRenewal}>
                      Renews {new Date(proSubscription.current_period_end).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    proSubscription ? styles.activeBadge : styles.freeBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      proSubscription ? styles.activeBadgeText : styles.freeBadgeText,
                    ]}
                  >
                    {proSubscription ? 'PRO' : 'FREE'}
                  </Text>
                </View>
              </View>

              {proSubscription ? (
                <TouchableOpacity style={styles.button} onPress={openBillingPortal}>
                  <Ionicons name="card-outline" size={20} color={theme.colors.text.inverse} />
                  <Text style={styles.buttonText}>Manage Billing</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.upgradeButtonContainer}
                  onPress={() => setShowUpgradeModal(true)}
                >
                  <LinearGradient
                    colors={[theme.colors.primary, '#1E40AF', '#1D4ED8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.upgradeButton}
                  >
                    <Ionicons name="star-outline" size={20} color="white" />
                    <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            {/* Strategy Subscriptions */}
            {loading ? (
              <View style={styles.loadingSection}>
                <Text style={styles.loadingText}>Loading subscriptions...</Text>
              </View>
            ) : subscriptions.length > 0 ? (
              <View style={styles.subscriptionsSection}>
                <Text style={styles.subscriptionsSectionTitle}>Strategy Subscriptions</Text>
                {subscriptions.map(subscription => (
                  <View key={subscription.id} style={styles.subscriptionItem}>
                    <View style={styles.subscriptionItemContent}>
                      <Text style={styles.subscriptionItemTitle}>
                        {subscription.strategies?.name || 'Strategy'}
                      </Text>
                      <Text style={styles.subscriptionItemSubtitle}>
                        ${subscription.price} / {subscription.frequency}
                      </Text>
                      {subscription.next_billing_date && (
                        <Text style={styles.subscriptionItemRenewal}>
                          Next billing:{' '}
                          {new Date(subscription.next_billing_date).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        subscription.status === 'active'
                          ? styles.activeBadge
                          : styles.cancelledBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          subscription.status === 'active'
                            ? styles.activeBadgeText
                            : styles.cancelledBadgeText,
                        ]}
                      >
                        {subscription.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptySubscriptionsSection}>
                <Text style={styles.emptySubscriptionsText}>No strategy subscriptions found</Text>
              </View>
            )}

            {/* Restore Purchases Button - iOS Only */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.manageBillingButton, { marginBottom: theme.spacing.md }]}
                onPress={handleRestorePurchases}
                disabled={saving}
              >
                <Ionicons name="refresh-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.manageBillingButtonText}>
                  {saving ? 'Restoring...' : 'Restore Purchases'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Manage Billing Button */}
            <TouchableOpacity style={styles.manageBillingButton} onPress={openBillingPortal}>
              <Ionicons name="card-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.manageBillingButtonText}>Manage Billing</Text>
            </TouchableOpacity>
          </ScrollView>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Back Arrow - Only show when no modal is visible */}
      {!modalVisible && (
        <View style={styles.backArrowContainer}>
          <TouchableOpacity style={styles.backArrow} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Settings List - Only show when no modal is visible */}
      {!modalVisible && (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.settingsList}>
            {sections.map(section => (
              <TouchableOpacity
                key={section.id}
                style={styles.settingsListItem}
                onPress={() => openModal(section.id)}
              >
                <View style={styles.settingsItemContent}>
                  <View style={styles.settingsItemIcon}>
                    <Ionicons name={section.icon as any} size={24} color="#0057ff" />
                  </View>
                  <View style={styles.settingsItemText}>
                    <Text style={styles.settingsItemTitle}>{section.title}</Text>
                    <Text style={styles.settingsItemDescription}>{section.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.text.light} />
                </View>
              </TouchableOpacity>
            ))}

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutListItem} onPress={handleSignOut}>
              <View style={styles.settingsItemContent}>
                <View style={styles.settingsItemIcon}>
                  <Ionicons name="log-out-outline" size={24} color={theme.colors.status.error} />
                </View>
                <View style={styles.settingsItemText}>
                  <Text style={[styles.settingsItemTitle, styles.logoutText]}>Sign Out</Text>
                  <Text style={styles.settingsItemDescription}>Sign out of your account</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Full Screen Modal - Covers everything below header */}
      {modalVisible && (
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal} style={styles.modalBackButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>
              {selectedSection && sections.find(s => s.id === selectedSection)?.title}
            </Text>
            <View style={styles.modalHeaderSpacer} />
          </View>
          {renderModalContent()}
        </View>
      )}

      {/* Upgrade to Pro Modal */}
      <UpgradeToProModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSelectPlan={(planType, productId, price) => {
          setShowUpgradeModal(false)
          Alert.alert('Success', `${planType} Pro plan selected!`)
        }}
      />

      {/* Legal Modals */}
      <LegalModals isVisible={showLegalModals} onClose={() => setShowLegalModals(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  backArrowContainer: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    zIndex: 10,
  },
  backArrow: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.card,
    ...theme.shadows.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...globalStyles.body,
    color: theme.colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  settingsList: {
    backgroundColor: theme.colors.card,
    margin: theme.spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  settingsListItem: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  logoutListItem: {
    marginTop: theme.spacing.lg,
  },
  settingsItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  settingsItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  settingsItemText: {
    flex: 1,
  },
  settingsItemTitle: {
    ...globalStyles.h4,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  settingsItemDescription: {
    ...globalStyles.caption,
    color: theme.colors.text.secondary,
  },
  logoutText: {
    color: theme.colors.status.error,
  },
  // Full Screen Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  modalBackButton: {
    padding: theme.spacing.xs,
  },
  modalHeaderTitle: {
    ...globalStyles.h2,
    color: theme.colors.text.primary,
  },
  modalHeaderSpacer: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  modalTitle: {
    ...globalStyles.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  profilePictureSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  profilePictureContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  profilePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surface,
    borderWidth: 3,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePictureOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.card,
  },
  profilePictureLabel: {
    ...globalStyles.caption,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  saveButton: {
    marginTop: theme.spacing.lg,
  },
  bottomPadding: {
    height: 200, // Extra padding to ensure keyboard doesn't cover content
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  switchTextContainer: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  switchTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  switchDescription: {
    ...globalStyles.caption,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  privacyCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  privacyTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  privacyTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  privacyDescription: {
    ...globalStyles.caption,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  privacyAction: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  privacyActionText: {
    ...globalStyles.caption,
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.medium,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.inverse,
    marginLeft: theme.spacing.sm,
  },
  upgradeButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  upgradeButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: 'white',
  },
  billingCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.card,
  },
  billingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  billingTitle: {
    ...globalStyles.h4,
    color: theme.colors.text.primary,
  },
  billingStatus: {
    ...globalStyles.caption,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  activeBadge: {
    backgroundColor: theme.colors.accent,
  },
  freeBadge: {
    backgroundColor: theme.colors.surface,
  },
  statusBadgeText: {
    ...globalStyles.caption,
    fontWeight: theme.typography.fontWeight.bold,
  },
  activeBadgeText: {
    color: theme.colors.text.inverse,
  },
  freeBadgeText: {
    color: theme.colors.text.secondary,
  },
  preferenceItem: {
    marginBottom: theme.spacing.lg,
  },
  preferenceLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  themeSelector: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  themeOption: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  selectedThemeOption: {
    backgroundColor: theme.colors.primary,
  },
  themeOptionText: {
    ...globalStyles.caption,
    color: theme.colors.text.secondary,
  },
  selectedThemeOptionText: {
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.medium,
  },
  logoutSection: {
    margin: theme.spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.status.error,
    ...theme.shadows.sm,
  },
  logoutButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.status.error,
    marginLeft: theme.spacing.sm,
  },
  disabledField: {
    marginBottom: theme.spacing.md,
  },
  disabledInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    minHeight: 48,
  },
  disabledInputText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  disabledHelpText: {
    ...globalStyles.caption,
    color: theme.colors.text.light,
    marginTop: theme.spacing.xs,
  },
  supportContactText: {
    ...globalStyles.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    fontSize: theme.typography.fontSize.sm,
  },
  securityContactText: {
    ...globalStyles.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
  },
  billingRenewal: {
    ...globalStyles.caption,
    color: theme.colors.text.light,
    marginTop: theme.spacing.xs,
  },
  subscriptionsSection: {
    marginTop: theme.spacing.lg,
  },
  subscriptionsSectionTitle: {
    ...globalStyles.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  subscriptionItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  subscriptionItemContent: {
    flex: 1,
  },
  subscriptionItemTitle: {
    ...globalStyles.body,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  subscriptionItemSubtitle: {
    ...globalStyles.caption,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  subscriptionItemRenewal: {
    ...globalStyles.caption,
    color: theme.colors.text.light,
    marginTop: theme.spacing.xs,
  },
  cancelledBadge: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.text.light,
  },
  cancelledBadgeText: {
    color: theme.colors.text.light,
  },
  manageBillingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginTop: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  manageBillingButtonText: {
    ...globalStyles.body,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing.sm,
  },
  loadingSection: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  emptySubscriptionsSection: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  emptySubscriptionsText: {
    ...globalStyles.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  deleteAccountSection: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.status.error,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  deleteAccountTitle: {
    ...globalStyles.h4,
    color: theme.colors.status.error,
    marginBottom: theme.spacing.sm,
  },
  deleteAccountDescription: {
    ...globalStyles.body,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.status.error,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  deleteAccountButtonText: {
    ...globalStyles.body,
    color: theme.colors.status.error,
    fontWeight: theme.typography.fontWeight.medium,
  },
})
