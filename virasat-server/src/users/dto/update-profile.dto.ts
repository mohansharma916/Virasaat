import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @MaxLength(120)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(80)
  @IsOptional()
  country?: string;

  // Used for SMS and phone-call reminders. Empty string clears it.
  @IsString()
  @IsOptional()
  @MaxLength(20)
  @Matches(/^$|^\+?[\d\s-]{10,18}$/, {
    message: 'Enter a phone number with country code, for example +91 98765 43210.',
  })
  phone?: string;

  @IsString()
  @MaxLength(80)
  @IsOptional()
  preferredLanguage?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  timezone?: string;
}
