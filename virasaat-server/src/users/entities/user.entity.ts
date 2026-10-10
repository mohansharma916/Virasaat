import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Vault } from '../../vault/entities/vault.entity';
import { Recipient } from '../../recipients/entities/recipient.entity';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ type: 'text', nullable: true })
  phone!: string | null;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  avatar!: string | null;

  /**
   * Google account identifier.
   *
   * NULL when the user has not linked Google.
   */
  @Column({ unique: true, type: 'text', nullable: true })
  googleId!: string | null;

  /**
   * Hashed password.
   *
   * NULL for Google-only accounts.
   */
  @Column({ nullable: true, type: 'text', select: false })
  passwordHash!: string | null;

  /** Increment on logout/recovery to revoke previously issued bearer tokens. */
  @Column({ type: 'integer', default: 0 })
  sessionVersion!: number;

  /**
   * TRUE only after:
   *
   * 1. Email + password signup → OTP verified
   * 2. Google signup → Google email verified
   */
  @Column({ default: false })
  emailVerified!: boolean;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Column({ default: 'Asia/Kolkata' })
  timezone!: string;

  @Column({ type: 'text', nullable: true })
  country!: string | null;

  @Column({ type: 'text', nullable: true })
  preferredLanguage!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToOne(() => Vault, (vault) => vault.user)
  vault!: Vault;

  @OneToMany(() => Recipient, (recipient) => recipient.user)
  recipients!: Recipient[];
}
