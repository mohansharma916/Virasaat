import { IsNotEmpty, IsString, MaxLength, ValidateIf } from 'class-validator';

export class UpdateLegacyItemDto {
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(100000)
  description?: string;
}
