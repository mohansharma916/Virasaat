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
import { LegacyItem } from '../../legacy-items/entities/legacy-item.entity';

export enum VaultStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

@Entity('vaults')
export class Vault {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column({
    type: 'enum',
    enum: VaultStatus,
    default: VaultStatus.ACTIVE,
  })
  status!: VaultStatus;

  @Column({
    default: 0,
  })
  readinessScore!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToOne(() => User, (user) => user.vault)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @OneToMany(
    () => LegacyItem,
    (item) => item.vault,
  )
  items!: LegacyItem[];
}