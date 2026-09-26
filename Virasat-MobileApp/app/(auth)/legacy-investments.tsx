import { useState } from 'react';

import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { router, useLocalSearchParams } from 'expo-router';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { parseLegacyCategories } from '@/src/utils/legacy-flow';

type AssetType =
  | 'INVESTMENT'
  | 'INSURANCE'
  | 'BANK'
  | 'PROPERTY'
  | 'OTHER';

type FinancialAsset = {
  id: string;
  type: AssetType;
  title: string;
  provider: string;
  identifier?: string;
};

const assetTypes = [
  {
    id: 'INVESTMENT' as AssetType,
    title: 'Investments',
    icon: '📈',
  },
  {
    id: 'INSURANCE' as AssetType,
    title: 'Insurance',
    icon: '🛡',
  },
  {
    id: 'BANK' as AssetType,
    title: 'Bank',
    icon: '🏦',
  },
  {
    id: 'PROPERTY' as AssetType,
    title: 'Property',
    icon: '🏠',
  },
  {
    id: 'OTHER' as AssetType,
    title: 'Other Financial Asset',
    icon: '＋',
  },
];

export default function LegacyInvestmentsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    category?: string;
    categories?: string;
  }>();
  const [assets, setAssets] = useState<
    FinancialAsset[]
  >([]);

  const [showAssetModal, setShowAssetModal] =
    useState(false);

const addAsset = (type: AssetType) => {
  setShowAssetModal(false);

  if (type === 'INVESTMENT') {
    router.push({
      pathname: '/(auth)/legacy-investment-details',
      params: {
        category: params.category ?? 'INVESTMENTS',
        categories: params.categories ?? 'INVESTMENTS',
      },
    });
    return;
  }

  Alert.alert(
    'Coming next',
    'This asset type will be implemented in the next screen.',
  );
};

  const removeAsset = (id: string) => {
    setAssets((current) =>
      current.filter(
        (asset) => asset.id !== id,
      ),
    );
  };

  const handleContinue = () => {
    if (assets.length === 0) {
      Alert.alert(
        'Add an asset first',
        'Add at least one financial asset before continuing.',
      );
      return;
    }

    const category = parseLegacyCategories(params.category)[0];

    router.replace({
      pathname: '/(auth)/legacy-category',
      params: {
        categories: params.categories ?? category ?? 'INVESTMENTS',
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
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

        {/* Heading */}

        <View style={styles.heading}>
          <Text style={styles.eyebrow}>
            INVESTMENTS & FINANCE
          </Text>

          <Text style={styles.title}>
            Help your family find what you've built.
          </Text>

          <Text style={styles.subtitle}>
            Add information about your investments,
            insurance and other financial assets.
          </Text>
        </View>

        {/* Add Asset */}

        <Pressable
          onPress={() => setShowAssetModal(true)}
          style={({ pressed }) => [
            styles.addCard,
            pressed && styles.cardPressed,
          ]}
        >
          <View style={styles.addIcon}>
            <Text style={styles.plus}>
              +
            </Text>
          </View>

          <View style={styles.addContent}>
            <Text style={styles.addTitle}>
              Add Financial Asset
            </Text>

            <Text style={styles.addDescription}>
              Investment, insurance, bank account
              or other financial asset
            </Text>
          </View>

          <Text style={styles.arrow}>
            →
          </Text>
        </Pressable>

        {/* Assets */}

        {assets.length > 0 && (
          <View style={styles.assetsSection}>
            <Text style={styles.sectionTitle}>
              YOUR FINANCIAL ASSETS
            </Text>

            {assets.map((asset) => (
              <View
                key={asset.id}
                style={styles.assetCard}
              >
                <View style={styles.assetIcon}>
                  <Text style={styles.assetEmoji}>
                    {getAssetIcon(asset.type)}
                  </Text>
                </View>

                <View style={styles.assetInfo}>
                  <Text style={styles.assetTitle}>
                    {asset.title}
                  </Text>

                  <Text style={styles.assetProvider}>
                    {asset.provider}
                  </Text>

                  {asset.identifier && (
                    <Text style={styles.assetIdentifier}>
                      Account {maskIdentifier(
                        asset.identifier,
                      )}
                    </Text>
                  )}
                </View>

                <Pressable
                  hitSlop={12}
                  onPress={() =>
                    removeAsset(asset.id)
                  }
                >
                  <Text style={styles.more}>
                    ×
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Security Warning */}

        <View style={styles.securityCard}>
          <View style={styles.securityIcon}>
            <Text style={styles.lock}>
              🔒
            </Text>
          </View>

          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>
              Keep authentication secrets out
            </Text>

            <Text style={styles.securityText}>
              Never store passwords, PINs, OTPs,
              CVVs or similar authentication secrets
              in Virasat.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {/* Continue */}
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.button,
            assets.length === 0 && styles.buttonDisabled,
            pressed && assets.length > 0 && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>
            Continue
          </Text>

          <Text style={styles.buttonArrow}>
            →
          </Text>
        </Pressable>

        <Text style={styles.footer}>
          {assets.length === 0
            ? 'You can add assets later'
            : `${assets.length} ${
                assets.length === 1
                  ? 'asset'
                  : 'assets'
              } added`}
        </Text>
      </View>

      {/* Asset Type Modal */}

      <Modal
        visible={showAssetModal}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowAssetModal(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>
              Add Financial Asset
            </Text>

            <Text style={styles.modalSubtitle}>
              What would you like to add?
            </Text>

            <View style={styles.assetTypeGrid}>
              {assetTypes.map((type) => (
                <Pressable
                  key={type.id}
                  onPress={() =>
                    addAsset(type.id)
                  }
                  style={({ pressed }) => [
                    styles.assetType,
                    pressed &&
                      styles.assetTypePressed,
                  ]}
                >
                  <Text style={styles.typeIcon}>
                    {type.icon}
                  </Text>

                  <Text style={styles.typeTitle}>
                    {type.title}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() =>
                setShowAssetModal(false)
              }
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getAssetIcon(type: AssetType) {
  switch (type) {
    case 'INVESTMENT':
      return '📈';

    case 'INSURANCE':
      return '🛡';

    case 'BANK':
      return '🏦';

    case 'PROPERTY':
      return '🏠';

    default:
      return '📁';
  }
}

function maskIdentifier(value: string) {
  if (value.length <= 4) {
    return `•••• ${value}`;
  }

  return `•••• ${value.slice(-4)}`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.brand.ivory,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 35,
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
    marginTop: 18,
    marginBottom: 16,
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
    fontSize: 29,
    lineHeight: 38,
    color: colors.primary.deepForest,
  },

  subtitle: {
    marginTop: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    lineHeight: 21,
    color: colors.neutral.textSecondary,
  },

  addCard: {
    minHeight: 91,
    padding: 15,
    borderRadius: 16,
    backgroundColor: colors.brand.mint,
    borderWidth: 1,
    borderColor: colors.brand.sage,
    flexDirection: 'row',
    alignItems: 'center',
  },

  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },

  addIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },

  plus: {
    fontSize: 25,
    fontWeight: '300',
    color: colors.primary.forest,
  },

  addContent: {
    flex: 1,
    marginLeft: 12,
  },

  addTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 13,
    color: colors.primary.deepForest,
  },

  addDescription: {
    marginTop: 4,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 10.5,
    lineHeight: 16,
    color: colors.neutral.textSecondary,
  },

  arrow: {
    marginLeft: 8,
    fontSize: 18,
    color: colors.primary.forest,
  },

  assetsSection: {
    marginTop: 25,
  },

  sectionTitle: {
    marginBottom: 11,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 9,
    letterSpacing: 1.3,
    color: colors.neutral.textMuted,
  },

  assetCard: {
    minHeight: 70,
    padding: 12,
    marginBottom: 9,
    borderRadius: 13,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    flexDirection: 'row',
    alignItems: 'center',
  },

  assetIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  assetEmoji: {
    fontSize: 17,
  },

  assetInfo: {
    flex: 1,
    marginLeft: 11,
  },

  assetTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 12.5,
    color: colors.neutral.textPrimary,
  },

  assetProvider: {
    marginTop: 3,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 10.5,
    color: colors.neutral.textSecondary,
  },

  assetIdentifier: {
    marginTop: 2,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 9.5,
    color: colors.neutral.textMuted,
  },

  more: {
    fontSize: 22,
    color: colors.neutral.textMuted,
    paddingLeft: 10,
  },

  securityCard: {
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.brand.mint,
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 11,
    color: colors.neutral.textPrimary,
  },

  securityText: {
    marginTop: 3,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 10.5,
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

  button: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary.deepForest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  buttonDisabled: {
    opacity: 0.45,
  },

  buttonText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 15,
    color: colors.neutral.white,
  },

  buttonArrow: {
    marginLeft: 10,
    fontSize: 19,
    color: colors.neutral.white,
  },

  footer: {
    marginTop: 10,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    color: colors.neutral.textMuted,
    textAlign: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },

  modal: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: colors.brand.ivory,
  },

  modalHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral.border,
    marginBottom: 22,
  },

  modalTitle: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 25,
    color: colors.primary.deepForest,
  },

  modalSubtitle: {
    marginTop: 5,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    color: colors.neutral.textSecondary,
  },

  assetTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 22,
  },

  assetType: {
    width: '47%',
    minHeight: 105,
    borderRadius: 15,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },

  assetTypePressed: {
    opacity: 0.75,
  },

  typeIcon: {
    fontSize: 25,
    marginBottom: 8,
  },

  typeTitle: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 11,
    textAlign: 'center',
    color: colors.neutral.textPrimary,
  },

  cancelButton: {
    height: 50,
    marginTop: 18,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },

  cancelText: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 13,
    color: colors.primary.deepForest,
  },
});
