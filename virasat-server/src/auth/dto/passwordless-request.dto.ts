import { IsEmail } from 'class-validator';

export class PasswordlessRequestDto {
  @IsEmail()
  email!: string;
}
