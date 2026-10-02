import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubscriptionStatus } from '../subscription.constants';
import { Plan } from './plan.entity';
import { User } from '../../users/entities/user.entity';

@Entity('subscriptions')
@Index(['userId', 'status'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  planId!: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status!: SubscriptionStatus;

  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  startDate!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expiryDate!: Date | null;

  @Column({ default: 'INTERNAL' })
  provider!: string;

  @Column({ type: 'text', nullable: true })
  providerSubscriptionId!: string | null;

  @Column({ type: 'text', nullable: true, select: false })
  providerPurchaseToken!: string | null;

  @Column({ default: true })
  autoRenew!: boolean;

  @Column({ default: false })
  cancelAtPeriodEnd!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Plan, (plan) => plan.subscriptions, { eager: true })
  @JoinColumn({ name: 'planId' })
  plan!: Plan;
}
