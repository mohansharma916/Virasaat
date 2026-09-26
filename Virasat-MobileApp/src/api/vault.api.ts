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

export async function getLegacyItem(id: string): Promise<LegacyItem> {
  const response = await api.get<LegacyItem>(`/vault/items/${id}`);
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

  formData.append('file', {
    uri: data.file.uri,
    name: data.file.name,
    type: data.file.mimeType ?? 'application/octet-stream',
  } as unknown as Blob);

  const response = await api.post<LegacyItem>(
    '/vault/items/upload',
    formData,
    {
      signal: options?.signal,
      timeout: 120_000,
      onUploadProgress: (event) => { if (event.total) options?.onProgress?.(Math.round(event.loaded / event.total * 100)); },
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );

  return response.data;
}

export async function assignLegacyItem(id: string, data: { recipientId: string; policyId: string; policyVersion: number }): Promise<LegacyItem> {
  const response = await api.patch<LegacyItem>(`/vault/items/${id}/assignment`, data);
  return response.data;
}
