import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { LegacyItemsService } from './legacy-items.service';

import { CreateLegacyItemDto } from './dto/create-legacy-item.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('vault/items')
@UseGuards(JwtAuthGuard)
export class LegacyItemsController {
  constructor(
    private readonly legacyItemsService: LegacyItemsService,
  ) {}

  @Post()
  async create(
    @Req() req: any,
    @Body() dto: CreateLegacyItemDto,
  ) {
    return this.legacyItemsService.create(
      req.user.id,
      dto,
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
    @Body() dto: CreateLegacyItemDto,
  ) {
    return this.legacyItemsService.createEncryptedUpload(
      req.user.id,
      dto,
      file,
    );
  }

  @Get()
  async findAll(@Req() req: any) {
    return this.legacyItemsService.findAll(
      req.user.id,
    );
  }

  @Get(':id')
  async findOne(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.legacyItemsService.findOne(
      req.user.id,
      id,
    );
  }
}
