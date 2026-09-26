import {
  IsOptional,
  IsBoolean,
  IsString,
} from 'class-validator';

export class UpdateRecipientDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  relationship?: string;
  @IsOptional()
  @IsBoolean()
  verificationRequired?: boolean;
}
