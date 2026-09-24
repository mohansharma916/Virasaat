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

export interface CreateLegacyItemRequest {
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
): Promise<LegacyItem> {
  const formData = new FormData();
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
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
}
