import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('email_signups')
export class EmailSignup {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  email!: string;

  @Column()
  name!: string;

  /**
   * Never store the plain password.
   */
  @Column()
  passwordHash!: string;

  /**
   * Hashed OTP.
   */
  @Column()
  otpHash!: string;

  @Column()
  otpExpiresAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastSentAt!: Date;

  @Column({ default: 0 })
  attempts!: number;

  @Column({ default: false })
  verified!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
