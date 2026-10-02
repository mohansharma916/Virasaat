import { Injectable, Logger } from '@nestjs/common';
import {
  CheckInConfirmedEmailData,
  CheckInMissedEmailData,
  CheckInReminderEmailData,
  EmailTemplateDataMap,
  EmailTemplateType,
  OtpVerificationEmailData,
  PasswordResetEmailData,
  ReleaseAuthorizedEmailData,
  ReleaseCaseOpenedEmailData,
  RenderedEmail,
  SecurityAlertEmailData,
  SubscriptionReceiptEmailData,
  TrustedPersonInvitationEmailData,
  WelcomeEmailData,
} from './email-template.types';
import {
  renderCheckInConfirmedTemplate,
  renderCheckInMissedTemplate,
  renderCheckInReminderTemplate,
  renderOtpVerificationTemplate,
  renderPasswordResetTemplate,
  renderReleaseAuthorizedTemplate,
  renderReleaseCaseOpenedTemplate,
  renderSecurityAlertTemplate,
  renderSubscriptionReceiptTemplate,
  renderTrustedPersonInvitationTemplate,
  renderWelcomeTemplate,
} from './templates';

@Injectable()
export class EmailTemplateService {
  private readonly logger = new Logger(EmailTemplateService.name);

  /**
   * Render any email template by type with type-safe arguments
   */
  render<T extends EmailTemplateType>(
    type: T,
    data: EmailTemplateDataMap[T],
  ): RenderedEmail {
    switch (type) {
      case EmailTemplateType.OTP_VERIFICATION:
        return renderOtpVerificationTemplate(data as OtpVerificationEmailData);

      case EmailTemplateType.WELCOME:
        return renderWelcomeTemplate(data as WelcomeEmailData);

      case EmailTemplateType.CHECK_IN_REMINDER:
        return renderCheckInReminderTemplate(
          data as CheckInReminderEmailData,
        );

      case EmailTemplateType.CHECK_IN_MISSED:
        return renderCheckInMissedTemplate(data as CheckInMissedEmailData);

      case EmailTemplateType.CHECK_IN_CONFIRMED:
        return renderCheckInConfirmedTemplate(
          data as CheckInConfirmedEmailData,
        );

      case EmailTemplateType.TRUSTED_PERSON_INVITATION:
        return renderTrustedPersonInvitationTemplate(
          data as TrustedPersonInvitationEmailData,
        );

      case EmailTemplateType.RELEASE_CASE_OPENED:
        return renderReleaseCaseOpenedTemplate(
          data as ReleaseCaseOpenedEmailData,
        );

      case EmailTemplateType.RELEASE_AUTHORIZED:
        return renderReleaseAuthorizedTemplate(
          data as ReleaseAuthorizedEmailData,
        );

      case EmailTemplateType.PASSWORD_RESET:
        return renderPasswordResetTemplate(data as PasswordResetEmailData);

      case EmailTemplateType.SECURITY_ALERT:
        return renderSecurityAlertTemplate(data as SecurityAlertEmailData);

      case EmailTemplateType.SUBSCRIPTION_RECEIPT:
        return renderSubscriptionReceiptTemplate(
          data as SubscriptionReceiptEmailData,
        );

      default:
        throw new Error(`Unknown email template type: ${type}`);
    }
  }

  // -------------------------------------------------------------
  // CONVENIENCE SHORTCUTS
  // -------------------------------------------------------------

  renderOtpVerification(data: OtpVerificationEmailData): RenderedEmail {
    return this.render(EmailTemplateType.OTP_VERIFICATION, data);
  }

  renderWelcome(data: WelcomeEmailData): RenderedEmail {
    return this.render(EmailTemplateType.WELCOME, data);
  }

  renderCheckInReminder(data: CheckInReminderEmailData): RenderedEmail {
    return this.render(EmailTemplateType.CHECK_IN_REMINDER, data);
  }

  renderCheckInMissed(data: CheckInMissedEmailData): RenderedEmail {
    return this.render(EmailTemplateType.CHECK_IN_MISSED, data);
  }

  renderCheckInConfirmed(data: CheckInConfirmedEmailData): RenderedEmail {
    return this.render(EmailTemplateType.CHECK_IN_CONFIRMED, data);
  }

  renderTrustedPersonInvitation(
    data: TrustedPersonInvitationEmailData,
  ): RenderedEmail {
    return this.render(EmailTemplateType.TRUSTED_PERSON_INVITATION, data);
  }

  renderReleaseCaseOpened(data: ReleaseCaseOpenedEmailData): RenderedEmail {
    return this.render(EmailTemplateType.RELEASE_CASE_OPENED, data);
  }

  renderReleaseAuthorized(data: ReleaseAuthorizedEmailData): RenderedEmail {
    return this.render(EmailTemplateType.RELEASE_AUTHORIZED, data);
  }

  renderPasswordReset(data: PasswordResetEmailData): RenderedEmail {
    return this.render(EmailTemplateType.PASSWORD_RESET, data);
  }

  renderSecurityAlert(data: SecurityAlertEmailData): RenderedEmail {
    return this.render(EmailTemplateType.SECURITY_ALERT, data);
  }

  renderSubscriptionReceipt(data: SubscriptionReceiptEmailData): RenderedEmail {
    return this.render(EmailTemplateType.SUBSCRIPTION_RECEIPT, data);
  }

  /**
   * Return all supported email template types
   */
  getAllTemplateTypes(): EmailTemplateType[] {
    return Object.values(EmailTemplateType);
  }

  /**
   * Render sample preview of a specific template
   */
  renderSample(type: EmailTemplateType): RenderedEmail {
    const sampleData = this.getSampleData(type);
    return this.render(type, sampleData as any);
  }

  /**
   * Realistic high-fidelity sample data for every email template
   */
  getSampleData(type: EmailTemplateType): any {
    switch (type) {
      case EmailTemplateType.OTP_VERIFICATION:
        return {
          recipientName: 'Mohan Sharma',
          otpCode: '849201',
          expiryMinutes: 10,
          purpose: 'SIGNUP',
          requestIp: '192.168.1.1',
        } satisfies OtpVerificationEmailData;

      case EmailTemplateType.WELCOME:
        return {
          recipientName: 'Mohan Sharma',
          userEmail: 'mohansharma916@example.com',
          dashboardUrl: 'https://virasaat.com/dashboard',
          vaultId: 'vlt_892019402',
        } satisfies WelcomeEmailData;

      case EmailTemplateType.CHECK_IN_REMINDER:
        return {
          recipientName: 'Mohan Sharma',
          daysRemaining: 3,
          dueDate: 'October 5, 2026',
          preferredTime: '10:00 AM',
          cadence: 'Monthly',
          checkInUrl: 'https://virasaat.com/check-in/confirm?token=demo_token',
        } satisfies CheckInReminderEmailData;

      case EmailTemplateType.CHECK_IN_MISSED:
        return {
          recipientName: 'Mohan Sharma',
          missedDate: 'October 2, 2026',
          gracePeriodDays: 7,
          gracePeriodEndDate: 'October 9, 2026',
          trustedContactsCount: 2,
          checkInUrl: 'https://virasaat.com/check-in/recover?token=demo_token',
        } satisfies CheckInMissedEmailData;

      case EmailTemplateType.CHECK_IN_CONFIRMED:
        return {
          recipientName: 'Mohan Sharma',
          confirmedAt: 'October 2, 2026, 9:24 PM',
          nextCheckInDate: 'November 2, 2026',
          cadence: 'Monthly',
          dashboardUrl: 'https://virasaat.com/dashboard',
        } satisfies CheckInConfirmedEmailData;

      case EmailTemplateType.TRUSTED_PERSON_INVITATION:
        return {
          recipientName: 'Ananya Sharma',
          ownerName: 'Mohan Sharma',
          relationship: 'Spouse & Primary Nominee',
          invitationUrl: 'https://virasaat.com/nominee/accept?invite=inv_98471',
          expiryDate: 'November 1, 2026',
        } satisfies TrustedPersonInvitationEmailData;

      case EmailTemplateType.RELEASE_CASE_OPENED:
        return {
          verifierName: 'Ananya Sharma',
          ownerName: 'Mohan Sharma',
          caseId: 'VRS-CASE-2026-9041',
          triggerReason:
            'Three consecutive missed check-in cycles and elapsed 7-day grace period',
          openedAt: 'October 2, 2026',
          verificationDeadline: 'October 16, 2026 at 6:00 PM',
          verificationUrl: 'https://virasaat.com/cases/VRS-CASE-2026-9041',
        } satisfies ReleaseCaseOpenedEmailData;

      case EmailTemplateType.RELEASE_AUTHORIZED:
        return {
          recipientName: 'Ananya Sharma',
          ownerName: 'Mohan Sharma',
          releaseId: 'REL-2026-0042',
          accessUrl: 'https://virasaat.com/release/REL-2026-0042',
          accessExpiryDays: 30,
          itemCountSummary:
            '4 legal documents, 2 financial account folios, and 1 personal video memory',
        } satisfies ReleaseAuthorizedEmailData;

      case EmailTemplateType.PASSWORD_RESET:
        return {
          recipientName: 'Mohan Sharma',
          resetCode: '592814',
          resetUrl: 'https://virasaat.com/auth/reset-password?code=592814',
          expiryMinutes: 15,
          requestDevice: 'Safari on macOS (Apple Silicon)',
          requestIp: '122.161.49.201',
          requestTime: 'October 2, 2026, 9:20 PM IST',
        } satisfies PasswordResetEmailData;

      case EmailTemplateType.SECURITY_ALERT:
        return {
          recipientName: 'Mohan Sharma',
          alertTitle: 'New sign-in from unrecognized device',
          alertDescription:
            'A new session was established using your password credentials from an unfamiliar IP address and location.',
          eventTime: 'October 2, 2026, 9:15 PM IST',
          ipAddress: '157.240.239.35',
          deviceInfo: 'Chrome 128 on Windows 11',
          location: 'Bengaluru, Karnataka, India',
          lockVaultUrl: 'https://virasaat.com/security/lock-vault',
          reviewActivityUrl: 'https://virasaat.com/security/audit',
        } satisfies SecurityAlertEmailData;

      case EmailTemplateType.SUBSCRIPTION_RECEIPT:
        return {
          recipientName: 'Mohan Sharma',
          planName: 'Virasaat Pro Heritage',
          amountPaid: '₹2,499',
          billingInterval: 'Annual',
          invoiceNumber: 'INV-2026-0924',
          purchaseDate: 'October 2, 2026',
          nextRenewalDate: 'October 2, 2027',
          features: [
            'Unlimited encrypted legacy items & documents',
            'Up to 10 designated Trusted Contacts & Nominees',
            'Custom weekly, bi-weekly & monthly check-in cadence',
            'HD video & audio legacy message vault',
            'Dual-approval release policy with step-up verification',
            'Priority concierge & estate guidance',
          ],
          manageUrl: 'https://virasaat.com/account/subscription',
        } satisfies SubscriptionReceiptEmailData;

      default:
        throw new Error(`No sample data defined for ${type}`);
    }
  }
}
