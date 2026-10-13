// Matches the API: bcrypt only hashes the first 72 bytes of a password.
export const PASSWORD_MAX_BYTES = 72;

export function passwordTooLong(password: string) {
  return new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES;
}
