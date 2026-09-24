import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  AuthService,
} from './auth.service';

import {
  RegisterDto,
} from './dto/register.dto';

import {
  VerifyEmailDto,
} from './dto/verify-email.dto';

import {
  LoginDto,
} from './dto/login.dto';

import {
  GoogleLoginDto,
} from './dto/google-login.dto';

import {
  ResendVerificationDto,
} from './dto/resend-verification.dto';

import {
  JwtAuthGuard,
} from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService:
      AuthService,
  ) {}

  /**
   * Email + Password Signup
   */
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
  ) {
    return this.authService.register(
      
      dto.email,
      dto.name,
      dto.password,
    );
  }

  /**
   * Verify signup OTP
   *
   * User account is created HERE.
   */
  @Post('verify-email')
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
  ) {
    return this.authService.verifyEmail(
      dto.email,
      dto.otp,
    );
  }

  /**
   * Issue a replacement OTP for an existing pending signup.
   * The response deliberately stays generic to avoid account enumeration.
   */
  @Post('resend-verification')
  async resendVerification(
    @Body() dto: ResendVerificationDto,
  ) {
    return this.authService.resendVerification(
      dto.email,
    );
  }

  /**
   * Email + Password Login
   */
  @Post('login')
  async login(
    @Body() dto: LoginDto,
  ) {
    return this.authService.login(
      dto.email,
      dto.password,
    );
  }

  /**
   * Google Signup / Login
   */
  @Post('google')
  async googleLogin(
    @Body() dto: GoogleLoginDto,
  ) {
    return this.authService.googleLogin(
      dto.idToken,
    );
  }

  /**
   * Current User
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(
    @Req() req: any,
  ) {
    return req.user;
  }
}
