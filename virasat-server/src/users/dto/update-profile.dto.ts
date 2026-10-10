import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @MaxLength(120)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(80)
  @IsOptional()
  country?: string;

  @IsString()
  @MaxLength(80)
  @IsOptional()
  preferredLanguage?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  timezone?: string;
}
