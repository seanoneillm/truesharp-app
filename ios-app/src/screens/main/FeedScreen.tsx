import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { globalStyles } from '../../styles/globalStyles';
import { theme } from '../../styles/theme';

export default function FeedScreen() {
  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Icon
            name="people-outline"
            size={80}
            color={theme.colors.text.light}
            style={styles.icon}
          />
          <Text style={styles.title}>Feed</Text>
          <Text style={styles.subtitle}>
            Connect with the betting community
          </Text>
          <Text style={styles.description}>
            Follow other bettors, share your picks, and engage with the community. 
            Discover trending bets, join discussions, and learn from successful 
            bettors in the TrueSharp community.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  icon: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '700' as const,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.light,
    textAlign: 'center',
    lineHeight: 24,
  },
});