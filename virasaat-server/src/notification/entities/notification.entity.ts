import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum NotificationType {
  CHECK_IN_REMINDER = 'CHECK_IN_REMINDER',
  CHECK_IN_MISSED = 'CHECK_IN_MISSED',
  RELEASE_CASE_OPENED = 'RELEASE_CASE_OPENED',
  RELEASE_APPROVED = 'RELEASE_APPROVED',
  RELEASE_AUTHORIZED = 'RELEASE_AUTHORIZED',
  RECIPIENT_INVITATION = 'RECIPIENT_INVITATION',
  SECURITY_ALERT = 'SECURITY_ALERT',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  SMS = 'SMS',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type!: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
  })
  channel!: NotificationChannel;

  @Column()
  subject!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status!: NotificationStatus;

  @Column({ type:"date",nullable: true })
  sentAt!: Date | null;

  @Column({ type:"date", nullable: true })
  failedAt!: Date | null;

  @Column({  type:"text",nullable: true })
  failureReason!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}