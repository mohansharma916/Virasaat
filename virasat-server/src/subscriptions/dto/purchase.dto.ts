import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PlanCode } from '../subscription.constants';

export class PurchaseDto {
  @IsEnum(PlanCode)
  planCode!: PlanCode;

  @IsString()
  @IsNotEmpty()
  provider!: string;

  @IsString()
  @IsNotEmpty()
  purchaseToken!: string;

  @IsString()
  @IsOptional()
  subscriptionId?: string;

  @IsString()
  @IsOptional()
  orderId?: string;
}
