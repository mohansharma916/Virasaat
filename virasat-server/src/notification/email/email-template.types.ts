export enum EmailTemplateType {
  OTP_VERIFICATION = 'OTP_VERIFICATION',
  WELCOME = 'WELCOME',
  CHECK_IN_REMINDER = 'CHECK_IN_REMINDER',
  CHECK_IN_MISSED = 'CHECK_IN_MISSED',
  CHECK_IN_CONFIRMED = 'CHECK_IN_CONFIRMED',
  TRUSTED_PERSON_INVITATION = 'TRUSTED_PERSON_INVITATION',
  RELEASE_CASE_OPENED = 'RELEASE_CASE_OPENED',
  RELEASE_AUTHORIZED = 'RELEASE_AUTHORIZED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  SECURITY_ALERT = 'SECURITY_ALERT',
  SUBSCRIPTION_RECEIPT = 'SUBSCRIPTION_RECEIPT',
}

export interface RenderedEmail {
  templateType: EmailTemplateType;
  subject: string;
  html: string;
  text: string;
}

export interface EmailLayoutOptions {
  preheader?: string;
  title: string;
  contentHtml: string;
  recipientEmail?: string;
  unsubscribeUrl?: string;
  securityNotice?: string;
}

// -------------------------------------------------------------
// TEMPLATE DATA INTERFACES
// -------------------------------------------------------------

export interface OtpVerificationEmailData {
  recipientName: string;
  otpCode: string;
  expiryMinutes?: number;
  purpose?: 'SIGNUP' | 'LOGIN' | 'PASSWORD_RESET' | 'SECURITY_VERIFICATION';
  requestIp?: string;
}

export interface WelcomeEmailData {
  recipientName: string;
  userEmail: string;
  dashboardUrl?: string;
  vaultId?: string;
}

export interface CheckInReminderEmailData {
  recipientName: string;
  daysRemaining: number;
  dueDate: string;
  preferredTime?: string;
  cadence?: 'Weekly' | 'Monthly' | 'Quarterly' | string;
  checkInUrl?: string;
}

export interface CheckInMissedEmailData {
  recipientName: string;
  missedDate: string;
  gracePeriodDays: number;
  gracePeriodEndDate: string;
  checkInUrl?: string;
  trustedContactsCount?: number;
}

export interface CheckInConfirmedEmailData {
  recipientName: string;
  confirmedAt: string;
  nextCheckInDate: string;
  cadence?: string;
  dashboardUrl?: string;
}

export interface TrustedPersonInvitationEmailData {
  recipientName: string;
  ownerName: string;
  relationship?: string;
  invitationUrl?: string;
  expiryDate?: string;
}

export interface ReleaseCaseOpenedEmailData {
  verifierName: string;
  ownerName: string;
  caseId: string;
  triggerReason: string;
  openedAt: string;
  verificationUrl?: string;
  verificationDeadline: string;
}

export interface ReleaseAuthorizedEmailData {
  recipientName: string;
  ownerName: string;
  releaseId: string;
  accessUrl?: string;
  accessExpiryDays?: number;
  itemCountSummary?: string;
}

export interface PasswordResetEmailData {
  recipientName: string;
  resetCode?: string;
  resetUrl?: string;
  expiryMinutes?: number;
  requestIp?: string;
  requestDevice?: string;
  requestTime?: string;
}

export interface SecurityAlertEmailData {
  recipientName: string;
  alertTitle: string;
  alertDescription: string;
  eventTime: string;
  ipAddress?: string;
  deviceInfo?: string;
  location?: string;
  lockVaultUrl?: string;
  reviewActivityUrl?: string;
}

export interface SubscriptionReceiptEmailData {
  recipientName: string;
  planName: string;
  amountPaid: string;
  billingInterval: 'Monthly' | 'Annual' | 'Lifetime' | string;
  invoiceNumber: string;
  purchaseDate: string;
  nextRenewalDate?: string;
  features?: string[];
  manageUrl?: string;
}

export type EmailTemplateDataMap = {
  [EmailTemplateType.OTP_VERIFICATION]: OtpVerificationEmailData;
  [EmailTemplateType.WELCOME]: WelcomeEmailData;
  [EmailTemplateType.CHECK_IN_REMINDER]: CheckInReminderEmailData;
  [EmailTemplateType.CHECK_IN_MISSED]: CheckInMissedEmailData;
  [EmailTemplateType.CHECK_IN_CONFIRMED]: CheckInConfirmedEmailData;
  [EmailTemplateType.TRUSTED_PERSON_INVITATION]: TrustedPersonInvitationEmailData;
  [EmailTemplateType.RELEASE_CASE_OPENED]: ReleaseCaseOpenedEmailData;
  [EmailTemplateType.RELEASE_AUTHORIZED]: ReleaseAuthorizedEmailData;
  [EmailTemplateType.PASSWORD_RESET]: PasswordResetEmailData;
  [EmailTemplateType.SECURITY_ALERT]: SecurityAlertEmailData;
  [EmailTemplateType.SUBSCRIPTION_RECEIPT]: SubscriptionReceiptEmailData;
};
