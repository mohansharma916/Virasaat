import { useCallback, useMemo, useState, useRef } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { confirmCheckIn } from '@/src/api/check-in.api';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { hydrateSession } from '@/src/store/session.slice';
import { refreshVaultData } from '@/src/store/vault.slice';
import { LEGACY_CATEGORY_KEYS } from '@/src/utils/legacy-flow';
import { syncAllVaultItemsToS3 } from '@/src/api/vault.api';

const emptySummary = { documents: 0, investments: 0, messages: 0, videos: 0 };

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.session.user);
  const items = useAppSelector((state) => state.vault.items);
  const recipients = useAppSelector((state) => state.vault.recipients);
  const checkInStatus = useAppSelector((state) => state.vault.checkIn);
  const issues = useAppSelector((state) => state.vault.issues);
  const failed = useAppSelector((state) => state.vault.status === 'error');
  const loading = useAppSelector((state) => state.vault.status === 'loading');
  const [confirmingCheckIn, setConfirmingCheckIn] = useState(false);
  const [syncingS3, setSyncingS3] = useState(false);
  const checkInBusy = useRef(false);

  const loadOverview = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(hydrateSession()).unwrap(),
        dispatch(refreshVaultData()).unwrap(),
      ]);
    } catch (error) {
      Alert.alert('Unable to refresh your vault', getApiErrorMessage(error));
    }
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      void loadOverview();
    }, [loadOverview]),
  );

  const legacySummary = useMemo(() => items.reduce((summary, item) => {
    if (item.type === 'DOCUMENT' || item.type === 'IMAGE' || item.type === 'OTHER') {
      summary.documents += 1;
    } else if (item.type === 'FINANCIAL') {
      summary.investments += 1;
    } else if (item.type === 'TEXT') {
      summary.messages += 1;
    } else if (item.type === 'VIDEO') {
      summary.videos += 1;
    }

    return summary;
  }, { ...emptySummary }), [items]);

  const trustedPerson = recipients.find((person) => person.status !== 'REVOKED') ?? null;
  const pendingCheckIn = checkInStatus?.currentEvent?.status === 'PENDING';
  const checkInDate = checkInStatus?.currentEvent?.dueAt
    ?? checkInStatus?.policy.nextCheckInAt
    ?? null;

  const totalItems = useMemo(
    () => legacySummary.documents + legacySummary.investments + legacySummary.messages + legacySummary.videos,
    [legacySummary],
  );


  const openLegacy = (category?: string) => {
    router.push({
      pathname: '/(auth)/legacy-category',
      params: { categories: category ?? LEGACY_CATEGORY_KEYS.join(',') },
    } as never);
  };

  const handleConfirmCheckIn = async () => {
    const eventId = checkInStatus?.currentEvent?.id;
    if (!eventId || checkInBusy.current) return;
    checkInBusy.current = true;
    try {
      setConfirmingCheckIn(true);
      await confirmCheckIn(eventId);
      await loadOverview();
    } catch (error) {
      Alert.alert('Unable to confirm check-in', getApiErrorMessage(error));
    } finally {
      checkInBusy.current = false;
      setConfirmingCheckIn(false);
    }
  };

  const handleSyncToS3 = async () => {
    if (syncingS3) return;
    try {
      setSyncingS3(true);
      const result = await syncAllVaultItemsToS3();
      await loadOverview();
      Alert.alert(
        'Vault Secured in AWS S3',
        `Successfully synced ${result.syncedItemsCount} item(s) to S3. All files and vault items are encrypted with AES-256-GCM + AWS S3 Server-Side Encryption and verified with SHA-256 checksums.`,
      );
    } catch (error) {
      Alert.alert('S3 Cloud Storage', getApiErrorMessage(error));
    } finally {
      setSyncingS3(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>VIRASAT</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.headerButton} hitSlop={10} onPress={() => router.push('/(auth)/dev-screen' as never)}>
              <Text style={styles.headerIcon}>♢</Text>
            </Pressable>
            <Pressable style={styles.headerButton} hitSlop={10} onPress={() => router.push({ pathname: '/(auth)/profile', params: { mode: 'edit' } } as never)}>
              <Text style={styles.menuIcon}>☰</Text>
            </Pressable>
          </View>
        </View>

        {(failed || issues.length > 0) && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText} accessibilityRole="alert">
              {failed ? 'Your vault could not be refreshed.' : issues.join(' ')}
            </Text>
            <Pressable accessibilityRole="button" onPress={() => void loadOverview()} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry refresh</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.greeting}>
          <Text style={styles.greetingTitle}>
            {user?.name ? `Hello, ${user.name.split(' ')[0]}` : 'Welcome to Virasat'}
          </Text>
          <Text style={styles.greetingSubtitle}>Your information, under your control.</Text>
        </View>

        {/* Check-In Box appears on Top once configured */}
        {!!checkInStatus && (
          <View style={styles.topCheckInContainer}>
            <View style={styles.sectionHeaderCompact}>
              <Text style={styles.sectionTitle}>NEXT CHECK-IN</Text>
              <Pressable onPress={() => router.push('/(auth)/check-in-preferences' as never)}>
                <Text style={styles.seeAll}>Preferences →</Text>
              </Pressable>
            </View>
            <View style={styles.checkInCard}>
              <View style={styles.checkInIcon}><Text style={styles.shieldIcon}>◇</Text></View>
              <Text style={styles.checkInTitle}>
                {pendingCheckIn ? 'Your check-in is ready' : "You're all set"}
              </Text>
              <Text style={styles.checkInDate}>
                {checkInDate ? formatCheckInDate(checkInDate) : 'Schedule configured'}
              </Text>
              <Text style={styles.checkInDescription}>
                {pendingCheckIn
                  ? "A quick confirmation helps us know you're active."
                  : 'Your activity has been confirmed.'}
              </Text>
              {pendingCheckIn && (
                <Pressable disabled={confirmingCheckIn} onPress={handleConfirmCheckIn} style={({ pressed }) => [styles.checkInButton, confirmingCheckIn && styles.buttonDisabled, pressed && !confirmingCheckIn && styles.buttonPressed]}>
                  {confirmingCheckIn ? <ActivityIndicator color={colors.neutral.white} /> : <Text style={styles.checkInButtonText}>Confirm I'm Active</Text>}
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Continuity Readiness Card (Disappears once setup checklist is completed) */}
        {!([totalItems > 0, !!trustedPerson, items.some((item) => !!item.assignment), !!checkInStatus].every(Boolean)) && (
          <View style={styles.readinessCard}>
            <View style={styles.readinessHeader}>
              <View>
                <Text style={styles.readinessEyebrow}>CONTINUITY READINESS</Text>
                <Text style={styles.readinessTitle}>Setup Checklist</Text>
              </View>
              <View style={styles.readinessBadge}>
                <Text style={styles.readinessBadgeText}>
                  {[totalItems > 0, !!trustedPerson, items.some((item) => !!item.assignment), !!checkInStatus].filter(Boolean).length} of 4
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${([totalItems > 0, !!trustedPerson, items.some((item) => !!item.assignment), !!checkInStatus].filter(Boolean).length / 4) * 100}%`,
                  },
                ]}
              />
            </View>

            <View style={styles.readinessList}>
              {[
                {
                  done: totalItems > 0,
                  title: 'Protect your first item',
                  subtitle: totalItems > 0 ? `${totalItems} item(s) preserved` : 'Add documents, investments or messages',
                  route: '/(auth)/legacy-setup',
                },
                {
                  done: !!trustedPerson,
                  title: 'Add a trusted person',
                  subtitle: trustedPerson ? trustedPerson.name : 'Informing them now is optional',
                  route: '/(auth)/people',
                },
                {
                  done: items.some((item) => !!item.assignment),
                  title: 'Assign policy to an item',
                  subtitle: items.some((item) => !!item.assignment) ? 'Assigned' : 'Review release conditions',
                  route: '/(auth)/item-settings',
                },
                {
                  done: !!checkInStatus,
                  title: 'Configure check-ins',
                  subtitle: checkInStatus ? 'Schedule active' : 'Set your preferred cadence',
                  route: '/(auth)/check-in-preferences',
                },
              ].map((action, idx) => (
                <Pressable
                  key={action.title}
                  accessibilityRole="button"
                  onPress={() => router.push(action.route as never)}
                  style={({ pressed }) => [
                    styles.readinessItem,
                    idx < 3 && styles.readinessItemBorder,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[styles.readinessCircle, action.done && styles.readinessCircleDone]}>
                    <Text style={[styles.readinessCheck, action.done && styles.readinessCheckDone]}>
                      {action.done ? '✓' : `${idx + 1}`}
                    </Text>
                  </View>
                  <View style={styles.readinessContent}>
                    <Text style={[styles.readinessItemTitle, action.done && styles.readinessItemTitleDone]}>
                      {action.title}
                    </Text>
                    <Text style={styles.readinessItemSubtitle}>{action.subtitle}</Text>
                  </View>
                  <Text style={styles.readinessChevron}>›</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Vault Overview Card (Separated with gap) */}
        <View style={styles.protectionCard}>
          <View style={styles.protectionTop}>
            <View style={styles.lockCircle}><Text style={styles.lockIcon}>⌑</Text></View>
            <View style={styles.protectionStatus}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>VAULT OVERVIEW</Text>
            </View>
          </View>
          <Text style={styles.protectionTitle}>
            {loading ? 'Loading your vault…' : totalItems ? 'Your saved information' : 'Protect your first item'}
          </Text>
          <Text style={styles.protectionDescription}>
            Saved items remain private. Recipient access requires an assigned policy and explicit authorization.
          </Text>
          <View style={styles.protectionDivider} />
          <View style={styles.protectionMeta}>
            <View>
              <Text style={styles.metaLabel}>ITEMS PRESERVED</Text>
              <Text style={styles.metaValue}>{totalItems}</Text>
            </View>
            <View style={styles.s3CloudBadge}>
              <Text style={styles.s3CloudIcon}>☁</Text>
              <Text style={styles.s3CloudText}>AWS S3 Encrypted</Text>
            </View>
          </View>

          {totalItems > 0 && (
            <Pressable
              disabled={syncingS3}
              onPress={handleSyncToS3}
              style={({ pressed }) => [
                styles.s3SyncButton,
                pressed && !syncingS3 && styles.buttonPressed,
              ]}
            >
              {syncingS3 ? (
                <View style={styles.syncRow}>
                  <ActivityIndicator size="small" color={colors.primary.deepForest} />
                  <Text style={styles.s3SyncText}>Securing to AWS S3…</Text>
                </View>
              ) : (
                <View style={styles.syncRow}>
                  <Text style={styles.s3SyncIcon}>☁</Text>
                  <Text style={styles.s3SyncText}>Backup & Sync Vault to S3</Text>
                  <Text style={styles.s3SyncArrow}>→</Text>
                </View>
              )}
            </Pressable>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>YOUR LEGACY</Text>
          <Pressable onPress={() => openLegacy()}>
            <Text style={styles.seeAll}>View all →</Text>
          </Pressable>
        </View>

        <View style={styles.grid}>
          <LegacyCard icon="▤" title="Documents" count={legacySummary.documents} onPress={() => openLegacy('DOCUMENTS')} />
          <LegacyCard icon="₹" title="Investments" count={legacySummary.investments} onPress={() => openLegacy('INVESTMENTS')} />
          <LegacyCard icon="✎" title="Messages" count={legacySummary.messages} onPress={() => openLegacy('MESSAGES')} />
          <LegacyCard icon="▶" title="Videos" count={legacySummary.videos} onPress={() => openLegacy('VIDEOS')} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TRUSTED PERSON</Text>
        </View>

        <Pressable
          onPress={() => router.push({ pathname: '/(auth)/trusted-person', params: trustedPerson ? { recipientId: trustedPerson.id } : undefined } as never)}
          style={({ pressed }) => [styles.trustedCard, pressed && styles.pressed]}
        >
          <View style={styles.checkCircle}><Text style={styles.checkMark}>✓</Text></View>
          <View style={styles.trustedContent}>
            <Text style={styles.trustedStatus}>
              {trustedPerson ? trustedPerson.status === 'ACTIVE' ? 'TRUSTED PERSON ACTIVE' : trustedPerson.status === 'PRIVATE' ? 'PRIVATE / NOT INFORMED' : 'INVITATION PENDING' : 'ACTION REQUIRED'}
            </Text>
            <Text style={styles.trustedName}>{trustedPerson?.name ?? 'Add a trusted person'}</Text>
            <Text style={styles.manageText}>Manage →</Text>
          </View>
          <Text style={styles.cardChevron}>›</Text>
        </Pressable>

        {!checkInStatus && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>NEXT CHECK-IN</Text>
            </View>

            <View style={styles.checkInCard}>
              <View style={styles.checkInIcon}><Text style={styles.shieldIcon}>◇</Text></View>
              <Text style={styles.checkInTitle}>Set up your check-in schedule</Text>
              <Text style={styles.checkInDate}>Not configured</Text>
              <Text style={styles.checkInDescription}>
                Choose your preferred schedule to activate automated check-ins.
              </Text>
              <Pressable onPress={() => router.push('/(auth)/check-in-preferences' as never)} style={({ pressed }) => [styles.checkInButton, pressed && styles.buttonPressed]}>
                <Text style={styles.checkInButtonText}>Set up check-ins</Text>
              </Pressable>
            </View>
          </>
        )}

        <View style={styles.securityNote}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>
            Your legacy remains private until your release conditions are satisfied.
          </Text>
        </View>
      </ScrollView>

  <View
  style={[
    styles.bottomNav,
    {
      paddingBottom: Math.max(insets.bottom, 8),
      height: 73 + insets.bottom,
    },
  ]}
>
        <BottomNavItem icon="⌂" label="Home" active onPress={() => {}} />
        <BottomNavItem icon="◈" label="Vault" onPress={() => openLegacy()} />
        <BottomNavItem icon="♡" label="People" onPress={() => router.push('/(auth)/people' as never)} />
        <BottomNavItem icon="⚙" label="Profile" onPress={() => router.push({ pathname: '/(auth)/profile', params: { mode: 'edit' } } as never)} />
      </View>
    </SafeAreaView>
  );
}

function formatCheckInDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Scheduled';
  }

  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
  });
}

function LegacyCard({ icon, title, count, onPress }: { icon: string; title: string; count: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.legacyCard, pressed && styles.pressed]}>
      <View style={styles.legacyIcon}><Text style={styles.legacyIconText}>{icon}</Text></View>
      <Text style={styles.legacyTitle}>{title}</Text>
      <Text style={styles.legacyCount}>{count}</Text>
      <Text style={styles.legacyItems}>{count === 1 ? 'item' : 'items'}</Text>
    </Pressable>
  );
}

function BottomNavItem({ icon, label, active = false, onPress }: { icon: string; label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.navItem}>
      <Text style={[styles.navIcon, active && styles.navIconActive]}>{icon}</Text>
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.brand.ivory },
  content: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 125 },
  header: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontFamily: typography.fonts.playfair.bold, fontSize: 18, letterSpacing: 3, color: colors.primary.deepForest },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerIcon: { fontSize: 25, color: colors.primary.deepForest },
  menuIcon: { fontSize: 21, color: colors.primary.deepForest },

  errorBanner: { padding: 14, borderRadius: 14, backgroundColor: '#FDE8E8', borderWidth: 1, borderColor: '#F8B4B4', marginBottom: 16 },
  errorBannerText: { fontFamily: typography.fonts.inter.medium, fontSize: 13, color: '#9B1C1C' },
  retryButton: { marginTop: 8, paddingVertical: 6, alignSelf: 'flex-start' },
  retryText: { fontFamily: typography.fonts.inter.semiBold, fontSize: 12, color: '#9B1C1C', textDecorationLine: 'underline' },

  greeting: { marginTop: 24, marginBottom: 18 },
  greetingTitle: { fontFamily: typography.fonts.playfair.semiBold, fontSize: 28, lineHeight: 35, color: colors.primary.deepForest },
  greetingSubtitle: { marginTop: 4, fontFamily: typography.fonts.inter.regular, fontSize: 13, color: colors.neutral.textSecondary },

  readinessCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  readinessHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readinessEyebrow: { fontFamily: typography.fonts.inter.semiBold, fontSize: 9.5, letterSpacing: 1.2, color: colors.primary.forest },
  readinessTitle: { marginTop: 2, fontFamily: typography.fonts.playfair.semiBold, fontSize: 20, color: colors.primary.deepForest },
  readinessBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.brand.mint },
  readinessBadgeText: { fontFamily: typography.fonts.inter.semiBold, fontSize: 11, color: colors.primary.forest },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.brand.sage, marginTop: 12, marginBottom: 14, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.primary.forest },
  readinessList: { marginTop: 2 },
  readinessItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11 },
  readinessItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.brand.mint },
  readinessCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.brand.ivory, borderWidth: 1, borderColor: colors.neutral.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  readinessCircleDone: { backgroundColor: colors.brand.mint, borderColor: colors.brand.sage },
  readinessCheck: { fontFamily: typography.fonts.inter.semiBold, fontSize: 11, color: colors.neutral.textMuted },
  readinessCheckDone: { color: colors.primary.forest, fontSize: 12 },
  readinessContent: { flex: 1 },
  readinessItemTitle: { fontFamily: typography.fonts.inter.semiBold, fontSize: 13, color: colors.neutral.textPrimary },
  readinessItemTitleDone: { color: colors.primary.deepForest },
  readinessItemSubtitle: { marginTop: 2, fontFamily: typography.fonts.inter.regular, fontSize: 11, color: colors.neutral.textMuted },
  readinessChevron: { fontSize: 18, color: colors.neutral.textMuted, marginLeft: 8 },

  protectionCard: { padding: 20, borderRadius: 20, backgroundColor: colors.primary.deepForest, marginBottom: 16 },
  protectionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lockCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.brand.sage, alignItems: 'center', justifyContent: 'center' },
  lockIcon: { fontSize: 21, color: colors.primary.deepForest },
  protectionStatus: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.brand.mint, marginRight: 6 },
  statusText: { fontFamily: typography.fonts.inter.semiBold, fontSize: 9, letterSpacing: 1.2, color: colors.brand.mint },
  protectionTitle: { marginTop: 22, fontFamily: typography.fonts.playfair.semiBold, fontSize: 23, color: colors.neutral.white },
  protectionDescription: { marginTop: 6, fontFamily: typography.fonts.inter.regular, fontSize: 11.5, lineHeight: 18, color: colors.brand.mint },
  protectionDivider: { height: 1, marginTop: 17, backgroundColor: 'rgba(255,255,255,0.16)' },
  protectionMeta: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaLabel: { fontFamily: typography.fonts.inter.semiBold, fontSize: 8.5, letterSpacing: 1.1, color: colors.brand.mint },
  metaValue: { fontFamily: typography.fonts.inter.semiBold, fontSize: 13, color: colors.neutral.white },

  s3CloudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 244, 240, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(234, 244, 240, 0.25)',
  },
  s3CloudIcon: {
    fontSize: 12,
    color: colors.brand.mint,
    marginRight: 6,
  },
  s3CloudText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 10,
    color: colors.brand.mint,
    letterSpacing: 0.5,
  },
  s3SyncButton: {
    marginTop: 14,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.brand.ivory,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  s3SyncIcon: {
    fontSize: 14,
    color: colors.primary.deepForest,
    marginRight: 7,
  },
  s3SyncText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 12,
    color: colors.primary.deepForest,
  },
  s3SyncArrow: {
    fontSize: 14,
    color: colors.primary.deepForest,
    marginLeft: 6,
  },

  topCheckInContainer: {
    marginBottom: 4,
  },
  sectionHeaderCompact: {
    marginTop: 4,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeader: { marginTop: 27, marginBottom: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: typography.fonts.inter.semiBold, fontSize: 9.5, letterSpacing: 1.3, color: colors.neutral.textSecondary },
  seeAll: { fontFamily: typography.fonts.inter.semiBold, fontSize: 10.5, color: colors.primary.forest },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legacyCard: { width: '48.5%', minHeight: 126, padding: 15, borderRadius: 16, backgroundColor: colors.neutral.white, borderWidth: 1, borderColor: colors.neutral.border },
  legacyIcon: { width: 35, height: 35, borderRadius: 11, backgroundColor: colors.brand.mint, alignItems: 'center', justifyContent: 'center' },
  legacyIconText: { fontSize: 16, color: colors.primary.forest },
  legacyTitle: { marginTop: 13, fontFamily: typography.fonts.inter.semiBold, fontSize: 11.5, color: colors.neutral.textPrimary },
  legacyCount: { marginTop: 4, fontFamily: typography.fonts.playfair.semiBold, fontSize: 23, color: colors.primary.deepForest },
  legacyItems: { marginTop: -2, fontFamily: typography.fonts.inter.regular, fontSize: 9.5, color: colors.neutral.textMuted },

  trustedCard: { minHeight: 91, padding: 15, borderRadius: 16, backgroundColor: colors.brand.mint, flexDirection: 'row', alignItems: 'center' },
  checkCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand.sage, alignItems: 'center', justifyContent: 'center' },
  checkMark: { fontSize: 18, color: colors.primary.forest },
  trustedContent: { flex: 1, marginLeft: 12 },
  trustedStatus: { fontFamily: typography.fonts.inter.semiBold, fontSize: 8.5, letterSpacing: 1, color: colors.primary.forest },
  trustedName: { marginTop: 5, fontFamily: typography.fonts.inter.semiBold, fontSize: 12, color: colors.neutral.textPrimary },
  manageText: { marginTop: 5, fontFamily: typography.fonts.inter.semiBold, fontSize: 10, color: colors.primary.forest },
  cardChevron: { fontSize: 25, color: colors.primary.forest },

  checkInCard: { padding: 19, borderRadius: 18, backgroundColor: colors.neutral.white, borderWidth: 1, borderColor: colors.neutral.border, alignItems: 'center' },
  checkInIcon: { width: 39, height: 39, borderRadius: 20, backgroundColor: colors.brand.mint, alignItems: 'center', justifyContent: 'center' },
  shieldIcon: { fontSize: 20, color: colors.primary.forest },
  checkInTitle: { marginTop: 12, fontFamily: typography.fonts.inter.semiBold, fontSize: 13, color: colors.neutral.textPrimary },
  checkInDate: { marginTop: 4, fontFamily: typography.fonts.playfair.semiBold, fontSize: 22, color: colors.primary.deepForest },
  checkInDescription: { marginTop: 5, textAlign: 'center', fontFamily: typography.fonts.inter.regular, fontSize: 10.5, lineHeight: 16, color: colors.neutral.textSecondary },
  checkInButton: { width: '100%', height: 48, marginTop: 16, borderRadius: 12, backgroundColor: colors.primary.deepForest, alignItems: 'center', justifyContent: 'center' },
  checkInButtonText: { fontFamily: typography.fonts.inter.semiBold, fontSize: 12.5, color: colors.neutral.white },
  buttonDisabled: { opacity: 0.6 },

  securityNote: { marginTop: 17, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center' },
  securityIcon: { fontSize: 12, marginRight: 7 },
  securityText: { flex: 1, fontFamily: typography.fonts.inter.regular, fontSize: 9.5, lineHeight: 15, color: colors.neutral.textMuted },

bottomNav: {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  paddingHorizontal: 18,
  paddingTop: 9,
  backgroundColor: colors.neutral.white,
  borderTopWidth: 1,
  borderTopColor: colors.neutral.border,
  flexDirection: 'row',
  justifyContent: 'space-around',
},
  navItem: { width: 70, alignItems: 'center', justifyContent: 'center' },
  navIcon: { fontSize: 19, color: colors.neutral.textMuted },
  navIconActive: { color: colors.primary.forest },
  navLabel: { marginTop: 4, fontFamily: typography.fonts.inter.medium, fontSize: 9, color: colors.neutral.textMuted },
  navLabelActive: { fontFamily: typography.fonts.inter.semiBold, color: colors.primary.forest },

  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  buttonPressed: { opacity: 0.85 },
});
