import {
  Column,
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
  })
  ciphertextRef!: string | null;

  @Column({
     type: 'text',
    nullable: true,
  })
  encryptionKeyRef!: string | null;

  @Column({
     type: 'text',
    nullable: true,
  })
  encryptionKeyVersion!: string | null;

  @Column({
    type: 'enum',
    enum: LegacyItemStatus,
    default: LegacyItemStatus.DRAFT,
  })
  status!: LegacyItemStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(
    () => Vault,
    (vault) => vault.items,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'vaultId' })
  vault!: Vault;
}