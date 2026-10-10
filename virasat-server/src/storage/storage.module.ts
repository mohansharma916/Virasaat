import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3StorageService } from './s3-storage.service';
import { StorageService } from './storage.service';

@Module({
  imports: [ConfigModule],
  providers: [S3StorageService, StorageService],
  exports: [S3StorageService, StorageService],
})
export class StorageModule {}
