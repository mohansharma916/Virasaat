import { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { AppIcon, type IconName } from '@/src/components/AppIcon';
import { InlineNotice } from '@/src/components/InlineNotice';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { logout } from '@/src/api/auth.api';
import { removeAccessToken } from '@/src/storage/auth.storage';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { clearSession } from '@/src/store/session.slice';
import { clearVaultData } from '@/src/store/vault.slice';
import { useSubscription } from '@/src/store/subscription.slice';
import { isReleaseReviewer } from '@/src/api/admin.api';

// Account tab: a settings list. Editing personal details lives on its own
// screen (`profile?mode=edit`) so Save only appears where it applies.
export default function AccountScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.session.user);
  const { currentPlan } = useSubscription();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');
  // The server decides who reviews releases; the row only appears for them.
  const [reviewer, setReviewer] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    void isReleaseReviewer().then((value) => { if (active) setReviewer(value); }).catch(() => undefined);
    return () => { active = false; };
  }, []));

  const initials = (user?.name || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const planSubtitle = currentPlan
    ? `${currentPlan.name} · ${currentPlan.price === 0 ? 'Free' : `₹${currentPlan.price} per year`}`
    : 'See your plan and limits';

  const executeSignOut = async () => {
    try {
      setSigningOut(true);
      setError('');
      try {
        await logout();
      } catch {
        // Local sign-out remains available offline. Recovery revokes sessions on the server.
      }
      await removeAccessToken();
      dispatch(clearSession());
      dispatch(clearVaultData());
      router.replace('/(auth)/welcome' as never);
    } catch {
      setError('We couldn’t clear this device’s secure storage. Try signing out again.');
    } finally {
      setSigningOut(false);
    }
  };

  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'You’ll need your password, Google or biometrics to sign back in on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void executeSignOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title} accessibilityRole="header">Account</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${user?.name ?? 'Your profile'}, ${user?.email ?? ''}`}
          accessibilityHint="Edit your name, country and language"
          onPress={() => router.push({ pathname: '/(auth)/profile', params: { mode: 'edit' } } as never)}
          style={({ pressed }) => [styles.profileCard, pressed && styles.pressed]}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileBody}>
            <Text style={styles.profileName} numberOfLines={1}>{user?.name || 'Your profile'}</Text>
            {user?.email ? <Text style={styles.profileEmail} numberOfLines={1}>{user.email}</Text> : null}
            <Text style={styles.profileAction}>Edit personal details</Text>
          </View>
          <AppIcon name="chevronRight" size={20} color={colors.neutral.textMuted} />
        </Pressable>

        {error ? <InlineNotice tone="danger" message={error} style={styles.notice} /> : null}

        <Text style={styles.sectionTitle} accessibilityRole="header">Settings</Text>
        <View style={styles.group}>
          <SettingsRow icon="sparkles" title="Plan" subtitle={planSubtitle} onPress={() => router.push('/(auth)/my-plan' as never)} />
          <SettingsRow icon="fingerprint" title="Security and biometrics" subtitle="Unlock with fingerprint or face" onPress={() => router.push('/(auth)/security' as never)} />
          <SettingsRow icon="clock" title="Check-ins" subtitle="How often we check you’re active" onPress={() => router.push('/(auth)/check-in-preferences' as never)} />
          <SettingsRow icon="shieldCheck" title="Release rules" subtitle="What happens if you stop checking in" onPress={() => router.push('/(auth)/release-rules' as never)} last />
        </View>

        <Text style={styles.sectionTitle} accessibilityRole="header">Trusted person</Text>
        <View style={styles.group}>
          <SettingsRow icon="heart" title="Shared with you" subtitle="Invitations and anything left for you" onPress={() => router.push('/(auth)/shared' as never)} last={!reviewer} />
          {reviewer ? (
            <SettingsRow icon="verified" title="Release reviews" subtitle="Approve or reject release cases" onPress={() => router.push('/(auth)/admin-cases' as never)} last />
          ) : null}
        </View>

        <Text style={styles.sectionTitle} accessibilityRole="header">About</Text>
        <View style={styles.group}>
          <SettingsRow icon="lock" title="Privacy policy" subtitle="Opens virasat.knowyourviews.com" external onPress={() => void Linking.openURL('https://www.virasat.knowyourviews.com/privacy/')} />
          <SettingsRow icon="document" title="Terms of service" subtitle="Opens virasat.knowyourviews.com" external onPress={() => void Linking.openURL('https://www.virasat.knowyourviews.com/terms/')} />
          <View style={styles.aboutNote}>
            <Text style={styles.aboutText}>
              Your records stay private. Nothing is released unless you stop checking in and Virasat approves a review.
            </Text>
          </View>
        </View>

        <View style={[styles.group, styles.dangerGroup]}>
          <SettingsRow icon="logOut" title={signingOut ? 'Signing out…' : 'Sign out'} tone="danger" onPress={confirmSignOut} disabled={signingOut} />
          <SettingsRow
            icon="trash"
            title="Delete account"
            subtitle="Permanently remove your vault and data"
            tone="danger"
            onPress={() => router.push('/(auth)/delete-account' as never)}
            last
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
  tone = 'default',
  external,
  disabled,
  last,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
  external?: boolean;
  disabled?: boolean;
  last?: boolean;
}) {
  const danger = tone === 'danger';
  return (
    <Pressable
      accessibilityRole={external ? 'link' : 'button'}
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, !last && styles.rowDivider, pressed && styles.pressed]}
    >
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <AppIcon name={icon} size={20} color={danger ? colors.semantic.error : colors.primary.deepForest} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, danger && styles.rowTitleDanger]}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {!danger ? <AppIcon name="chevronRight" size={20} color={colors.neutral.textMuted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.brand.ivory },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32 },
  title: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: typography.sizes.title1,
    lineHeight: typography.lineHeights.title1,
    color: colors.primary.deepForest,
    marginBottom: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  pressed: { backgroundColor: colors.brand.mint },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.deepForest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.title3, color: colors.neutral.white },
  profileBody: { flex: 1, gap: 2 },
  profileName: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.title3,
    lineHeight: typography.lineHeights.title3,
    color: colors.neutral.textPrimary,
  },
  profileEmail: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
    color: colors.neutral.textSecondary,
  },
  profileAction: {
    marginTop: 4,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.caption,
    color: colors.primary.forest,
  },
  notice: { marginTop: 16 },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 8,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.label,
    lineHeight: typography.lineHeights.label,
    color: colors.neutral.textSecondary,
  },
  group: {
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    overflow: 'hidden',
  },
  dangerGroup: { marginTop: 28 },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.neutral.border },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDanger: { backgroundColor: colors.semantic.errorSoft },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.callout,
    lineHeight: typography.lineHeights.callout,
    color: colors.neutral.textPrimary,
  },
  rowTitleDanger: { color: colors.semantic.error },
  rowSubtitle: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
    color: colors.neutral.textSecondary,
  },
  aboutNote: { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.neutral.sunken },
  aboutText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
    color: colors.neutral.textSecondary,
  },
});
