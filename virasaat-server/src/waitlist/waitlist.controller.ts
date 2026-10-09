import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';

@Controller(['waitlist', 'api/waitlist'])
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
}
