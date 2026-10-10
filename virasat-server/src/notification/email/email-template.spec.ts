import { EmailTemplateService } from './email-template.service';
import { EmailTemplateType } from './email-template.types';

describe('EmailTemplateService', () => {
  let service: EmailTemplateService;

  beforeEach(() => {
    service = new EmailTemplateService();
  });

  it('should list all 11 supported email template types', () => {
    const types = service.getAllTemplateTypes();
    expect(types).toHaveLength(11);
    expect(types).toContain(EmailTemplateType.OTP_VERIFICATION);
    expect(types).toContain(EmailTemplateType.WELCOME);
    expect(types).toContain(EmailTemplateType.CHECK_IN_REMINDER);
    expect(types).toContain(EmailTemplateType.CHECK_IN_MISSED);
    expect(types).toContain(EmailTemplateType.CHECK_IN_CONFIRMED);
    expect(types).toContain(EmailTemplateType.TRUSTED_PERSON_INVITATION);
    expect(types).toContain(EmailTemplateType.RELEASE_CASE_OPENED);
    expect(types).toContain(EmailTemplateType.RELEASE_AUTHORIZED);
    expect(types).toContain(EmailTemplateType.PASSWORD_RESET);
    expect(types).toContain(EmailTemplateType.SECURITY_ALERT);
    expect(types).toContain(EmailTemplateType.SUBSCRIPTION_RECEIPT);
  });

  describe('OTP Verification Template', () => {
    it('should render OTP verification with valid code, digits, and security notice', () => {
      const rendered = service.renderOtpVerification({
        recipientName: 'Aarav Patel',
        otpCode: '654321',
        expiryMinutes: 10,
        purpose: 'SIGNUP',
      });

      expect(rendered.subject).toContain('654321');
      expect(rendered.subject).toContain('Virasat verification code');
      expect(rendered.html).toContain('654321');
      expect(rendered.html).toContain('Aarav Patel');
      expect(rendered.html).toContain('10 minutes');
      expect(rendered.html).toContain('Server-Managed Encryption');
      expect(rendered.html).toContain(
        'Authorized server processes can decrypt content',
      );
      expect(rendered.html).not.toContain(
        'Zero-Knowledge Encrypted Protection',
      );
      expect(rendered.text).toContain('654321');
    });
  });

  describe('Welcome Email Template', () => {
    it('should render welcome email with onboarding roadmap', () => {
      const rendered = service.renderWelcome({
        recipientName: 'Aarav Patel',
        userEmail: 'aarav@example.com',
        dashboardUrl: 'https://virasat.com/dashboard',
        vaultId: 'vlt_123',
      });

      expect(rendered.subject).toContain('Welcome to Virasat');
      expect(rendered.html).toContain('Aarav Patel');
      expect(rendered.html).toContain(
        'Three Steps to Complete Your Vault Setup',
      );
      expect(rendered.html).toContain('Open My Vault &amp; Complete Setup');
      expect(rendered.text).toContain('THREE STEPS TO COMPLETE YOUR SETUP');
    });
  });

  describe('Check-In Reminder Template', () => {
    it('should render due-in-days reminder with CTA button', () => {
      const rendered = service.renderCheckInReminder({
        recipientName: 'Aarav Patel',
        daysRemaining: 3,
        dueDate: 'October 10, 2026',
        preferredTime: '10:00 AM',
        cadence: 'Monthly',
      });

      expect(rendered.subject).toContain('due in 3 days');
      expect(rendered.html).toContain('Aarav Patel');
      expect(rendered.html).toContain('October 10, 2026');
      expect(rendered.html).toContain('Open Virasat App');
      expect(rendered.text).toContain('Monthly');
    });

    it('should render due today subject when daysRemaining is 0', () => {
      const rendered = service.renderCheckInReminder({
        recipientName: 'Aarav Patel',
        daysRemaining: 0,
        dueDate: 'October 2, 2026',
        cadence: 'Monthly',
      });

      expect(rendered.subject).toContain('due today');
    });
  });

  describe('Check-In Missed Template', () => {
    it('should render missed check-in grace period warning', () => {
      const rendered = service.renderCheckInMissed({
        recipientName: 'Aarav Patel',
        missedDate: 'October 1, 2026',
        gracePeriodDays: 7,
        gracePeriodEndDate: 'October 8, 2026',
      });

      expect(rendered.subject).toContain('URGENT: Missed Check-in');
      expect(rendered.html).toContain('7-day grace period');
      expect(rendered.html).toContain('October 8, 2026');
      expect(rendered.html).toContain('Open Virasat App');
      expect(rendered.text).toContain('URGENT: MISSED CHECK-IN NOTICE');
    });
  });

  describe('Check-In Confirmed Template', () => {
    it('should render confirmed check-in status with next scheduled date', () => {
      const rendered = service.renderCheckInConfirmed({
        recipientName: 'Aarav Patel',
        confirmedAt: 'October 2, 2026, 10:00 AM',
        nextCheckInDate: 'November 2, 2026',
        cadence: 'Monthly',
      });

      expect(rendered.subject).toContain('Check-in Confirmed');
      expect(rendered.html).toContain('November 2, 2026');
      expect(rendered.html).toContain('View Vault Dashboard');
    });
  });

  describe('Trusted Person Invitation Template', () => {
    it('should render invitation to designated nominee', () => {
      const rendered = service.renderTrustedPersonInvitation({
        recipientName: 'Diya Patel',
        ownerName: 'Aarav Patel',
        relationship: 'Sister',
        invitationUrl: 'https://virasat.com/invite/123',
      });

      expect(rendered.subject).toContain('Aarav Patel has designated you');
      expect(rendered.html).toContain('Sister');
      expect(rendered.html).toContain('Zero Immediate Access');
      expect(rendered.html).toContain('Open Virasat App');
    });
  });

  describe('All Templates Sample Render', () => {
    it('uses implemented destinations and accurate encryption claims in every sample', () => {
      for (const type of service.getAllTemplateTypes()) {
        const rendered = service.renderSample(type);
        expect(rendered.html).not.toContain('https://virasat.com');
        expect(rendered.text).not.toContain('https://virasat.com');
        expect(rendered.html).not.toMatch(
          /client-side encryption|Zero-Knowledge Encrypted/,
        );
        expect(rendered.text).not.toContain('client-side encryption');
        expect(rendered.text).toContain(
          'Authorized server processes can decrypt content',
        );
      }
    });

    it('marks unavailable workflow previews as illustrative in subject, HTML and text', () => {
      for (const type of [
        EmailTemplateType.CHECK_IN_REMINDER,
        EmailTemplateType.CHECK_IN_MISSED,
        EmailTemplateType.TRUSTED_PERSON_INVITATION,
        EmailTemplateType.RELEASE_CASE_OPENED,
        EmailTemplateType.RELEASE_AUTHORIZED,
        EmailTemplateType.SUBSCRIPTION_RECEIPT,
      ]) {
        const rendered = service.renderSample(type);
        expect(rendered.subject).toContain(
          'Illustrative sample — workflow unavailable',
        );
        expect(rendered.html).toContain(
          'This message performs no account action.',
        );
        expect(rendered.text).toContain(
          'This message performs no account action.',
        );
        expect(rendered.html).toContain('Open Virasat App');
      }
    });

    it('opens the reset form with the recipient email and keeps the OTP out of the URL', () => {
      const rendered = service.renderSample(EmailTemplateType.PASSWORD_RESET);
      const href = rendered.html.match(
        /href="(virasat:\/\/forgot-password[^" ]*)"/,
      )?.[1];
      expect(href).toBeDefined();
      const url = new URL(href!.replace(/&amp;/g, '&'));
      expect(url.searchParams.get('email')).toBe('mohansharma916@example.com');
      expect(url.searchParams.get('mode')).toBe('reset');
      expect(url.searchParams.has('code')).toBe(false);
      expect(url.toString()).not.toContain('592814');
    });

    it('offers implemented security settings without promising a lock action or audit viewer', () => {
      const rendered = service.renderSample(EmailTemplateType.SECURITY_ALERT);
      expect(rendered.html).toContain('Open Security Settings');
      expect(rendered.html).toContain('href="virasat://security"');
      expect(rendered.html).not.toMatch(
        /Lock Vault|Terminate Sessions|Review Audit Log|security\/audit|security\/lock/,
      );
      expect(rendered.text).not.toContain('Immediately lock your vault');
    });

    it('should render all 11 template types from sample data without error', () => {
      const types = service.getAllTemplateTypes();
      for (const type of types) {
        const rendered = service.renderSample(type);
        expect(rendered.templateType).toBe(type);
        expect(rendered.subject).toBeTruthy();
        expect(rendered.html).toContain('<!DOCTYPE html');
        expect(rendered.html).toContain('VIRASAT');
        expect(rendered.text).toContain('VIRASAT');
        expect(rendered.text).toContain('Digital Legacy & Inheritance Vault');
      }
    });
  });
});
