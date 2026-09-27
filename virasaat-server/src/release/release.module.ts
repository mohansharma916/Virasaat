import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReleaseController } from './release.controller';
import { ReleaseService } from './release.service';

import { ReleasePolicy } from './entities/release-policy.entity';
import { ReleaseCase } from './entities/release-case.entity';
import { ReleaseAuthorization } from './entities/release-authorization.entity';

import { Recipient } from '../recipients/entities/recipient.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReleasePolicy,
      ReleaseCase,
      ReleaseAuthorization,
      Recipient,
    ]),
    AuditModule,
  ],

  controllers: [ReleaseController],

  providers: [ReleaseService],

  exports: [ReleaseService],
})
export class ReleaseModule {}
