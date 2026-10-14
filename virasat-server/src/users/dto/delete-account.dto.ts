import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class DeleteAccountDto {
  // The owner types this word to show the deletion is intended.
  @IsIn(['DELETE'], { message: 'Type DELETE to confirm account deletion.' })
  confirmation!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  googleIdToken?: string;
}
