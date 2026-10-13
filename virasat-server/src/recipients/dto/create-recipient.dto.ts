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
  @MaxLength(120)
  name!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

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
  @IsOptional()
  @IsString()
  @MaxLength(128)
  requestKey?: string;
}
