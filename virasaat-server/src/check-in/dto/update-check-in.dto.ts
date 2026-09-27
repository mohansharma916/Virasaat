import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';

import { CheckInCadence } from '../entities/check-in-policy.entity';

export class UpdateCheckInDto {
  @IsEnum(CheckInCadence)
  @IsOptional()
  cadence?: CheckInCadence;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  @IsOptional()
  preferredTime?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsOptional()
  reminderConfig?: {
    channels?: string[];
    reminderDaysBefore?: number[];
  };

  @IsOptional()
  escalationEnabled?: boolean;
}
