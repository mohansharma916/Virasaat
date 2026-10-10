import {
  IsEmail,
  MaxLength,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsString,
} from 'class-validator';

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
  @IsString()
  @MaxLength(128)
  requestKey?: string;
}
