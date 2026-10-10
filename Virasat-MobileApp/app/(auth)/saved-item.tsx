import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import type { File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { downloadLegacyItem, getLegacyItem, updateLegacyItem, type LegacyItemDetail } from '@/src/api/vault.api';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { useAppDispatch } from '@/src/store/hooks';
import { addLegacyItem } from '@/src/store/vault.slice';
import { vaultScreenStyles as styles } from '@/src/theme/vault-screen';
import { createTemporaryVaultExport } from '@/src/storage/vault-export.storage';

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
      if (!request.signal.aborted) setError(getApiErrorMessage(reason, 'Could not open this item.'));
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
      if (!signal?.aborted) setError(getApiErrorMessage(reason, 'Could not save your changes.'));
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
        await Sharing.shareAsync(temporaryFile.uri, { mimeType: item.mimeType ?? 'application/octet-stream', dialogTitle: 'Save or open your vault file' });
      }
    } catch (reason) {
      if (!signal?.aborted) setError(getApiErrorMessage(reason, 'Could not export the file.'));
    } finally {
      try { if (temporaryFile?.exists) temporaryFile.delete(); } catch {
        if (!signal?.aborted) setError('The temporary export could not be removed. Restart Virasat to retry cleanup.');
      }
      if (!signal?.aborted) setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={styles.link}>‹ Saved items</Text></Pressable>
        {!item && !error && <ActivityIndicator />}
        {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
        {!item && error && <Pressable accessibilityRole="button" onPress={() => setRetry((value) => value + 1)}><Text style={styles.link}>Retry</Text></Pressable>}
        {item && <>
          <Text style={styles.heading}>{editing ? 'Edit saved item' : item.title}</Text>
          <Text style={styles.text}>{item.category} · {item.type}</Text>
          {editing ? <>
            <Text style={styles.label}>Title</Text>
            <TextInput accessibilityLabel="Item title" style={styles.input} value={title} onChangeText={setTitle} maxLength={200} editable={!busy} />
            <Text style={styles.label}>{item.hasFile ? 'Notes' : 'Contents'}</Text>
            <TextInput accessibilityLabel="Item contents" style={[styles.input, { minHeight: 200, textAlignVertical: 'top' }]} multiline value={description} onChangeText={setDescription} maxLength={100000} editable={!busy} />
            <Pressable accessibilityRole="button" disabled={busy || !title.trim()} onPress={save} style={[styles.button, (busy || !title.trim()) && styles.disabled]}><Text style={styles.buttonText}>{busy ? 'Saving…' : 'Save changes'}</Text></Pressable>
            <Pressable disabled={busy} onPress={() => { setEditing(false); setTitle(item.title); setDescription(item.description ?? ''); }}><Text style={styles.link}>Cancel</Text></Pressable>
          </> : <>
            <View style={styles.card}><Text selectable style={styles.text}>{item.description || 'No notes saved with this item.'}</Text></View>
            <Pressable disabled={busy} onPress={() => setEditing(true)} style={styles.button} accessibilityRole="button"><Text style={styles.buttonText}>Edit title and contents</Text></Pressable>
            {item.hasFile && <>
              <Text style={styles.text}>{item.fileName ?? item.title}{item.sizeBytes ? ` · ${(item.sizeBytes / 1024 / 1024).toFixed(1)} MB` : ''}</Text>
              <Pressable accessibilityRole="button" disabled={busy} onPress={exportFile} style={[styles.button, busy && styles.disabled]}><Text style={styles.buttonText}>{busy ? 'Opening…' : 'Save or open file'}</Text></Pressable>
              <Text style={styles.text}>The exported copy can be read by the app or location you choose. Virasat removes its temporary decrypted copy after sharing.</Text>
            </>}
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/(auth)/item-settings', params: { itemId: item.id } } as never)}><Text style={styles.link}>Recipient and policy settings</Text></Pressable>
          </>}
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}
