import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class AuthorizeReleaseDto {
  @IsUUID()
  @IsNotEmpty()
  recipientId!: string;

  @IsInt()
  @Min(1)
  expiresInDays!: number;
}
