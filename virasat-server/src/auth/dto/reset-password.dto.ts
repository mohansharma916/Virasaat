import {
  IsByteLength,
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import {
  PASSWORD_LENGTH_MESSAGE,
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN_BYTES,
} from '../password-policy';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Email address is required.' })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email!: string;

  @IsNotEmpty({ message: 'Reset code is required.' })
  @Length(6, 6, { message: 'Verification code must be exactly 6 digits.' })
  @IsString()
  @Matches(/^\d{6}$/)
  otp!: string;

  @IsNotEmpty({ message: 'New password is required.' })
  @IsByteLength(PASSWORD_MIN_BYTES, PASSWORD_MAX_BYTES, {
    message: PASSWORD_LENGTH_MESSAGE,
  })
  @IsString()
  newPassword!: string;
}
