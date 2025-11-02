import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { CheckboxProps } from '../../types';
import { globalStyles } from '../../styles/globalStyles';
import { theme } from '../../styles/theme';

export default function CheckboxField({
  label,
  value,
  onValueChange,
  required = false,
  linkText,
  onLinkPress,
}: CheckboxProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => onValueChange(!value)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, value && styles.checkboxChecked]}>
          {value && (
            <Icon
              name="checkmark"
              size={16}
              color={theme.colors.text.inverse}
            />
          )}
        </View>
        <View style={styles.labelContainer}>
          <Text style={[globalStyles.body, styles.label]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
            {linkText && (
              <Text
                style={styles.link}
                onPress={onLinkPress}
              >
                {' ' + linkText}
              </Text>
            )}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    lineHeight: 20,
  },
  required: {
    color: theme.colors.status.error,
  },
  link: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
});