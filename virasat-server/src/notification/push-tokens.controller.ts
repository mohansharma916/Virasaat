import { Body, Controller, Delete, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FcmPushSender } from './channels/fcm-push.sender';

class PushTokenDto {
  @IsString()
  @MinLength(20)
  @MaxLength(4096)
  token!: string;

  @IsOptional()
  @IsIn(['android', 'ios'])
  platform?: string;
}

/** The app registers its device for notifications after sign-in. */
@Controller('me/push-tokens')
@UseGuards(JwtAuthGuard)
export class PushTokensController {
  constructor(private readonly push: FcmPushSender) {}

  @Post()
  @HttpCode(204)
  async register(@Req() req: { user: { id: string } }, @Body() dto: PushTokenDto) {
    await this.push.register(req.user.id, dto.token, dto.platform ?? 'android');
  }

  @Delete()
  @HttpCode(204)
  async unregister(@Req() req: { user: { id: string } }, @Body() dto: PushTokenDto) {
    await this.push.unregister(req.user.id, dto.token);
  }
}
