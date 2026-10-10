import { getEmailAppLink } from '../email-links';
import {
  BRAND_COLORS,
  renderCtaButton,
  renderStatusBadge,
  wrapInEmailLayout,
  wrapInPlainTextLayout,
} from '../email-layout';
import {
  CheckInMissedEmailData,
  EmailTemplateType,
  RenderedEmail,
} from '../email-template.types';

export function renderCheckInMissedTemplate(
  data: CheckInMissedEmailData,
): RenderedEmail {
  const checkInUrl = data.checkInUrl || getEmailAppLink('home');
  const subject = `URGENT: Missed Check-in on Virasaat — Grace Period Active`;

  const contentHtml = `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="left">
          ${renderStatusBadge({ label: 'Action Required • Grace Period Active', variant: 'warning' })}
          <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 700; color: ${BRAND_COLORS.deepForest}; line-height: 32px; margin-bottom: 12px;">
            We missed your scheduled check-in
          </h1>
          <p style="font-family: 'Inter', sans-serif; font-size: 15px; color: ${BRAND_COLORS.textSecondary}; line-height: 24px; margin-bottom: 20px;">
            Hello ${escapeHtml(data.recipientName)},<br />
            We did not receive your confirmation for the scheduled check-in on <strong>${escapeHtml(data.missedDate)}</strong>. To protect your wishes, Virasaat has placed your account into an active <strong>${data.gracePeriodDays}-day grace period</strong>.
          </p>
        </td>
      </tr>

      <!-- Warning Callout Box -->
      <tr>
        <td>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${BRAND_COLORS.warningSoft}; border: 1.5px solid #FDE68A; border-radius: 12px; margin-bottom: 24px;">
            <tr>
              <td style="padding: 20px;">
                <div style="font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700; color: ${BRAND_COLORS.warning}; margin-bottom: 8px;">
                  &#9888; Grace Period Active Until: ${escapeHtml(data.gracePeriodEndDate)}
                </div>
                <div style="font-family: 'Inter', sans-serif; font-size: 13px; color: ${BRAND_COLORS.textPrimary}; line-height: 20px;">
                  <strong>No vault items are released by a missed check-in.</strong> No materials have been released. Scheduled reminders and escalation are not currently available.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- CTA Button -->
      <tr>
        <td align="center">
          ${renderCtaButton({
            url: checkInUrl,
            label: 'Open Virasaat App',
            variant: 'warning',
          })}
        </td>
      </tr>

      <!-- What Happens Next Protocol Tracker -->
      <tr>
        <td style="padding-top: 12px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAFBFB; border-radius: 12px; border: 1px solid ${BRAND_COLORS.borderLight};">
            <tr>
              <td style="padding: 20px;">
                <div style="font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: ${BRAND_COLORS.textMuted}; margin-bottom: 14px;">
                  ESCALATION PROTOCOL STATUS
                </div>

                <!-- Step 1 -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 10px;">
                  <tr>
                    <td width="24" valign="top" style="color: ${BRAND_COLORS.warning}; font-size: 14px;">&#10004;</td>
                    <td style="font-family: 'Inter', sans-serif; font-size: 13px; color: ${BRAND_COLORS.textPrimary};">
                      <strong>Check-in Deadline Passed:</strong> ${escapeHtml(data.missedDate)}
                    </td>
                  </tr>
                </table>

                <!-- Step 2 -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 10px;">
                  <tr>
                    <td width="24" valign="top" style="color: ${BRAND_COLORS.warning}; font-size: 14px;">&#9679;</td>
                    <td style="font-family: 'Inter', sans-serif; font-size: 13px; color: ${BRAND_COLORS.warning}; font-weight: 600;">
                      Grace Period Active (${data.gracePeriodDays} days remaining until ${escapeHtml(data.gracePeriodEndDate)})
                    </td>
                  </tr>
                </table>

                <!-- Step 3 -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td width="24" valign="top" style="color: ${BRAND_COLORS.textMuted}; font-size: 14px;">&#9675;</td>
                    <td style="font-family: 'Inter', sans-serif; font-size: 13px; color: ${BRAND_COLORS.textMuted};">
                      Trusted Contact Review &amp; Verification Protocol (On standby)
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  const html = wrapInEmailLayout({
    preheader: `URGENT: Missed Virasaat check-in. Grace period ends on ${data.gracePeriodEndDate}. Confirm safety now.`,
    title: subject,
    contentHtml:
      `<p><strong>Illustrative sample only. Scheduled reminders, invitations, verification, inheritance release, automatic delivery, and paid checkout are unavailable. This message performs no account action.</strong></p>` +
      contentHtml,
    securityNotice:
      'This urgent notice was triggered by a missed check-in interval according to your vault safety rules.',
  });

  const bodyText = `
URGENT: MISSED CHECK-IN NOTICE
------------------------------------------------------------
Hello ${data.recipientName},

We did not receive your confirmation for the scheduled check-in on ${data.missedDate}.

A ${data.gracePeriodDays}-day grace period is currently ACTIVE until ${data.gracePeriodEndDate}.

CURRENT STATUS:
- Your vault remains completely private and sealed.
- No files have been released.
- If you do not check in before ${data.gracePeriodEndDate}, the contingency verification protocol with your trusted contacts will begin.

CONFIRM SAFETY NOW:
Click below to confirm you are safe and reset your schedule:
${checkInUrl}
`;

  const text = wrapInPlainTextLayout({
    title: 'Urgent: Missed Check-In Alert',
    bodyText:
      'Illustrative sample only. Scheduled reminders, invitations, verification, inheritance release, automatic delivery, and paid checkout are unavailable. This message performs no account action.\n\n' +
      bodyText,
  });

  return {
    templateType: EmailTemplateType.CHECK_IN_MISSED,
    subject: '[Illustrative sample — workflow unavailable] ' + subject,
    html,
    text,
  };
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
