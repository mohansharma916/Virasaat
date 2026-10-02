import { AssignItemDto } from './dto/assign-item.dto';
import { LegacyItem } from './entities/legacy-item.entity';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';

import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { LegacyItemsService } from './legacy-items.service';

import { CreateLegacyItemDto } from './dto/create-legacy-item.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('vault/items')
@UseGuards(JwtAuthGuard)
export class LegacyItemsController {
  constructor(private readonly legacyItemsService: LegacyItemsService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateLegacyItemDto) {
    return this.safeItem(
      await this.legacyItemsService.create(req.user.id, dto),
    );
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 25 * 1024 * 1024,
      },
    }),
  )
  async upload(
    @Req() req: any,
    @UploadedFile()
    file:
      | {
          buffer: Buffer;
          mimetype: string;
        }
      | undefined,
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
      }),
    )
    dto: CreateLegacyItemDto,
  ) {
    let resolvedFile = file;

    // Fallback if file was not captured by multer directly (e.g. data URI, buffer, or base64 in body)
    if (!resolvedFile?.buffer?.length && req.body?.file) {
      if (Buffer.isBuffer(req.body.file)) {
        resolvedFile = {
          buffer: req.body.file,
          mimetype:
            req.body.mimeType ||
            req.body.mimetype ||
            'application/octet-stream',
        };
      } else if (
        typeof req.body.file === 'string' &&
        req.body.file.startsWith('data:')
      ) {
        const matches = req.body.file.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          resolvedFile = {
            buffer: Buffer.from(matches[2], 'base64'),
            mimetype: matches[1],
          };
        }
      } else if (
        typeof req.body.file === 'string' &&
        req.body.file.length > 50
      ) {
        try {
          const buf = Buffer.from(req.body.file, 'base64');
          if (buf.length > 0) {
            resolvedFile = {
              buffer: buf,
              mimetype:
                req.body.mimeType ||
                req.body.mimetype ||
                'application/octet-stream',
            };
          }
        } catch {
          // ignore
        }
      }
    }

    return this.safeItem(
      await this.legacyItemsService.createEncryptedUpload(
        req.user.id,
        dto,
        resolvedFile,
      ),
    );
  }

  /**
   * Upload / sync all vault items of the authenticated user to AWS S3.
   * Migrates local disk files and creates encrypted backups of all items in S3.
   */
  @Post('sync-s3')
  async syncAllToS3(@Req() req: any) {
    return this.legacyItemsService.syncAllVaultItemsToS3(req.user.id);
  }

  private safeItem(item: LegacyItem) {
    const {
      id,
      vaultId,
      type,
      category,
      title,
      description,
      status,
      createdAt,
      updatedAt,
      assignment,
    } = item;
    return {
      id,
      vaultId,
      type,
      category,
      title,
      description,
      status,
      createdAt,
      updatedAt,
      assignment,
    };
  }

  @Patch(':id/assignment')
  async assign(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: AssignItemDto,
  ) {
    return this.safeItem(
      await this.legacyItemsService.assign(req.user.id, id, dto),
    );
  }

  @Get()
  async findAll(@Req() req: any) {
    return (await this.legacyItemsService.findAll(req.user.id)).map((item) =>
      this.safeItem(item),
    );
  }

  /**
   * Get overall S3 cloud vault status and statistics.
   */
  @Get('s3-overview')
  async getS3Overview(@Req() req: any) {
    return this.legacyItemsService.getVaultS3Overview(req.user.id);
  }

  /**
   * Securely download and decrypt an uploaded file (from S3 or local storage).
   */
  @Get(':id/file')
  async downloadFile(
    @Req() req: any,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const fileResult = await this.legacyItemsService.downloadFile(
      req.user.id,
      id,
    );

    res.setHeader('Content-Type', fileResult.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(fileResult.filename)}"`,
    );
    res.setHeader('Content-Length', fileResult.sizeBytes);
    res.setHeader('X-Storage-Type', fileResult.storageType);
    res.end(fileResult.buffer);
  }

  /**
   * Get S3 storage status, location, and checksum integrity info for a vault item.
   */
  @Get(':id/s3-status')
  async getS3Status(@Req() req: any, @Param('id') id: string) {
    return this.legacyItemsService.getItemS3Status(req.user.id, id);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.safeItem(
      await this.legacyItemsService.findOne(req.user.id, id),
    );
  }
}
