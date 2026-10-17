import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import type { File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { downloadLegacyItem, getLegacyItem, updateLegacyItem, type LegacyItemDetail } from '@/src/api/vault.api';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { useAppDispatch } from '@/src/store/hooks';
import { addLegacyItem } from '@/src/store/vault.slice';
import { ActionBar } from '@/src/components/ActionBar';
import { AppIcon } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { InlineNotice } from '@/src/components/InlineNotice';
import { Input } from '@/src/components/Input';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { Skeleton, SkeletonGroup } from '@/src/components/Skeleton';
import { TextLink } from '@/src/components/TextLink';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { createTemporaryVaultExport } from '@/src/storage/vault-export.storage';
import { runWithSystemUi } from '@/src/components/SessionGate';

export default function SavedItemScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const dispatch = useAppDispatch();
  const [item, setItem] = useState<LegacyItemDetail | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    const request = new AbortController();
    controller.current = request;
    setItem(null);
    setError('');
    setEditing(false);
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      setError('This saved item link is invalid.');
      return () => request.abort();
    }
    void getLegacyItem(id, request.signal).then((detail) => {
      if (request.signal.aborted) return;
      setItem(detail);
      setTitle(detail.title);
      setDescription(detail.description ?? '');
    }).catch((reason) => {
      if (!request.signal.aborted) setError(getApiErrorMessage(reason, 'We couldn’t open this item. Check your connection and try again.'));
    });
    return () => request.abort();
  }, [id, retry]);

  const save = async () => {
    if (!item || busy || !title.trim()) return;
    const signal = controller.current?.signal;
    setBusy(true);
    setError('');
    try {
      const updated = await updateLegacyItem(item.id, { title: title.trim(), description }, signal);
      if (signal?.aborted) return;
      setItem(updated);
      // List metadata must never cache decrypted descriptions across screens.
      dispatch(addLegacyItem({ ...updated, description: null }));
      setEditing(false);
    } catch (reason) {
      if (!signal?.aborted) setError(getApiErrorMessage(reason, 'We couldn’t save your changes. Try again.'));
    } finally {
      if (!signal?.aborted) setBusy(false);
    }
  };

  const exportFile = async () => {
    if (!item?.hasFile || busy) return;
    const signal = controller.current?.signal;
    let temporaryFile: File | undefined;
    setBusy(true);
    setError('');
    try {
      if (Platform.OS !== 'web' && !(await Sharing.isAvailableAsync())) throw new Error('File sharing is unavailable on this device.');
      const data = await downloadLegacyItem(item.id, signal);
      if (signal?.aborted) return;
      const name = (item.fileName || item.title || 'vault-file').replace(/[^\w. -]/g, '_').slice(0, 180);
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(new Blob([data], { type: item.mimeType ?? 'application/octet-stream' }));
        const link = document.createElement('a');
        link.href = url; link.download = name; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        temporaryFile = createTemporaryVaultExport(`${item.id}-${name}`);
        temporaryFile.write(new Uint8Array(data));
        const exported = temporaryFile;
        await runWithSystemUi(() => Sharing.shareAsync(exported.uri, { mimeType: item.mimeType ?? 'application/octet-stream', dialogTitle: 'Save or open your vault file' }));
      }
    } catch (reason) {
      if (!signal?.aborted) setError(getApiErrorMessage(reason, 'We couldn’t export the file. Try again.'));
    } finally {
      try { if (temporaryFile?.exists) temporaryFile.delete(); } catch {
        if (!signal?.aborted) setError('The temporary export could not be removed. Restart Virasat to retry cleanup.');
      }
      if (!signal?.aborted) setBusy(false);
    }
  };

  const cancelEdit = () => {
    if (!item) return;
    setEditing(false);
    setTitle(item.title);
    setDescription(item.description ?? '');
  };

  const typeLabel = item ? ({ TEXT: 'Message', FINANCIAL: 'Financial asset', DOCUMENT: 'Document', IMAGE: 'Image', VIDEO: 'Video', OTHER: 'Other' } as const)[item.type] : '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenHeader
          onBack={editing ? cancelEdit : 'default'}
          backLabel={editing ? 'Cancel editing' : 'Back to vault'}
          title={editing ? 'Edit item' : undefined}
          trailing={item && !editing ? <TextLink title="Edit" onPress={() => setEditing(true)} disabled={busy} /> : null}
        />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {!item && !error ? (
            <SkeletonGroup label="Loading item">
              <Skeleton height={34} width="70%" />
              <Skeleton height={18} width="40%" style={styles.gap} />
              <Skeleton height={140} radius={16} style={styles.gap} />
            </SkeletonGroup>
          ) : null}

          {error ? (
            <InlineNotice
              tone="danger"
              message={error}
              actionLabel={!item ? 'Try again' : undefined}
              onAction={!item ? () => setRetry((value) => value + 1) : undefined}
              style={styles.notice}
            />
          ) : null}

          {item && editing ? (
            <>
              <Input label="Title" value={title} onChangeText={setTitle} maxLength={200} editable={!busy} error={!title.trim() ? 'Add a title.' : undefined} />
              <Input
                label={item.hasFile ? 'Notes' : 'Contents'}
                required={!item.hasFile}
                multiline
                value={description}
                onChangeText={setDescription}
                maxLength={100000}
                editable={!busy}
                style={styles.editor}
              />
            </>
          ) : null}

          {item && !editing ? (
            <>
              <Text style={styles.title} accessibilityRole="header">{item.title}</Text>
              <Text style={styles.meta}>{typeLabel} · Updated {new Date(item.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</Text>

              {item.hasFile ? (
                <View style={styles.fileCard}>
                  <View style={styles.fileIcon}>
                    <AppIcon name="document" size={24} color={colors.primary.deepForest} />
                  </View>
                  <View style={styles.fileBody}>
                    <Text style={styles.fileName} numberOfLines={2}>{item.fileName ?? item.title}</Text>
                    {item.sizeBytes ? <Text style={styles.fileSize}>{(item.sizeBytes / 1024 / 1024).toFixed(1)} MB · encrypted</Text> : null}
                  </View>
                </View>
              ) : null}

              <Text style={styles.sectionTitle}>{item.hasFile ? 'Notes' : 'Contents'}</Text>
              <View style={styles.card}>
                <Text selectable style={[styles.body, !item.description && styles.bodyEmpty]}>
                  {item.description || (item.hasFile ? 'No notes saved with this file.' : 'Nothing written yet.')}
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.assignment ? 'Release settings. Assigned to a person' : 'Release settings. Not assigned yet'}
                onPress={() => router.push({ pathname: '/(auth)/item-settings', params: { itemId: item.id } } as never)}
                style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]}
              >
                <View style={styles.fileIcon}>
                  <AppIcon name={item.assignment ? 'userCheck' : 'userPlus'} size={22} color={colors.primary.deepForest} />
                </View>
                <View style={styles.fileBody}>
                  <Text style={styles.fileName}>Who receives this</Text>
                  <Text style={[styles.fileSize, !item.assignment && styles.warning]}>
                    {item.assignment ? 'Assigned to a trusted person' : 'Not assigned yet'}
                  </Text>
                </View>
                <AppIcon name="chevronRight" size={20} color={colors.neutral.textMuted} />
              </Pressable>

              {item.hasFile ? (
                <Text style={styles.footnote}>
                  Exporting creates a readable copy in the app or place you choose. Virasat removes its temporary copy after sharing.
                </Text>
              ) : null}
            </>
          ) : null}
        </ScrollView>

        {item && editing ? (
          <ActionBar>
            <Button title="Save changes" onPress={() => void save()} loading={busy} disabled={!title.trim()} />
          </ActionBar>
        ) : null}
        {item && !editing && item.hasFile ? (
          <ActionBar>
            <Button
              title={busy ? 'Opening…' : 'Open or save file'}
              onPress={() => void exportFile()}
              loading={busy}
              icon={<AppIcon name="upload" size={20} color={colors.neutral.white} />}
            />
          </ActionBar>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.brand.ivory },
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  gap: { marginTop: 12 },
  notice: { marginBottom: 16 },
  title: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: typography.sizes.title1,
    lineHeight: typography.lineHeights.title1,
    color: colors.primary.deepForest,
  },
  meta: {
    marginTop: 4,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
    color: colors.neutral.textSecondary,
  },
  fileCard: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileBody: { flex: 1, gap: 2 },
  fileName: { fontFamily: typography.fonts.inter.semiBold, fontSize: typography.sizes.callout, lineHeight: 22, color: colors.neutral.textPrimary },
  fileSize: { fontFamily: typography.fonts.inter.regular, fontSize: typography.sizes.caption, lineHeight: 18, color: colors.neutral.textSecondary },
  warning: { color: colors.semantic.warning },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 8,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: typography.sizes.label,
    color: colors.neutral.textSecondary,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  body: { fontFamily: typography.fonts.inter.regular, fontSize: typography.sizes.body, lineHeight: typography.lineHeights.body, color: colors.neutral.textPrimary },
  bodyEmpty: { color: colors.neutral.textMuted },
  settingsRow: {
    marginTop: 16,
    minHeight: 72,
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
  footnote: {
    marginTop: 16,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
    color: colors.neutral.textMuted,
  },
  editor: { minHeight: 240 },
});
