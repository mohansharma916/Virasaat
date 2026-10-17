import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { IconButton } from '@/src/components/IconButton';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

type ScreenHeaderProps = {
  // Omit on tab roots: tabs never show a back button.
  onBack?: (() => void) | 'default';
  backLabel?: string;
  title?: string;
  trailing?: ReactNode;
};

// One 56dp app bar for every stack screen: 48dp back button, centred
// wordmark (or title) and an optional trailing action.
export function ScreenHeader({ onBack, backLabel = 'Go back', title, trailing }: ScreenHeaderProps) {
  // Screens reached with router.replace have no history; hide back rather than show a dead button.
  const handleBack = onBack === 'default' ? (router.canGoBack() ? () => router.back() : undefined) : onBack;

  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        {handleBack ? <IconButton icon="chevronLeft" accessibilityLabel={backLabel} onPress={handleBack} /> : null}
      </View>
      {title ? (
        <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
      ) : (
        <Text style={styles.brand} accessibilityLabel="Virasat">
          VIRASAT
        </Text>
      )}
      <View style={[styles.side, styles.trailing]}>{trailing}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 56,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: { width: 56, alignItems: 'flex-start', justifyContent: 'center' },
  trailing: { alignItems: 'flex-end' },
  brand: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typography.fonts.playfair.bold,
    fontSize: 20,
    letterSpacing: 3,
    color: colors.primary.deepForest,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.title3,
    color: colors.neutral.textPrimary,
  },
});
