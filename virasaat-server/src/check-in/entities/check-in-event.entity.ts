import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { CheckInPolicy } from './check-in-policy.entity';

export enum CheckInEventStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED',
  ESCALATED = 'ESCALATED',
}

@Entity('check_in_events')
export class CheckInEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  policyId!: string;

  @Column({ type: 'timestamptz' })
  dueAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  respondedAt!: Date | null;

  @Column({
    type: 'enum',
    enum: CheckInEventStatus,
    default: CheckInEventStatus.PENDING,
  })
  status!: CheckInEventStatus;

  @Column({ default: 0 })
  reminderCount!: number;

  @Column({ type: 'timestamptz', nullable: true })
  escalatedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => CheckInPolicy, (policy) => policy.events, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'policyId' })
  policy!: CheckInPolicy;
}
