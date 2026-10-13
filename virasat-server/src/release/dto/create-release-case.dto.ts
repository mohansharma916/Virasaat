import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { ReleaseReason } from '../entities/release-case.entity';

export class CreateReleaseCaseDto {
  @IsEnum(ReleaseReason)
  reason!: ReleaseReason;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  evidence?: string;
}
