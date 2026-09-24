import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum AuditResult {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  DENIED = 'DENIED',
}

@Entity('audit_events')
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type:"text",nullable: true })
  actorId!: string | null;

  @Column()
  action!: string;

  @Column()
  targetType!: string;

  @Column({type:"text", nullable: true })
  targetId!: string | null;

  @Column({
    type: 'enum',
    enum: AuditResult,
  })
  result!: AuditResult;

  @Column({ type:"text",nullable: true })
  ipAddress!: string | null;

  @Column({ type:"text",nullable: true })
  userAgent!: string | null;

  /**
   * Additional metadata.
   *
   * NEVER put:
   * - passwords
   * - JWTs
   * - plaintext documents
   * - encryption keys
   */
  @Column({
    type: 'jsonb',
    default: {},
  })
  metadata!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;
}