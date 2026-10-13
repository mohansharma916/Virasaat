import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { RecipientNotificationMode } from '../entities/recipient.entity';

export class UpdateRecipientDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(120)
  name?: string;

  // Only editable while the person is private; no invitation references it yet.
  @IsEmail()
  @IsOptional()
  @MaxLength(254)
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(32)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  relationship?: string;
  @IsOptional()
  @IsBoolean()
  verificationRequired?: boolean;
  @IsOptional()
  @IsEnum(RecipientNotificationMode)
  notificationMode?: RecipientNotificationMode;
}
