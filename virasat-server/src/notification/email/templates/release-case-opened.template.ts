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
  ReleaseCaseOpenedEmailData,
  RenderedEmail,
} from '../email-template.types';

export function renderReleaseCaseOpenedTemplate(
  data: ReleaseCaseOpenedEmailData,
): RenderedEmail {
  const verificationUrl = data.verificationUrl || getEmailAppLink('home');
  const subject = `Confidential: Verification Case #${data.caseId} opened for ${data.ownerName}`;

  const contentHtml = `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="left">
          ${renderStatusBadge({ label: 'Confidential Protocol Notice', variant: 'warning' })}
          <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 700; color: ${BRAND_COLORS.deepForest}; line-height: 32px; margin-bottom: 12px;">
            Verification review initiated for ${escapeHtml(data.ownerName)}
          </h1>
          <p style="font-family: 'Inter', sans-serif; font-size: 15px; color: ${BRAND_COLORS.textSecondary}; line-height: 24px; margin-bottom: 22px;">
            Dear ${escapeHtml(data.verifierName)},<br />
            In accordance with the contingency instructions established by <strong>${escapeHtml(data.ownerName)}</strong>, an official verification review has been opened on Virasaat due to: <em>${escapeHtml(data.triggerReason)}</em>.
          </p>
        </td>
      </tr>

      <!-- Case Reference Card -->
      <tr>
        <td>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${BRAND_COLORS.warmIvory}; border: 1.5px solid ${BRAND_COLORS.border}; border-radius: 12px; margin-bottom: 24px;">
            <tr>
              <td style="padding: 20px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td width="50%" valign="top" style="padding-bottom: 12px;">
                      <div style="font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: ${BRAND_COLORS.textMuted};">
                        CASE IDENTIFIER
                      </div>
                      <div style="font-family: 'Inter', monospace; font-size: 15px; font-weight: 700; color: ${BRAND_COLORS.deepForest}; margin-top: 4px;">
                        #${escapeHtml(data.caseId)}
                      </div>
                    </td>
                    <td width="50%" valign="top" style="padding-bottom: 12px;">
                      <div style="font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: ${BRAND_COLORS.textMuted};">
                        INITIATED DATE
                      </div>
                      <div style="font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; color: ${BRAND_COLORS.textPrimary}; margin-top: 4px;">
                        ${escapeHtml(data.openedAt)}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="border-top: 1px solid ${BRAND_COLORS.border}; padding-top: 12px;">
                      <div style="font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: ${BRAND_COLORS.textMuted};">
                        RESPONSE DEADLINE
                      </div>
                      <div style="font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700; color: ${BRAND_COLORS.warning}; margin-top: 4px;">
                        &#9201; ${escapeHtml(data.verificationDeadline)}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Instructions for Verifier -->
      <tr>
        <td>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAFBFB; border-radius: 8px; border-left: 3px solid ${BRAND_COLORS.warning}; margin-bottom: 24px;">
            <tr>
              <td style="padding: 16px;">
                <div style="font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700; color: ${BRAND_COLORS.deepForest}; margin-bottom: 4px;">
                  Your Role as Designated Verifier
                </div>
                <div style="font-family: 'Inter', sans-serif; font-size: 12px; color: ${BRAND_COLORS.textSecondary}; line-height: 18px;">
                  Please follow the portal link below to submit your verification status. All vault contents remain locked and encrypted. No assets or documents will be released until the full verification criteria are satisfied.
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
            url: verificationUrl,
            label: 'Open Virasaat App',
            variant: 'gold',
          })}
        </td>
      </tr>

      <!-- Security Audit Note -->
      <tr>
        <td style="padding-top: 10px;">
          <p style="font-family: 'Inter', sans-serif; font-size: 11px; color: ${BRAND_COLORS.textMuted}; line-height: 16px; text-align: center;">
            Recipient verification, an audit viewer, and two-factor release confirmation are not available yet.
          </p>
        </td>
      </tr>
    </table>
  `;

  const html = wrapInEmailLayout({
    preheader: `Confidential: Verification case #${data.caseId} opened for ${data.ownerName}. Input needed by ${data.verificationDeadline}.`,
    title: subject,
    contentHtml:
      `<p><strong>Illustrative sample only. Scheduled reminders, invitations, verification, inheritance release, automatic delivery, and paid checkout are unavailable. This message performs no account action.</strong></p>` +
      contentHtml,
    securityNotice:
      'This high-security legal verification notice was delivered under the owner’s pre-configured release rules.',
  });

  const bodyText = `
CONFIDENTIAL: VERIFICATION PROTOCOL OPENED
------------------------------------------------------------
Case ID: #${data.caseId}
Account Owner: ${data.ownerName}
Initiated Date: ${data.openedAt}
Deadline: ${data.verificationDeadline}

Dear ${data.verifierName},

A formal verification case has been opened for ${data.ownerName} due to:
${data.triggerReason}

As an appointed verifier, your verification status is required. Vault materials remain encrypted and protected until verification is complete.

ACCESS VERIFICATION PORTAL:
${verificationUrl}

Please complete your review before ${data.verificationDeadline}.
`;

  const text = wrapInPlainTextLayout({
    title: 'Verification Review Notice',
    bodyText:
      'Illustrative sample only. Scheduled reminders, invitations, verification, inheritance release, automatic delivery, and paid checkout are unavailable. This message performs no account action.\n\n' +
      bodyText,
  });

  return {
    templateType: EmailTemplateType.RELEASE_CASE_OPENED,
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
