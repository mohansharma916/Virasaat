import * as LocalAuthentication from 'expo-local-authentication';

export async function isBiometricAvailable() {
  const hasHardware =
    await LocalAuthentication.hasHardwareAsync();

  const isEnrolled =
    await LocalAuthentication.isEnrolledAsync();

  return hasHardware && isEnrolled;
}

export async function authenticateWithBiometric() {
  const available = await isBiometricAvailable();

  if (!available) {
    return {
      success: false,
      available: false,
    };
  }

  const result =
    await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock your Virasat vault',
      fallbackLabel: 'Use device passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

  return {
    success: result.success,
    available: true,
  };
}