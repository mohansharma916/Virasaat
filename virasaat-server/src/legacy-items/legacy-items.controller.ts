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
    return this.safeItem(await this.legacyItemsService.create(
      req.user.id,
      dto,
    ));
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
    return this.safeItem(await this.legacyItemsService.createEncryptedUpload(
      req.user.id,
      dto,
      file,
    ));
  }

  private safeItem(item: LegacyItem) {
    const { id, vaultId, type, category, title, description, status, createdAt, updatedAt, assignment } = item;
    return { id, vaultId, type, category, title, description, status, createdAt, updatedAt, assignment };
  }

  @Patch(':id/assignment')
  async assign(@Req() req: { user: { id: string } }, @Param('id') id: string, @Body() dto: AssignItemDto) {
    return this.safeItem(await this.legacyItemsService.assign(req.user.id, id, dto));
  }

  @Get()
  async findAll(@Req() req: any) {
    return (await this.legacyItemsService.findAll(req.user.id)).map((item) => this.safeItem(item));
  }

  @Get(':id')
  async findOne(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.safeItem(await this.legacyItemsService.findOne(
      req.user.id,
      id,
    ));
  }
}
