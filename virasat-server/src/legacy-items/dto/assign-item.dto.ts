import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
export class AssignItemDto {
  @IsUUID() recipientId!: string;
  @IsUUID() policyId!: string;
  @IsInt() @Min(1) policyVersion!: number;
  // Required only when changing an existing assignment.
  @IsOptional() @IsString() @MaxLength(200) currentPassword?: string;
  @IsOptional() @IsString() @MaxLength(4096) googleIdToken?: string;
}
