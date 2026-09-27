import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditEvent, AuditResult } from './entities/audit-event.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditEvent)
    private readonly auditRepository: Repository<AuditEvent>,
  ) {}

  async log(data: {
    actorId?: string | null;
    action: string;
    targetType: string;
    targetId?: string | null;
    result: AuditResult;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, any>;
  }) {
    const event = this.auditRepository.create({
      actorId: data.actorId ?? null,
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId ?? null,
      result: data.result,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
      metadata: data.metadata ?? {},
    });

    return this.auditRepository.save(event);
  }

  async getUserEvents(actorId: string) {
    return this.auditRepository.find({
      where: {
        actorId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getTargetEvents(targetType: string, targetId: string) {
    return this.auditRepository.find({
      where: {
        targetType,
        targetId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
