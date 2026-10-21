import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class ConfirmDirectUploadDto {
  @IsUUID()
  @IsNotEmpty()
  itemId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  s3Key!: string;

  @IsOptional()
  @IsString()
  @MaxLength(350000) // Base64 JPEG thumbnail (~256KB max)
  thumbnailBase64?: string;
}
