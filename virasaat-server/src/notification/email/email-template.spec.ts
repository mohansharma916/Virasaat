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
      expect(rendered.subject).toContain('Virasaat verification code');
      expect(rendered.html).toContain('654321');
      expect(rendered.html).toContain('Aarav Patel');
      expect(rendered.html).toContain('10 minutes');
      expect(rendered.html).toContain('Zero-Knowledge Encrypted Protection');
      expect(rendered.text).toContain('654321');
    });
  });

  describe('Welcome Email Template', () => {
    it('should render welcome email with onboarding roadmap', () => {
      const rendered = service.renderWelcome({
        recipientName: 'Aarav Patel',
        userEmail: 'aarav@example.com',
        dashboardUrl: 'https://virasaat.com/dashboard',
        vaultId: 'vlt_123',
      });

      expect(rendered.subject).toContain('Welcome to Virasaat');
      expect(rendered.html).toContain('Aarav Patel');
      expect(rendered.html).toContain('Three Steps to Complete Your Vault Setup');
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
      expect(rendered.html).toContain('Confirm I Am Safe &amp; Well');
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
      expect(rendered.html).toContain('Confirm Safety &amp; Reset Schedule');
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
        invitationUrl: 'https://virasaat.com/invite/123',
      });

      expect(rendered.subject).toContain('Aarav Patel has designated you');
      expect(rendered.html).toContain('Sister');
      expect(rendered.html).toContain('Zero Immediate Access');
      expect(rendered.html).toContain('Acknowledge Designation &amp; Verify Details');
    });
  });

  describe('All Templates Sample Render', () => {
    it('should render all 11 template types from sample data without error', () => {
      const types = service.getAllTemplateTypes();
      for (const type of types) {
        const rendered = service.renderSample(type);
        expect(rendered.templateType).toBe(type);
        expect(rendered.subject).toBeTruthy();
        expect(rendered.html).toContain('<!DOCTYPE html');
        expect(rendered.html).toContain('VIRASAAT');
        expect(rendered.text).toContain('VIRASAAT');
        expect(rendered.text).toContain('Digital Legacy & Inheritance Vault');
      }
    });
  });
});
