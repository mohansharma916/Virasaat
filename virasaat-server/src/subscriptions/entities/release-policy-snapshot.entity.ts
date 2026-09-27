import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('release_policy_snapshots')
@Index(['userId', 'policyVersion'])
export class ReleasePolicySnapshot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column({ default: 1 })
  policyVersion!: number;

  @Column({ nullable: true })
  policyId!: string;

  @Column({ default: 'CHECK_IN_ESCALATION' })
  trigger!: string;

  @Column({ default: 'STANDARD' })
  verificationLevel!: string;

  @Column({ default: true })
  verificationRequired!: boolean;

  @Column({ type: 'jsonb', default: {} })
  escalationConfig!: Record<string, any>;

  @Column({ type: 'text', default: 'SYSTEM_PRESERVATION' })
  snapshotReason!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
