import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get('me/deletion')
  deletionEligibility() {
    // BACKEND GAP: retention, active-case resolution, step-up and deletion worker
    // have no approved contract. Never accept a request we cannot execute.
    return {
      status: 'UNAVAILABLE',
      message: 'Account deletion is not available yet. Your account has not been changed. Please try again later.',
      blockers: ['DELETION_LIFECYCLE_NOT_CONFIGURED'],
    };
  }

  @Get('me')
  async getProfile(@Req() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('me')
  async updateProfile(
    @Req() req: any,
    @Body() dto: UpdateProfileDto,
  ) {
    await this.usersService.update(req.user.id, dto);
    return this.usersService.getProfile(req.user.id);
  }
}
