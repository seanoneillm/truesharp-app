import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { theme } from '../../styles/theme';

interface TrueSharpShieldProps {
  size?: number;
  variant?: 'default' | 'light';
  style?: any;
}

export default function TrueSharpShield({ 
  size = 24, 
  variant = 'default',
  style 
}: TrueSharpShieldProps) {
  const gradientId = `shieldGradient-${variant}-${Math.random().toString(36).substr(2, 9)}`;
  
  const colors = variant === 'light' 
    ? { start: theme.colors.primary, end: theme.colors.primaryDark, stroke: '#60A5FA' }
    : { start: theme.colors.primaryDark, end: '#1E3A8A', stroke: theme.colors.primary };

  return (
    <View style={style}>
      <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.start} />
            <Stop offset="100%" stopColor={colors.end} />
          </LinearGradient>
        </Defs>
        
        {/* Shield shape */}
        <Path
          d="M50 5 L80 20 L80 50 Q80 85 50 110 Q20 85 20 50 L20 20 Z"
          fill={`url(#${gradientId})`}
          stroke={colors.stroke}
          strokeWidth="2"
        />
        
        {/* Checkmark */}
        <Path
          d="M35 45 L45 55 L65 35"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}