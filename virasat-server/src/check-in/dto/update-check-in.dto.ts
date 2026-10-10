import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsObject,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

import { CheckInCadence } from '../entities/check-in-policy.entity';

class ReminderConfigDto {
  @ValidateIf((_, value) => value !== undefined)
  @IsArray()
  @ArrayMaxSize(1)
  @ArrayUnique()
  @IsIn(['EMAIL'], { each: true })
  channels?: string[];

  @ValidateIf((_, value) => value !== undefined)
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(30, { each: true })
  reminderDaysBefore?: number[];
}

export class UpdateCheckInDto {
  @IsEnum(CheckInCadence)
  @ValidateIf((_, value) => value !== undefined)
  cadence?: CheckInCadence;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  @ValidateIf((_, value) => value !== undefined)
  preferredTime?: string;

  @IsString()
  @MaxLength(100)
  @ValidateIf((_, value) => value !== undefined)
  timezone?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsObject()
  @ValidateNested()
  @Type(() => ReminderConfigDto)
  reminderConfig?: ReminderConfigDto;

  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  escalationEnabled?: boolean;
}
