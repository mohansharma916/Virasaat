import { getEmailAppLink } from '../email-links';
import {
  BRAND_COLORS,
  renderCtaButton,
  renderStatusBadge,
  wrapInEmailLayout,
  wrapInPlainTextLayout,
} from '../email-layout';
import {
  CheckInConfirmedEmailData,
  EmailTemplateType,
  RenderedEmail,
} from '../email-template.types';

export function renderCheckInConfirmedTemplate(
  data: CheckInConfirmedEmailData,
): RenderedEmail {
  const dashboardUrl = data.dashboardUrl || getEmailAppLink('home');
  const cadence = data.cadence || 'Monthly';
  const subject = `Check-in Confirmed — Your Virasat Vault is Secure`;

  const contentHtml = `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="left">
          ${renderStatusBadge({ label: 'Check-In Confirmed', variant: 'success' })}
          <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 700; color: ${BRAND_COLORS.deepForest}; line-height: 32px; margin-bottom: 12px;">
            Your vault is secure and active
          </h1>
          <p style="font-family: 'Inter', sans-serif; font-size: 15px; color: ${BRAND_COLORS.textSecondary}; line-height: 24px; margin-bottom: 24px;">
            Hello ${escapeHtml(data.recipientName)},<br />
            Thank you for checking in. We have successfully registered your confirmation. Your activity has been recorded. Scheduled reminders, escalation, and inheritance release are not available yet.
          </p>
        </td>
      </tr>

      <!-- Confirmation Details Card -->
      <tr>
        <td>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${BRAND_COLORS.warmIvory}; border: 1.5px solid ${BRAND_COLORS.border}; border-radius: 12px; margin-bottom: 24px;">
            <tr>
              <td style="padding: 20px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td width="50%" valign="top" style="padding-bottom: 12px;">
                      <div style="font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: ${BRAND_COLORS.textMuted};">
                        CONFIRMED AT
                      </div>
                      <div style="font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; color: ${BRAND_COLORS.textPrimary}; margin-top: 4px;">
                        ${escapeHtml(data.confirmedAt)}
                      </div>
                    </td>
                    <td width="50%" valign="top" style="padding-bottom: 12px;">
                      <div style="font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: ${BRAND_COLORS.textMuted};">
                        FREQUENCY
                      </div>
                      <div style="font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; color: ${BRAND_COLORS.textPrimary}; margin-top: 4px;">
                        ${escapeHtml(cadence)}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="border-top: 1px solid ${BRAND_COLORS.border}; padding-top: 12px;">
                      <div style="font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: ${BRAND_COLORS.textMuted};">
                        NEXT SCHEDULED CHECK-IN
                      </div>
                      <div style="font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 700; color: ${BRAND_COLORS.primaryForest}; margin-top: 4px;">
                        &#128197; ${escapeHtml(data.nextCheckInDate)}
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
          ${renderCtaButton({ url: dashboardUrl, label: 'View Vault Dashboard' })}
        </td>
      </tr>

      <!-- Note -->
      <tr>
        <td style="padding-top: 10px;">
          <p style="font-family: 'Inter', sans-serif; font-size: 13px; color: ${BRAND_COLORS.textMuted}; line-height: 20px; text-align: center;">
            To change check-in preferences, open the app and select Check-in Preferences. Scheduled reminder delivery is not available yet.
          </p>
        </td>
      </tr>
    </table>
  `;

  const html = wrapInEmailLayout({
    preheader: `Check-in confirmed on ${data.confirmedAt}. Your next check-in is scheduled for ${data.nextCheckInDate}.`,
    title: subject,
    contentHtml,
    securityNotice:
      'This confirmation receipt was issued following your successful check-in action.',
  });

  const bodyText = `
Hello ${data.recipientName},

Your check-in has been confirmed. Your Virasat vault remains secure and active.

CONFIRMATION DETAILS:
- Confirmed At: ${data.confirmedAt}
- Frequency: ${cadence}
- Next Scheduled Check-In: ${data.nextCheckInDate}

Your check-in activity has been recorded. Scheduled reminders, escalation, and inheritance release are not available yet.

View your vault: ${dashboardUrl}
`;

  const text = wrapInPlainTextLayout({
    title: 'Check-In Confirmed',
    bodyText,
  });

  return {
    templateType: EmailTemplateType.CHECK_IN_CONFIRMED,
    subject,
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
