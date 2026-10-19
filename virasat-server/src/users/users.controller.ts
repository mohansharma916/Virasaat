import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';
import { AccountDeletionService } from './account-deletion.service';
import { DeleteAccountDto } from './dto/delete-account.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly accountDeletion: AccountDeletionService,
  ) {}

  @Get('me/deletion')
  deletionEligibility() {
    return {
      status: 'AVAILABLE',
      message:
        'Deleting your account permanently removes your vault items, files, trusted people and settings. This cannot be undone.',
      requires: ['CONFIRMATION', 'REAUTHENTICATION'],
    };
  }

  /** Permanently delete the signed-in account after identity confirmation. */
  @Post('me/deletion')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(
    @Req() req: { user: { id: string } },
    @Body() dto: DeleteAccountDto,
  ) {
    return this.accountDeletion.deleteAccount(req.user.id, {
      currentPassword: dto.currentPassword,
      googleIdToken: dto.googleIdToken,
    });
  }

  @Get('me')
  async getProfile(@Req() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('me')
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    const { phone, ...rest } = dto;
    await this.usersService.update(req.user.id, {
      ...rest,
      ...(phone !== undefined ? { phone: phone.trim() || null } : {}),
    });
    return this.usersService.getProfile(req.user.id);
  }
}
