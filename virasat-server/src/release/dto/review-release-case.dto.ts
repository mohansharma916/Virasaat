import { IsEnum, IsOptional, IsString } from 'class-validator';

import { ReleaseCaseStatus } from '../entities/release-case.entity';

export class ReviewReleaseCaseDto {
  @IsEnum(ReleaseCaseStatus)
  status!: ReleaseCaseStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
