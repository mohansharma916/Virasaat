import { api } from './client';

export interface ReleasePolicy {
  id: string;
  trigger: 'MANUAL' | 'CHECK_IN_ESCALATION';
  verificationLevel: 'BASIC' | 'STANDARD' | 'HIGH';
  escalationConfig: Record<string, unknown>;
  enabled: boolean;
}

export type ReleaseCaseStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CLOSED';

export interface ReleaseCase {
  id: string;
  reason: 'MANUAL_REQUEST' | 'CHECK_IN_ESCALATION';
  status: ReleaseCaseStatus;
  evidence: string | null;
  reviewerNotes: string | null;
  openedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReleaseAuthorization {
  id: string;
  caseId: string;
  recipientId: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
}

export async function getReleasePolicy(): Promise<ReleasePolicy | null> {
  const response = await api.get<ReleasePolicy | null>('/release/policy');
  return response.data;
}

export async function updateReleasePolicy(
  data: Partial<Omit<ReleasePolicy, 'id'>>,
): Promise<ReleasePolicy> {
  const response = await api.patch<ReleasePolicy>('/release/policy', data);
  return response.data;
}

export async function createReleaseCase(data: {
  reason: ReleaseCase['reason'];
  evidence?: string;
}): Promise<ReleaseCase> {
  const response = await api.post<ReleaseCase>('/release/cases', data);
  return response.data;
}

export async function listReleaseCases(): Promise<ReleaseCase[]> {
  const response = await api.get<ReleaseCase[]>('/release/cases');
  return response.data;
}

export async function getReleaseCase(id: string): Promise<ReleaseCase> {
  const response = await api.get<ReleaseCase>(`/release/cases/${id}`);
  return response.data;
}

export async function reviewReleaseCase(
  id: string,
  data: { status: ReleaseCaseStatus; notes?: string },
): Promise<ReleaseCase> {
  const response = await api.patch<ReleaseCase>(
    `/release/cases/${id}/review`,
    data,
  );
  return response.data;
}

export async function authorizeRelease(
  id: string,
  data: { recipientId: string; expiresInDays: number },
): Promise<ReleaseAuthorization> {
  const response = await api.post<ReleaseAuthorization>(
    `/release/cases/${id}/authorize`,
    data,
  );
  return response.data;
}

export async function verifyReleaseAuthorization(
  recipientId: string,
): Promise<ReleaseAuthorization> {
  const response = await api.get<ReleaseAuthorization>(
    `/release/authorization/${recipientId}`,
  );
  return response.data;
}

export async function closeReleaseCase(id: string): Promise<ReleaseCase> {
  const response = await api.patch<ReleaseCase>(`/release/cases/${id}/close`);
  return response.data;
}
