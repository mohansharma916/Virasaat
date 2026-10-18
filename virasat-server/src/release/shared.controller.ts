import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRateLimit } from '../auth/guards/user-rate-limit.guard';
import { SubmitStatementDto } from './dto/release-flow.dto';
import { ReleaseFlowService } from './release-flow.service';

/** What other people have shared with the signed-in user (as a trusted person). */
@Controller('shared')
@UseGuards(JwtAuthGuard)
export class SharedController {
  constructor(private readonly releaseFlow: ReleaseFlowService) {}

  @Get()
  overview(@Req() req: any) {
    return this.releaseFlow.overview(req.user.id);
  }

  @Post('invitations/:recipientId/accept')
  accept(
    @Req() req: any,
    @Param('recipientId', ParseUUIDPipe) recipientId: string,
  ) {
    return this.releaseFlow.respondToInvitation(req.user.id, recipientId, true);
  }

  @Post('invitations/:recipientId/decline')
  decline(
    @Req() req: any,
    @Param('recipientId', ParseUUIDPipe) recipientId: string,
  ) {
    return this.releaseFlow.respondToInvitation(
      req.user.id,
      recipientId,
      false,
    );
  }

  @Post('cases/:caseId/statement')
  @UserRateLimit('release-statement', 10, 60 * 60)
  statement(
    @Req() req: any,
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Body() dto: SubmitStatementDto,
  ) {
    return this.releaseFlow.submitStatement(req.user.id, caseId, dto.statement);
  }

  @Get('releases/:caseId/items')
  items(@Req() req: any, @Param('caseId', ParseUUIDPipe) caseId: string) {
    return this.releaseFlow.releasedItems(req.user.id, caseId);
  }

  @Get('items/:itemId')
  item(@Req() req: any, @Param('itemId', ParseUUIDPipe) itemId: string) {
    return this.releaseFlow.releasedItem(req.user.id, itemId);
  }

  @Get('items/:itemId/file')
  async file(
    @Req() req: any,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Res() res: Response,
  ) {
    const file = await this.releaseFlow.releasedFile(req.user.id, itemId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(file.filename)}"; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
    );
    res.setHeader('Content-Length', file.sizeBytes);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.end(file.buffer);
  }

  @Get('items/:itemId/thumbnail')
  async thumbnail(
    @Req() req: any,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Res() res: Response,
  ) {
    const image = await this.releaseFlow.releasedThumbnail(req.user.id, itemId);
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', image.length);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.end(image);
  }
}
