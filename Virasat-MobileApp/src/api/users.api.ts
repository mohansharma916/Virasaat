import { api } from './client';
import type { AuthenticatedUser } from './auth.api';

export interface Profile extends AuthenticatedUser {
  country: string | null;
  preferredLanguage: string | null;
  timezone: string;
}

export interface ProfileInput {
  name?: string;
  country?: string;
  preferredLanguage?: string;
  timezone?: string;
}

export async function getProfile(): Promise<Profile> {
  const response = await api.get<Profile>('/users/me');
  return response.data;
}

export async function updateProfile(data: ProfileInput): Promise<Profile> {
  const response = await api.patch<Profile>('/users/me', data);
  return response.data;
}
