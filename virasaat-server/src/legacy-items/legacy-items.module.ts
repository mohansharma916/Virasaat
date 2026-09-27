import { Recipient } from '../recipients/entities/recipient.entity';
import { ReleasePolicy } from '../release/entities/release-policy.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LegacyItem } from './entities/legacy-item.entity';

import { LegacyItemsService } from './legacy-items.service';
import { LegacyItemsController } from './legacy-items.controller';

import { VaultModule } from '../vault/vault.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { StorageModule } from '../storage/storage.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LegacyItem, Recipient, ReleasePolicy]),

    VaultModule,
    EncryptionModule,
    StorageModule,
    SubscriptionsModule,
  ],

  providers: [LegacyItemsService],

  controllers: [LegacyItemsController],

  exports: [LegacyItemsService],
})
export class LegacyItemsModule {}
