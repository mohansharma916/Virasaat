import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Vault,
  VaultStatus,
} from './entities/vault.entity';

@Injectable()
export class VaultService {
  constructor(
    @InjectRepository(Vault)
    private readonly vaultRepository: Repository<Vault>,
  ) {}

  async createForUser(userId: string) {
    const vault = this.vaultRepository.create({
      userId,
      status: VaultStatus.ACTIVE,
      readinessScore: 0,
    });

    return this.vaultRepository.save(vault);
  }

  async findByUserId(userId: string) {
    return this.vaultRepository.findOne({
      where: {
        userId,
        status: VaultStatus.ACTIVE,
      },
    });
  }

  async getUserVault(userId: string) {
    const vault = await this.findByUserId(userId);

    if (!vault) {
      throw new NotFoundException(
        'Vault not found',
      );
    }

    return vault;
  }
}