import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FormScrollView } from '@/src/components/FormScrollView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ActionBar } from '@/src/components/ActionBar';
import { AppIcon } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { InlineNotice } from '@/src/components/InlineNotice';
import { Input } from '@/src/components/Input';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { createLegacyItem, createItemRequestKey } from '@/src/api/vault.api';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { ASSET_TYPES, type AssetTypeId } from '@/src/utils/financial-assets';
import { haptics } from '@/src/utils/haptics';
import { useAppDispatch } from '@/src/store/hooks';
import { addLegacyItem } from '@/src/store/vault.slice';

export default function LegacyInvestmentDetailsScreen() {
  const dispatch = useAppDispatch();
  const [assetType, setAssetType] = useState<AssetTypeId>('INVESTMENT');
  const [provider, setProvider] = useState('');
  const [reference, setReference] = useState('');
  const [contact, setContact] = useState('');
  const [value, setValue] = useState('');
  const [instructions, setInstructions] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ provider?: string; reference?: string }>({});
  const [submitError, setSubmitError] = useState('');
  const requestKey = useRef(createItemRequestKey());
  const busy = useRef(false);

  const type = ASSET_TYPES.find((entry) => entry.id === assetType) ?? ASSET_TYPES[0];

  const handleSave = async () => {
    if (busy.current) return;
    const nextErrors: typeof errors = {};
    if (!provider.trim()) nextErrors.provider = 'Enter who holds this asset.';
    if (!reference.trim()) nextErrors.reference = `Enter the ${type.referenceLabel.toLowerCase()}.`;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      haptics.error();
      return;
    }

    try {
      busy.current = true;
      setSaving(true);
      setSubmitError('');
      const item = await createLegacyItem({
        requestKey: requestKey.current,
        type: 'FINANCIAL',
        category: 'INVESTMENTS',
        title: type.label,
        description: [
          `Type: ${type.label}`,
          `Provider: ${provider.trim()}`,
          `Reference: ${reference.trim()}`,
          contact.trim() ? `Contact: ${contact.trim()}` : '',
          value.trim() ? `Approximate value: ₹${value.trim()}` : '',
          instructions.trim() ? `Instructions: ${instructions.trim()}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      });
      dispatch(addLegacyItem(item));
      haptics.success();
      if (router.canGoBack()) router.back();
      else router.replace('/(auth)/(tabs)/home');
    } catch (error) {
      haptics.error();
      setSubmitError(getApiErrorMessage(error, 'We couldn’t save this asset. Check your connection and try again.'));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.keyboard}>
        <ScreenHeader onBack="default" />
        <FormScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.title} accessibilityRole="header">Add a financial asset</Text>
          <Text style={styles.subtitle}>Just enough for your family to find it and contact the provider.</Text>

          <Text style={styles.label} nativeID="assetTypeLabel">Type of asset</Text>
          <View style={styles.typeGrid} accessibilityRole="radiogroup" accessibilityLabelledBy="assetTypeLabel">
            {ASSET_TYPES.map((entry) => {
              const selected = entry.id === assetType;
              return (
                <Pressable
                  key={entry.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={entry.label}
                  onPress={() => {
                    haptics.selection();
                    setAssetType(entry.id);
                  }}
                  style={[styles.typeChip, selected && styles.typeChipSelected]}
                >
                  <AppIcon name={entry.icon} size={18} color={selected ? colors.neutral.white : colors.primary.deepForest} />
                  <Text style={[styles.typeText, selected && styles.typeTextSelected]}>{entry.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Input
            label="Provider or institution"
            placeholder={type.providerHint}
            value={provider}
            onChangeText={(text) => {
              setProvider(text);
              if (errors.provider) setErrors((current) => ({ ...current, provider: undefined }));
            }}
            error={errors.provider}
            autoCapitalize="words"
          />
          <Input
            label={type.referenceLabel}
            placeholder="So your family can identify it"
            value={reference}
            onChangeText={(text) => {
              setReference(text);
              if (errors.reference) setErrors((current) => ({ ...current, reference: undefined }));
            }}
            error={errors.reference}
            autoCapitalize="none"
          />
          <Input
            label="Registered email or phone"
            required={false}
            placeholder="The contact the provider has on file"
            value={contact}
            onChangeText={setContact}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View>
            <Input
              label="Approximate value in rupees"
              required={false}
              placeholder="e.g. 5,00,000"
              value={value}
              onChangeText={setValue}
              keyboardType="numeric"
              style={styles.amountInput}
            />
            <Text style={styles.currency} accessible={false}>₹</Text>
          </View>

          <Input
            label="Instructions for your family"
            required={false}
            placeholder="Anything they should know, such as who to call first"
            value={instructions}
            onChangeText={setInstructions}
            multiline
          />

          <InlineNotice
            tone="warning"
            icon="key"
            title="Keep secrets out"
            message="Never enter passwords, PINs, OTPs, card CVVs or banking logins."
          />
        </FormScrollView>

        <ActionBar>
          {submitError ? <InlineNotice tone="danger" message={submitError} style={styles.error} /> : null}
          <Button title="Save asset" onPress={() => void handleSave()} loading={saving} />
        </ActionBar>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.brand.ivory },
  keyboard: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  title: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: typography.sizes.title1,
    lineHeight: typography.lineHeights.title1,
    color: colors.primary.deepForest,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    color: colors.neutral.textSecondary,
  },
  label: {
    marginBottom: 8,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.label,
    lineHeight: typography.lineHeights.label,
    color: colors.neutral.textPrimary,
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  typeChip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.neutral.control,
    backgroundColor: colors.neutral.white,
  },
  typeChipSelected: { backgroundColor: colors.primary.deepForest, borderColor: colors.primary.deepForest },
  typeText: { fontFamily: typography.fonts.inter.medium, fontSize: typography.sizes.label, color: colors.neutral.textPrimary },
  typeTextSelected: { color: colors.neutral.white },
  amountInput: { paddingLeft: 36 },
  currency: {
    position: 'absolute',
    left: 16,
    top: 42,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.body,
    color: colors.neutral.textSecondary,
  },
  error: { marginBottom: 8 },
});
