import { AuditResult } from '../audit/entities/audit-event.entity';
import {
  BadRequestException,
  ForbiddenException,
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
        verificationRequired: data.verificationRequired ?? true,
      });
    } else {
      Object.assign(policy, data);
      policy.version = (policy.version ?? 1) + 1;
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
    return this.denyRelease(reviewerId, caseId, 'release_review_denied', { requestedStatus: dto.status });
  }

  // -----------------------------
  // AUTHORIZE RELEASE
  // -----------------------------

  async authorizeRelease(
    approverId: string,
    caseId: string,
    dto: AuthorizeReleaseDto,
  ) {
    return this.denyRelease(approverId, caseId, 'release_authorization_denied', { recipientId: dto.recipientId });
  }

  // -----------------------------
  // VERIFY AUTHORIZATION
  // -----------------------------

  async verifyAuthorization(
    recipientId: string,
  ) {
    return this.denyRelease(null, recipientId, 'release_access_denied');
  }

  private async denyRelease(actorId: string | null, targetId: string, action: string, metadata: Record<string, unknown> = {}) {
    await this.auditService.log({ actorId, action, targetType: 'release', targetId, result: AuditResult.DENIED, metadata });
    throw new ForbiddenException('Release is unavailable until reviewer permissions, policy evaluation and item-scoped access are configured.');
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