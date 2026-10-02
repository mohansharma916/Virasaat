import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { EmailTemplateType } from '../email/email-template.types';

export class SendTestEmailDto {
  @IsEmail({}, { message: 'Must be a valid destination email address' })
  to!: string;

  @IsOptional()
  @IsEnum(EmailTemplateType, {
    message: `templateType must be one of: ${Object.values(EmailTemplateType).join(', ')}`,
  })
  templateType?: EmailTemplateType;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
