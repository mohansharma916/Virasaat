import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FormScrollView } from '@/src/components/FormScrollView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { assignLegacyItem, listLegacyItems, type LegacyItem } from '@/src/api/vault.api';
import { listRecipients, type Recipient } from '@/src/api/recipients.api';
import { getReleasePolicy, type ReleasePolicy } from '@/src/api/release.api';
import { ActionBar } from '@/src/components/ActionBar';
import { Button } from '@/src/components/Button';
import { InlineNotice } from '@/src/components/InlineNotice';
import { Input } from '@/src/components/Input';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { Skeleton, SkeletonGroup } from '@/src/components/Skeleton';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { signInWithGoogle } from '@/src/utils/google-auth';
import { runWithSystemUi } from '@/src/components/SessionGate';
import { ItemThumbnail, itemTypeIcon } from '@/src/components/ItemThumbnail';

export default function ItemSettingsScreen() {
  const params = useLocalSearchParams<{ itemId?: string }>();
  const [items, setItems] = useState<LegacyItem[]>([]);
  const [people, setPeople] = useState<Recipient[]>([]);
  const [policy, setPolicy] = useState<ReleasePolicy | null>(null);
  const [itemId, setItemId] = useState(params.itemId ?? '');
  const [recipientId, setRecipientId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [retry, setRetry] = useState(0);
  const busy = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([listLegacyItems(), listRecipients(), getReleasePolicy()])
      .then(([saved, recipients, current]) => {
        if (active) {
          setItems(saved);
          const opened = saved.find((item) => item.id === params.itemId);
          if (opened?.assignment) setRecipientId((current) => current || opened.assignment!.recipientId);
          setPeople(recipients.filter((person) => person.status !== 'REVOKED'));
          setPolicy(current);
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(getApiErrorMessage(reason));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry, params.itemId]);

  const selectedItem = items.find((item) => item.id === itemId);
  // Moving an already-assigned item to someone else needs identity confirmation.
  const needsReauth = Boolean(
    selectedItem?.assignment && policy && (
      selectedItem.assignment.recipientId !== recipientId ||
      selectedItem.assignment.policyId !== policy.id ||
      selectedItem.assignment.policyVersion !== policy.version
    ),
  );

  const save = async (googleIdToken?: string) => {
    if (busy.current || !itemId || !recipientId) return;
    if (needsReauth && !googleIdToken && !currentPassword) {
      setError('Enter your password, or confirm with Google, to change who receives this item.');
      return;
    }
    if (!policy?.enabled) {
      setError('Set your release rules before assigning an item.');
      return;
    }
    busy.current = true;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const saved = await assignLegacyItem(itemId, {
        recipientId,
        policyId: policy.id,
        policyVersion: policy.version,
        ...(needsReauth
          ? googleIdToken ? { googleIdToken } : { currentPassword }
          : {}),
      });
      setItems((current) =>
        current.map((item) => (item.id === saved.id ? saved : item)),
      );
      setCurrentPassword('');
      setSuccess('Saved. Nobody was notified.');
    } catch (reason) {
      setError(getApiErrorMessage(reason));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const confirmWithGoogle = async () => {
    if (busy.current) return;
    setError('');
    try {
      const idToken = await runWithSystemUi(() => signInWithGoogle());
      if (idToken) await save(idToken);
    } catch (reason) {
      setError(getApiErrorMessage(reason, 'Google confirmation failed. Try your password instead.'));
    }
  };

  const canSave = Boolean(
    itemId && recipientId && policy?.enabled && !saving && !loading &&
    (!needsReauth || currentPassword),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader
        onBack={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/(auth)/(tabs)/home');
        }}
      />

      <FormScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <Text style={styles.title} accessibilityRole="header">Who receives this</Text>
          <Text style={styles.subtitle}>
            Choose an item and the person who should receive it. They get it only if you stop checking in and Virasat approves a review.
          </Text>
        </View>

        {loading ? (
          <SkeletonGroup label="Loading your items and people">
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} height={64} radius={12} style={styles.skeletonGap} />
            ))}
          </SkeletonGroup>
        ) : null}

        {error ? (
          <InlineNotice tone="danger" message={error} actionLabel="Try again" onAction={() => setRetry((v) => v + 1)} style={styles.notice} />
        ) : null}

        {success ? <InlineNotice tone="success" message={success} style={styles.notice} /> : null}

        {!loading && (
          <>
            {/* Step 1: Select Item */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle} accessibilityRole="header">1. Choose an item</Text>
            </View>

            {items.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Your vault is empty. Save an item first, then choose who receives it.</Text>
                <Button title="Add your first item" variant="secondary" size="md" onPress={() => router.push('/(auth)/legacy-setup')} />
              </View>
            ) : (
              items.map((item) => {
                const isSelected = itemId === item.id;
                return (
                  <Pressable
                    key={item.id}
                    disabled={saving}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    onPress={() => {
                      setItemId(item.id);
                      setRecipientId(item.assignment?.recipientId ?? '');
                      setCurrentPassword('');
                      setSuccess('');
                    }}
                    style={({ pressed }) => [
                      styles.selectCard,
                      isSelected && styles.selectCardActive,
                      pressed && styles.cardPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleActive,
                      ]}
                    >
                      {isSelected ? <View style={styles.radioDot} /> : null}
                    </View>
                    <ItemThumbnail itemId={item.id} hasThumbnail={item.hasThumbnail} icon={itemTypeIcon(item.type)} size={40} style={styles.selectThumb} />
                    <View style={styles.selectInfo}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemMeta}>
                        {item.assignment
                          ? `Assigned to ${people.find((person) => person.id === item.assignment?.recipientId)?.name ?? 'a removed person'} · ${item.assignment.verificationRequired ? 'ID check required' : 'No ID check'}`
                          : 'Not assigned yet'}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}

            {/* Step 2: Select Recipient */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle} accessibilityRole="header">2. Choose who receives it</Text>
            </View>

            {people.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>You haven’t added a trusted person yet.</Text>
                <Button title="Add a trusted person" variant="secondary" size="md" onPress={() => router.push('/(auth)/trusted-person')} />
              </View>
            ) : (
              people.map((person) => {
                const isSelected = recipientId === person.id;
                return (
                  <Pressable
                    key={person.id}
                    disabled={saving}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    onPress={() => {
                      setRecipientId(person.id);
                      setSuccess('');
                    }}
                    style={({ pressed }) => [
                      styles.selectCard,
                      isSelected && styles.selectCardActive,
                      pressed && styles.cardPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleActive,
                      ]}
                    >
                      {isSelected ? <View style={styles.radioDot} /> : null}
                    </View>
                    <View style={styles.selectInfo}>
                      <Text style={styles.itemTitle}>{person.name}</Text>
                      <Text style={styles.itemMeta}>
                        {person.status === 'PRIVATE' ? 'Saved privately' : person.status === 'ACTIVE' ? 'Active' : person.status === 'INVITED' ? 'Invited' : 'Removed'}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}

            {/* Step 3: Policy Overview */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle} accessibilityRole="header">3. Release rules that apply</Text>
            </View>

            {policy?.enabled ? (
              <View style={styles.policyCard}>
                <Text style={styles.policyActive}>Active</Text>
                <Text style={styles.policyDesc}>
                  {policy.trigger === 'CHECK_IN_ESCALATION' ? 'Released after missed check-ins and Virasat’s review.' : 'Released only on request, after Virasat’s review.'}
                </Text>
                <Text style={styles.policySubtext}>
                  {policy.verificationRequired ? 'They must verify their identity first.' : 'No ID check, but sign-in and review still apply.'}
                </Text>
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>You haven’t set your release rules yet.</Text>
                <Button title="Set release rules" variant="secondary" size="md" onPress={() => router.push('/(auth)/release-rules')} />
              </View>
            )}
            {needsReauth ? (
              <View style={styles.reauthCard}>
                <Text style={styles.reauthTitle} accessibilityRole="header">Confirm it’s you</Text>
                <Text style={styles.emptyText}>
                  This item is already assigned. Changing who receives it needs your password.
                </Text>
                <Input
                  label="Current password"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="current-password"
                  textContentType="password"
                  editable={!saving}
                  placeholder="Your password"
                  containerStyle={styles.reauthInput}
                />
                <Button title="I use Google: confirm with Google" variant="secondary" size="md" disabled={saving} onPress={() => void confirmWithGoogle()} />
              </View>
            ) : null}
          </>
        )}
      </FormScrollView>

      <ActionBar>
        <Button title="Save assignment" onPress={() => void save()} loading={saving} disabled={!canSave && !saving} />
      </ActionBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  skeletonGap: { marginTop: 12 },
  notice: { marginBottom: 16 },
  safeArea: {
    flex: 1,
    backgroundColor: colors.brand.ivory,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 24,
  },
  heading: {
    marginTop: 14,
    marginBottom: 20,
  },
  title: {
    marginTop: 6,
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 27,
    lineHeight: 39,
    color: colors.primary.deepForest,
  },
  subtitle: {
    marginTop: 6,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.neutral.textSecondary,
  },
  sectionHeader: {
    marginTop: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 12,
    
    color: colors.neutral.textMuted,
  },
  reauthCard: {
    backgroundColor: colors.neutral.white,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.semantic.warning,
    marginTop: 14,
    marginBottom: 10,
    gap: 10,
  },
  reauthTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 15,
    color: colors.primary.deepForest,
  },
  reauthInput: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    paddingHorizontal: 14,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 15,
    color: colors.neutral.textPrimary,
  },
  emptyCard: {
    backgroundColor: colors.neutral.white,
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral.border,
    marginBottom: 10,
  },
  emptyText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    color: colors.neutral.textSecondary,
    marginBottom: 10,
  },
  selectCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  selectCardActive: {
    borderColor: colors.primary.forest,
    backgroundColor: colors.neutral.white,
  },
  cardPressed: {
    opacity: 0.85,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioCircleActive: {
    borderColor: colors.primary.forest,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary.forest,
  },
  selectThumb: { marginLeft: 12 },
  selectInfo: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 15,
    color: colors.primary.deepForest,
  },
  itemMeta: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    color: colors.neutral.textSecondary,
    marginTop: 2,
  },
  policyCard: {
    backgroundColor: colors.brand.mint,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.brand.sage,
    marginBottom: 12,
  },
  policyActive: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 13,
    color: colors.primary.forest,
  },
  policyDesc: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 13,
    lineHeight: 17,
    color: colors.primary.deepForest,
    marginBottom: 4,
  },
  policySubtext: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.neutral.textSecondary,
  },
});
