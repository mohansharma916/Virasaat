import { getEmailAppLink } from '../email-links';
import {
  BRAND_COLORS,
  renderCtaButton,
  renderStatusBadge,
  wrapInEmailLayout,
  wrapInPlainTextLayout,
} from '../email-layout';
import {
  EmailTemplateType,
  ReleaseAuthorizedEmailData,
  RenderedEmail,
} from '../email-template.types';

export function renderReleaseAuthorizedTemplate(
  data: ReleaseAuthorizedEmailData,
): RenderedEmail {
  const accessUrl = data.accessUrl || getEmailAppLink('home');
  const expiryDays = data.accessExpiryDays || 30;
  const itemsText =
    data.itemCountSummary ||
    'Designated documents, personal messages, and vital asset records';
  const subject = `A Legacy Message & Package has been released to you from ${data.ownerName}`;

  const contentHtml = `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="left">
          ${renderStatusBadge({ label: 'Legacy Release Authorized', variant: 'success' })}
          <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 25px; font-weight: 700; color: ${BRAND_COLORS.deepForest}; line-height: 33px; margin-bottom: 12px;">
            A personal legacy from ${escapeHtml(data.ownerName)}
          </h1>
          <p style="font-family: 'Inter', sans-serif; font-size: 15px; color: ${BRAND_COLORS.textSecondary}; line-height: 24px; margin-bottom: 22px;">
            Dear ${escapeHtml(data.recipientName)},<br />
            In accordance with the verified instructions and wishes established by <strong>${escapeHtml(data.ownerName)}</strong>, their designated legacy package created for you on Virasaat has been authorized for secure access.
          </p>
        </td>
      </tr>

      <!-- Legacy Package Details Card -->
      <tr>
        <td>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${BRAND_COLORS.warmIvory}; border: 1.5px solid ${BRAND_COLORS.border}; border-radius: 12px; margin-bottom: 24px;">
            <tr>
              <td style="padding: 22px 20px;">
                <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 17px; font-weight: 700; color: ${BRAND_COLORS.deepForest}; margin-bottom: 14px;">
                  Legacy Package Summary
                </div>

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 12px;">
                  <tr>
                    <td width="30%" valign="top" style="font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600; color: ${BRAND_COLORS.textMuted};">
                      FROM:
                    </td>
                    <td width="70%" style="font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; color: ${BRAND_COLORS.textPrimary};">
                      ${escapeHtml(data.ownerName)}
                    </td>
                  </tr>
                </table>

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 12px;">
                  <tr>
                    <td width="30%" valign="top" style="font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600; color: ${BRAND_COLORS.textMuted};">
                      CONTENTS:
                    </td>
                    <td width="70%" style="font-family: 'Inter', sans-serif; font-size: 13px; color: ${BRAND_COLORS.textPrimary}; line-height: 18px;">
                      ${escapeHtml(itemsText)}
                    </td>
                  </tr>
                </table>

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td width="30%" valign="top" style="font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600; color: ${BRAND_COLORS.textMuted};">
                      VALIDITY:
                    </td>
                    <td width="70%" style="font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; color: ${BRAND_COLORS.primaryForest};">
                      Available securely for ${expiryDays} days
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- How to Access Steps -->
      <tr>
        <td>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAFBFB; border-radius: 8px; border: 1px solid ${BRAND_COLORS.borderLight}; margin-bottom: 24px;">
            <tr>
              <td style="padding: 16px 20px;">
                <div style="font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; color: ${BRAND_COLORS.deepForest}; margin-bottom: 8px;">
                  How to Access Your Materials
                </div>
                <div style="font-family: 'Inter', sans-serif; font-size: 12px; color: ${BRAND_COLORS.textSecondary}; line-height: 18px;">
                  1. The button opens the current Virasaat app.<br />
                  2. Recipient identity verification and package delivery are not available yet.<br />
                  3. This sample does not authorize access to any vault items.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- CTA Button -->
      <tr>
        <td align="center">
          ${renderCtaButton({ url: accessUrl, label: 'Open Virasaat App' })}
        </td>
      </tr>

      <!-- Dignified closing -->
      <tr>
        <td style="padding-top: 10px;">
          <p style="font-family: 'Inter', sans-serif; font-size: 12px; color: ${BRAND_COLORS.textMuted}; line-height: 18px; text-align: center;">
            This package was prepared with love, intention, and forethought. If you need any assistance opening or saving these files, our concierge team is here for you.
          </p>
        </td>
      </tr>
    </table>
  `;

  const html = wrapInEmailLayout({
    preheader: `A personal legacy package prepared by ${data.ownerName} has been authorized and is ready for you.`,
    title: subject,
    contentHtml:
      `<p><strong>Illustrative sample only. Scheduled reminders, invitations, verification, inheritance release, automatic delivery, and paid checkout are unavailable. This message performs no account action.</strong></p>` +
      contentHtml,
    securityNotice:
      'This message communicates the release of confidential legacy assets authorized under owner instructions.',
  });

  const bodyText = `
Dear ${data.recipientName},

A personal legacy package created by ${data.ownerName} on Virasaat has been authorized for you.

PACKAGE DETAILS:
- From: ${data.ownerName}
- Contents: ${itemsText}
- Access Window: ${expiryDays} days

HOW TO ACCESS:
Click the link below to enter the secure viewer and verify your identity:
${accessUrl}

This legacy package was created with deep intention and care. Please save any necessary documents to your local device.
`;

  const text = wrapInPlainTextLayout({
    title: 'Legacy Package Release',
    bodyText:
      'Illustrative sample only. Scheduled reminders, invitations, verification, inheritance release, automatic delivery, and paid checkout are unavailable. This message performs no account action.\n\n' +
      bodyText,
  });

  return {
    templateType: EmailTemplateType.RELEASE_AUTHORIZED,
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
