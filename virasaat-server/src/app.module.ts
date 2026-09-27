import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { databaseConfig } from './database/database.config';

import { UsersModule } from './users/users.module';
import { VaultModule } from './vault/vault.module';
import { LegacyItemsModule } from './legacy-items/legacy-items.module';
import { AuthModule } from './auth/auth.module';
import { RecipientsModule } from './recipients/recipients.module';
import { CheckInModule } from './check-in/check-in.module';
import { ReleaseModule } from './release/release.module';
import { NotificationsModule } from './notification/notification.module';
import { AuditModule } from './audit/audit.module';
import { EncryptionModule } from './encryption/encryption.module';
import { StorageModule } from './storage/storage.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],

      useFactory: databaseConfig,
    }),

    UsersModule,
    VaultModule,
    LegacyItemsModule,
    AuthModule,
    RecipientsModule,
    CheckInModule,
    ReleaseModule,
    NotificationsModule,
    AuditModule,
    EncryptionModule,
    StorageModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
