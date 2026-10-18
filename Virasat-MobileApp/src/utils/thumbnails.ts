import { Platform } from 'react-native';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { File } from 'expo-file-system';

const THUMBNAIL_WIDTH = 320;

/**
 * Makes a small JPEG preview of a local image or video before upload. Returns
 * null for other file types or when the device cannot decode the file; the
 * upload itself never depends on a preview.
 */
export async function createUploadThumbnail(uri: string, mimeType?: string | null): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  let frameUri: string | null = null;
  try {
    let source = uri;
    if (mimeType?.startsWith('video/')) {
      frameUri = (await VideoThumbnails.getThumbnailAsync(uri, { time: 1000, quality: 0.7 })).uri;
      source = frameUri;
    } else if (!mimeType?.startsWith('image/')) {
      return null;
    }
    const image = await ImageManipulator.manipulate(source).resize({ width: THUMBNAIL_WIDTH }).renderAsync();
    const result = await image.saveAsync({ compress: 0.6, format: SaveFormat.JPEG });
    return result.uri;
  } catch {
    return null;
  } finally {
    if (frameUri) deleteThumbnail(frameUri);
  }
}

export function deleteThumbnail(uri: string | null | undefined) {
  if (!uri) return;
  try { const file = new File(uri); if (file.exists) file.delete(); } catch { /* Cache is cleared by the OS. */ }
}
