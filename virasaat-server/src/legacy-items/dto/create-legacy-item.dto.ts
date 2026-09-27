import { MaxLength } from 'class-validator';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { LegacyItemType } from '../entities/legacy-item.entity';

export class CreateLegacyItemDto {
  @IsEnum(LegacyItemType)
  type!: LegacyItemType;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;
  @IsOptional()
  @IsString()
  @MaxLength(128)
  requestKey?: string;
}
