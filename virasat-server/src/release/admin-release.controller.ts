import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReviewDecisionDto } from './dto/release-flow.dto';
import { ReleaseCaseStatus } from './entities/release-case.entity';
import { ReleaseFlowService } from './release-flow.service';

/** Virasat reviewers (ADMIN_EMAIL) decide release cases here. */
@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminReleaseController {
  constructor(private readonly releaseFlow: ReleaseFlowService) {}

  // Lets the app show the review screen only to reviewers.
  @Get('me')
  async me(@Req() req: any) {
    await this.releaseFlow.assertAdmin(req.user.id);
    return { reviewer: true };
  }

  @Get('release-cases')
  list(
    @Req() req: any,
    @Query('status', new ParseEnumPipe(ReleaseCaseStatus, { optional: true }))
    status?: ReleaseCaseStatus,
  ) {
    return this.releaseFlow.adminListCases(req.user.id, status);
  }

  @Get('release-cases/:id')
  detail(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.releaseFlow.adminCaseDetail(req.user.id, id);
  }

  @Post('release-cases/:id/approve')
  approve(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewDecisionDto,
  ) {
    return this.releaseFlow.approveCase(req.user.id, id, dto.notes ?? '');
  }

  @Post('release-cases/:id/reject')
  reject(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewDecisionDto,
  ) {
    return this.releaseFlow.rejectCase(req.user.id, id, dto.notes ?? '');
  }
}
