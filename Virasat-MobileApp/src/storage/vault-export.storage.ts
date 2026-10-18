import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { api } from '../api/client';
import { getAccessToken } from './auth.storage';

const exportDirectory = () => new Directory(Paths.cache, 'vault-exports');
let cleanedAtStartup = false;

export function clearTemporaryVaultExports() {
  if (Platform.OS === 'web' || cleanedAtStartup) return;
  const directory = exportDirectory();
  if (directory.exists) directory.delete();
  cleanedAtStartup = true;
}

export function createTemporaryVaultExport(name: string): File {
  const directory = exportDirectory();
  directory.create({ intermediates: true, idempotent: true });
  const file = new File(directory, name);
  file.create({ overwrite: true });
  return file;
}

// Streams a decrypted vault file straight to the cache so large videos never
// sit in JS memory. The caller deletes the file when it is done with it.
export async function downloadVaultFileToCache(
  itemId: string,
  name: string,
  options?: { expectedBytes?: number | null; signal?: AbortSignal; onProgress?: (percent: number) => void },
): Promise<File> {
  const token = await getAccessToken();
  if (!token) throw new Error('Your session has expired. Sign in again to continue.');
  const directory = exportDirectory();
  directory.create({ intermediates: true, idempotent: true });
  const destination = new File(directory, name);
  const file = await File.downloadFileAsync(`${api.defaults.baseURL}/vault/items/${itemId}/file`, destination, {
    headers: { Authorization: `Bearer ${token}` },
    idempotent: true,
    signal: options?.signal,
    onProgress: ({ bytesWritten, totalBytes }) => {
      if (totalBytes > 0) options?.onProgress?.(Math.round((bytesWritten / totalBytes) * 100));
    },
  });
  const discard = (message: string) => {
    try { if (file.exists) file.delete(); } catch { /* Cleared at next start. */ }
    throw new Error(message);
  };
  // A download that finishes after sign-out or an account switch is discarded.
  if ((await getAccessToken()) !== token) discard('This request belongs to a previous session.');
  // An error response body is written to disk too; never hand it to a player.
  if (!file.size || (options?.expectedBytes && file.size !== options.expectedBytes)) {
    discard('We couldn’t download this video. Check your connection and try again.');
  }
  return file;
}
