import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Vault } from './entities/vault.entity';
import { VaultService } from './vault.service';
import { VaultController } from './vault.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Vault])],

  providers: [VaultService],

  controllers: [VaultController],

  exports: [VaultService],
})
export class VaultModule {}
