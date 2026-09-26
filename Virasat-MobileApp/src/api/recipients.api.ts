import { api } from './client';

export type RecipientStatus = 'PRIVATE' | 'INVITED' | 'ACTIVE' | 'REVOKED';

export interface Recipient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  relationship: string | null;
  status: RecipientStatus;
  verificationRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecipientInput {
  requestKey?: string;
  name: string;
  email: string;
  phone?: string;
  relationship?: string;
  verificationRequired?: boolean;
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
  data: Partial<Pick<RecipientInput, 'name' | 'phone' | 'relationship' | 'verificationRequired'>>,
): Promise<Recipient> {
  const response = await api.patch<Recipient>(`/recipients/${id}`, data);
  return response.data;
}

export async function revokeRecipient(id: string): Promise<Recipient> {
  const response = await api.delete<Recipient>(`/recipients/${id}`);
  return response.data;
}

export async function inviteRecipient(id: string): Promise<Recipient> {
  const response = await api.post<Recipient>(`/recipients/${id}/invite`);
  return response.data;
}
