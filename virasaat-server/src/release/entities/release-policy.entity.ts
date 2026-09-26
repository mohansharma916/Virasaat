import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

export enum ReleaseTrigger {
  MANUAL = 'MANUAL',
  CHECK_IN_ESCALATION = 'CHECK_IN_ESCALATION',
}

export enum VerificationLevel {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  HIGH = 'HIGH',
}

@Entity('release_policies')
export class ReleasePolicy {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  userId!: string;

  @Column({
    type: 'enum',
    enum: ReleaseTrigger,
    default: ReleaseTrigger.CHECK_IN_ESCALATION,
  })
  trigger!: ReleaseTrigger;

  @Column({
    type: 'enum',
    enum: VerificationLevel,
    default: VerificationLevel.STANDARD,
  })
  verificationLevel!: VerificationLevel;

  @Column({
    type: 'jsonb',
    default: {},
  })
  escalationConfig!: Record<string, any>;

  @Column({ default: true })
  enabled!: boolean;

  @Column({ default: 1 })
  version!: number;

  @Column({ default: true })
  verificationRequired!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;
}