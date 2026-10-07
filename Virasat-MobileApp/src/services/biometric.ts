import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export type BiometricType = 'Face ID' | 'Fingerprint' | 'Touch ID' | 'Biometrics';

export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  } catch {
    return false;
  }
}

export async function getBiometricType(): Promise<BiometricType> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    }
  } catch {}
  return Platform.OS === 'ios' ? 'Face ID' : 'Fingerprint';
}

export async function authenticateWithBiometric(
  customPrompt?: string
): Promise<{ success: boolean; available: boolean; error?: string }> {
  const available = await isBiometricAvailable();

  if (!available) {
    return {
      success: false,
      available: false,
    };
  }

  const bioType = await getBiometricType();
  const prompt = customPrompt || `Sign in to Virasat with ${bioType}`;

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: prompt,
      fallbackLabel: 'Use device passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    return {
      success: result.success,
      available: true,
      error: !result.success ? result.error : undefined,
    };
  } catch (err: any) {
    return {
      success: false,
      available: true,
      error: err?.message || 'Biometric authentication failed',
    };
  }
}