import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { CheckInService } from './check-in.service';
import { UpdateCheckInDto } from './dto/update-check-in.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('check-in')
@UseGuards(JwtAuthGuard)
export class CheckInController {
  constructor(
    private readonly checkInService: CheckInService,
  ) {}

  @Get()
  async getStatus(@Req() req: any) {
    return this.checkInService.getStatus(
      req.user.id,
    );
  }

  @Patch('settings')
  async updateSettings(
    @Req() req: any,
    @Body() dto: UpdateCheckInDto,
  ) {
    return this.checkInService.updatePolicy(
      req.user.id,
      dto,
    );
  }

  @Post('confirm')
  async confirm(@Req() req: any) {
    return this.checkInService.confirmCheckIn(
      req.user.id,
    );
  }

  @Get('history')
  async history(@Req() req: any) {
    return this.checkInService.getHistory(
      req.user.id,
    );
  }
}