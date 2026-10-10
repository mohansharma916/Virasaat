import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('auth_rate_limits')
export class AuthRateLimit {
  @PrimaryColumn({ length: 64 })
  key!: string;

  @Column({ type: 'integer' })
  count!: number;

  @Index()
  @Column({ type: 'timestamp with time zone' })
  expiresAt!: Date;
}
