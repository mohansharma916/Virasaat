import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  ReleaseCase,
  ReleaseCaseStatus,
  ReleaseReason,
} from './entities/release-case.entity';

import {
  ReleasePolicy,
  ReleaseTrigger,
} from './entities/release-policy.entity';

import {
  AuthorizationStatus,
  ReleaseAuthorization,
} from './entities/release-authorization.entity';

import { CreateReleaseCaseDto } from './dto/create-release-case.dto';
import { ReviewReleaseCaseDto } from './dto/review-release-case.dto';
import { AuthorizeReleaseDto } from './dto/authorize-release.dto';

import {
  Recipient,
  RecipientStatus,
} from '../recipients/entities/recipient.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ReleaseService {
  constructor(
    @InjectRepository(ReleasePolicy)
    private readonly policyRepository:
      Repository<ReleasePolicy>,

    @InjectRepository(ReleaseCase)
    private readonly caseRepository:
      Repository<ReleaseCase>,

    @InjectRepository(ReleaseAuthorization)
    private readonly authorizationRepository:
      Repository<ReleaseAuthorization>,

    @InjectRepository(Recipient)
    private readonly recipientRepository:
      Repository<Recipient>,


    private readonly auditService: AuditService
  ) {}

  // -----------------------------
  // RELEASE POLICY
  // -----------------------------

  async getPolicy(userId: string) {
    return this.policyRepository.findOne({
      where: { userId },
    });
  }

  async updatePolicy(
    userId: string,
    data: Partial<ReleasePolicy>,
  ) {
    let policy =
      await this.policyRepository.findOne({
        where: { userId },
      });

    if (!policy) {
      policy = this.policyRepository.create({
        userId,
        trigger:
          data.trigger ??
          ReleaseTrigger.CHECK_IN_ESCALATION,
        verificationLevel:
          data.verificationLevel ?? undefined,
        escalationConfig:
          data.escalationConfig ?? {},
        enabled: data.enabled ?? true,
      });
    } else {
      Object.assign(policy, data);
    }

    return this.policyRepository.save(policy);
  }

  // -----------------------------
  // CREATE CASE
  // -----------------------------

  async createCase(
    userId: string,
    dto: CreateReleaseCaseDto,
  ) {
    const releaseCase =
      this.caseRepository.create({
        userId,
        reason: dto.reason,
        evidence: dto.evidence ?? null,
        status: ReleaseCaseStatus.OPEN,
        openedAt: new Date(),
      });

      

    return this.caseRepository.save(releaseCase);
  }

  // -----------------------------
  // GET CASES
  // -----------------------------

  async getCases(userId: string) {
    return this.caseRepository.find({
      where: { userId },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getCase(
    userId: string,
    caseId: string,
  ) {
    const releaseCase =
      await this.caseRepository.findOne({
        where: {
          id: caseId,
          userId,
        },
      });

    if (!releaseCase) {
      throw new NotFoundException(
        'Release case not found',
      );
    }

    return releaseCase;
  }

  // -----------------------------
  // REVIEW CASE
  // -----------------------------

  async reviewCase(
    reviewerId: string,
    caseId: string,
    dto: ReviewReleaseCaseDto,
  ) {
    const releaseCase =
      await this.caseRepository.findOne({
        where: {
          id: caseId,
        },
      });

    if (!releaseCase) {
      throw new NotFoundException(
        'Release case not found',
      );
    }

    if (
      releaseCase.status ===
        ReleaseCaseStatus.CLOSED ||
      releaseCase.status ===
        ReleaseCaseStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Release case is already closed',
      );
    }

    releaseCase.status = dto.status;
    releaseCase.reviewerId = reviewerId;
    releaseCase.reviewerNotes =
      dto.notes ?? null;
    releaseCase.reviewedAt = new Date();

    if (
      dto.status === ReleaseCaseStatus.REJECTED
    ) {
      releaseCase.closedAt = new Date();
    }

    return this.caseRepository.save(
      releaseCase,
    );
  }

  // -----------------------------
  // AUTHORIZE RELEASE
  // -----------------------------

  async authorizeRelease(
    approverId: string,
    caseId: string,
    dto: AuthorizeReleaseDto,
  ) {
    const releaseCase =
      await this.caseRepository.findOne({
        where: {
          id: caseId,
        },
      });

    if (!releaseCase) {
      throw new NotFoundException(
        'Release case not found',
      );
    }

    if (
      releaseCase.status !==
      ReleaseCaseStatus.APPROVED
    ) {
      throw new BadRequestException(
        'Release case must be approved before authorization',
      );
    }

    // Validate recipient belongs to vault owner.
    const recipient =
      await this.recipientRepository.findOne({
        where: {
          id: dto.recipientId,
          userId: releaseCase.userId,
        },
      });

    if (!recipient) {
      throw new NotFoundException(
        'Recipient not found',
      );
    }

    if (
      recipient.status !==
      RecipientStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'Recipient is not active',
      );
    }

    const expiresAt = new Date();

    expiresAt.setDate(
      expiresAt.getDate() +
        dto.expiresInDays,
    );

    const authorization =
      this.authorizationRepository.create({
        caseId,
        recipientId: recipient.id,
        approvedBy: approverId,
        scope: {
          type: 'FULL_VAULT',
        },
        status: AuthorizationStatus.ACTIVE,
        expiresAt,
      });

    releaseCase.status =
      ReleaseCaseStatus.APPROVED;

    await this.caseRepository.save(
      releaseCase,
    );

    return this.authorizationRepository.save(
      authorization,
    );
  }

  // -----------------------------
  // VERIFY AUTHORIZATION
  // -----------------------------

  async verifyAuthorization(
    recipientId: string,
  ) {
    const authorization =
      await this.authorizationRepository
        .createQueryBuilder('authorization')
        .where(
          'authorization.recipientId = :recipientId',
          { recipientId },
        )
        .andWhere(
          'authorization.status = :status',
          {
            status: AuthorizationStatus.ACTIVE,
          },
        )
        .andWhere(
          'authorization.expiresAt > :now',
          {
            now: new Date(),
          },
        )
        .orderBy(
          'authorization.createdAt',
          'DESC',
        )
        .getOne();

    if (!authorization) {
      throw new BadRequestException(
        'No active release authorization',
      );
    }

    return authorization;
  }

  // -----------------------------
  // CLOSE CASE
  // -----------------------------

  async closeCase(
    userId: string,
    caseId: string,
  ) {
    const releaseCase =
      await this.getCase(
        userId,
        caseId,
      );

    releaseCase.status =
      ReleaseCaseStatus.CLOSED;

    releaseCase.closedAt =
      new Date();

    return this.caseRepository.save(
      releaseCase,
    );
  }
}