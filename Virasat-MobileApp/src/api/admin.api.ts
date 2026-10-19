import { isAxiosError } from 'axios';
import { api } from './client';

// Virasat reviewers (the server's ADMIN_EMAIL) decide release cases.

export type ReviewCaseStatus = 'OPEN' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CLOSED';

export const REVIEW_STATUS_LABEL: Record<ReviewCaseStatus, string> = {
  OPEN: 'Waiting for statements',
  UNDER_REVIEW: 'Ready to review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CLOSED: 'Closed',
};

export interface ReviewCaseSummary {
  id: string;
  status: ReviewCaseStatus;
  reason: 'MANUAL_REQUEST' | 'CHECK_IN_ESCALATION';
  openedAt: string | null;
  ownerName: string;
  statementCount: number;
}

export interface ReviewCaseDetail {
  id: string;
  status: ReviewCaseStatus;
  reason: ReviewCaseSummary['reason'];
  openedAt: string | null;
  reviewedAt: string | null;
  closedAt: string | null;
  reviewerNotes: string | null;
  owner: { name: string; email: string; phone: string | null } | null;
  /** Family plan: a team member must visit before approval. */
  inPersonVisit: { required: boolean; completedAt: string | null; notes: string | null } | null;
  overdueDays: number | null;
  dueAt: string | null;
  lastCheckInAt: string | null;
  note: string | null;
  recipients: {
    id: string;
    name: string;
    email: string;
    relationship: string | null;
    status: string;
    verificationRequired: boolean;
    assignedItems: number;
    statement: string | null;
    statementSubmittedAt: string | null;
    authorized: boolean;
  }[];
}

/** True only for reviewers; everyone else gets 403 from the server. */
export async function isReleaseReviewer(): Promise<boolean> {
  try {
    await api.get('/admin/me');
    return true;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) return false;
    throw error;
  }
}

export async function listReviewCases(status?: ReviewCaseStatus): Promise<ReviewCaseSummary[]> {
  const response = await api.get<ReviewCaseSummary[]>('/admin/release-cases', { params: status ? { status } : undefined });
  return response.data;
}

export async function getReviewCase(id: string): Promise<ReviewCaseDetail> {
  const response = await api.get<ReviewCaseDetail>(`/admin/release-cases/${id}`);
  return response.data;
}

export async function recordReviewVisit(id: string, notes: string): Promise<ReviewCaseDetail> {
  const response = await api.post<ReviewCaseDetail>(`/admin/release-cases/${id}/visit`, { notes });
  return response.data;
}

export async function decideReviewCase(id: string, decision: 'approve' | 'reject', notes: string): Promise<ReviewCaseDetail> {
  const response = await api.post<ReviewCaseDetail>(`/admin/release-cases/${id}/${decision}`, { notes });
  return response.data;
}
