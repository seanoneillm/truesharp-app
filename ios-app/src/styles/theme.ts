import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const theme = {
  colors: {
    // TrueSharp brand colors from web app
    primary: '#3B82F6', // Blue-600
    primaryDark: '#1E40AF', // Blue-800  
    secondary: '#0EA5E9', // Sky-500
    accent: '#8B5CF6', // Violet-500
    
    // Background colors from web app
    background: '#FFFFFF',
    surface: '#F8FAFC', // Gray-50
    surfaceSecondary: '#F1F5F9', // Gray-100
    card: '#FFFFFF',
    
    // Border colors
    border: '#E2E8F0', // Gray-200
    borderLight: '#F1F5F9', // Gray-100
    
    // Text colors from web app
    text: {
      primary: '#0F172A', // Gray-900 (darker than before)
      secondary: '#64748B', // Gray-500
      light: '#94A3B8', // Gray-400
      muted: '#CBD5E1', // Gray-300
      inverse: '#FFFFFF',
    },
    
    // Status colors
    status: {
      success: '#059669', // Green-600
      warning: '#D97706', // Amber-600
      error: '#DC2626', // Red-600
      info: '#0284C7', // Sky-600
      pending: '#6B7280', // Gray-500
    },

    // Filter-specific colors
    filters: {
      basic: '#3B82F6', // Blue-600 (matches primary)
      advanced: '#8B5CF6', // Violet-500
      pro: '#F59E0B', // Amber-500 (premium gold)
      proAccent: '#FBBF24', // Amber-400
      proBackground: '#FEF3C7', // Amber-100
    },
    
    // Gradient colors from web app
    gradient: {
      primary: ['#3B82F6', '#1E40AF'], // Blue-600 to Blue-800
      secondary: ['#0EA5E9', '#0284C7'], // Sky-500 to Sky-600
      accent: ['#8B5CF6', '#7C3AED'], // Violet-500 to Violet-600
      truesharp: ['#1E3A8A', '#1E40AF', '#3730A3'], // TrueSharp gradient
      welcome: ['#2563EB', '#06B6D4'], // Blue-600 to Cyan-500
    },
    
    // Sport-specific colors from web app
    sports: {
      nfl: '#22C55E', // Green-500
      nba: '#F97316', // Orange-500
      mlb: '#3B82F6', // Blue-500
      nhl: '#6366F1', // Indigo-500
      ncaaf: '#8B5CF6', // Violet-500
      ncaab: '#EC4899', // Pink-500
      soccer: '#10B981', // Emerald-500
    },
    
    // Betting status colors
    betting: {
      won: '#059669', // Green-600
      lost: '#DC2626', // Red-600
      pending: '#6B7280', // Gray-500
      void: '#D97706', // Amber-600
      push: '#0284C7', // Sky-600
    },
  },
  
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
    fontWeight: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    full: 999,
  },
  
  shadows: {
    sm: {
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
      shadowOpacity: 0.05,
      elevation: 1,
    },
    md: {
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      shadowOpacity: 0.1,
      elevation: 3,
    },
    lg: {
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 6,
      shadowOpacity: 0.15,
      elevation: 5,
    },
    xl: {
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 8,
      shadowOpacity: 0.2,
      elevation: 8,
    },
  },
  
  layout: {
    window: {
      width,
      height,
    },
    container: {
      maxWidth: 390,
      padding: 16,
    },
    header: {
      height: 60,
    },
    tabBar: {
      height: 80,
    },
  },
  
  animation: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
    },
  },
};

export type Theme = typeof theme;