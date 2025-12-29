import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../styles/theme';
import { supabase } from '../../lib/supabase';

interface Notification {
  id: string;
  notification_type: string;
  sender_type: string;
  sender_id: string | null;
  title: string;
  message: string;
  metadata: any;
  read_at: string | null;
  created_at: string;
  seller_profile?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Notification | null>(null);

  const fetchNotifications = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First get the notifications
      const { data: notificationsData, error } = await supabase
        .from('notifications')
        .select(`
          id,
          notification_type,
          sender_type,
          sender_id,
          title,
          message,
          metadata,
          read_at,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      // Get seller info for user notifications
      const userNotifications = notificationsData?.filter(n => n.sender_id) || [];
      let sellersData: any[] = [];

      if (userNotifications.length > 0) {
        const senderIds = [...new Set(userNotifications.map(n => n.sender_id).filter(Boolean))];
        
        // Get seller profile info
        const { data: sellersInfo } = await supabase
          .from('profiles')
          .select(`
            id,
            username,
            profile_picture_url
          `)
          .in('id', senderIds);

        sellersData = sellersInfo || [];
      }

      // Merge notification data with seller info
      const enrichedNotifications = notificationsData?.map(notification => {
        if (notification.sender_id) {
          const sellerInfo = sellersData.find(s => s.id === notification.sender_id);
          return {
            ...notification,
            seller_profile: {
              id: sellerInfo?.id,
              username: sellerInfo?.username,
              avatar_url: sellerInfo?.profile_picture_url
            }
          };
        }
        return notification;
      }) || [];

      setNotifications(enrichedNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const unreadNotifications = notifications
        .filter(n => !n.read_at)
        .map(n => n.id);

      if (unreadNotifications.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadNotifications);

      if (error) {
        console.error('Error marking notifications as read:', error);
        return;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ 
          ...n, 
          read_at: n.read_at || new Date().toISOString() 
        }))
      );
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(true);
  };

  const handleNotificationPress = (notification: Notification) => {
    // If it's a TrueSharp announcement, show the modal
    if (notification.sender_type === 'truesharp') {
      setSelectedAnnouncement(notification);
      return;
    }
    
    // If it's a strategy notification, navigate to subscriptions screen
    if (notification.notification_type === 'new_subscriber' || 
        notification.metadata?.strategy_id) {
      // Navigate to the nested Subscriptions screen in TabNavigator
      (navigation as any).navigate('Tabs', {
        screen: 'Subscriptions'
      });
    }
    // For other notifications, we can add different navigation logic later
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    // Auto-mark as read when screen loads if there are unread notifications
    const timer = setTimeout(() => {
      markAllAsRead();
    }, 1000); // Wait 1 second after screen loads

    return () => clearTimeout(timer);
  }, [notifications]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'truesharp':
        return 'megaphone';
      case 'user':
        return 'person';
      case 'system':
        return 'settings';
      default:
        return 'notifications';
    }
  };

  const getSenderColor = (senderType: string) => {
    switch (senderType) {
      case 'truesharp':
        return theme.colors.primary;
      case 'user':
        return theme.colors.success;
      case 'system':
        return theme.colors.warning;
      default:
        return theme.colors.text.light;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons 
              name="notifications-outline" 
              size={64} 
              color={theme.colors.text.light} 
            />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>
              You'll see your notifications here when they arrive
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification) => (
              <TouchableOpacity 
                key={notification.id} 
                style={styles.notificationItem}
                onPress={() => handleNotificationPress(notification)}
              >
                <View style={styles.notificationIcon}>
                  {notification.sender_type === 'truesharp' ? (
                    <Image
                      source={require('../../assets/truesharp-logo.png')}
                      style={styles.truesharpLogo}
                      resizeMode="contain"
                    />
                  ) : notification.seller_profile?.avatar_url ? (
                    <Image
                      source={{ uri: notification.seller_profile.avatar_url }}
                      style={styles.profileImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons
                      name={getSenderIcon(notification.sender_type) as any}
                      size={18}
                      color={getSenderColor(notification.sender_type)}
                    />
                  )}
                </View>
                
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle} numberOfLines={2}>
                      {notification.title}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatTimeAgo(notification.created_at)}
                    </Text>
                  </View>
                  
                  <Text style={styles.notificationMessage} numberOfLines={3}>
                    {notification.message}
                  </Text>
                  
                  <View style={styles.notificationFooter}>
                    <Text style={styles.notificationSender}>
                      From: {notification.sender_type === 'truesharp' 
                        ? 'TrueSharp' 
                        : notification.seller_profile?.username 
                          ? notification.seller_profile.username
                          : notification.sender_type.charAt(0).toUpperCase() + notification.sender_type.slice(1)}
                    </Text>
                    {(notification.notification_type === 'new_subscriber' || 
                      notification.metadata?.strategy_id) && (
                      <Text style={styles.viewNowText}>View Now</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* TrueSharp Announcement Popup */}
      <Modal
        visible={selectedAnnouncement !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedAnnouncement(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.popupContainer}>
            <View style={styles.popupHeader}>
              <View style={styles.popupHeaderLeft}>
                <Image
                  source={require('../../assets/truesharp-logo.png')}
                  style={styles.popupLogo}
                  resizeMode="contain"
                />
                <Text style={styles.popupTitle}>TrueSharp Announcement</Text>
              </View>
              <TouchableOpacity
                style={styles.popupCloseButton}
                onPress={() => setSelectedAnnouncement(null)}
              >
                <Ionicons name="close" size={20} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.popupContent} showsVerticalScrollIndicator={true}>
              <Text style={styles.popupAnnouncementTitle}>
                {selectedAnnouncement?.title}
              </Text>
              <Text style={styles.popupAnnouncementTime}>
                {selectedAnnouncement ? formatTimeAgo(selectedAnnouncement.created_at) : ''}
              </Text>
              <Text style={styles.popupAnnouncementMessage}>
                {selectedAnnouncement?.message}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    padding: theme.spacing.xs,
    marginLeft: -theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.light,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 2,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.light,
    textAlign: 'center',
    lineHeight: 22,
  },
  notificationsList: {
    paddingVertical: theme.spacing.sm,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.light,
    marginLeft: theme.spacing.sm,
  },
  notificationMessage: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationSender: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.light,
    fontStyle: 'italic',
  },
  viewNowText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  truesharpLogo: {
    width: 28,
    height: 28,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  popupContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    maxHeight: '80%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  popupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  popupLogo: {
    width: 28,
    height: 28,
    marginRight: theme.spacing.sm,
  },
  popupTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  popupCloseButton: {
    padding: theme.spacing.xs,
    borderRadius: 8,
  },
  popupContent: {
    maxHeight: 400,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  popupAnnouncementTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    lineHeight: 24,
  },
  popupAnnouncementTime: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.light,
    marginBottom: theme.spacing.md,
  },
  popupAnnouncementMessage: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
});