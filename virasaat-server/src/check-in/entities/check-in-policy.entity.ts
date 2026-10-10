import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { CheckInEvent } from './check-in-event.entity';

export enum CheckInCadence {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

@Entity('check_in_policies')
export class CheckInPolicy {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  userId!: string;

  @Column({
    type: 'enum',
    enum: CheckInCadence,
    default: CheckInCadence.MONTHLY,
  })
  cadence!: CheckInCadence;

  @Column({ default: '09:00' })
  preferredTime!: string;

  @Column({ default: 'Asia/Kolkata' })
  timezone!: string;

  @Column({
    type: 'jsonb',
    default: {
      channels: ['EMAIL'],
      reminderDaysBefore: [3, 1],
    },
  })
  reminderConfig!: {
    channels: string[];
    reminderDaysBefore: number[];
  };

  @Column({ type: 'timestamptz', nullable: true })
  nextCheckInAt!: Date | null;

  @Column({ default: false })
  escalationEnabled!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @OneToMany(() => CheckInEvent, (event) => event.policy)
  events!: CheckInEvent[];
}
