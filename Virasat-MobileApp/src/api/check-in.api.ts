import { api } from './client';

export type CheckInCadence = 'WEEKLY' | 'MONTHLY';

export interface CheckInPolicy {
  id: string;
  cadence: CheckInCadence;
  preferredTime: string;
  timezone: string;
  nextCheckInAt: string | null;
  reminderConfig: {
    channels: string[];
    reminderDaysBefore: number[];
  };
  escalationEnabled: boolean;
}

export interface CheckInEvent {
  id: string;
  dueAt: string;
  respondedAt: string | null;
  status: 'PENDING' | 'COMPLETED' | 'MISSED' | 'ESCALATED';
}

export interface CheckInStatus {
  policy: CheckInPolicy;
  currentEvent: CheckInEvent | null;
}

export interface CheckInSettingsInput {
  cadence?: CheckInCadence;
  preferredTime?: string;
  timezone?: string;
  reminderConfig?: {
    channels?: string[];
    reminderDaysBefore?: number[];
  };
  escalationEnabled?: boolean;
}

export async function getCheckInStatus(): Promise<CheckInStatus> {
  const response = await api.get<CheckInStatus>('/check-in');
  return response.data;
}

export async function updateCheckInSettings(
  data: CheckInSettingsInput,
): Promise<CheckInPolicy> {
  const response = await api.patch<CheckInPolicy>('/check-in/settings', data);
  return response.data;
}

export async function confirmCheckIn(eventId: string): Promise<{
  success: boolean;
  nextCheckInAt: string;
}> {
  const response = await api.post('/check-in/confirm', { eventId });
  return response.data;
}

export async function getCheckInHistory(): Promise<CheckInEvent[]> {
  const response = await api.get<CheckInEvent[]>('/check-in/history');
  return response.data;
}
