import { MaxLength } from 'class-validator';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { LegacyItemType } from '../entities/legacy-item.entity';

export class CreateLegacyItemDto {
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

  @IsString()
  @IsOptional()
  @MaxLength(100000)
  description?: string;
  @IsOptional()
  @IsString()
  @MaxLength(128)
  requestKey?: string;

  @IsOptional()
  file?: any;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;
}
