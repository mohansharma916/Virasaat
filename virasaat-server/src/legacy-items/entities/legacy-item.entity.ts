import {
  Column,
  Index,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Vault } from '../../vault/entities/vault.entity';

export enum LegacyItemType {
  TEXT = 'TEXT',
  FINANCIAL = 'FINANCIAL',
  DOCUMENT = 'DOCUMENT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  OTHER = 'OTHER',
}

export enum LegacyItemStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  UPDATED = 'UPDATED',
  ARCHIVED = 'ARCHIVED',
}

@Index(['vaultId', 'requestKey'], { unique: true })
@Entity('legacy_items')
export class LegacyItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  vaultId!: string;

  @Column({
    type: 'enum',
    enum: LegacyItemType,
  })
  type!: LegacyItemType;

  @Column()
  category!: string;

  @Column()
  title!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description!: string | null;

  @Column({
    type: 'text',
    nullable: true,
    select: false,
  })
  ciphertextRef!: string | null;

  @Column({
    type: 'text',
    nullable: true,
    select: false,
  })
  encryptionKeyRef!: string | null;

  @Column({
    type: 'text',
    nullable: true,
    select: false,
  })
  encryptionKeyVersion!: string | null;

  @Column({
    type: 'enum',
    enum: LegacyItemStatus,
    default: LegacyItemStatus.DRAFT,
  })
  status!: LegacyItemStatus;

  @Column({ type: 'jsonb', nullable: true })
  assignment!: {
    recipientId: string;
    policyId: string;
    policyVersion: number;
    verificationRequired: boolean;
    trigger: string;
    verificationLevel: string;
    escalationConfig: Record<string, unknown>;
    assignedAt: string;
  } | null;

  @Column({ type: 'text', nullable: true, select: false })
  requestKey!: string | null;

  @Column({ type: 'text', nullable: true, select: false })
  requestHash!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Vault, (vault) => vault.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vaultId' })
  vault!: Vault;
}
