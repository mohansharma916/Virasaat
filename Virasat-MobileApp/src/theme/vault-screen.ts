import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { typography } from './typography';

export const vaultScreenStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.brand.ivory },
  content: { padding: 24, gap: 16, paddingBottom: 40 },
  heading: { fontFamily: typography.fonts.playfair.semiBold, fontSize: 28, color: colors.primary.deepForest },
  text: { fontFamily: typography.fonts.inter.regular, fontSize: 14, lineHeight: 21, color: colors.neutral.textSecondary },
  label: { fontFamily: typography.fonts.inter.semiBold, fontSize: 14, color: colors.primary.deepForest },
  card: { padding: 18, gap: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.neutral.border, backgroundColor: colors.neutral.white },
  input: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.neutral.border, backgroundColor: colors.neutral.white, color: colors.neutral.textPrimary, fontSize: 15 },
  button: { padding: 16, borderRadius: 12, backgroundColor: colors.primary.forest, alignItems: 'center' },
  buttonText: { fontFamily: typography.fonts.inter.semiBold, fontSize: 14, color: colors.neutral.white },
  link: { paddingVertical: 12, color: colors.primary.forest, fontSize: 15 },
  error: { color: colors.semantic.error, fontSize: 14, lineHeight: 21 },
  disabled: { opacity: 0.5 },
});
