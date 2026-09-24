import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Recipient,
  RecipientStatus,
} from './entities/recipient.entity';

import { CreateRecipientDto } from './dto/create-recipient.dto';
import { UpdateRecipientDto } from './dto/update-recipient.dto';

@Injectable()
export class RecipientsService {
  constructor(
    @InjectRepository(Recipient)
    private readonly recipientRepository: Repository<Recipient>,
  ) {}

  async create(
    userId: string,
    dto: CreateRecipientDto,
  ) {
    const existing =
      await this.recipientRepository.findOne({
        where: {
          userId,
          email: dto.email,
        },
      });

    if (existing) {
      throw new ConflictException(
        'Recipient already exists',
      );
    }

    const recipient =
      this.recipientRepository.create({
        userId,

        name: dto.name,
        email: dto.email,

        phone: dto.phone ?? null,

        relationship:
          dto.relationship ?? null,

        status:
          RecipientStatus.INVITED,
      });

    return this.recipientRepository.save(
      recipient,
    );
  }

  async findAll(userId: string) {
    return this.recipientRepository.find({
      where: {
        userId,
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(
    userId: string,
    recipientId: string,
  ) {
    const recipient =
      await this.recipientRepository.findOne({
        where: {
          id: recipientId,
          userId,
        },
      });

    if (!recipient) {
      throw new NotFoundException(
        'Recipient not found',
      );
    }

    return recipient;
  }

  async update(
    userId: string,
    recipientId: string,
    dto: UpdateRecipientDto,
  ) {
    const recipient =
      await this.findOne(
        userId,
        recipientId,
      );

    Object.assign(recipient, dto);

    return this.recipientRepository.save(
      recipient,
    );
  }

  async revoke(
    userId: string,
    recipientId: string,
  ) {
    const recipient =
      await this.findOne(
        userId,
        recipientId,
      );

    recipient.status =
      RecipientStatus.REVOKED;

    recipient.revokedAt = new Date();

    return this.recipientRepository.save(
      recipient,
    );
  }
}