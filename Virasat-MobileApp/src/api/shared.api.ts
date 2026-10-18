import { api } from './client';
import type { LegacyItemDetail } from './vault.api';

// What other people shared with the signed-in user, as their trusted person.

export interface SharedOverview {
  invitations: { recipientId: string; ownerName: string; relationship: string | null }[];
  cases: {
    caseId: string;
    ownerName: string;
    status: 'OPEN' | 'UNDER_REVIEW';
    openedAt: string | null;
    statementSubmittedAt: string | null;
  }[];
  releases: { caseId: string; ownerName: string; expiresAt: string }[];
}

export type SharedItem = LegacyItemDetail;

export async function getSharedOverview(): Promise<SharedOverview> {
  const response = await api.get<SharedOverview>('/shared');
  return response.data;
}

export async function respondToInvitation(recipientId: string, accept: boolean) {
  const response = await api.post(`/shared/invitations/${recipientId}/${accept ? 'accept' : 'decline'}`);
  return response.data as { recipientId: string; status: string };
}

export async function submitReleaseStatement(caseId: string, statement: string) {
  const response = await api.post(`/shared/cases/${caseId}/statement`, { statement });
  return response.data as { caseId: string; status: string };
}

export async function listReleasedItems(caseId: string): Promise<SharedItem[]> {
  const response = await api.get<SharedItem[]>(`/shared/releases/${caseId}/items`);
  return response.data;
}

export async function getReleasedItem(itemId: string, signal?: AbortSignal): Promise<SharedItem> {
  const response = await api.get<SharedItem>(`/shared/items/${itemId}`, { signal });
  return response.data;
}

export async function downloadReleasedFile(itemId: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  const response = await api.get<ArrayBuffer>(`/shared/items/${itemId}/file`, {
    responseType: 'arraybuffer', timeout: 120_000, signal,
  });
  return response.data;
}

export async function downloadReleasedThumbnail(itemId: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  const response = await api.get<ArrayBuffer>(`/shared/items/${itemId}/thumbnail`, {
    responseType: 'arraybuffer', timeout: 30_000, signal,
  });
  return response.data;
}
