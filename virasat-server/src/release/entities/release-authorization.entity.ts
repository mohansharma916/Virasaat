import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ReleaseCase } from './release-case.entity';

export enum AuthorizationStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

@Entity('release_authorizations')
export class ReleaseAuthorization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  caseId!: string;

  /**
   * MVP:
   * FULL_VAULT
   *
   * Later:
   * ITEM / CATEGORY based scope.
   */
  @Column({
    type: 'jsonb',
    default: {
      type: 'FULL_VAULT',
    },
  })
  scope!: {
    type: 'FULL_VAULT';
  };

  @Column()
  recipientId!: string;

  @Column()
  approvedBy!: string;

  @Column({
    type: 'enum',
    enum: AuthorizationStatus,
    default: AuthorizationStatus.ACTIVE,
  })
  status!: AuthorizationStatus;

  @Column()
  expiresAt!: Date;

  @Column({ type: 'date', nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => ReleaseCase, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caseId' })
  releaseCase!: ReleaseCase;
}
