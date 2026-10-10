import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { ReleasePolicySnapshot } from './entities/release-policy-snapshot.entity';
import { ReleasePolicy } from '../release/entities/release-policy.entity';
import { PlanEntitlementService } from './plan-entitlement.service';
import { SubscriptionsController } from './subscriptions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Plan,
      Subscription,
      ReleasePolicySnapshot,
      ReleasePolicy,
    ]),
  ],
  controllers: [SubscriptionsController],
  providers: [PlanEntitlementService],
  exports: [PlanEntitlementService],
})
export class SubscriptionsModule {}
