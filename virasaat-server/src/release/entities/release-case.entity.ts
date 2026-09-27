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

export enum ReleaseCaseStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CLOSED = 'CLOSED',
}

export enum ReleaseReason {
  MANUAL_REQUEST = 'MANUAL_REQUEST',
  CHECK_IN_ESCALATION = 'CHECK_IN_ESCALATION',
}

@Entity('release_cases')
export class ReleaseCase {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column({
    type: 'enum',
    enum: ReleaseReason,
  })
  reason!: ReleaseReason;

  @Column({
    type: 'enum',
    enum: ReleaseCaseStatus,
    default: ReleaseCaseStatus.OPEN,
  })
  status!: ReleaseCaseStatus;

  @Column({ type: 'text', nullable: true })
  evidence!: string | null;

  @Column({ type: 'text', nullable: true })
  reviewerId!: string | null;

  @Column({ type: 'text', nullable: true })
  reviewerNotes!: string | null;

  @Column({ type: 'date', nullable: true })
  reviewedAt!: Date | null;

  @Column({ type: 'date', nullable: true })
  openedAt!: Date | null;

  @Column({ type: 'date', nullable: true })
  closedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
