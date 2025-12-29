import { AuthUser } from '../lib/auth';

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ResetPassword: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  Settings: undefined;
  Profile: undefined;
  Help: undefined;
  Feedback: undefined;
  Admin: undefined;
  Notifications: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Analytics: undefined;
  Games: undefined;
  Marketplace: undefined;
  Sell: undefined;
  Subscriptions: undefined;
};

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

// Dashboard data types
export interface DashboardStats {
  totalBets: number;
  winRate: number;
  totalProfit: number;
  roi: number;
}

export interface RecentBet {
  id: string;
  description: string;
  odds: number;
  stake: number;
  result: 'pending' | 'won' | 'lost' | 'push';
  sport: string;
  createdAt: string;
}

export interface PreviewCard {
  title: string;
  subtitle: string;
  value?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  action?: string;
}

// Context types
export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (credentials: any) => Promise<void>;
  signUp: (credentials: any) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Component prop types
export interface LoadingButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
  variant?: 'primary' | 'secondary' | 'outline';
}

export interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  required?: boolean;
}

export interface CheckboxProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  required?: boolean;
  linkText?: string;
  onLinkPress?: () => void;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Error types
export interface AuthError extends Error {
  code?: string;
  details?: string;
}