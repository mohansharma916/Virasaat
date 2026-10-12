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

import { User } from '../../users/entities/user.entity';

export enum RecipientStatus {
  PRIVATE = 'PRIVATE',
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
}

export enum RecipientNotificationMode {
  INFORM_NOW = 'INFORM_NOW',
  INFORM_ON_ACTIVATION = 'INFORM_ON_ACTIVATION',
}

export enum RecipientAccessLevel {
  FULL_VAULT = 'FULL_VAULT',
}

@Index(['userId', 'requestKey'], { unique: true })
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

  @Column({ type: 'text', nullable: true })
  phone!: string | null;

  @Column({ type: 'text', nullable: true })
  relationship!: string | null;

  @Column({
    type: 'enum',
    enum: RecipientStatus,
    default: RecipientStatus.PRIVATE,
  })
  status!: RecipientStatus;

  @Column({
    type: 'enum',
    enum: RecipientAccessLevel,
    default: RecipientAccessLevel.FULL_VAULT,
  })
  accessLevel!: RecipientAccessLevel;

  @Column({ type: 'text', nullable: true, select: false })
  invitationTokenHash!: string | null;

  @Column({ type: Date, nullable: true })
  invitationExpiresAt!: Date | null;

  @Column({ type: Date, nullable: true })
  acceptedAt!: Date | null;

  @Column({ type: Date, nullable: true })
  revokedAt!: Date | null;

  @Column({ default: true })
  verificationRequired!: boolean;

  // The owner's saved preference. No notification is sent until delivery exists.
  @Column({
    type: 'text',
    default: RecipientNotificationMode.INFORM_ON_ACTIVATION,
  })
  notificationMode!: RecipientNotificationMode;

  @Column({ type: 'text', nullable: true })
  requestKey!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
