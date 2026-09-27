import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PlanCode } from '../subscription.constants';
import type {
  PlanFeatureConfig,
  PlanLimitConfig,
} from '../subscription.constants';
import { Subscription } from './subscription.entity';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: PlanCode,
    unique: true,
  })
  code!: PlanCode;

  @Column()
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price!: number;

  @Column({ default: 'INR' })
  currency!: string;

  @Column({ default: 'FREE' })
  billingPeriod!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: 1 })
  displayOrder!: number;

  @Column({ type: 'jsonb' })
  features!: PlanFeatureConfig;

  @Column({ type: 'jsonb' })
  limits!: PlanLimitConfig;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  subscriptions!: Subscription[];
}
