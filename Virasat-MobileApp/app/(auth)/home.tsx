import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { getCurrentUser, type AuthenticatedUser } from '@/src/api/auth.api';
import { listLegacyItems, type LegacyItem } from '@/src/api/vault.api';
import { listRecipients, type Recipient } from '@/src/api/recipients.api';
import { confirmCheckIn, getCheckInStatus, type CheckInStatus } from '@/src/api/check-in.api';
import { getApiErrorMessage } from '@/src/utils/api-error';

const emptySummary = { documents: 0, investments: 0, messages: 0, videos: 0 };

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [items, setItems] = useState<LegacyItem[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmingCheckIn, setConfirmingCheckIn] = useState(false);

  const loadOverview = useCallback(async () => {
    try {
      const [currentUser, vaultItems, trustedPeople, checkIn] = await Promise.all([
        getCurrentUser(),
        listLegacyItems(),
        listRecipients(),
        getCheckInStatus().catch(() => null),
      ]);

      setUser(currentUser);
      setItems(vaultItems);
      setRecipients(trustedPeople.filter((person) => person.status !== 'REVOKED'));
      setCheckInStatus(checkIn);
    } catch (error) {
      Alert.alert('Unable to refresh your vault', getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

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

  const trustedPerson = recipients[0] ?? null;
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
      params: category ? { categories: category } : undefined,
    } as never);
  };

  const handleConfirmCheckIn = async () => {
    try {
      setConfirmingCheckIn(true);
      await confirmCheckIn();
      await loadOverview();
    } catch (error) {
      Alert.alert('Unable to confirm check-in', getApiErrorMessage(error));
    } finally {
      setConfirmingCheckIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>VIRASAT</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.headerButton} hitSlop={10} onPress={() => {}}>
              <Text style={styles.headerIcon}>♢</Text>
            </Pressable>
            <Pressable style={styles.headerButton} hitSlop={10} onPress={() => {}}>
              <Text style={styles.menuIcon}>☰</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.greeting}>
          <Text style={styles.greetingTitle}>
            {user?.name ? `Hello, ${user.name.split(' ')[0]}` : 'Welcome to Virasat'}
          </Text>
          <Text style={styles.greetingSubtitle}>Your legacy is protected.</Text>
        </View>

        <View style={styles.protectionCard}>
          <View style={styles.protectionTop}>
            <View style={styles.lockCircle}><Text style={styles.lockIcon}>⌑</Text></View>
            <View style={styles.protectionStatus}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>PROTECTED</Text>
            </View>
          </View>
          <Text style={styles.protectionTitle}>
            {loading ? 'Loading your vault…' : 'Your legacy is safe.'}
          </Text>
          <Text style={styles.protectionDescription}>
            Everything you've added is securely stored and remains under your control.
          </Text>
          <View style={styles.protectionDivider} />
          <View style={styles.protectionMeta}>
            <Text style={styles.metaLabel}>ITEMS PRESERVED</Text>
            <Text style={styles.metaValue}>{totalItems}</Text>
          </View>
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
          onPress={() => router.push('/(auth)/trusted-person' as never)}
          style={({ pressed }) => [styles.trustedCard, pressed && styles.pressed]}
        >
          <View style={styles.checkCircle}><Text style={styles.checkMark}>✓</Text></View>
          <View style={styles.trustedContent}>
            <Text style={styles.trustedStatus}>
              {trustedPerson ? trustedPerson.status === 'ACTIVE' ? 'TRUSTED PERSON ACTIVE' : 'INVITATION PENDING' : 'ACTION REQUIRED'}
            </Text>
            <Text style={styles.trustedName}>{trustedPerson?.name ?? 'Add a trusted person'}</Text>
            <Text style={styles.manageText}>Manage →</Text>
          </View>
          <Text style={styles.cardChevron}>›</Text>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>NEXT CHECK-IN</Text>
        </View>

        <View style={styles.checkInCard}>
          <View style={styles.checkInIcon}><Text style={styles.shieldIcon}>◇</Text></View>
          <Text style={styles.checkInTitle}>
            {checkInStatus ? pendingCheckIn ? 'Your check-in is ready' : "You're all set" : 'Set up your monthly check-in'}
          </Text>
          <Text style={styles.checkInDate}>
            {checkInDate ? formatCheckInDate(checkInDate) : 'Not configured'}
          </Text>
          <Text style={styles.checkInDescription}>
            {checkInStatus
              ? pendingCheckIn
                ? "A quick confirmation helps us know you're active."
                : 'Your activity has been confirmed.'
              : 'Choose your preferred schedule to activate check-ins.'}
          </Text>
          {pendingCheckIn && (
            <Pressable disabled={confirmingCheckIn} onPress={handleConfirmCheckIn} style={({ pressed }) => [styles.checkInButton, confirmingCheckIn && styles.buttonDisabled, pressed && !confirmingCheckIn && styles.buttonPressed]}>
              {confirmingCheckIn ? <ActivityIndicator color={colors.neutral.white} /> : <Text style={styles.checkInButtonText}>Confirm I'm Active</Text>}
            </Pressable>
          )}
          {!checkInStatus && (
            <Pressable onPress={() => router.push('/(auth)/check-in-preferences' as never)} style={({ pressed }) => [styles.checkInButton, pressed && styles.buttonPressed]}>
              <Text style={styles.checkInButtonText}>Set up check-ins</Text>
            </Pressable>
          )}
        </View>

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
        <BottomNavItem icon="◈" label="Legacy" onPress={() => openLegacy()} />
        <BottomNavItem icon="♡" label="Trusted" onPress={() => router.push('/(auth)/trusted-person' as never)} />
        <BottomNavItem icon="⚙" label="Settings" onPress={() => router.push('/(auth)/profile' as never)} />
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

  greeting: { marginTop: 24, marginBottom: 20 },
  greetingTitle: { fontFamily: typography.fonts.playfair.semiBold, fontSize: 28, lineHeight: 35, color: colors.primary.deepForest },
  greetingSubtitle: { marginTop: 4, fontFamily: typography.fonts.inter.regular, fontSize: 13, color: colors.neutral.textSecondary },

  protectionCard: { padding: 20, borderRadius: 20, backgroundColor: colors.primary.deepForest },
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
