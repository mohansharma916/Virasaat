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
  RenderedEmail,
  TrustedPersonInvitationEmailData,
} from '../email-template.types';

export function renderTrustedPersonInvitationTemplate(
  data: TrustedPersonInvitationEmailData,
): RenderedEmail {
  const invitationUrl = data.invitationUrl || getEmailAppLink('home');
  const subject = `${data.ownerName} has designated you as a Trusted Contact on Virasat`;

  const contentHtml = `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="left">
          ${renderStatusBadge({ label: 'Trusted Contact Designation', variant: 'info' })}
          <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 700; color: ${BRAND_COLORS.deepForest}; line-height: 32px; margin-bottom: 12px;">
            You have been entrusted by ${escapeHtml(data.ownerName)}
          </h1>
          <p style="font-family: 'Inter', sans-serif; font-size: 15px; color: ${BRAND_COLORS.textSecondary}; line-height: 24px; margin-bottom: 24px;">
            Hello ${escapeHtml(data.recipientName)},<br />
            <strong>${escapeHtml(data.ownerName)}</strong> has appointed you as a designated <strong>Trusted Contact</strong> on Virasat${data.relationship ? ` (specified role: <em>${escapeHtml(data.relationship)}</em>)` : ''}.
          </p>
        </td>
      </tr>

      <!-- What This Means FAQ Card -->
      <tr>
        <td>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${BRAND_COLORS.warmIvory}; border: 1.5px solid ${BRAND_COLORS.border}; border-radius: 12px; margin-bottom: 24px;">
            <tr>
              <td style="padding: 22px 20px;">
                <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 17px; font-weight: 700; color: ${BRAND_COLORS.deepForest}; margin-bottom: 16px;">
                  What does this mean for you?
                </div>

                <!-- Point 1 -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 14px;">
                  <tr>
                    <td width="30" valign="top">
                      <span style="font-size: 18px; color: ${BRAND_COLORS.primaryForest};">&#128101;</span>
                    </td>
                    <td style="padding-left: 8px;">
                      <div style="font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; color: ${BRAND_COLORS.textPrimary};">
                        A Gesture of Deep Trust
                      </div>
                      <div style="font-family: 'Inter', sans-serif; font-size: 12px; color: ${BRAND_COLORS.textSecondary}; line-height: 18px; margin-top: 2px;">
                        ${escapeHtml(data.ownerName)} relies on you to act as a guardian of their wishes and digital legacy if life ever takes an unexpected turn.
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Point 2 -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 14px;">
                  <tr>
                    <td width="30" valign="top">
                      <span style="font-size: 18px; color: ${BRAND_COLORS.primaryForest};">&#128274;</span>
                    </td>
                    <td style="padding-left: 8px;">
                      <div style="font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; color: ${BRAND_COLORS.textPrimary};">
                        Zero Immediate Access
                      </div>
                      <div style="font-family: 'Inter', sans-serif; font-size: 12px; color: ${BRAND_COLORS.textSecondary}; line-height: 18px; margin-top: 2px;">
                        You do not have access to any vault items, credentials, or private documents today. Descriptions and uploaded files use server-managed encryption. Authorized server processes can decrypt content.
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Point 3 -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td width="30" valign="top">
                      <span style="font-size: 18px; color: ${BRAND_COLORS.primaryForest};">&#9200;</span>
                    </td>
                    <td style="padding-left: 8px;">
                      <div style="font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; color: ${BRAND_COLORS.textPrimary};">
                        Only Contacted Upon Strict Escalation
                      </div>
                      <div style="font-family: 'Inter', sans-serif; font-size: 12px; color: ${BRAND_COLORS.textSecondary}; line-height: 18px; margin-top: 2px;">
                        You will only ever receive a notification if ${escapeHtml(data.ownerName)} misses multiple consecutive check-in cycles and their grace period elapses without word.
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
          ${renderCtaButton({ url: invitationUrl, label: 'Open Virasat App' })}
        </td>
      </tr>

      <!-- Note -->
      <tr>
        <td style="padding-top: 10px;">
          <p style="font-family: 'Inter', sans-serif; font-size: 12px; color: ${BRAND_COLORS.textMuted}; line-height: 18px; text-align: center;">
            No password or credit card is required. Verifying your contact information simply ensures that ${escapeHtml(data.ownerName)}'s contingency protocol can reach you if needed.
          </p>
        </td>
      </tr>
    </table>
  `;

  const html = wrapInEmailLayout({
    preheader: `${data.ownerName} has named you as their Trusted Contact on Virasat. Learn what this entails.`,
    title: subject,
    contentHtml:
      `<p><strong>Illustrative sample only. Scheduled reminders, invitations, verification, inheritance release, automatic delivery, and paid checkout are unavailable. This message performs no account action.</strong></p>` +
      contentHtml,
    securityNotice:
      'You were designated as a trusted contact by a verified Virasat account owner.',
  });

  const bodyText = `
Hello ${data.recipientName},

${data.ownerName} has appointed you as a designated Trusted Contact on Virasat${data.relationship ? ` (Relationship: ${data.relationship})` : ''}.

WHAT DOES THIS MEAN?
- ${data.ownerName} has chosen you to help ensure their vital documents, instructions, and legacy are honored.
- You do NOT have access to their vault or private items now. Descriptions and uploaded files use server-managed encryption; titles and categories are metadata.
- You would only be contacted if ${data.ownerName} becomes unreachable over extended check-in cycles.

ACKNOWLEDGE DESIGNATION:
Please review and verify your contact details:
${invitationUrl}

No account creation or credit card is required.
`;

  const text = wrapInPlainTextLayout({
    title: 'Trusted Contact Appointment',
    bodyText:
      'Illustrative sample only. Scheduled reminders, invitations, verification, inheritance release, automatic delivery, and paid checkout are unavailable. This message performs no account action.\n\n' +
      bodyText,
  });

  return {
    templateType: EmailTemplateType.TRUSTED_PERSON_INVITATION,
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
