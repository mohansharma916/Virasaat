import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { RecipientNotificationMode } from '../entities/recipient.entity';

export class UpdateRecipientDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  // Only editable while the person is private; no invitation references it yet.
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  relationship?: string;
  @IsOptional()
  @IsBoolean()
  verificationRequired?: boolean;
  @IsOptional()
  @IsEnum(RecipientNotificationMode)
  notificationMode?: RecipientNotificationMode;
}
