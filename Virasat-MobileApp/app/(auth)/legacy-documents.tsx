import { useState, useRef, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { parseLegacyCategories } from '@/src/utils/legacy-flow';
import { uploadLegacyItem, createItemRequestKey } from '@/src/api/vault.api';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { useAppDispatch } from '@/src/store/hooks';
import { addLegacyItem } from '@/src/store/vault.slice';

type DocumentItem = {
  id: string;
  name: string;
  size: number;
  uri: string;
  mimeType?: string | null;
};

export default function LegacyDocumentsScreen() {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    category?: string;
    categories?: string;
  }>();
  const isVideo = params.category === 'VIDEOS';
  const [documents, setDocuments] = useState<
    DocumentItem[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const transfer = useRef<AbortController | null>(null);
  useEffect(() => () => transfer.current?.abort(), []);

  const pickDocument = async () => {
    if (transfer.current) return;
    try {
      const result =
        await DocumentPicker.getDocumentAsync({
          type: isVideo ? ['video/mp4', 'video/quicktime'] : [
            'application/pdf',
            'image/*',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ],
          copyToCacheDirectory: true,
          multiple: false,
        });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];

      // 25 MB limit
      const MAX_FILE_SIZE =
        25 * 1024 * 1024;

      if (
        file.size &&
        file.size > MAX_FILE_SIZE
      ) {
        Alert.alert(
          'File too large',
          'Please select a file smaller than 25 MB.',
        );

        return;
      }

      const newDocument: DocumentItem = {
        id: createItemRequestKey(),
        name: file.name,
        size: file.size ?? 0,
        uri: file.uri,
        mimeType: file.mimeType,
      };

      setDocuments((current) => [
        ...current,
        newDocument,
      ]);
    } catch {
      Alert.alert(
        'Unable to add document',
        'Something went wrong while selecting the document.',
      );
    }
  };

  const removeDocument = (id: string) => {
    if (transfer.current) return;
    setDocuments((current) =>
      current.filter(
        (document) => document.id !== id,
      ),
    );
  };

  const handleContinue = async () => {
    if (transfer.current) return;
    if (documents.length === 0) {
      Alert.alert(
        'Add a document',
        'Please add at least one document to continue.',
      );

      return;
    }

    try {
      setSaving(true);
      const category = parseLegacyCategories(params.category)[0] ?? 'DOCUMENTS';
      transfer.current = new AbortController();
      for (const [index, document] of documents.entries()) {
        if (transfer.current.signal.aborted) break;
        setProgress(0); setUploadStatus(`Uploading file ${index + 1} of ${documents.length}`);
        const item = await uploadLegacyItem({
          requestKey: document.id,
          type: category === 'VIDEOS' ? 'VIDEO' : category === 'OTHER' ? 'OTHER' : document.mimeType?.startsWith('image/') ? 'IMAGE' : 'DOCUMENT',
          category, title: isVideo ? 'Video message' : 'Protected document', description: `File size: ${document.size} bytes`,
          file: { uri: document.uri, name: document.name, mimeType: document.mimeType },
        }, { signal: transfer.current.signal, onProgress: setProgress });
        dispatch(addLegacyItem(item));
        setDocuments((current) => current.filter((entry) => entry.id !== document.id));
      }
      if (transfer.current.signal.aborted) { setUploadStatus('Upload stopped. Check your vault before retrying.'); return; }
      setUploadStatus('Files protected.');

      router.replace('/(auth)/home');
    } catch (error) {
      setUploadStatus(transfer.current?.signal.aborted ? 'Transfer stopped. Confirmed files remain saved. Retry remaining files safely.' : getApiErrorMessage(error));
    } finally {
      transfer.current = null;
      setSaving(false);
    }
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
            {isVideo ? 'VIDEO MESSAGE' : 'IMPORTANT DOCUMENTS'}
          </Text>

          <Text style={styles.title}>
            Keep the important things together.
          </Text>

          <Text style={styles.subtitle}>
            Upload documents that may help your
            family understand and manage your
            affairs later.
          </Text>
        </View>

        {/* Add Document */}

        <Pressable
          disabled={saving}
          accessibilityRole="button"
          onPress={pickDocument}
          style={({ pressed }) => [
            styles.uploadCard,
            pressed && styles.uploadPressed,
          ]}
        >
          <View style={styles.plusCircle}>
            <Text style={styles.plus}>
              +
            </Text>
          </View>

          <Text style={styles.uploadTitle}>
            {isVideo ? 'Add a video' : 'Add a document'}
          </Text>

          <Text style={styles.uploadSubtitle}>
            {isVideo ? 'MP4 or QuickTime video' : 'PDF, image or document'}
          </Text>

          <Text style={styles.uploadLimit}>
            Up to 25 MB
          </Text>
        </Pressable>

        {/* Documents */}

        {documents.length > 0 && (
          <View style={styles.documentsSection}>
            <Text style={styles.sectionTitle}>
              ADDED DOCUMENTS
            </Text>

            {documents.map((document) => (
              <View
                key={document.id}
                style={styles.documentCard}
              >
                <View style={styles.fileIcon}>
                  <Text style={styles.fileIconText}>
                    📄
                  </Text>
                </View>

                <View style={styles.documentInfo}>
                  <Text
                    numberOfLines={1}
                    style={styles.documentName}
                  >
                    {document.name}
                  </Text>

                  <Text style={styles.documentSize}>
                    {formatFileSize(
                      document.size,
                    )}
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    removeDocument(document.id)
                  }
                  hitSlop={12}
                >
                  <Text style={styles.remove}>
                    ×
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Security */}

        <View style={styles.securityCard}>
          <View style={styles.securityIcon}>
            <Text style={styles.lock}>
              🔒
            </Text>
          </View>

          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>
              AWS S3 Encrypted Vault
            </Text>

            <Text style={styles.securityText}>
              Each file is protected with client-side AES-256-GCM envelope
              encryption before storage in AWS S3 with hardware-level at-rest encryption.
            </Text>
          </View>
        </View>

        <Text style={styles.helperNotice}>
          AES-256-GCM + S3 SSE · SHA-256 verified · Max 25 MB per file
        </Text>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {!!uploadStatus && (
          <View style={styles.transferRow}>
            <Text style={styles.transferText} accessibilityLiveRegion="polite">
              {uploadStatus}{saving ? ` · ${progress}%${progress === 100 ? ' — confirming' : ''}` : ''}
            </Text>
            {saving && (
              <Pressable
                accessibilityRole="button"
                style={styles.stopButton}
                onPress={() => transfer.current?.abort()}
              >
                <Text style={styles.stopText}>Stop</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Continue */}
        <Pressable
          disabled={documents.length === 0 || saving}
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.button,
            (documents.length === 0 || saving) &&
              styles.buttonDisabled,
            pressed &&
              documents.length > 0 && !saving &&
              styles.buttonPressed,
          ]}
        >
          {saving ? (
            <Text style={styles.buttonText}>Saving…</Text>
          ) : (
            <>
              <Text style={styles.buttonText}>
                Continue
              </Text>

              <Text style={styles.buttonArrow}>
                →
              </Text>
            </>
          )}
        </Pressable>

        <Text style={styles.footer}>
          {documents.length === 0
            ? 'Add at least one document'
            : `${documents.length} ${
                documents.length === 1
                  ? 'document'
                  : 'documents'
              } added`}
        </Text>
      </View>
    </SafeAreaView>
  );
}

function formatFileSize(bytes: number) {
  if (!bytes) {
    return 'Unknown size';
  }

  const mb = bytes / (1024 * 1024);

  if (mb < 1) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${mb.toFixed(1)} MB`;
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

  uploadCard: {
    minHeight: 170,
    borderRadius: 17,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary.forest,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  uploadPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },

  plusCircle: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  plus: {
    fontSize: 25,
    fontWeight: '300',
    color: colors.primary.forest,
  },

  uploadTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 14,
    color: colors.primary.deepForest,
  },

  uploadSubtitle: {
    marginTop: 4,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    color: colors.neutral.textSecondary,
  },

  uploadLimit: {
    marginTop: 3,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 10,
    color: colors.neutral.textMuted,
  },

  documentsSection: {
    marginTop: 25,
  },

  sectionTitle: {
    marginBottom: 11,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 9,
    letterSpacing: 1.3,
    color: colors.neutral.textMuted,
  },

  documentCard: {
    minHeight: 67,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 13,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },

  fileIcon: {
    width: 37,
    height: 37,
    borderRadius: 10,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  fileIconText: {
    fontSize: 16,
  },

  documentInfo: {
    flex: 1,
    marginLeft: 11,
  },

  documentName: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 12,
    color: colors.neutral.textPrimary,
  },

  documentSize: {
    marginTop: 3,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 10,
    color: colors.neutral.textMuted,
  },

  remove: {
    fontSize: 22,
    fontWeight: '300',
    color: colors.neutral.textMuted,
    paddingLeft: 10,
  },

  securityCard: {
    marginTop: 7,
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

  helperNotice: {
    marginTop: 16,
    marginBottom: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    color: colors.neutral.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },

  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: colors.brand.ivory,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },

  transferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },

  transferText: {
    flex: 1,
    fontFamily: typography.fonts.inter.medium,
    fontSize: 12,
    color: colors.primary.deepForest,
  },

  stopButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FDE8E8',
    marginLeft: 8,
  },

  stopText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 12,
    color: '#9B1C1C',
  },

  button: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary.deepForest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonDisabled: {
    opacity: 0.35,
  },

  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
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
});
