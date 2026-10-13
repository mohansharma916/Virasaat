import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { ReleaseCaseStatus } from '../entities/release-case.entity';

export class ReviewReleaseCaseDto {
  @IsEnum(ReleaseCaseStatus)
  status!: ReleaseCaseStatus;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  notes?: string;
}
