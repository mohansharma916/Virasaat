import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import {
  Recipient,
  RecipientNotificationMode,
  RecipientStatus,
} from './entities/recipient.entity';

import { CreateRecipientDto } from './dto/create-recipient.dto';
import { UpdateRecipientDto } from './dto/update-recipient.dto';
import { PlanEntitlementService } from '../subscriptions/plan-entitlement.service';
import { PlanLimit } from '../subscriptions/subscription.constants';

@Injectable()
export class RecipientsService {
  constructor(
    @InjectRepository(Recipient)
    private readonly recipientRepository: Repository<Recipient>,
    @Optional()
    private readonly planEntitlementService?: PlanEntitlementService,
  ) {}

  async create(userId: string, dto: CreateRecipientDto) {
    const email = this.normalizeEmail(dto.email);
    const matches = (saved: Recipient) =>
      saved.email === email &&
      saved.name === dto.name &&
      saved.phone === (dto.phone ?? null) &&
      saved.relationship === (dto.relationship ?? null) &&
      saved.verificationRequired === (dto.verificationRequired ?? true) &&
      saved.notificationMode ===
        (dto.notificationMode ??
          RecipientNotificationMode.INFORM_ON_ACTIVATION);

    // One owner's writes are serialized so parallel requests cannot all pass
    // the plan limit or the duplicate-email check.
    return this.recipientRepository.manager.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        `recipients:${userId}`,
      ]);
      const recipients = manager.getRepository(Recipient);
      if (dto.requestKey) {
        const saved = await recipients.findOne({
          where: { userId, requestKey: dto.requestKey },
        });
        if (saved) {
          if (matches(saved)) return saved;
          throw new ConflictException(
            'This request already saved a different recipient. Review your people list.',
          );
        }
      }

      const existing = await recipients.findOne({ where: { userId, email } });
      if (existing)
        throw new ConflictException(
          'Recipient already exists. Review the saved person before making changes.',
        );

      if (this.planEntitlementService) {
        const activeCount = await recipients.count({
          where: {
            userId,
            status: Not(RecipientStatus.REVOKED),
          },
        });
        await this.planEntitlementService.assertWithinLimit(
          userId,
          PlanLimit.TRUSTED_PERSONS,
          activeCount,
        );
      }

      return recipients.save(
        recipients.create({
          userId,
          requestKey: dto.requestKey ?? null,
          name: dto.name,
          email,
          phone: dto.phone ?? null,
          relationship: dto.relationship ?? null,
          verificationRequired: dto.verificationRequired ?? true,
          notificationMode:
            dto.notificationMode ??
            RecipientNotificationMode.INFORM_ON_ACTIVATION,
          status: RecipientStatus.PRIVATE,
        }),
      );
    });
  }

  async invite(userId: string, recipientId: string) {
    await this.findOne(userId, recipientId);
    // BACKEND GAP: no real notification transport or invitation acceptance flow.
    // Never mark an invitation sent or disclose a private relationship via a stub.
    throw new ServiceUnavailableException(
      'Invitation delivery is not available yet. The person remains saved; no invitation was sent.',
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

  async findOne(userId: string, recipientId: string) {
    const recipient = await this.recipientRepository.findOne({
      where: {
        id: recipientId,
        userId,
      },
    });

    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }

    return recipient;
  }

  async update(userId: string, recipientId: string, dto: UpdateRecipientDto) {
    return this.recipientRepository.manager.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        `recipients:${userId}`,
      ]);
      const recipients = manager.getRepository(Recipient);
      const recipient = await recipients.findOne({
        where: { id: recipientId, userId },
      });
      if (!recipient) throw new NotFoundException('Recipient not found');

      const { email: requestedEmail, ...changes } = dto;
      if (requestedEmail !== undefined) {
        const email = this.normalizeEmail(requestedEmail);
        if (email !== recipient.email) {
          if (recipient.status !== RecipientStatus.PRIVATE)
            throw new BadRequestException(
              'This person has already been contacted, so their email cannot be changed. Add them again with the new email instead.',
            );
          const duplicate = await recipients.findOne({
            where: { userId, email },
          });
          if (duplicate)
            throw new ConflictException(
              'Another saved person already uses this email.',
            );
          recipient.email = email;
        }
      }
      Object.assign(recipient, changes);
      return recipients.save(recipient);
    });
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  async revoke(userId: string, recipientId: string) {
    const recipient = await this.findOne(userId, recipientId);

    recipient.status = RecipientStatus.REVOKED;

    recipient.revokedAt = new Date();

    return this.recipientRepository.save(recipient);
  }
}
