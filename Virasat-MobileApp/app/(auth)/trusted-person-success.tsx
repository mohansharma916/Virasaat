import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ActionBar } from '@/src/components/ActionBar';
import { AppIcon } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { InlineNotice } from '@/src/components/InlineNotice';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { haptics } from '@/src/utils/haptics';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { clearTrustedPersonDraft } from '@/src/store/trusted-person-draft.slice';

export default function TrustedPersonSuccessScreen() {
  const dispatch = useAppDispatch();
  const draft = useAppSelector((state) => state.trustedPersonDraft);
  const personName = draft?.name.trim() || '';
  const fromOnboarding = !!draft?.fromOnboarding;

  useEffect(() => {
    haptics.success();
  }, []);

  const handleContinue = () => {
    // During onboarding the next step is adding the first vault items.
    dispatch(clearTrustedPersonDraft());
    if (fromOnboarding) router.replace('/(auth)/legacy-setup');
    else router.replace('/(auth)/(tabs)/people');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Scrolls on small screens and with large text instead of overlapping the header. */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.successCircle} accessible={false}>
          <AppIcon name="check" size={36} color={colors.primary.deepForest} strokeWidth={2.5} />
        </View>

        <Text style={styles.title} accessibilityRole="header">
          {personName ? `${personName} is saved` : 'Trusted person saved'}
        </Text>
        <Text style={styles.subtitle}>
          {personName ? `We’ve saved ${personName}’s details privately.` : 'We’ve saved their details privately.'} No invitation was sent.
        </Text>

        <InlineNotice
          tone="brand"
          title="Your vault stays private"
          message="Being a trusted person doesn’t give them access to your encrypted documents. Invitations and releasing items are coming soon."
          style={styles.notice}
        />
      </ScrollView>

      <ActionBar>
        <Button title={fromOnboarding ? 'Continue setup' : 'Done'} onPress={handleContinue} />
      </ActionBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.brand.ivory },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 32 },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 24,
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: typography.sizes.title1,
    lineHeight: typography.lineHeights.title1,
    color: colors.primary.deepForest,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    color: colors.neutral.textSecondary,
  },
  notice: { marginTop: 24 },
});
