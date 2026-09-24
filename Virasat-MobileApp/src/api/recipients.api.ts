import { api } from './client';

export type RecipientStatus = 'INVITED' | 'ACTIVE' | 'REVOKED';

export interface Recipient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  relationship: string | null;
  status: RecipientStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RecipientInput {
  name: string;
  email: string;
  phone?: string;
  relationship?: string;
}

export async function createRecipient(data: RecipientInput): Promise<Recipient> {
  const response = await api.post<Recipient>('/recipients', data);
  return response.data;
}

export async function listRecipients(): Promise<Recipient[]> {
  const response = await api.get<Recipient[]>('/recipients');
  return response.data;
}

export async function getRecipient(id: string): Promise<Recipient> {
  const response = await api.get<Recipient>(`/recipients/${id}`);
  return response.data;
}

export async function updateRecipient(
  id: string,
  data: Partial<Pick<RecipientInput, 'name' | 'phone' | 'relationship'>>,
): Promise<Recipient> {
  const response = await api.patch<Recipient>(`/recipients/${id}`, data);
  return response.data;
}

export async function revokeRecipient(id: string): Promise<Recipient> {
  const response = await api.delete<Recipient>(`/recipients/${id}`);
  return response.data;
}
