import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { globalStyles } from '../../styles/globalStyles';
import { theme } from '../../styles/theme';
import { supabase } from '../../lib/supabase';
import { MainStackParamList } from '../../types';
import LoadingButton from '../../components/common/LoadingButton';

type NavigationProp = StackNavigationProp<MainStackParamList>;

interface FeedbackType {
  icon: string;
  title: string;
  description: string;
}

const feedbackTypes: FeedbackType[] = [
  {
    icon: 'bulb',
    title: 'Feature requests and suggestions',
    description: 'Ideas for new features or improvements',
  },
  {
    icon: 'bug',
    title: 'Bug reports and technical issues',
    description: 'Problems you\'ve encountered while using the app',
  },
  {
    icon: 'phone-portrait',
    title: 'User experience feedback',
    description: 'Interface suggestions and usability improvements',
  },
  {
    icon: 'heart',
    title: 'General thoughts',
    description: 'How we can make TrueSharp better overall',
  },
];

export default function FeedbackScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      Alert.alert('Missing Feedback', 'Please enter your feedback before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          feedback_text: feedback.trim(),
        });

      if (error) {
        console.error('Error submitting feedback:', error);
        setSubmitResult('Error submitting feedback. Please try again.');
        Alert.alert('Submission Failed', 'There was an error submitting your feedback. Please try again.');
      } else {
        setFeedback('');
        setSubmitResult('Thank you for your feedback!');
        Alert.alert(
          'Feedback Submitted',
          'Thank you for your feedback! We appreciate your input and will use it to improve TrueSharp.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setSubmitResult('Unexpected error occurred. Please try again.');
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backArrow}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={theme.colors.text.inverse} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="chatbubble" size={24} color={theme.colors.text.inverse} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Feedback</Text>
              <Text style={styles.headerSubtitle}>Help us improve TrueSharp</Text>
            </View>
          </View>
        </View>

        {/* Feedback Form */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>
            Share your feedback, suggestions, or report issues
          </Text>
          
          <View style={styles.textInputContainer}>
            <TextInput
              style={[
                styles.textInput,
                feedback.length > 0 && styles.textInputFocused,
              ]}
              value={feedback}
              onChangeText={setFeedback}
              placeholder="Tell us what you think... What features would you like to see? What could we improve?"
              placeholderTextColor={theme.colors.text.light}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              editable={!isSubmitting}
              maxLength={2000}
            />
            <View style={styles.characterCount}>
              <Text style={styles.characterCountText}>
                {feedback.length}/2000 characters
              </Text>
            </View>
          </View>

          <View style={styles.formFooter}>
            <Text style={styles.formFooterText}>
              Your feedback helps us build a better platform for everyone
            </Text>
            
            <LoadingButton
              title={isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={!feedback.trim()}
              style={styles.submitButton}
            />
          </View>

          {submitResult && (
            <View style={[
              styles.resultContainer,
              submitResult.includes('Error') || submitResult.includes('error')
                ? styles.errorResult
                : styles.successResult
            ]}>
              <Ionicons
                name={submitResult.includes('Error') || submitResult.includes('error') ? 'alert-circle' : 'checkmark-circle'}
                size={20}
                color={submitResult.includes('Error') || submitResult.includes('error') ? theme.colors.status.error : theme.colors.status.success}
              />
              <Text style={[
                styles.resultText,
                submitResult.includes('Error') || submitResult.includes('error')
                  ? styles.errorText
                  : styles.successText
              ]}>
                {submitResult}
              </Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What kind of feedback are we looking for?</Text>
          
          <View style={styles.feedbackTypesList}>
            {feedbackTypes.map((type, index) => (
              <View key={index} style={styles.feedbackTypeItem}>
                <View style={styles.feedbackTypeIcon}>
                  <Ionicons name={type.icon as any} size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.feedbackTypeContent}>
                  <Text style={styles.feedbackTypeTitle}>{type.title}</Text>
                  <Text style={styles.feedbackTypeDescription}>{type.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  backArrow: {
    position: 'absolute',
    left: theme.spacing.lg,
    top: theme.spacing.lg,
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: theme.colors.primary,
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    ...theme.shadows.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: theme.spacing.xl, // Add padding to avoid overlap with back button
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  formSection: {
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.md,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  textInputContainer: {
    marginBottom: theme.spacing.lg,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    fontSize: 16,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background,
    minHeight: 140,
    textAlignVertical: 'top',
  },
  textInputFocused: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: theme.spacing.sm,
  },
  characterCountText: {
    fontSize: 12,
    color: theme.colors.text.light,
  },
  formFooter: {
    gap: theme.spacing.lg,
  },
  formFooterText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
  },
  successResult: {
    backgroundColor: theme.colors.status.success + '15',
    borderWidth: 1,
    borderColor: theme.colors.status.success + '30',
  },
  errorResult: {
    backgroundColor: theme.colors.status.error + '15',
    borderWidth: 1,
    borderColor: theme.colors.status.error + '30',
  },
  resultText: {
    fontSize: 16,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  successText: {
    color: theme.colors.status.success,
  },
  errorText: {
    color: theme.colors.status.error,
  },
  infoSection: {
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.sm,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  feedbackTypesList: {
    gap: theme.spacing.lg,
  },
  feedbackTypeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  feedbackTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  feedbackTypeContent: {
    flex: 1,
  },
  feedbackTypeTitle: {
    fontSize: 16,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  feedbackTypeDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: theme.spacing['2xl'],
  },
});