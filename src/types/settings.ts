// Settings type definitions for TrueSharp

export interface UserProfile {
  id: string
  username: string
  display_name: string
  bio?: string
  email: string
  profile_picture_url?: string
  is_seller: boolean
  is_verified_seller: boolean
  pro: string
  public_profile: boolean
  created_at: string
  updated_at: string
}

export interface UserSettings {
  id?: string
  user_id: string
  theme: 'light' | 'dark' | 'system'
  timezone: string
  currency: string
  email_notifications: {
    subscriptions: boolean
    followers: boolean
    weekly_summary: boolean
    marketing: boolean
  }
  created_at?: string
  updated_at?: string
}

export interface SellerStripeAccount {
  id: string
  user_id: string
  stripe_account_id: string
  details_submitted: boolean
  charges_enabled: boolean
  payouts_enabled: boolean
  requirements_due: string[]
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  subscriber_id: string
  strategy_id: string
  seller_id: string
  stripe_subscription_id?: string
  status: 'active' | 'cancelled' | 'past_due'
  frequency: 'weekly' | 'monthly' | 'yearly'
  price: number
  current_period_start?: string
  current_period_end?: string
  cancelled_at?: string
  created_at: string
  updated_at: string
  // Joined data
  strategies?: {
    id: string
    name: string
    description?: string
  }
  profiles?: {
    id: string
    username: string
    display_name: string
    profile_picture_url?: string
  }
}

export interface PasswordChangeForm {
  current: string
  new: string
  confirm: string
}

export interface ProfileForm {
  username: string
  display_name: string
  bio: string
}

export interface SettingsSection {
  id: 'profile' | 'account' | 'billing' | 'seller' | 'privacy' | 'preferences'
  label: string
  icon: any
  description: string
}

export interface ApiError {
  message: string
  code?: string
  details?: any
}

export interface SettingsApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
}

export interface ExportData {
  profile: UserProfile
  bets: any[]
  strategies: any[]
  subscriptions: Subscription[]
  exported_at: string
}

export interface ConnectedSportsbook {
  id: string
  user_id: string
  sportsbook_name: string
  external_account_id?: string
  connection_status: 'connected' | 'disconnected' | 'error'
  last_sync_at?: string
  sync_enabled: boolean
  created_at: string
  updated_at: string
}

export interface NotificationPreference {
  id: string
  type: 'email' | 'push' | 'sms'
  category: 'subscriptions' | 'followers' | 'weekly_summary' | 'marketing' | 'security'
  enabled: boolean
  description: string
}
