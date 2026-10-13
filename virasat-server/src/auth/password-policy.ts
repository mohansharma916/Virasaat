import { BadRequestException } from '@nestjs/common';

// bcrypt ignores everything after 72 bytes, so longer passwords would be
// silently truncated. The DTOs enforce the same byte bounds.
export const PASSWORD_MIN_BYTES = 8;
export const PASSWORD_MAX_BYTES = 72;
export const PASSWORD_LENGTH_MESSAGE =
  'Password must be 8 to 72 characters long.';

// The most-used passwords that still meet the length rule.
const COMMON_PASSWORDS = new Set([
  '12345678',
  '123456789',
  '1234567890',
  '87654321',
  '11111111',
  '00000000',
  '12341234',
  'password',
  'password1',
  'password12',
  'password123',
  'passw0rd',
  'qwertyui',
  'qwerty123',
  'qwertyuiop',
  'iloveyou',
  'sunshine',
  'princess',
  'football',
  'baseball',
  'welcome1',
  'welcome123',
  'abc12345',
  'abcd1234',
  'admin123',
  'letmein1',
  'trustno1',
  'virasat1',
  'virasat123',
]);

/** Rejects passwords that are trivially guessed for this account. */
export function assertPasswordPolicy(password: string, email: string) {
  const normalized = password.trim().toLowerCase();
  const mailbox = email.trim().toLowerCase().split('@')[0];
  if (
    COMMON_PASSWORDS.has(normalized) ||
    /^(.)\1+$/.test(normalized) ||
    (mailbox.length >= 4 && normalized.includes(mailbox))
  )
    throw new BadRequestException(
      'Choose a less common password that does not contain your email address.',
    );
}
