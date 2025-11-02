import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { LoadingButtonProps } from '../../types';
import { globalStyles } from '../../styles/globalStyles';
import { theme } from '../../styles/theme';

export default function LoadingButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  variant = 'primary',
}: LoadingButtonProps) {
  const getButtonStyle = () => {
    return [
      globalStyles.button,
      variant === 'primary' && globalStyles.buttonPrimary,
      variant === 'secondary' && globalStyles.buttonSecondary,
      variant === 'outline' && globalStyles.buttonOutline,
      (disabled || loading) && styles.disabled,
      style,
    ].filter(Boolean);
  };

  const getTextStyle = () => {
    return [
      globalStyles.buttonText,
      variant === 'outline' && globalStyles.buttonTextOutline,
      (disabled || loading) && styles.disabledText,
    ].filter(Boolean);
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? theme.colors.text.primary : theme.colors.text.inverse}
          size="small"
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.6,
  },
  disabledText: {
    opacity: 0.6,
  },
});