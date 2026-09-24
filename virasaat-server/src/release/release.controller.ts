import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ReleaseService } from './release.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CreateReleaseCaseDto } from './dto/create-release-case.dto';
import { ReviewReleaseCaseDto } from './dto/review-release-case.dto';
import { AuthorizeReleaseDto } from './dto/authorize-release.dto';

@Controller('release')
@UseGuards(JwtAuthGuard)
export class ReleaseController {
  constructor(
    private readonly releaseService: ReleaseService,
  ) {}

  // -----------------------------
  // POLICY
  // -----------------------------

  @Get('policy')
  async getPolicy(@Req() req: any) {
    return this.releaseService.getPolicy(
      req.user.id,
    );
  }

  @Patch('policy')
  async updatePolicy(
    @Req() req: any,
    @Body() body: any,
  ) {
    return this.releaseService.updatePolicy(
      req.user.id,
      body,
    );
  }

  // -----------------------------
  // CASES
  // -----------------------------

  @Post('cases')
  async createCase(
    @Req() req: any,
    @Body() dto: CreateReleaseCaseDto,
  ) {
    return this.releaseService.createCase(
      req.user.id,
      dto,
    );
  }

  @Get('cases')
  async getCases(@Req() req: any) {
    return this.releaseService.getCases(
      req.user.id,
    );
  }

  @Get('cases/:id')
  async getCase(
    @Req() req: any,
    @Param('id') caseId: string,
  ) {
    return this.releaseService.getCase(
      req.user.id,
      caseId,
    );
  }

  // -----------------------------
  // REVIEW
  // -----------------------------

  @Patch('cases/:id/review')
  async reviewCase(
    @Req() req: any,
    @Param('id') caseId: string,
    @Body() dto: ReviewReleaseCaseDto,
  ) {
    return this.releaseService.reviewCase(
      req.user.id,
      caseId,
      dto,
    );
  }

  // -----------------------------
  // AUTHORIZE
  // -----------------------------

  @Post('cases/:id/authorize')
  async authorize(
    @Req() req: any,
    @Param('id') caseId: string,
    @Body() dto: AuthorizeReleaseDto,
  ) {
    return this.releaseService.authorizeRelease(
      req.user.id,
      caseId,
      dto,
    );
  }

  // -----------------------------
  // VERIFY
  // -----------------------------

  @Get('authorization/:recipientId')
  async verifyAuthorization(
    @Param('recipientId')
    recipientId: string,
  ) {
    return this.releaseService.verifyAuthorization(
      recipientId,
    );
  }

  // -----------------------------
  // CLOSE
  // -----------------------------

  @Patch('cases/:id/close')
  async closeCase(
    @Req() req: any,
    @Param('id') caseId: string,
  ) {
    return this.releaseService.closeCase(
      req.user.id,
      caseId,
    );
  }
}