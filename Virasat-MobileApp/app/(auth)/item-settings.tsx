import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { assignLegacyItem, listLegacyItems, type LegacyItem } from '@/src/api/vault.api';
import { listRecipients, type Recipient } from '@/src/api/recipients.api';
import { getReleasePolicy, type ReleasePolicy } from '@/src/api/release.api';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { getApiErrorMessage } from '@/src/utils/api-error';

export default function ItemSettingsScreen() {
  const params = useLocalSearchParams<{ itemId?: string }>();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<LegacyItem[]>([]);
  const [people, setPeople] = useState<Recipient[]>([]);
  const [policy, setPolicy] = useState<ReleasePolicy | null>(null);
  const [itemId, setItemId] = useState(params.itemId ?? '');
  const [recipientId, setRecipientId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
  }, [retry]);

  const save = async () => {
    if (busy.current || !itemId || !recipientId) return;
    if (!policy?.enabled) {
      setError('Please configure and enable a release policy before confirming assignment.');
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
      });
      setItems((current) =>
        current.map((item) => (item.id === saved.id ? saved : item)),
      );
      setSuccess('Assignment saved successfully. No notifications were sent.');
    } catch (reason) {
      setError(getApiErrorMessage(reason));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const canSave = Boolean(itemId && recipientId && policy?.enabled && !saving && !loading);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.replace('/(auth)/home')}
          hitSlop={12}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>
        <Text style={styles.brand}>VIRASAT</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>VAULT ASSIGNMENT</Text>
          <Text style={styles.title}>Release Settings</Text>
          <Text style={styles.subtitle}>
            Save recipient and policy preferences for each item. Recipient access and inheritance release are not available yet.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary.deepForest} size="small" />
            <Text style={styles.loadingText}>Loading settings…</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              onPress={() => setRetry((v) => v + 1)}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Reload</Text>
            </Pressable>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successCard}>
            <Text style={styles.successText}>✓ {success}</Text>
          </View>
        ) : null}

        {!loading && (
          <>
            {/* Step 1: Select Item */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>1. SELECT A VAULT ITEM</Text>
            </View>

            {items.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No items found in your vault.</Text>
                <Pressable
                  onPress={() => router.push('/(auth)/legacy-setup')}
                  style={styles.outlineButton}
                >
                  <Text style={styles.outlineButtonText}>Protect an item first</Text>
                </Pressable>
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
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemMeta}>
                        {item.assignment
                          ? `Policy v${item.assignment.policyVersion} · Verification ${item.assignment.verificationRequired ? 'required' : 'optional'}`
                          : 'No policy assigned yet'}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}

            {/* Step 2: Select Recipient */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>2. SELECT A RECIPIENT</Text>
            </View>

            {people.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No recipients added yet.</Text>
                <Pressable
                  onPress={() => router.push('/(auth)/trusted-person')}
                  style={styles.outlineButton}
                >
                  <Text style={styles.outlineButtonText}>Add a recipient</Text>
                </Pressable>
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
                        {person.status === 'PRIVATE' ? 'Private · Silent' : person.status}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}

            {/* Step 3: Policy Overview */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>3. RELEASE POLICY RULES</Text>
            </View>

            {policy?.enabled ? (
              <View style={styles.policyCard}>
                <View style={styles.policyHeader}>
                  <Text style={styles.policyBadge}>VERSION {policy.version}</Text>
                  <Text style={styles.policyActive}>Active Policy</Text>
                </View>
                <Text style={styles.policyDesc}>
                  Trigger: {policy.trigger === 'CHECK_IN_ESCALATION' ? 'Missed check-in escalation & human review' : 'Manual request & review'}.
                </Text>
                <Text style={styles.policySubtext}>
                  Identity verification: {policy.verificationRequired ? 'Required' : 'Not required'}. Explicit owner authorization always applies.
                </Text>
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Release policy is not yet configured.</Text>
                <Pressable
                  onPress={() => router.push('/(auth)/release-rules')}
                  style={styles.outlineButton}
                >
                  <Text style={styles.outlineButtonText}>Configure Policy</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          disabled={!canSave}
          onPress={() => void save()}
          style={({ pressed }) => [
            styles.primaryButton,
            !canSave && styles.buttonDisabled,
            pressed && canSave && styles.buttonPressed,
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.neutral.white} />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>Confirm Assignment</Text>
              <Text style={styles.buttonArrow}>→</Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.brand.ivory,
  },
  header: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 24,
  },
  backButton: {
    position: 'absolute',
    left: 24,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 34,
    fontWeight: '300',
    color: colors.primary.deepForest,
  },
  brand: {
    fontFamily: typography.fonts.playfair.bold,
    fontSize: 18,
    letterSpacing: 3,
    color: colors.primary.deepForest,
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
  eyebrow: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.primary.forest,
  },
  title: {
    marginTop: 6,
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 27,
    lineHeight: 34,
    color: colors.primary.deepForest,
  },
  subtitle: {
    marginTop: 6,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.neutral.textSecondary,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    color: colors.neutral.textMuted,
  },
  errorCard: {
    backgroundColor: '#FDE8E8',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F8B4B4',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 12,
    color: '#9B1C1C',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: '#9B1C1C',
    borderRadius: 8,
  },
  retryText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 11,
    color: colors.neutral.white,
  },
  successCard: {
    backgroundColor: '#DEF7EC',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BCF0DA',
  },
  successText: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 12,
    color: '#03543F',
    textAlign: 'center',
  },
  sectionHeader: {
    marginTop: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 9.5,
    letterSpacing: 1.2,
    color: colors.neutral.textMuted,
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
    fontSize: 12.5,
    color: colors.neutral.textSecondary,
    marginBottom: 10,
  },
  outlineButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary.forest,
  },
  outlineButtonText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 12,
    color: colors.primary.forest,
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
    backgroundColor: '#FAFDFB',
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
  selectInfo: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 14,
    color: colors.primary.deepForest,
  },
  itemMeta: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
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
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  policyBadge: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.primary.deepForest,
  },
  policyActive: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 11,
    color: colors.primary.forest,
  },
  policyDesc: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 12,
    lineHeight: 17,
    color: colors.primary.deepForest,
    marginBottom: 4,
  },
  policySubtext: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.neutral.textSecondary,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: colors.brand.ivory,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  primaryButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary.deepForest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 15,
    color: colors.neutral.white,
  },
  buttonArrow: {
    marginLeft: 10,
    fontSize: 19,
    color: colors.neutral.white,
  },
});
