import { IsEnum, IsOptional, IsString } from 'class-validator';

import { ReleaseReason } from '../entities/release-case.entity';

export class CreateReleaseCaseDto {
  @IsEnum(ReleaseReason)
  reason!: ReleaseReason;

  @IsString()
  @IsOptional()
  evidence?: string;
}
