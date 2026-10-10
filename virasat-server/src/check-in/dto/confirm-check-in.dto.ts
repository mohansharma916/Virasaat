import { IsUUID } from 'class-validator';
export class ConfirmCheckInDto {
  @IsUUID() eventId!: string;
}
