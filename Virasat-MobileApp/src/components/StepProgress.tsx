import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

// The single source of truth for onboarding progress. Screens pass the phase
// they belong to rather than hard-coding dots.
export const ONBOARDING_PHASES = ['Account', 'Legacy', 'Rules'] as const;
export type OnboardingPhase = (typeof ONBOARDING_PHASES)[number];

export function StepProgress({ phase }: { phase: OnboardingPhase }) {
  const current = ONBOARDING_PHASES.indexOf(phase);
  const label = `Step ${current + 1} of ${ONBOARDING_PHASES.length}: ${phase}`;

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 1, max: ONBOARDING_PHASES.length, now: current + 1 }}
    >
      <View style={styles.track}>
        {ONBOARDING_PHASES.map((name, index) => (
          <View key={name} style={[styles.segment, index <= current && styles.segmentDone]} />
        ))}
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  track: { flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.brand.sage },
  segmentDone: { backgroundColor: colors.primary.forest },
  label: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
    color: colors.neutral.textSecondary,
  },
});
