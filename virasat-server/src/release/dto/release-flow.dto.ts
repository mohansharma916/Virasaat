import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SubmitStatementDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  statement!: string;
}

export class ReviewDecisionDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
