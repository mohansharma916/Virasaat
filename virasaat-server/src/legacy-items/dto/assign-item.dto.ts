import { IsInt, IsUUID, Min } from 'class-validator';
export class AssignItemDto {
  @IsUUID() recipientId!: string;
  @IsUUID() policyId!: string;
  @IsInt() @Min(1) policyVersion!: number;
}
