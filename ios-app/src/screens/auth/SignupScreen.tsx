import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  TouchableOpacity,
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
import TrueSharpLogo from '../../components/common/TrueSharpLogo';
import TrueSharpShield from '../../components/common/TrueSharpShield';
import LegalModals from '../../components/auth/LegalModals';

type SignupScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, 'Signup'>;
};

interface SignupForm {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  verifyAge: boolean;
}

export default function SignupScreen({ navigation }: SignupScreenProps) {
  const { signUp } = useAuth();
  const [form, setForm] = useState<SignupForm>({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    agreeToPrivacy: false,
    verifyAge: false,
  });
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLegalModals, setShowLegalModals] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: ValidationError[] = [];

    // Email validation
    if (!form.email.trim()) {
      newErrors.push({ field: 'email', message: 'Email is required' });
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.push({ field: 'email', message: 'Please enter a valid email address' });
    }

    // Username validation
    if (!form.username.trim()) {
      newErrors.push({ field: 'username', message: 'Username is required' });
    } else if (form.username.length < 3) {
      newErrors.push({ field: 'username', message: 'Username must be at least 3 characters' });
    } else if (form.username.length > 20) {
      newErrors.push({ field: 'username', message: 'Username must be less than 20 characters' });
    } else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      newErrors.push({ field: 'username', message: 'Username can only contain letters, numbers, and underscores' });
    }

    // Password validation
    if (!form.password.trim()) {
      newErrors.push({ field: 'password', message: 'Password is required' });
    } else if (form.password.length < 8) {
      newErrors.push({ field: 'password', message: 'Password must be at least 8 characters' });
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      newErrors.push({ field: 'password', message: 'Password must contain uppercase, lowercase, and number' });
    }

    // Confirm password validation
    if (!form.confirmPassword.trim()) {
      newErrors.push({ field: 'confirmPassword', message: 'Please confirm your password' });
    } else if (form.password !== form.confirmPassword) {
      newErrors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
    }

    // Checkbox validation
    if (!form.agreeToTerms) {
      newErrors.push({ field: 'agreeToTerms', message: 'You must agree to the Terms of Service' });
    }
    if (!form.agreeToPrivacy) {
      newErrors.push({ field: 'agreeToPrivacy', message: 'You must agree to the Privacy Policy' });
    }
    if (!form.verifyAge) {
      newErrors.push({ field: 'verifyAge', message: 'You must be 21 or older to use this service' });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const getFieldError = (field: string): string | undefined => {
    return errors.find(error => error.field === field)?.message;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await signUp({
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        agreeToTerms: form.agreeToTerms,
        agreeToPrivacy: form.agreeToPrivacy,
        verifyAge: form.verifyAge,
      });
    } catch (error: any) {
      setLoading(false);
      Alert.alert(
        'Signup Failed',
        error.message || 'Failed to create account. Please try again.'
      );
    }
  };

  const updateForm = (field: keyof SignupForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors.some(error => error.field === field)) {
      setErrors(prev => prev.filter(error => error.field !== field));
    }
  };

  const showLegalDocuments = () => {
    setShowLegalModals(true);
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
              <View style={styles.shieldSection}>
                <TrueSharpShield size={48} variant="default" />
              </View>
              <View style={styles.logoSection}>
                <TrueSharpLogo size="large" variant="single-line" />
              </View>
            </View>

            {/* Welcome Header */}
            <View style={styles.header}>
              <Text style={[globalStyles.h1, styles.title]}>Create Account</Text>
              <Text style={[globalStyles.bodySecondary, styles.subtitle]}>
                Join TrueSharp and start tracking your bets
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
                label="Username"
                value={form.username}
                onChangeText={(text) => updateForm('username', text)}
                placeholder="Choose a username"
                autoCapitalize="none"
                error={getFieldError('username')}
                required
              />

              <InputField
                label="Password"
                value={form.password}
                onChangeText={(text) => updateForm('password', text)}
                placeholder="Create a password"
                secureTextEntry
                error={getFieldError('password')}
                required
              />

              <InputField
                label="Confirm Password"
                value={form.confirmPassword}
                onChangeText={(text) => updateForm('confirmPassword', text)}
                placeholder="Confirm your password"
                secureTextEntry
                error={getFieldError('confirmPassword')}
                required
              />

              {/* Agreement Checkboxes */}
              <View style={styles.agreementSection}>
                <CheckboxField
                  label="I agree to the"
                  value={form.agreeToTerms && form.agreeToPrivacy}
                  onValueChange={(value) => {
                    updateForm('agreeToTerms', value);
                    updateForm('agreeToPrivacy', value);
                  }}
                  linkText="Terms of Service and Privacy Policy"
                  onLinkPress={showLegalDocuments}
                  required
                />
                {(getFieldError('agreeToTerms') || getFieldError('agreeToPrivacy')) && (
                  <Text style={[globalStyles.errorText, styles.checkboxError]}>
                    {getFieldError('agreeToTerms') || getFieldError('agreeToPrivacy')}
                  </Text>
                )}

                <CheckboxField
                  label="I am 21 years of age or older"
                  value={form.verifyAge}
                  onValueChange={(value) => updateForm('verifyAge', value)}
                  required
                />
                {getFieldError('verifyAge') && (
                  <Text style={[globalStyles.errorText, styles.checkboxError]}>
                    {getFieldError('verifyAge')}
                  </Text>
                )}
              </View>

              <LoadingButton
                title="Create Account"
                onPress={handleSignup}
                loading={loading}
                style={styles.signupButton}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={globalStyles.body}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Legal Modals */}
      <LegalModals
        isVisible={showLegalModals}
        onClose={() => setShowLegalModals(false)}
      />
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
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  brandingSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
  shieldSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  logoSection: {
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
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
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  agreementSection: {
    marginVertical: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  checkboxError: {
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  signupButton: {
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  loginLink: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    fontSize: theme.typography.fontSize.base,
  },
});