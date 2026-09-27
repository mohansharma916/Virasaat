import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RestorePurchaseDto {
  @IsString()
  @IsNotEmpty()
  provider!: string;

  @IsString()
  @IsOptional()
  purchaseToken?: string;

  @IsString()
  @IsOptional()
  originalTransactionId?: string;
}
