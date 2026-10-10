import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

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
  @MinLength(8, { message: 'New password must be at least 8 characters long.' })
  @IsString()
  newPassword!: string;
}
