import React from 'react'
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path } from 'react-native-svg'
import { theme } from '../../styles/theme'
import { globalStyles } from '../../styles/globalStyles'

const socials = {
  x: 'https://x.com/truesharpsports?s=21',
  instagram: 'https://www.instagram.com/truesharpsports?igsh=Mm14djk3Nno0NHVx',
  discord: 'https://discord.com/invite/HWpU6cGhZa',
  tiktok: 'https://www.tiktok.com/@truesharp?_r=1&_t=ZT-91YeGNWnMLn',
}

// Custom X Logo Component
const XLogo = ({ size = 24, color = "white" }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </Svg>
)

// Custom TikTok Logo Component
const TikTokLogo = ({ size = 24, color = "white" }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </Svg>
)

interface SocialButtonProps {
  icon?: keyof typeof Ionicons.glyphMap
  customIcon?: React.ReactNode
  title: string
  subtitle: string
  url: string
  colors: string[]
  onPress: () => void
}

const SocialButton: React.FC<SocialButtonProps> = ({
  icon,
  customIcon,
  title,
  subtitle,
  url,
  colors,
  onPress,
}) => (
  <TouchableOpacity style={styles.socialButtonContainer} onPress={onPress}>
    <LinearGradient colors={colors} style={styles.socialButton}>
      <View style={styles.socialButtonContent}>
        <View style={styles.iconContainer}>
          {customIcon ? customIcon : <Ionicons name={icon!} size={32} color="white" />}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.socialTitle}>{title}</Text>
          <Text style={styles.socialSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
      </View>
    </LinearGradient>
  </TouchableOpacity>
)

interface ConnectWithUsModalProps {
  onClose: () => void
}

const ConnectWithUsModal: React.FC<ConnectWithUsModalProps> = ({ onClose }) => {
  const openURL = async (url: string, platform: string) => {
    if (!url) {
      Alert.alert('Coming Soon', `${platform} link will be available soon!`)
      return
    }

    try {
      const supported = await Linking.canOpenURL(url)
      if (supported) {
        await Linking.openURL(url)
      } else {
        Alert.alert('Error', `Cannot open ${platform}`)
      }
    } catch (error) {
      console.error('Error opening URL:', error)
      Alert.alert('Error', `Failed to open ${platform}`)
    }
  }

  return (
    <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.description}>
        Join the TrueSharp community and stay updated with the latest features, tips, and betting
        insights across all our social platforms.
      </Text>

      <View style={styles.socialsContainer}>
        <SocialButton
          customIcon={<XLogo size={32} color="white" />}
          title="Follow us on X"
          subtitle="Behind the scenes content"
          url={socials.x}
          colors={['#000000', '#1a1a1a']}
          onPress={() => openURL(socials.x, 'X (Twitter)')}
        />

        <SocialButton
          icon="logo-instagram"
          title="Follow us on Instagram"
          subtitle="Latest updates and insights"
          url={socials.instagram}
          colors={['#E4405F', '#C13584', '#833AB4']}
          onPress={() => openURL(socials.instagram, 'Instagram')}
        />

        <SocialButton
          icon="chatbubbles"
          title="Join our Discord"
          subtitle="Connect with the community"
          url={socials.discord}
          colors={['#5865F2', '#4752C4']}
          onPress={() => openURL(socials.discord, 'Discord')}
        />

        <SocialButton
          customIcon={<TikTokLogo size={32} color="white" />}
          title="Follow on TikTok"
          subtitle="Quick betting tips and highlights"
          url={socials.tiktok}
          colors={['#FF0050', '#000000']}
          onPress={() => openURL(socials.tiktok, 'TikTok')}
        />
      </View>

      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>
          Have questions or feedback? Reach out to us at{' '}
          <Text
            style={styles.emailLink}
            onPress={() => Linking.openURL('mailto:info@truesharp.io')}
          >
            info@truesharp.io
          </Text>
        </Text>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  modalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  modalTitle: {
    ...globalStyles.h2,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  description: {
    ...globalStyles.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  socialsContainer: {
    gap: theme.spacing.md,
  },
  socialButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  socialButton: {
    borderRadius: 16,
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  socialTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: 'white',
    marginBottom: 2,
  },
  socialSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  footerContainer: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
  },
  footerText: {
    ...globalStyles.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emailLink: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  bottomPadding: {
    height: 100,
  },
})

export default ConnectWithUsModal