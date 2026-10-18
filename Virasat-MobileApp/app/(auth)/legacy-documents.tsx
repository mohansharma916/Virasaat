import { useState, useRef, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';

import { ActionBar } from '@/src/components/ActionBar';
import { AppIcon, type IconName } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { IconButton } from '@/src/components/IconButton';
import { InlineNotice } from '@/src/components/InlineNotice';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { haptics } from '@/src/utils/haptics';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { parseLegacyCategories } from '@/src/utils/legacy-flow';
import { uploadLegacyItem, createItemRequestKey } from '@/src/api/vault.api';
import { MAX_DOCUMENT_BYTES, MAX_DOCUMENT_LABEL, MAX_VIDEO_BYTES, MAX_VIDEO_LABEL } from '@/src/utils/upload-limits';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { useAppDispatch } from '@/src/store/hooks';
import { addLegacyItem } from '@/src/store/vault.slice';
import { runWithSystemUi } from '@/src/components/SessionGate';
import { ItemThumbnail } from '@/src/components/ItemThumbnail';
import { createUploadThumbnail, deleteThumbnail } from '@/src/utils/thumbnails';

type DocumentItem = {
  id: string;
  name: string;
  size: number;
  uri: string;
  mimeType?: string | null;
  file?: any;
  thumbnailUri?: string | null;
};

export default function LegacyDocumentsScreen() {
  const dispatch = useAppDispatch();
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
  const [failed, setFailed] = useState(false);
  const [pickError, setPickError] = useState('');
  const transfer = useRef<AbortController | null>(null);
  // Generated previews are temporary files; remove any left when leaving.
  const thumbnails = useRef(new Set<string>());
  useEffect(() => () => {
    transfer.current?.abort();
    thumbnails.current.forEach(deleteThumbnail);
  }, []);

  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_DOCUMENT_BYTES;
  const maxLabel = isVideo ? MAX_VIDEO_LABEL : MAX_DOCUMENT_LABEL;

  const addFile = (file: { name: string; size?: number | null; uri: string; mimeType?: string | null; file?: unknown }) => {
    if (file.size && file.size > maxBytes) {
      setPickError(`That file is larger than ${maxLabel}. Choose a smaller file.`);
      haptics.warning();
      return;
    }
    setPickError('');
    const id = createItemRequestKey();
    setDocuments((current) => [
      ...current,
      { id, name: file.name, size: file.size ?? 0, uri: file.uri, mimeType: file.mimeType, file: file.file },
    ]);
    void createUploadThumbnail(file.uri, file.mimeType).then((thumbnailUri) => {
      if (!thumbnailUri) return;
      thumbnails.current.add(thumbnailUri);
      setDocuments((current) => current.map((entry) => (entry.id === id ? { ...entry, thumbnailUri } : entry)));
    });
  };

  // Camera capture is the fastest way to add a paper document.
  const capturePhoto = async (source: 'camera' | 'library') => {
    if (transfer.current) return;
    setPickError('');
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setPickError('Allow camera access in your phone’s settings to photograph a document.');
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.85 };
      const result = await runWithSystemUi(() =>
        source === 'camera' ? ImagePicker.launchCameraAsync(options) : ImagePicker.launchImageLibraryAsync(options),
      );
      if (result.canceled) return;
      const asset = result.assets[0];
      addFile({
        name: asset.fileName ?? `document-${new Date().toISOString().slice(0, 10)}.jpg`,
        size: asset.fileSize,
        uri: asset.uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
        file: (asset as { file?: unknown }).file,
      });
    } catch {
      setPickError('We couldn’t open the camera or photos. Try choosing a file instead.');
    }
  };

  const pickDocument = async () => {
    if (transfer.current) return;
    try {
      const result = await runWithSystemUi(() =>
        DocumentPicker.getDocumentAsync({
          type: isVideo ? ['video/mp4', 'video/quicktime'] : [
            'application/pdf',
            'image/*',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ],
          copyToCacheDirectory: true,
          multiple: false,
        }));

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      addFile({ name: file.name, size: file.size, uri: file.uri, mimeType: file.mimeType, file: (file as { file?: unknown }).file });
    } catch {
      setPickError('We couldn’t open that file. Try another one.');
    }
  };

  const removeDocument = (id: string) => {
    if (transfer.current) return;
    deleteThumbnail(documents.find((document) => document.id === id)?.thumbnailUri);
    setDocuments((current) =>
      current.filter(
        (document) => document.id !== id,
      ),
    );
  };

  const handleContinue = async () => {
    if (transfer.current) return;
    if (documents.length === 0) {
      setPickError('Add at least one file first.');
      return;
    }

    try {
      setSaving(true);
      setFailed(false);
      const category = parseLegacyCategories(params.category)[0] ?? 'DOCUMENTS';
      transfer.current = new AbortController();
      for (const [index, document] of documents.entries()) {
        if (transfer.current.signal.aborted) break;
        setProgress(0); setUploadStatus(`Uploading file ${index + 1} of ${documents.length}`);
        const item = await uploadLegacyItem({
          requestKey: document.id,
          type: category === 'VIDEOS' ? 'VIDEO' : category === 'OTHER' ? 'OTHER' : document.mimeType?.startsWith('image/') ? 'IMAGE' : 'DOCUMENT',
          category, title: isVideo ? 'Video message' : 'Protected document', description: `File size: ${document.size} bytes`,
          file: { uri: document.uri, name: document.name, mimeType: document.mimeType, file: document.file },
          thumbnailUri: document.thumbnailUri,
        }, { signal: transfer.current.signal, onProgress: setProgress });
        dispatch(addLegacyItem(item));
        deleteThumbnail(document.thumbnailUri);
        setDocuments((current) => current.filter((entry) => entry.id !== document.id));
      }
      if (transfer.current.signal.aborted) { setUploadStatus('Upload stopped. Check your vault before retrying.'); return; }
      setUploadStatus('Files protected.');
      haptics.success();

      // Return to where the user came from (the setup hub or the vault).
      if (router.canGoBack()) router.back();
      else router.replace('/(auth)/(tabs)/home');
    } catch (error) {
      const msg = transfer.current?.signal.aborted
        ? 'Upload stopped. Files already uploaded are saved. You can retry the rest.'
        : getApiErrorMessage(error, 'We couldn’t upload your files. Check your connection and try again.');
      setUploadStatus(msg);
      setFailed(true);
      haptics.error();
    } finally {
      transfer.current = null;
      setSaving(false);
    }
  };

  const label = isVideo ? 'video' : 'document';
  const sources: { key: string; icon: IconName; title: string; detail: string; onPress: () => void }[] = isVideo
    ? [
        { key: 'record', icon: 'camera', title: 'Record a video message', detail: 'Use your camera now', onPress: () => router.push('/(auth)/legacy-video-message' as never) },
        { key: 'file', icon: 'folder', title: 'Choose a video file', detail: `MP4 or QuickTime, up to ${MAX_VIDEO_LABEL}`, onPress: () => void pickDocument() },
      ]
    : [
        { key: 'camera', icon: 'camera', title: 'Take a photo', detail: 'Photograph a paper document', onPress: () => void capturePhoto('camera') },
        { key: 'library', icon: 'image', title: 'Choose a photo', detail: 'From your photo library', onPress: () => void capturePhoto('library') },
        { key: 'file', icon: 'folder', title: 'Choose a file', detail: `PDF, Word or image, up to ${MAX_DOCUMENT_LABEL}`, onPress: () => void pickDocument() },
      ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader onBack="default" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.category}>{isVideo ? 'Video messages' : 'Important documents'}</Text>
        <Text style={styles.title} accessibilityRole="header">
          {isVideo ? 'Add a video for your loved ones' : 'Keep the important things together'}
        </Text>
        <Text style={styles.subtitle}>
          {isVideo
            ? 'Upload a video you’ve already recorded, or record one now.'
            : 'Add documents that will help your family understand and manage your affairs.'}
        </Text>

        <View style={styles.sources}>
          {sources.map((source) => (
            <Pressable
              key={source.key}
              accessibilityRole="button"
              accessibilityLabel={`${source.title}. ${source.detail}`}
              disabled={saving}
              onPress={source.onPress}
              style={({ pressed }) => [styles.source, pressed && styles.pressed, saving && styles.disabled]}
            >
              <View style={styles.sourceIcon}>
                <AppIcon name={source.icon} size={22} color={colors.primary.deepForest} />
              </View>
              <View style={styles.sourceBody}>
                <Text style={styles.sourceTitle}>{source.title}</Text>
                <Text style={styles.sourceDetail}>{source.detail}</Text>
              </View>
              <AppIcon name="plus" size={20} color={colors.primary.forest} />
            </Pressable>
          ))}
        </View>

        {pickError ? <InlineNotice tone="warning" message={pickError} style={styles.notice} /> : null}

        {documents.length > 0 ? (
          <View style={styles.documentsSection}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Ready to upload ({documents.length})
            </Text>
            {documents.map((document) => (
              <View key={document.id} style={styles.documentCard}>
                <ItemThumbnail
                  localUri={document.thumbnailUri}
                  icon={document.mimeType?.startsWith('image/') ? 'image' : document.mimeType?.startsWith('video/') || isVideo ? 'video' : 'document'}
                  size={56}
                />
                <View style={styles.documentInfo}>
                  <Text numberOfLines={1} style={styles.documentName}>{document.name}</Text>
                  <Text style={styles.documentSize}>{formatFileSize(document.size)}</Text>
                </View>
                <IconButton
                  icon="close"
                  accessibilityLabel={`Remove ${document.name}`}
                  onPress={() => removeDocument(document.id)}
                  disabled={saving}
                  color={colors.neutral.textSecondary}
                  size={20}
                />
              </View>
            ))}
          </View>
        ) : null}

        <InlineNotice
          tone="brand"
          title="Encrypted before it’s stored"
          message={`Each file is encrypted with AES-256 before it leaves for your vault. Maximum ${maxLabel} per file.`}
          style={styles.notice}
        />
      </ScrollView>

      <ActionBar>
        {uploadStatus ? (
          <View style={styles.transferRow}>
            {saving ? (
              <View
                style={styles.progressTrack}
                accessible
                accessibilityRole="progressbar"
                accessibilityLabel={uploadStatus}
                accessibilityValue={{ min: 0, max: 100, now: progress }}
              >
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
            ) : null}
            <View style={styles.transferTextRow}>
              <Text style={[styles.transferText, failed && styles.transferTextError]} accessibilityLiveRegion="polite">
                {uploadStatus}
                {saving ? ` · ${progress}%${progress === 100 ? ', confirming' : ''}` : ''}
              </Text>
              {saving ? <Button title="Stop" variant="tertiary" onPress={() => transfer.current?.abort()} /> : null}
            </View>
          </View>
        ) : null}

        <Button
          title={
            saving
              ? 'Uploading…'
              : documents.length === 0
                ? `Add a ${label} to continue`
                : failed
                  ? 'Retry upload'
                  : `Upload ${documents.length} ${documents.length === 1 ? 'file' : 'files'}`
          }
          onPress={() => void handleContinue()}
          disabled={documents.length === 0 || saving}
          loading={saving}
        />
      </ActionBar>
    </SafeAreaView>
  );
}

function formatFileSize(bytes: number) {
  if (!bytes) return 'Size unknown';
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${Math.round(bytes / 1024)} KB`;
  return `${mb.toFixed(1)} MB`;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.brand.ivory },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  category: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.label, color: colors.primary.forest },
  title: {
    marginTop: 4,
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
  sources: {
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    overflow: 'hidden',
  },
  source: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral.border,
  },
  pressed: { backgroundColor: colors.brand.mint },
  disabled: { opacity: 0.5 },
  sourceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceBody: { flex: 1, gap: 2 },
  sourceTitle: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.callout, lineHeight: 22, color: colors.neutral.textPrimary },
  sourceDetail: { fontFamily: typography.fonts.inter.regular, fontSize: typography.sizes.caption, lineHeight: 18, color: colors.neutral.textSecondary },
  notice: { marginTop: 16 },
  documentsSection: { marginTop: 24, gap: 8 },
  sectionTitle: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.label, color: colors.neutral.textSecondary },
  documentCard: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 12,
    paddingRight: 4,
    borderRadius: 12,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  documentInfo: { flex: 1, gap: 2 },
  documentName: { fontFamily: typography.fonts.inter.medium, fontSize: typography.sizes.callout, color: colors.neutral.textPrimary },
  documentSize: { fontFamily: typography.fonts.inter.regular, fontSize: typography.sizes.caption, color: colors.neutral.textMuted },
  transferRow: { marginBottom: 8, gap: 6 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.brand.sage, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary.forest },
  transferTextRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  transferText: {
    flex: 1,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.caption,
    lineHeight: 18,
    color: colors.neutral.textSecondary,
  },
  transferTextError: { color: colors.semantic.error },
});
