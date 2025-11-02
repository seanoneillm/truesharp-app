import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { InputFieldProps } from '../../types';
import { globalStyles } from '../../styles/globalStyles';
import { theme } from '../../styles/theme';

export default function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  required = false,
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  const getInputStyle = () => {
    return [
      globalStyles.input,
      isFocused && globalStyles.inputFocused,
      error && globalStyles.inputError,
    ].filter(Boolean);
  };

  return (
    <View style={styles.container}>
      <Text style={globalStyles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={getInputStyle()}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text.light}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {error && <Text style={globalStyles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  required: {
    color: theme.colors.status.error,
  },
});