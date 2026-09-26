import { IsBoolean, IsEnum, IsObject, IsOptional } from 'class-validator';
import { ReleaseTrigger, VerificationLevel } from '../entities/release-policy.entity';
export class UpdatePolicyDto {
  @IsOptional() @IsEnum(ReleaseTrigger) trigger?: ReleaseTrigger;
  @IsOptional() @IsEnum(VerificationLevel) verificationLevel?: VerificationLevel;
  @IsOptional() @IsObject() escalationConfig?: Record<string, unknown>;
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsBoolean() verificationRequired?: boolean;
}
