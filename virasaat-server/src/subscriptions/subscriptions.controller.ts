import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanEntitlementService } from './plan-entitlement.service';
import { PurchaseDto } from './dto/purchase.dto';
import { RestorePurchaseDto } from './dto/restore-purchase.dto';
import { PlanCode } from './subscription.constants';

@Controller()
export class SubscriptionsController {
  constructor(
    private readonly entitlementService: PlanEntitlementService,
  ) {}

  /**
   * Public list of available plans, features, limits, and pricing.
   */
  @Get('subscriptions/plans')
  async getPlans() {
    return this.entitlementService.getPublicPlans();
  }

  /**
   * Unified user subscription and entitlement status.
   */
  @Get('subscriptions/me')
  @UseGuards(JwtAuthGuard)
  async getMySubscription(@Req() req: { user: { id: string } }) {
    return this.entitlementService.getUserEntitlementsPayload(req.user.id);
  }

  /**
   * Alias: GET /me/subscription
   */
  @Get('me/subscription')
  @UseGuards(JwtAuthGuard)
  async getMeSubscriptionAlias(@Req() req: { user: { id: string } }) {
    return this.entitlementService.getUserEntitlementsPayload(req.user.id);
  }

  /**
   * Alias: GET /me/entitlements
   */
  @Get('me/entitlements')
  @UseGuards(JwtAuthGuard)
  async getMeEntitlementsAlias(@Req() req: { user: { id: string } }) {
    return this.entitlementService.getUserEntitlementsPayload(req.user.id);
  }

  /**
   * Verify and process a purchase.
   */
  @Post('subscriptions/purchase')
  @UseGuards(JwtAuthGuard)
  async processPurchase(
    @Req() req: { user: { id: string } },
    @Body() dto: PurchaseDto,
  ) {
    const sub = await this.entitlementService.verifyAndProcessPurchase(
      req.user.id,
      dto,
    );
    return this.entitlementService.getUserEntitlementsPayload(req.user.id);
  }

  /**
   * Restore previous purchases.
   */
  @Post('subscriptions/restore')
  @UseGuards(JwtAuthGuard)
  async restorePurchases(
    @Req() req: { user: { id: string } },
    @Body() dto: RestorePurchaseDto,
  ) {
    await this.entitlementService.restorePurchases(req.user.id, dto);
    return this.entitlementService.getUserEntitlementsPayload(req.user.id);
  }

  /**
   * Non-destructive plan downgrade.
   */
  @Post('subscriptions/downgrade')
  @UseGuards(JwtAuthGuard)
  async downgrade(
    @Req() req: { user: { id: string } },
    @Body() body: { planCode: PlanCode },
  ) {
    await this.entitlementService.downgradeSubscription(
      req.user.id,
      body.planCode,
    );
    return this.entitlementService.getUserEntitlementsPayload(req.user.id);
  }
}
