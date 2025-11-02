import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  
  screenNoPadding: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  column: {
    flexDirection: 'column',
  },
  
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Typography
  h1: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: '700' as const,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.lineHeight.tight * theme.typography.fontSize['3xl'],
  },
  
  h2: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '700' as const,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.lineHeight.tight * theme.typography.fontSize['2xl'],
  },
  
  h3: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600' as const,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.xl,
  },
  
  h4: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600' as const,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.lg,
  },
  
  body: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '400' as const,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.base,
  },
  
  bodySecondary: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '400' as const,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.base,
  },
  
  caption: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '400' as const,
    color: theme.colors.text.light,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
  },
  
  // Buttons
  button: {
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  
  buttonSecondary: {
    backgroundColor: theme.colors.secondary,
  },
  
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  
  buttonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600' as const,
    color: theme.colors.text.inverse,
  },
  
  buttonTextOutline: {
    color: theme.colors.text.primary,
  },
  
  // Forms
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background,
    minHeight: 48,
  },
  
  inputFocused: {
    borderColor: theme.colors.primary,
  },
  
  inputError: {
    borderColor: theme.colors.status.error,
  },
  
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500' as const,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.status.error,
    marginTop: theme.spacing.xs,
  },
  
  // Spacing utilities
  mt: {
    marginTop: theme.spacing.md,
  },
  
  mb: {
    marginBottom: theme.spacing.md,
  },
  
  ml: {
    marginLeft: theme.spacing.md,
  },
  
  mr: {
    marginRight: theme.spacing.md,
  },
  
  mx: {
    marginHorizontal: theme.spacing.md,
  },
  
  my: {
    marginVertical: theme.spacing.md,
  },
  
  pt: {
    paddingTop: theme.spacing.md,
  },
  
  pb: {
    paddingBottom: theme.spacing.md,
  },
  
  pl: {
    paddingLeft: theme.spacing.md,
  },
  
  pr: {
    paddingRight: theme.spacing.md,
  },
  
  px: {
    paddingHorizontal: theme.spacing.md,
  },
  
  py: {
    paddingVertical: theme.spacing.md,
  },
});