import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

export enum RecipientStatus {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
}

export enum RecipientAccessLevel {
  FULL_VAULT = 'FULL_VAULT',
}

@Entity('recipients')
export class Recipient {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column({  type: 'text',nullable: true })
  phone!: string | null;

  @Column({  type: 'text',nullable: true })
  relationship!: string | null;

  @Column({
    type: 'enum',
    enum: RecipientStatus,
    default: RecipientStatus.INVITED,
  })
  status!: RecipientStatus;

  @Column({
    type: 'enum',
    enum: RecipientAccessLevel,
    default: RecipientAccessLevel.FULL_VAULT,
  })
  accessLevel!: RecipientAccessLevel;

  @Column({  type: 'text',nullable: true })
  invitationTokenHash!: string | null;

  @Column({  type: Date,nullable: true })
  invitationExpiresAt!: Date | null;

  @Column({ type: Date,nullable: true })
  acceptedAt!: Date | null;

  @Column({ type: Date,nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(
    () => User,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'userId' })
  user!: User;
}