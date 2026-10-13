import {
  IsByteLength,
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  PASSWORD_LENGTH_MESSAGE,
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN_BYTES,
} from '../password-policy';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsByteLength(PASSWORD_MIN_BYTES, PASSWORD_MAX_BYTES, {
    message: PASSWORD_LENGTH_MESSAGE,
  })
  password!: string;
}
