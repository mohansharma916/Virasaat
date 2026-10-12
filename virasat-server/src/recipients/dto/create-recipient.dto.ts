import {
  IsEmail,
  MaxLength,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsString,
  IsEnum,
} from 'class-validator';
import { RecipientNotificationMode } from '../entities/recipient.entity';

export class CreateRecipientDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

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
  @IsOptional()
  @IsString()
  @MaxLength(128)
  requestKey?: string;
}
