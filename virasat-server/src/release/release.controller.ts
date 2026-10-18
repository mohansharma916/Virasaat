import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { UpdatePolicyDto } from './dto/update-policy.dto';

import { ReleaseService } from './release.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CreateReleaseCaseDto } from './dto/create-release-case.dto';
import { ReleaseFlowService } from './release-flow.service';

@Controller('release')
@UseGuards(JwtAuthGuard)
export class ReleaseController {
  constructor(
    private readonly releaseService: ReleaseService,
    private readonly releaseFlow: ReleaseFlowService,
  ) {}

  // -----------------------------
  // POLICY
  // -----------------------------

  @Get('policy')
  async getPolicy(@Req() req: any) {
    return this.releaseService.getPolicy(req.user.id);
  }

  @Patch('policy')
  async updatePolicy(@Req() req: any, @Body() body: UpdatePolicyDto) {
    return this.releaseService.updatePolicy(req.user.id, body);
  }

  // -----------------------------
  // CASES
  // -----------------------------

  @Post('cases')
  async createCase(@Req() req: any, @Body() dto: CreateReleaseCaseDto) {
    return this.releaseService.createCase(req.user.id, dto);
  }

  @Get('cases')
  async getCases(@Req() req: any) {
    return this.releaseService.getCases(req.user.id);
  }

  @Get('cases/:id')
  async getCase(@Req() req: any, @Param('id', ParseUUIDPipe) caseId: string) {
    return this.releaseService.getCase(req.user.id, caseId);
  }

  // Reviews and approvals happen only through the admin controller; an
  // owner can never review or authorize a release of their own vault.

  @Get('live-case')
  async liveCase(@Req() req: any) {
    return { case: await this.releaseFlow.liveCaseForOwner(req.user.id) };
  }

  // -----------------------------
  // CLOSE
  // -----------------------------

  @Patch('cases/:id/close')
  async closeCase(@Req() req: any, @Param('id', ParseUUIDPipe) caseId: string) {
    return this.releaseService.closeCase(req.user.id, caseId);
  }
}
