import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { assertPasswordPolicy } from './password-policy';

describe('Password policy', () => {
  it('rejects common, repeated and email-derived passwords', () => {
    for (const password of ['Password123', '11111111', 'priya.sharma2026'])
      expect(() =>
        assertPasswordPolicy(password, 'priya.sharma@example.test'),
      ).toThrow('less common password');
    expect(() =>
      assertPasswordPolicy('river-lamp-quiet', 'priya.sharma@example.test'),
    ).not.toThrow();
  });

  it('bounds passwords to what bcrypt actually hashes', async () => {
    const register = (password: string) =>
      validate(
        plainToInstance(RegisterDto, {
          email: 'owner@example.test',
          name: 'Owner',
          password,
        }),
      );
    expect(await register('a'.repeat(72))).toHaveLength(0);
    // 73 bytes would be silently truncated by bcrypt.
    expect(await register('a'.repeat(73))).toHaveLength(1);
    // Multi-byte characters count by bytes: 25 × 3 bytes = 75.
    expect(await register('क'.repeat(25))).toHaveLength(1);
    const reset = await validate(
      plainToInstance(ResetPasswordDto, {
        email: 'owner@example.test',
        otp: '123456',
        newPassword: 'short',
      }),
    );
    expect(reset).toHaveLength(1);
  });
});
