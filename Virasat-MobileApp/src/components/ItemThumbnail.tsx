import { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { downloadLegacyItemThumbnail, type LegacyItemType } from '@/src/api/vault.api';
import { getAccessToken } from '@/src/storage/auth.storage';
import { colors } from '@/src/theme/colors';
import { AppIcon, type IconName } from './AppIcon';

const TYPE_ICONS: Record<LegacyItemType, IconName> = {
  TEXT: 'message', FINANCIAL: 'investment', DOCUMENT: 'document', IMAGE: 'image', VIDEO: 'video', OTHER: 'folder',
};
export const itemTypeIcon = (type: LegacyItemType): IconName => TYPE_ICONS[type] ?? 'folder';

// Decrypted previews stay in memory only, keyed by session token so a later
// account can never be shown an earlier account's previews.
const MAX_CACHED = 200;
const cache = new Map<string, string>();

function toDataUri(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return `data:image/jpeg;base64,${btoa(binary)}`;
}

type Props = {
  // A saved item whose preview is fetched from the vault.
  itemId?: string;
  hasThumbnail?: boolean;
  // Or a local file picked on this device (image or generated preview).
  localUri?: string | null;
  icon: IconName;
  size?: number;
  // Fill the parent instead of a fixed square (large previews, video posters).
  fill?: boolean;
  // Rendered instead of the icon when there is no preview (fill mode).
  hideIcon?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ItemThumbnail({ itemId, hasThumbnail, localUri, icon, size = 44, fill, hideIcon, style }: Props) {
  const [remoteUri, setRemoteUri] = useState<string | null>(null);

  useEffect(() => {
    setRemoteUri(null);
    if (localUri || !itemId || !hasThumbnail) return;
    const request = new AbortController();
    void (async () => {
      const token = await getAccessToken();
      if (!token || request.signal.aborted) return;
      const key = `${token}:${itemId}`;
      const cached = cache.get(key);
      if (cached) { setRemoteUri(cached); return; }
      try {
        const uri = toDataUri(await downloadLegacyItemThumbnail(itemId, request.signal));
        if (cache.size >= MAX_CACHED) cache.delete(cache.keys().next().value!);
        cache.set(key, uri);
        if (!request.signal.aborted) setRemoteUri(uri);
      } catch { /* The type icon stays as the fallback. */ }
    })();
    return () => request.abort();
  }, [itemId, hasThumbnail, localUri]);

  const uri = localUri ?? remoteUri;
  const box = fill ? StyleSheet.absoluteFill : { width: size, height: size, borderRadius: Math.round(size / 4) };
  return (
    <View style={[styles.box, box, fill && styles.fill, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={120} />
      ) : hideIcon ? null : (
        <AppIcon name={icon} size={Math.round(size / 2)} color={colors.primary.deepForest} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: { backgroundColor: 'transparent' },
});
