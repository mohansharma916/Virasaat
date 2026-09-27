import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EncryptionService } from './encryption.service';
import { EncryptionMetadata } from './entities/encryption-metadata.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EncryptionMetadata])],

  providers: [EncryptionService],

  exports: [EncryptionService],
})
export class EncryptionModule {}
