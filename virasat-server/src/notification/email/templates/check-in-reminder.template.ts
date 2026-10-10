import { getEmailAppLink } from '../email-links';
import {
  BRAND_COLORS,
  renderCtaButton,
  renderStatusBadge,
  wrapInEmailLayout,
  wrapInPlainTextLayout,
} from '../email-layout';
import {
  CheckInReminderEmailData,
  EmailTemplateType,
  RenderedEmail,
} from '../email-template.types';

export function renderCheckInReminderTemplate(
  data: CheckInReminderEmailData,
): RenderedEmail {
  const checkInUrl = data.checkInUrl || getEmailAppLink('home');
  const cadence = data.cadence || 'Monthly';
  const daysText =
    data.daysRemaining === 0
      ? 'due today'
      : data.daysRemaining === 1
        ? 'due tomorrow'
        : `due in ${data.daysRemaining} days`;

  const subject =
    data.daysRemaining === 0
      ? `Action Required: Your routine Virasaat check-in is due today`
      : `Reminder: Your Virasaat check-in is ${daysText}`;

  const contentHtml = `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="left">
          ${renderStatusBadge({ label: `${cadence} Pulse Check`, variant: 'info' })}
          <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 700; color: ${BRAND_COLORS.deepForest}; line-height: 32px; margin-bottom: 12px;">
            Time for your routine check-in
          </h1>
          <p style="font-family: 'Inter', sans-serif; font-size: 15px; color: ${BRAND_COLORS.textSecondary}; line-height: 24px; margin-bottom: 24px;">
            Hello ${escapeHtml(data.recipientName)},<br />
            This is your friendly, scheduled check-in for your Virasaat account. Simply confirm you are safe to ensure that all vault items, documents, and release policies remain undisturbed and sealed.
          </p>
        </td>
      </tr>

      <!-- Check-in Schedule Card -->
      <tr>
        <td>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${BRAND_COLORS.warmIvory}; border: 1.5px solid ${BRAND_COLORS.border}; border-radius: 12px; margin-bottom: 24px;">
            <tr>
              <td style="padding: 20px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td width="50%" valign="top" style="padding-bottom: 12px;">
                      <div style="font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: ${BRAND_COLORS.textMuted};">
                        CHECK-IN STATUS
                      </div>
                      <div style="font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 700; color: ${BRAND_COLORS.primaryForest}; margin-top: 4px;">
                        &#9679; Pending (${daysText})
                      </div>
                    </td>
                    <td width="50%" valign="top" style="padding-bottom: 12px;">
                      <div style="font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: ${BRAND_COLORS.textMuted};">
                        CADENCE
                      </div>
                      <div style="font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600; color: ${BRAND_COLORS.textPrimary}; margin-top: 4px;">
                        ${escapeHtml(cadence)}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="border-top: 1px solid ${BRAND_COLORS.border}; padding-top: 12px;">
                      <div style="font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: ${BRAND_COLORS.textMuted};">
                        DUE DATE &amp; TIME
                      </div>
                      <div style="font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; color: ${BRAND_COLORS.textPrimary}; margin-top: 4px;">
                        ${escapeHtml(data.dueDate)}${data.preferredTime ? ` at ${escapeHtml(data.preferredTime)}` : ''}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- CTA Button -->
      <tr>
        <td align="center">
          ${renderCtaButton({ url: checkInUrl, label: 'Open Virasaat App' })}
        </td>
      </tr>

      <!-- Quick Explanation -->
      <tr>
        <td style="padding-top: 8px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${BRAND_COLORS.mint}; border-radius: 8px; border: 1px solid ${BRAND_COLORS.sage};">
            <tr>
              <td style="padding: 14px 18px;">
                <div style="font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; color: ${BRAND_COLORS.deepForest};">
                  Why do we send check-ins?
                </div>
                <div style="font-family: 'Inter', sans-serif; font-size: 12px; color: ${BRAND_COLORS.textSecondary}; line-height: 18px; margin-top: 4px;">
                  Confirm activity inside the app. Scheduled reminders, escalation, and inheritance release are not available yet.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  const html = wrapInEmailLayout({
    preheader: `Friendly reminder: Your Virasaat check-in is ${daysText}. Confirm with one click.`,
    title: subject,
    contentHtml:
      `<p><strong>Illustrative sample only. Scheduled reminders, invitations, verification, inheritance release, automatic delivery, and paid checkout are unavailable. This message performs no account action.</strong></p>` +
      contentHtml,
    securityNotice:
      'This routine notification was generated based on your check-in schedule preferences.',
  });

  const bodyText = `
Hello ${data.recipientName},

This is your routine scheduled check-in for your Virasaat account (${cadence}).

CHECK-IN DETAILS:
- Status: Pending (${daysText})
- Cadence: ${cadence}
- Due Date: ${data.dueDate} ${data.preferredTime ? 'at ' + data.preferredTime : ''}

CONFIRM YOUR CHECK-IN:
Click the link below to confirm you are safe and reset your check-in timer:
${checkInUrl}

WHY WE SEND THIS:
Confirm activity inside the app. No vault items are released by a missed check-in.
`;

  const text = wrapInPlainTextLayout({
    title: 'Routine Check-In Reminder',
    bodyText:
      'Illustrative sample only. Scheduled reminders, invitations, verification, inheritance release, automatic delivery, and paid checkout are unavailable. This message performs no account action.\n\n' +
      bodyText,
  });

  return {
    templateType: EmailTemplateType.CHECK_IN_REMINDER,
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
