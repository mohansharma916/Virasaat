import { AssignItemDto } from './dto/assign-item.dto';
import { LegacyItem } from './entities/legacy-item.entity';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';

import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { LegacyItemsService } from './legacy-items.service';
import { UploadSlotInterceptor } from './upload-slot.interceptor';
import { MAX_VIDEO_BYTES } from './upload-limits';

import { CreateLegacyItemDto } from './dto/create-legacy-item.dto';
import { UpdateLegacyItemDto } from './dto/update-legacy-item.dto';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto';
import { ConfirmDirectUploadDto } from './dto/confirm-direct-upload.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRateLimit } from '../auth/guards/user-rate-limit.guard';

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

  /**
   * Request a direct presigned S3 PUT URL for uploading large files (up to 1 GB).
   */
  @Post('upload-url')
  async requestUploadUrl(
    @Req() req: any,
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
      }),
    )
    dto: RequestUploadUrlDto,
  ) {
    const result = await this.legacyItemsService.requestDirectUploadUrl(
      req.user.id,
      dto,
    );
    if ('item' in result && result.item) {
      return {
        ...result,
        item: this.safeItem(result.item),
      };
    }
    return result;
  }

  /**
   * Confirm that direct S3 upload completed and activate the vault item.
   */
  @Post('confirm-upload')
  async confirmUpload(
    @Req() req: any,
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
      }),
    )
    dto: ConfirmDirectUploadDto,
  ) {
    return this.safeItem(
      await this.legacyItemsService.confirmDirectUpload(req.user.id, dto),
    );
  }


  @Post('upload')
  @UseInterceptors(
    UploadSlotInterceptor,
    FileFieldsInterceptor(
      [
        { name: 'file', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: {
          // Per-type limits (documents are smaller) are enforced in the service.
          fileSize: MAX_VIDEO_BYTES,
          files: 2,
          fields: 10,
        },
      },
    ),
  )
  async upload(
    @Req() req: any,
    @UploadedFiles()
    files:
      | {
          file?: { buffer: Buffer; mimetype: string; originalname?: string }[];
          thumbnail?: { buffer: Buffer }[];
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
    // Only multipart files are accepted. Body-encoded files would bypass the
    // multipart size limit and let the client choose the stored MIME type.
    const file = files?.file?.[0];
    const resolvedFile = file?.buffer?.length ? file : undefined;
    if (resolvedFile && !resolvedFile.originalname && dto.fileName) {
      resolvedFile.originalname = dto.fileName;
    }

    return this.safeItem(
      await this.legacyItemsService.createEncryptedUpload(
        req.user.id,
        dto,
        resolvedFile,
        files?.thumbnail?.[0]?.buffer,
      ),
    );
  }

  /**
   * Upload / sync all vault items of the authenticated user to AWS S3.
   * Migrates local disk files and creates encrypted backups of all items in S3.
   */
  @Post('sync-s3')
  // Re-reads and decrypts the whole vault, so each account may run it rarely.
  @UserRateLimit('vault-sync-s3', 3, 60 * 60)
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
      status,
      createdAt,
      updatedAt,
      assignment,
      hasThumbnail,
    } = item;
    return {
      id,
      vaultId,
      type,
      category,
      title,
      description: null,
      status,
      createdAt,
      updatedAt,
      assignment,
      hasThumbnail: Boolean(hasThumbnail),
    };
  }

  @Patch(':id/assignment')
  async assign(
    @Req() req: { user: { id: string } },
    @Param('id', ParseUUIDPipe) id: string,
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
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const fileResult = await this.legacyItemsService.downloadFile(
      req.user.id,
      id,
    );

    res.setHeader('Content-Type', fileResult.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(fileResult.filename)}"; filename*=UTF-8''${encodeURIComponent(fileResult.filename)}`,
    );
    res.setHeader('Content-Length', fileResult.sizeBytes);
    res.setHeader('X-Storage-Type', fileResult.storageType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.end(fileResult.buffer);
  }

  /**
   * Get direct S3 presigned download URL for fast streaming / download.
   */
  @Get(':id/file-url')
  async getFileDownloadUrl(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.legacyItemsService.getDirectFileDownloadUrl(req.user.id, id);
  }


  /**
   * Decrypted JPEG preview made on the owner's device at upload time.
   */
  @Get(':id/thumbnail')
  async thumbnail(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const image = await this.legacyItemsService.getThumbnail(req.user.id, id);
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', image.length);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.end(image);
  }

  /**
   * Get S3 storage status, location, and checksum integrity info for a vault item.
   */
  @Get(':id/s3-status')
  async getS3Status(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.legacyItemsService.getItemS3Status(req.user.id, id);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.legacyItemsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  async update(
    @Req() req: { user: { id: string } },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLegacyItemDto,
  ) {
    return this.legacyItemsService.update(req.user.id, id, dto);
  }
}
