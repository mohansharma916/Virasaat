import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
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
      if (dto.requestKey && existing.requestKey === dto.requestKey && existing.name === dto.name && existing.phone === (dto.phone ?? null) && existing.relationship === (dto.relationship ?? null) && existing.verificationRequired === (dto.verificationRequired ?? true)) return existing;
      throw new ConflictException('Recipient already exists. Review the saved person before making changes.');
    }

    const recipient =
      this.recipientRepository.create({
        userId,
        requestKey: dto.requestKey ?? null,

        name: dto.name,
        email: dto.email,

        phone: dto.phone ?? null,

        relationship:
          dto.relationship ?? null,

        verificationRequired: dto.verificationRequired ?? true,
        status:
          RecipientStatus.PRIVATE,
      });

    try { return await this.recipientRepository.save(recipient); }
    catch (error) {
      if (dto.requestKey && (error as { code?: string }).code === '23505') {
        const saved = await this.recipientRepository.findOne({ where: { userId, requestKey: dto.requestKey } });
        if (saved && saved.email === dto.email && saved.name === dto.name && saved.phone === (dto.phone ?? null) && saved.relationship === (dto.relationship ?? null) && saved.verificationRequired === (dto.verificationRequired ?? true)) return saved;
        throw new ConflictException('This request already saved a different recipient. Review your people list.');
      }
      throw error;
    }
  }

  async invite(userId: string, recipientId: string) {
    await this.findOne(userId, recipientId);
    // BACKEND GAP: no real notification transport or invitation acceptance flow.
    // Never mark an invitation sent or disclose a private relationship via a stub.
    throw new ServiceUnavailableException('Invitation delivery is not available yet. The person remains saved; no invitation was sent.');
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