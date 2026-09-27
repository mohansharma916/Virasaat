import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Recipient } from './entities/recipient.entity';

import { RecipientsController } from './recipients.controller';
import { RecipientsService } from './recipients.service';

@Module({
  imports: [TypeOrmModule.forFeature([Recipient])],

  controllers: [RecipientsController],

  providers: [RecipientsService],

  exports: [RecipientsService],
})
export class RecipientsModule {}
