import { IsEnum } from 'class-validator';
import { PlanCode } from '../subscription.constants';

export class DowngradeDto {
  @IsEnum(PlanCode)
  planCode!: PlanCode;
}
