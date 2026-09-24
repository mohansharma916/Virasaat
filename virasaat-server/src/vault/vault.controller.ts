import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';

import { VaultService } from './vault.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('vault')
@UseGuards(JwtAuthGuard)
export class VaultController {
  constructor(
    private readonly vaultService: VaultService,
  ) {}

  @Get()
  async getVault(@Req() req: any) {
    return this.vaultService.getUserVault(
      req.user.id,
    );
  }
}