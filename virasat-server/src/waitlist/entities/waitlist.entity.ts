import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('waitlist')
export class Waitlist {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ type: 'text', nullable: true })
  fullName!: string | null;

  @Column({ type: 'varchar', length: 120, default: 'India' })
  country!: string;

  @Column({ type: 'varchar', length: 120, default: 'Both iOS & Android' })
  platform!: string;

  @Column({ type: 'varchar', length: 120, default: 'website' })
  source!: string;

  @Index()
  @Column({ type: 'int' })
  queueNumber!: number;

  @Column({ type: 'boolean', default: false })
  emailSentToAdmin!: boolean;

  @Column({ type: 'boolean', default: false })
  emailSentToUser!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
