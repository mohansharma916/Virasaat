import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router, useLocalSearchParams } from 'expo-router';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import {
  markLegacyCategoryComplete,
  parseLegacyCategories,
} from '@/src/utils/legacy-flow';
import { createLegacyItem } from '@/src/api/vault.api';
import { getApiErrorMessage } from '@/src/utils/api-error';

export default function LegacyInvestmentDetailsScreen() {
  const params = useLocalSearchParams<{
    category?: string;
    categories?: string;
  }>();
  const [provider, setProvider] = useState('');
  const [folioNumber, setFolioNumber] = useState('');
  const [contact, setContact] = useState('');
  const [value, setValue] = useState('');
  const [instructions, setInstructions] =
    useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!provider.trim()) {
      Alert.alert(
        'Provider required',
        'Please enter the investment provider or institution.',
      );
      return;
    }

    if (!folioNumber.trim()) {
      Alert.alert(
        'Reference required',
        'Please enter the account or folio number.',
      );
      return;
    }

    try {
      setSaving(true);
      await createLegacyItem({
        type: 'FINANCIAL',
        category: 'INVESTMENTS',
        title: 'Financial record',
        description: [
          `Provider: ${provider.trim()}`,
          `Reference: ${folioNumber.trim()}`,
          contact.trim() ? `Contact: ${contact.trim()}` : '',
          value.trim() ? `Approximate value: ${value.trim()}` : '',
          instructions.trim() ? `Instructions: ${instructions.trim()}` : '',
        ].filter(Boolean).join('\n'),
      });

      const category = parseLegacyCategories(params.category)[0];

      if (category) {
        markLegacyCategoryComplete(category);
      }

      router.replace({
        pathname: '/(auth)/legacy-category',
        params: {
          categories: params.categories ?? category ?? 'INVESTMENTS',
        },
      });
    } catch (error) {
      Alert.alert('Unable to save investment', getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}

          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={styles.backButton}
            >
              <Text style={styles.backArrow}>
                ‹
              </Text>
            </Pressable>

            <Text style={styles.brand}>
              VIRASAT
            </Text>
          </View>

          {/* Progress */}

          <View style={styles.progressContainer}>
            {Array.from({ length: 10 }).map(
              (_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressItem,
                    styles.progressItemActive,
                  ]}
                />
              ),
            )}
          </View>

          {/* Heading */}

          <View style={styles.heading}>
            <Text style={styles.eyebrow}>
              INVESTMENT DETAILS
            </Text>

            <Text style={styles.title}>
              Add the details your family may need.
            </Text>

            <Text style={styles.subtitle}>
              Keep this information focused on
              identifying and managing the asset.
            </Text>
          </View>

          {/* Investment Type */}

          <FieldLabel label="Investment type" />

          <Pressable style={styles.select}>
            <Text style={styles.selectText}>
              Mutual Fund
            </Text>

            <Text style={styles.chevron}>
              ▼
            </Text>
          </Pressable>

          {/* Provider */}

          <FieldLabel
            label="Provider / Institution"
          />

          <TextInput
            value={provider}
            onChangeText={setProvider}
            placeholder="e.g. HDFC Mutual Fund"
            placeholderTextColor={
              colors.neutral.textMuted
            }
            style={styles.input}
          />

          {/* Folio */}

          <FieldLabel label="Account / Folio Number" />

          <TextInput
            value={folioNumber}
            onChangeText={setFolioNumber}
            placeholder="Enter reference number"
            placeholderTextColor={
              colors.neutral.textMuted
            }
            autoCapitalize="none"
            style={styles.input}
          />

          {/* Contact */}

          <FieldLabel
            label="Registered Email / Phone"
            optional
          />

          <TextInput
            value={contact}
            onChangeText={setContact}
            placeholder="Optional"
            placeholderTextColor={
              colors.neutral.textMuted
            }
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          {/* Value */}

          <FieldLabel
            label="Approximate Value"
            optional
          />

          <View style={styles.amountInput}>
            <Text style={styles.rupee}>
              ₹
            </Text>

            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder="Enter amount"
              placeholderTextColor={
                colors.neutral.textMuted
              }
              keyboardType="numeric"
              style={styles.amountTextInput}
            />
          </View>

          {/* Instructions */}

          <FieldLabel
            label="Important Instructions"
            optional
          />

          <TextInput
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Add any information your family should know..."
            placeholderTextColor={
              colors.neutral.textMuted
            }
            multiline
            textAlignVertical="top"
            style={styles.textArea}
          />

          {/* Supporting Document */}

          <FieldLabel
            label="Supporting Document"
            optional
          />

          <Pressable style={styles.documentButton}>
            <Text style={styles.documentPlus}>
              +
            </Text>

            <Text style={styles.documentText}>
              Add document
            </Text>
          </Pressable>

          {/* Security */}

          <View style={styles.securityCard}>
            <View style={styles.securityIcon}>
              <Text style={styles.lock}>
                🔒
              </Text>
            </View>

            <View style={styles.securityContent}>
              <Text style={styles.securityTitle}>
                Sensitive information
              </Text>

              <Text style={styles.securityText}>
                Never enter passwords, PINs, OTPs,
                CVVs or banking login credentials.
              </Text>
            </View>
          </View>

          {/* Save */}

          <Pressable
            disabled={saving}
            onPress={handleSave}
            style={({ pressed }) => [
              styles.button,
              pressed && !saving && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>
              {saving ? 'Saving…' : 'Save Investment'}
            </Text>
          </Pressable>

          <Text style={styles.footer}>
            You can edit this information later.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldLabel({
  label,
  optional = false,
}: {
  label: string;
  optional?: boolean;
}) {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.label}>
        {label}
      </Text>

      {optional && (
        <Text style={styles.optional}>
          Optional
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.brand.ivory,
  },

  keyboard: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },

  header: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  backButton: {
    position: 'absolute',
    left: 0,
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

  progressContainer: {
    marginTop: 27,
    flexDirection: 'row',
    gap: 5,
  },

  progressItem: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary.forest,
  },

  progressItemActive: {
    backgroundColor: colors.primary.forest,
  },

  heading: {
    marginTop: 35,
    marginBottom: 22,
  },

  eyebrow: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.primary.forest,
  },

  title: {
    marginTop: 7,
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 28,
    lineHeight: 37,
    color: colors.primary.deepForest,
  },

  subtitle: {
    marginTop: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12.5,
    lineHeight: 20,
    color: colors.neutral.textSecondary,
  },

  labelRow: {
    marginTop: 17,
    marginBottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  label: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 11,
    color: colors.neutral.textPrimary,
  },

  optional: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 9.5,
    color: colors.neutral.textMuted,
  },

  input: {
    height: 52,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    color: colors.neutral.textPrimary,
  },

  select: {
    height: 52,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectText: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    color: colors.neutral.textPrimary,
  },

  chevron: {
    fontSize: 9,
    color: colors.neutral.textMuted,
  },

  amountInput: {
    height: 52,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    flexDirection: 'row',
    alignItems: 'center',
  },

  rupee: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 14,
    color: colors.primary.forest,
    marginRight: 8,
  },

  amountTextInput: {
    flex: 1,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    color: colors.neutral.textPrimary,
  },

  textArea: {
    minHeight: 105,
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 13,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    lineHeight: 19,
    color: colors.neutral.textPrimary,
  },

  documentButton: {
    height: 50,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.brand.sage,
    backgroundColor: colors.brand.mint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  documentPlus: {
    fontSize: 19,
    color: colors.primary.forest,
    marginRight: 7,
  },

  documentText: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 11,
    color: colors.primary.forest,
  },

  securityCard: {
    marginTop: 20,
    padding: 13,
    borderRadius: 14,
    backgroundColor: colors.brand.mint,
    flexDirection: 'row',
  },

  securityIcon: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },

  lock: {
    fontSize: 12,
  },

  securityContent: {
    flex: 1,
    marginLeft: 10,
  },

  securityTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 10.5,
    color: colors.neutral.textPrimary,
  },

  securityText: {
    marginTop: 3,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.neutral.textSecondary,
  },

  button: {
    height: 56,
    marginTop: 23,
    borderRadius: 14,
    backgroundColor: colors.primary.deepForest,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  buttonText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 14,
    color: colors.neutral.white,
  },

  footer: {
    marginTop: 13,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 10,
    color: colors.neutral.textMuted,
    textAlign: 'center',
  },
});
