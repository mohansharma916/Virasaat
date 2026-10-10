import { Platform } from 'react-native';
import { api } from './client';

export type LegacyItemType =
  | 'TEXT'
  | 'FINANCIAL'
  | 'DOCUMENT'
  | 'IMAGE'
  | 'VIDEO'
  | 'OTHER';

export interface LegacyItem {
  id: string;
  vaultId: string;
  assignment?: {
    recipientId: string; policyId: string; policyVersion: number;
    verificationRequired: boolean; trigger: string; assignedAt: string;
  } | null;
  type: LegacyItemType;
  category: string;
  title: string;
  description: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'UPDATED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface Vault {
  id: string;
  userId: string;
  status: 'ACTIVE' | 'ARCHIVED';
  readinessScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface LegacyItemDetail extends LegacyItem {
  hasFile: boolean;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
}

// A correlation key, not an authentication secret. Keep it stable across retries.
export function createItemRequestKey() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export interface CreateLegacyItemRequest {
  requestKey?: string;
  type: LegacyItemType;
  category: string;
  title: string;
  description?: string;
}

export interface UploadLegacyItemRequest extends CreateLegacyItemRequest {
  file: {
    uri: string;
    name: string;
    mimeType?: string | null;
    file?: any;
  };
}

export async function getVault(): Promise<Vault> {
  const response = await api.get<Vault>('/vault');
  return response.data;
}

export async function listLegacyItems(): Promise<LegacyItem[]> {
  const response = await api.get<LegacyItem[]>('/vault/items');
  return response.data;
}

export async function getLegacyItem(id: string, signal?: AbortSignal): Promise<LegacyItemDetail> {
  const response = await api.get<LegacyItemDetail>(`/vault/items/${id}`, { signal });
  return response.data;
}

export async function updateLegacyItem(id: string, data: { title?: string; description?: string }, signal?: AbortSignal): Promise<LegacyItemDetail> {
  const response = await api.patch<LegacyItemDetail>(`/vault/items/${id}`, data, { signal });
  return response.data;
}

export async function downloadLegacyItem(id: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  const response = await api.get<ArrayBuffer>(`/vault/items/${id}/file`, {
    responseType: 'arraybuffer', timeout: 120_000, signal,
  });
  return response.data;
}

export async function createLegacyItem(
  data: CreateLegacyItemRequest,
): Promise<LegacyItem> {
  const response = await api.post<LegacyItem>('/vault/items', data);
  return response.data;
}

export async function uploadLegacyItem(
  data: UploadLegacyItemRequest,
  options?: { signal?: AbortSignal; onProgress?: (percent: number) => void },
): Promise<LegacyItem> {
  const formData = new FormData();
  if (data.requestKey) formData.append('requestKey', data.requestKey);
  formData.append('type', data.type);
  formData.append('category', data.category);
  formData.append('title', data.title);

  if (data.description) {
    formData.append('description', data.description);
  }

  if (Platform.OS === 'web') {
    if (data.file.file instanceof Blob) {
      formData.append('file', data.file.file, data.file.name);
    } else if (data.file.uri) {
      try {
        const response = await fetch(data.file.uri);
        const blob = await response.blob();
        formData.append('file', blob, data.file.name);
      } catch {
        formData.append('file', {
          uri: data.file.uri,
          name: data.file.name,
          type: data.file.mimeType ?? 'application/octet-stream',
        } as unknown as Blob);
      }
    }
  } else {
    // React Native (iOS & Android)
    formData.append('file', {
      uri: data.file.uri,
      name: data.file.name,
      type: data.file.mimeType ?? 'application/octet-stream',
    } as unknown as Blob);
  }

  const response = await api.post<LegacyItem>(
    '/vault/items/upload',
    formData,
    {
      signal: options?.signal,
      timeout: 120_000,
      onUploadProgress: (event) => {
        if (event.total) {
          options?.onProgress?.(Math.round((event.loaded / event.total) * 100));
        }
      },
    },
  );

  return response.data;
}

export async function assignLegacyItem(id: string, data: { recipientId: string; policyId: string; policyVersion: number }): Promise<LegacyItem> {
  const response = await api.patch<LegacyItem>(`/vault/items/${id}/assignment`, data);
  return response.data;
}

export interface SyncToS3Response {
  success: boolean;
  vaultId: string;
  totalItems: number;
  syncedItemsCount: number;
  s3Configured: boolean;
  items: {
    itemId: string;
    title: string;
    type: string;
    action: 'MIGRATED_TO_S3' | 'ALREADY_ON_S3' | 'BACKED_UP_TO_S3';
    s3Key: string;
    s3Uri?: string;
    checksumSha256?: string;
  }[];
}

export async function syncAllVaultItemsToS3(): Promise<SyncToS3Response> {
  const response = await api.post<SyncToS3Response>('/vault/items/sync-s3');
  return response.data;
}

export async function getVaultItemS3Status(id: string): Promise<{
  itemId: string;
  title: string;
  type: string;
  storageType: 'S3' | 'LOCAL' | 'INLINE_DB';
  s3Configured: boolean;
  s3Key: string | null;
  s3Uri: string | null;
  checksumSha256: string | null;
  encryptionAlgorithm: string;
  encryptionKeyVersion: string;
}> {
  const response = await api.get(`/vault/items/${id}/s3-status`);
  return response.data;
}

export interface VaultS3Overview {
  vaultId: string;
  totalItems: number;
  s3Configured: boolean;
  s3Bucket: string | null;
  region: string | null;
  encryption: string;
  storageBreakdown: {
    s3Stored: number;
    localDisk: number;
    inlineEncrypted: number;
  };
  allSyncedToS3: boolean;
}

export async function getVaultS3Overview(): Promise<VaultS3Overview> {
  const response = await api.get<VaultS3Overview>('/vault/items/s3-overview');
  return response.data;
}


