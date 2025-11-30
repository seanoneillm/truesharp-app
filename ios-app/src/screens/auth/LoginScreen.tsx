import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParamList, ValidationError } from '../../types';
import { globalStyles } from '../../styles/globalStyles';
import { theme } from '../../styles/theme';

import InputField from '../../components/common/InputField';
import CheckboxField from '../../components/common/CheckboxField';
import LoadingButton from '../../components/common/LoadingButton';

type LoginScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, 'Login'>;
};

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { signIn, resetPassword } = useAuth();
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: ValidationError[] = [];

    if (!form.email.trim()) {
      newErrors.push({ field: 'email', message: 'Email is required' });
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.push({ field: 'email', message: 'Please enter a valid email address' });
    }

    if (!form.password.trim()) {
      newErrors.push({ field: 'password', message: 'Password is required' });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const getFieldError = (field: string): string | undefined => {
    return errors.find(error => error.field === field)?.message;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await signIn({
        email: form.email.trim(),
        password: form.password,
        rememberMe: form.rememberMe,
      });
    } catch (error: any) {
      setLoading(false);
      Alert.alert(
        'Login Failed',
        error.message || 'Failed to sign in. Please check your credentials and try again.'
      );
    }
  };

  const handleForgotPassword = () => {
    if (!form.email.trim()) {
      Alert.alert(
        'Email Required',
        'Please enter your email address first, then tap "Forgot Password?" again.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Reset Password',
      `Send password reset instructions to ${form.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              await resetPassword(form.email.trim());
              Alert.alert(
                'Check Your Email',
                'Password reset instructions have been sent to your email address.'
              );
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.message || 'Failed to send reset email. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const updateForm = (field: keyof LoginForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors.some(error => error.field === field)) {
      setErrors(prev => prev.filter(error => error.field !== field));
    }
  };

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={globalStyles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Branding Header */}
            <View style={styles.brandingSection}>
              <View style={styles.logoContainer}>
                <Image 
                  source={require('../../assets/truesharp-logo.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Welcome Header */}
            <View style={styles.header}>
              <Text style={[globalStyles.h1, styles.title]}>Welcome Back</Text>
              <Text style={[globalStyles.bodySecondary, styles.subtitle]}>
                Sign in to continue to your account
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <InputField
                label="Email"
                value={form.email}
                onChangeText={(text) => updateForm('email', text)}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                error={getFieldError('email')}
                required
              />

              <InputField
                label="Password"
                value={form.password}
                onChangeText={(text) => updateForm('password', text)}
                placeholder="Enter your password"
                secureTextEntry
                error={getFieldError('password')}
                required
              />

              <View style={styles.optionsRow}>
                <CheckboxField
                  label="Remember me"
                  value={form.rememberMe}
                  onValueChange={(value) => updateForm('rememberMe', value)}
                />
                
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotPassword}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <LoadingButton
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                style={styles.loginButton}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={globalStyles.body}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  brandingSection: {
    alignItems: 'center',
    marginBottom: theme.spacing['3xl'],
    paddingTop: theme.spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 240,
    height: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
    paddingHorizontal: theme.spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
  },
  form: {
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.xl,
    ...theme.shadows.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginHorizontal: theme.spacing.xs,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  forgotPassword: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  loginButton: {
    marginTop: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  signupLink: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    fontSize: theme.typography.fontSize.base,
  },
});