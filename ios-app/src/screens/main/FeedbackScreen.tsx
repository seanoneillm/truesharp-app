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
import { LinearGradient } from 'expo-linear-gradient';
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
        {/* Enhanced Gradient Header */}
        <LinearGradient
          colors={[theme.colors.primary, '#1e40af', '#0f172a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity 
            style={styles.backArrow}
            onPress={() => navigation.goBack()}
          >
            <View style={styles.backButtonContainer}>
              <Ionicons name="arrow-back" size={20} color="white" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={styles.headerTitleContainer}>
              <View style={styles.headerRow}>
                <View style={styles.headerIconContainer}>
                  <Ionicons name="chatbubble" size={16} color="white" />
                </View>
                <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9}>Feedback</Text>
              </View>
              <Text style={styles.headerSubtitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9}>Help us improve TrueSharp</Text>
            </View>
          </View>
          
          <View style={styles.headerSpacer} />
        </LinearGradient>

        {/* Enhanced Feedback Form */}
        <View style={styles.formSection}>
          <View style={styles.formHeader}>
            <View style={styles.formHeaderContent}>
              <Ionicons name="create" size={18} color={theme.colors.primary} />
              <Text style={styles.formLabel} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.9}>
                Share your feedback, suggestions, or report issues
              </Text>
            </View>
          </View>
          
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
              numberOfLines={6}
              textAlignVertical="top"
              editable={!isSubmitting}
              maxLength={2000}
            />
            <View style={styles.characterCount}>
              <Text style={styles.characterCountText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                {feedback.length}/2000 characters
              </Text>
            </View>
          </View>

          <View style={styles.formFooter}>
            <Text style={styles.formFooterText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.9}>
              Your feedback helps us build a better platform for everyone
            </Text>
            
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!feedback.trim() || isSubmitting}
              style={[
                styles.submitButton,
                (!feedback.trim() || isSubmitting) && styles.submitButtonDisabled
              ]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={(!feedback.trim() || isSubmitting) 
                  ? ['#9ca3af', '#6b7280'] 
                  : [theme.colors.primary, '#1e40af']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitButtonGradient}
              >
                {isSubmitting && (
                  <Ionicons name="refresh" size={16} color="white" style={styles.submitButtonIcon} />
                )}
                <Text style={styles.submitButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9}>
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
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

        {/* Enhanced Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <View style={styles.infoHeaderContent}>
              <Ionicons name="information-circle" size={18} color={theme.colors.primary} />
              <Text style={styles.infoTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.9}>
                What kind of feedback are we looking for?
              </Text>
            </View>
          </View>
          
          <View style={styles.feedbackTypesList}>
            {feedbackTypes.map((type, index) => (
              <View key={index} style={styles.feedbackTypeItem}>
                <View style={styles.feedbackTypeIcon}>
                  <Ionicons name={type.icon as any} size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.feedbackTypeContent}>
                  <Text style={styles.feedbackTypeTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.9}>
                    {type.title}
                  </Text>
                  <Text style={styles.feedbackTypeDescription} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
                    {type.description}
                  </Text>
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
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  
  // Enhanced Header Styles - Thinner
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.lg,
    elevation: 8,
  },
  backArrow: {
    padding: theme.spacing.xs,
    zIndex: 1,
  },
  backButtonContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  headerIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    textAlign: 'center',
  },
  // Enhanced Form Section Styles
  formSection: {
    backgroundColor: 'white',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.lg,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
  },
  formHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  formHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  formLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
  },
  textInputContainer: {
    padding: theme.spacing.md,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    backgroundColor: '#f8fafc',
    minHeight: 120,
    textAlignVertical: 'top',
    fontFamily: theme.typography.fontFamily,
  },
  textInputFocused: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: 'white',
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: theme.spacing.xs,
  },
  characterCountText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  formFooter: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  formFooterText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  submitButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    ...theme.shadows.sm,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  submitButtonIcon: {
    marginRight: theme.spacing.xs,
  },
  submitButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.3,
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
  // Enhanced Info Section Styles
  infoSection: {
    backgroundColor: 'white',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.lg,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
  },
  infoHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  infoTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
  },
  feedbackTypesList: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  feedbackTypeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: '#f8fafc',
    borderRadius: theme.borderRadius.sm,
    marginBottom: 2,
  },
  feedbackTypeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  feedbackTypeContent: {
    flex: 1,
  },
  feedbackTypeTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs / 2,
  },
  feedbackTypeDescription: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },
  bottomSpacing: {
    height: theme.spacing.lg,
  },
});