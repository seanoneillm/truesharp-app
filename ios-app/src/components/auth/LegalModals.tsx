import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../styles/theme';

interface LegalModalsProps {
  isVisible: boolean;
  onClose: () => void;
}

type ModalType = 'menu' | 'terms' | 'privacy';

const { height: screenHeight } = Dimensions.get('window');

export default function LegalModals({ isVisible, onClose }: LegalModalsProps) {
  const [activeModal, setActiveModal] = useState<ModalType>('menu');

  const handleClose = () => {
    setActiveModal('menu');
    onClose();
  };

  const renderMenuModal = () => (
    <View style={styles.modalContainer}>
      <SafeAreaView style={styles.menuModal}>
        <View style={styles.menuHeader}>
          <Text style={styles.modalTitle}>Legal Documents</Text>
          <TouchableOpacity style={styles.headerCloseButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.menuContent}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setActiveModal('terms')}
          >
            <Text style={styles.menuButtonTitle}>Terms of Service</Text>
            <Text style={styles.menuButtonSubtitle}>
              Our terms and conditions for using TrueSharp
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setActiveModal('privacy')}
          >
            <Text style={styles.menuButtonTitle}>Privacy Policy</Text>
            <Text style={styles.menuButtonSubtitle}>
              How we collect, use, and protect your data
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );

  const renderTermsModal = () => (
    <View style={styles.modalContainer}>
      <SafeAreaView style={styles.fullModal}>
        <View style={styles.modalHeader}>
          <TouchableOpacity 
            onPress={() => setActiveModal('menu')}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Terms of Service</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
          <View style={styles.contentContainer}>
            <Text style={styles.documentHeader}>TrueSharp LLC – Terms of Service</Text>
            <Text style={styles.dateText}>Effective Date: July 16, 2025</Text>
            <Text style={styles.dateText}>Last Updated: July 16, 2025</Text>

            <Text style={styles.bodyText}>
              Welcome to TrueSharp, a platform operated by TrueSharp LLC ("TrueSharp," "we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of the TrueSharp website, mobile application, and related services (collectively, the "Service").
            </Text>

            <Text style={styles.bodyText}>
              By creating an account, accessing, or using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree, do not use the Service.
            </Text>

            <Text style={styles.sectionTitle}>1. Eligibility</Text>
            <View style={styles.bulletContainer}>
              <Text style={styles.bulletText}>• You must be at least 21 years of age (or the legal age of majority in your jurisdiction, whichever is higher).</Text>
              <Text style={styles.bulletText}>• You are solely responsible for ensuring that your use of the Service complies with local, state, and federal laws where you reside.</Text>
              <Text style={styles.bulletText}>• We may suspend or terminate accounts that violate eligibility requirements.</Text>
            </View>

            <Text style={styles.sectionTitle}>2. Nature of Service</Text>
            <Text style={styles.bodyText}>TrueSharp is a content and analytics platform that enables users to:</Text>
            <View style={styles.bulletContainer}>
              <Text style={styles.bulletText}>• Publish, track, and evaluate sports betting strategies;</Text>
              <Text style={styles.bulletText}>• Monetize strategies via paid subscriptions;</Text>
              <Text style={styles.bulletText}>• Access analytics, rankings, and community features.</Text>
            </View>
            <Text style={styles.bodyText}>TrueSharp is not a sportsbook. We:</Text>
            <View style={styles.bulletContainer}>
              <Text style={styles.bulletText}>• Do not accept, process, or facilitate wagers of any kind;</Text>
              <Text style={styles.bulletText}>• Do not provide gambling services;</Text>
              <Text style={styles.bulletText}>• Do not guarantee the accuracy, profitability, or outcomes of any strategies.</Text>
            </View>
            <Text style={styles.bodyText}>All information and content are provided for entertainment and educational purposes only.</Text>

            <Text style={styles.sectionTitle}>3. Account Registration and User Conduct</Text>
            <Text style={styles.bodyText}>When creating an account, you agree to:</Text>
            <View style={styles.bulletContainer}>
              <Text style={styles.bulletText}>• Provide truthful, accurate, and current information;</Text>
              <Text style={styles.bulletText}>• Keep your login credentials secure;</Text>
              <Text style={styles.bulletText}>• Be responsible for all activity on your account.</Text>
            </View>
            <Text style={styles.bodyText}>You may not:</Text>
            <View style={styles.bulletContainer}>
              <Text style={styles.bulletText}>• Misrepresent your identity or impersonate others;</Text>
              <Text style={styles.bulletText}>• Attempt to manipulate platform rankings, metrics, or payouts;</Text>
              <Text style={styles.bulletText}>• Post unlawful, defamatory, fraudulent, or harmful content;</Text>
              <Text style={styles.bulletText}>• Engage in harassment, spamming, or exploitation of other users.</Text>
            </View>
            <Text style={styles.bodyText}>We reserve the right to investigate, suspend, or terminate accounts that violate these Terms or applicable law.</Text>

            <Text style={styles.sectionTitle}>4. Monetizing Strategies</Text>
            <View style={styles.bulletContainer}>
              <Text style={styles.bulletText}>• Users may publish strategies upon registration.</Text>
              <Text style={styles.bulletText}>• Sellers may monetize strategies through paid subscriptions.</Text>
              <Text style={styles.bulletText}>• All submissions are timestamped, permanently recorded, and locked upon posting.</Text>
              <Text style={styles.bulletText}>• Verified Seller status may be granted based on transparent and consistent performance.</Text>
              <Text style={styles.bulletText}>• TrueSharp may suspend, limit, or revoke monetization privileges if abuse, manipulation, or policy violations are detected.</Text>
            </View>

            <Text style={styles.sectionTitle}>5. Subscriptions, Billing & Cancellation</Text>
            <View style={styles.bulletContainer}>
              <Text style={styles.bulletText}>• Payments are securely processed through Stripe or other authorized providers.</Text>
              <Text style={styles.bulletText}>• Subscriptions renew automatically each billing cycle until canceled.</Text>
              <Text style={styles.bulletText}>• No refunds are provided once a payment has been processed.</Text>
              <Text style={styles.bulletText}>• Users may cancel at any time via the account dashboard (cancellations stop future charges but do not refund the current cycle).</Text>
              <Text style={styles.bulletText}>• Sellers receive periodic payouts, net of platform and processing fees.</Text>
            </View>

            <Text style={styles.sectionTitle}>6. Contact Us</Text>
            <Text style={styles.bodyText}>For questions or concerns about these Terms, please contact:</Text>
            <Text style={styles.contactText}>TrueSharp LLC</Text>
            <Text style={styles.contactText}>📧 Email: info@truesharp.com</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );

  const renderPrivacyModal = () => (
    <View style={styles.modalContainer}>
      <SafeAreaView style={styles.fullModal}>
        <View style={styles.modalHeader}>
          <TouchableOpacity 
            onPress={() => setActiveModal('menu')}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Privacy Policy</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
          <View style={styles.contentContainer}>
            <Text style={styles.documentHeader}>TrueSharp LLC – Privacy Policy</Text>
            <Text style={styles.dateText}>Effective Date: July 16, 2025</Text>

            <Text style={styles.bodyText}>
              TrueSharp LLC ("TrueSharp," "we," "our," or "us") values your trust and is committed to protecting your privacy. This Privacy Policy explains how we collect, use, share, and protect your personal information when you use our web application, website, and related services (collectively, the "Platform").
            </Text>

            <Text style={styles.bodyText}>
              By accessing or using the Platform, you agree to this Privacy Policy. If you do not agree, please discontinue use immediately.
            </Text>

            <Text style={styles.sectionTitle}>1. Information We Collect</Text>
            <Text style={styles.bodyText}>We collect information in the following categories:</Text>
            <View style={styles.bulletContainer}>
              <Text style={styles.bulletText}><Text style={styles.boldText}>Account Information:</Text> Name, email address, username, password or login credentials.</Text>
              <Text style={styles.bulletText}><Text style={styles.boldText}>Activity Data:</Text> Content you create (such as strategy posts, comments, likes, follows), interactions with other users, and subscription preferences.</Text>
              <Text style={styles.bulletText}><Text style={styles.boldText}>Transactional Data:</Text> Payment history, subscription details, and limited information processed via third-party payment processors (we do not store full credit card details).</Text>
              <Text style={styles.bulletText}><Text style={styles.boldText}>Technical & Device Data:</Text> IP address, browser type, operating system, cookies, session identifiers, log files, and usage analytics.</Text>
              <Text style={styles.bulletText}><Text style={styles.boldText}>Communications:</Text> Messages you send to our support team, feedback, or survey responses.</Text>
            </View>

            <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
            <Text style={styles.bodyText}>We process personal data only for legitimate business purposes, including:</Text>
            <View style={styles.bulletContainer}>
              <Text style={styles.bulletText}><Text style={styles.boldText}>Platform Functionality:</Text> Operating, maintaining, and improving the Platform.</Text>
              <Text style={styles.bulletText}><Text style={styles.boldText}>User Experience:</Text> Delivering analytics, insights, and personalized features.</Text>
              <Text style={styles.bulletText}><Text style={styles.boldText}>Communications:</Text> Sending confirmations, account updates, onboarding guidance, alerts, and optional marketing communications (with opt-out options).</Text>
              <Text style={styles.bulletText}><Text style={styles.boldText}>Compliance & Safety:</Text> Detecting fraud, preventing misuse, and meeting legal or regulatory obligations.</Text>
              <Text style={styles.bulletText}><Text style={styles.boldText}>Research & Development:</Text> Improving features, content, and services through aggregated and anonymized data analysis.</Text>
            </View>

            <Text style={styles.sectionTitle}>3. Your Rights</Text>
            <Text style={styles.bodyText}>Depending on your jurisdiction, you may have the following rights:</Text>
            <View style={styles.bulletContainer}>
              <Text style={styles.bulletText}><Text style={styles.boldText}>Access:</Text> Request a copy of the personal data we hold about you.</Text>
              <Text style={styles.bulletText}><Text style={styles.boldText}>Correction:</Text> Update or correct inaccurate or incomplete information.</Text>
              <Text style={styles.bulletText}><Text style={styles.boldText}>Deletion:</Text> Request deletion of your account and associated personal data.</Text>
              <Text style={styles.bulletText}><Text style={styles.boldText}>Marketing Preferences:</Text> Opt out of receiving promotional communications at any time.</Text>
            </View>
            <Text style={styles.bodyText}>To exercise these rights, contact us at support@truesharp.com. We may require verification of your identity before fulfilling requests.</Text>

            <Text style={styles.sectionTitle}>4. Contact Us</Text>
            <Text style={styles.bodyText}>If you have questions or concerns about this Privacy Policy, please contact:</Text>
            <Text style={styles.contactText}>TrueSharp LLC</Text>
            <Text style={styles.contactText}>Email: info@truesharp.com</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );

  const renderContent = () => {
    switch (activeModal) {
      case 'terms':
        return renderTermsModal();
      case 'privacy':
        return renderPrivacyModal();
      default:
        return renderMenuModal();
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      {renderContent()}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  menuModal: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  menuContent: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  headerCloseButton: {
    paddingVertical: theme.spacing.sm,
    paddingLeft: theme.spacing.md,
  },
  fullModal: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  backButton: {
    paddingVertical: theme.spacing.sm,
    paddingRight: theme.spacing.md,
  },
  backButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  closeButton: {
    paddingVertical: theme.spacing.sm,
    paddingLeft: theme.spacing.md,
  },
  closeButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  menuButton: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  menuButtonTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  menuButtonSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 3,
  },
  documentHeader: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  dateText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  bodyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight: 24,
    marginBottom: theme.spacing.md,
  },
  bulletContainer: {
    marginBottom: theme.spacing.md,
  },
  bulletText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight: 24,
    marginBottom: theme.spacing.sm,
    paddingLeft: theme.spacing.sm,
  },
  boldText: {
    fontWeight: theme.typography.fontWeight.semibold,
  },
  contactText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight: 24,
    marginBottom: theme.spacing.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
});