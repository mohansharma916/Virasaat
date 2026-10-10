import { api } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  avatar?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    avatar?: string | null;
  };
  vault: {
    id: string;
    readinessScore: number;
  } | null;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  developmentOtp?: string;
}

export const login = async (
  data: LoginRequest,
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>(
    '/auth/login',
    data,
  );

  return response.data;
};


export const register = async (
  data: RegisterRequest,
): Promise<RegisterResponse> => {
  const response = await api.post<RegisterResponse>(
    '/auth/register',
    data,
  );

  return response.data;
};




export async function verifyEmail(
  email: string,
  otp: string,
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/verify-email', {
    email,
    otp,
  });

  return response.data;
}

export async function resendVerification(email: string): Promise<RegisterResponse> {
  const response = await api.post<RegisterResponse>(
    '/auth/resend-verification',
    { email },
  );

  return response.data;
}

export async function googleLogin(idToken: string): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/google', { idToken });
  return response.data;
}

export async function getCurrentUser(): Promise<AuthenticatedUser> {
  const response = await api.get<AuthenticatedUser>('/auth/me');
  return response.data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export interface ForgotPasswordResponse {
  status: 'OTP_SENT' | 'GOOGLE_ACCOUNT' | 'NOT_FOUND';
  authMethod?: 'PASSWORD' | 'GOOGLE';
  message: string;
  email?: string;
  name?: string;
  developmentOtp?: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  const response = await api.post<ForgotPasswordResponse>('/auth/forgot-password', { email });
  return response.data;
}

export async function resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  const response = await api.post<ResetPasswordResponse>('/auth/reset-password', data);
  return response.data;
}

export async function resendPasswordReset(email: string): Promise<ForgotPasswordResponse> {
  const response = await api.post<ForgotPasswordResponse>('/auth/resend-password-reset', { email });
  return response.data;
}

