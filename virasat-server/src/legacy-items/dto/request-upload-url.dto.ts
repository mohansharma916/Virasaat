import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { LegacyItemType } from '../entities/legacy-item.entity';
import { MAX_VIDEO_BYTES } from '../upload-limits';

export class RequestUploadUrlDto {
  @IsEnum(LegacyItemType)
  type!: LegacyItemType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  category!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsInt()
  @Min(1)
  @Max(MAX_VIDEO_BYTES)
  fileSizeBytes!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  mimeType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  requestKey?: string;
}
