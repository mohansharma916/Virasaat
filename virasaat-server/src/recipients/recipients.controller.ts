import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { RecipientsService } from './recipients.service';

import { CreateRecipientDto } from './dto/create-recipient.dto';
import { UpdateRecipientDto } from './dto/update-recipient.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('recipients')
@UseGuards(JwtAuthGuard)
export class RecipientsController {
  constructor(private readonly recipientsService: RecipientsService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateRecipientDto) {
    return this.recipientsService.create(req.user.id, dto);
  }

  @Post(':id/invite')
  async invite(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.recipientsService.invite(req.user.id, id);
  }

  @Get()
  async findAll(@Req() req: any) {
    return this.recipientsService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.recipientsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateRecipientDto,
  ) {
    return this.recipientsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  async revoke(@Req() req: any, @Param('id') id: string) {
    return this.recipientsService.revoke(req.user.id, id);
  }
}
