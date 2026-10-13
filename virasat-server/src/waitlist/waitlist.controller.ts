import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { WaitlistRateLimitGuard } from './waitlist-rate-limit.guard';

@Controller(['waitlist', 'api/waitlist'])
@UseGuards(WaitlistRateLimitGuard)
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async joinWaitlist(@Body() dto: CreateWaitlistDto) {
    return this.waitlistService.joinWaitlist(dto);
  }

  @Get()
  async getStats() {
    return this.waitlistService.getStats();
  }

  @Get('stats')
  async getStatsAlias() {
    return this.waitlistService.getStats();
  }
}
