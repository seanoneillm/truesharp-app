import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

interface TrueSharpLogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'horizontal' | 'vertical' | 'single-line';
  style?: any;
}

export default function TrueSharpLogo({ 
  size = 'medium', 
  variant = 'horizontal',
  style 
}: TrueSharpLogoProps) {
  const sizeStyles = {
    small: { fontSize: theme.typography.fontSize.lg, letterSpacing: 1 },
    medium: { fontSize: theme.typography.fontSize['2xl'], letterSpacing: 2 },
    large: { fontSize: theme.typography.fontSize['3xl'], letterSpacing: 3 },
  };

  const getContainerStyle = () => {
    switch (variant) {
      case 'vertical':
        return styles.verticalContainer;
      case 'single-line':
        return styles.singleLineContainer;
      default:
        return styles.horizontalContainer;
    }
  };

  if (variant === 'single-line') {
    return (
      <View style={[getContainerStyle(), style]}>
        <Text style={[styles.singleLine, sizeStyles[size]]}>TrueSharp</Text>
      </View>
    );
  }

  return (
    <View style={[getContainerStyle(), style]}>
      <Text style={[styles.true, sizeStyles[size]]}>True</Text>
      <Text style={[styles.sharp, sizeStyles[size]]}>Sharp</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verticalContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  singleLineContainer: {
    alignItems: 'center',
  },
  true: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  sharp: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primaryDark,
  },
  singleLine: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    textAlign: 'center',
  },
});