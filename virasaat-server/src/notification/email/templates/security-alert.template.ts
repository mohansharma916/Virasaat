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
  SecurityAlertEmailData,
} from '../email-template.types';

export function renderSecurityAlertTemplate(
  data: SecurityAlertEmailData,
): RenderedEmail {
  const lockVaultUrl =
    data.lockVaultUrl || 'https://virasaat.com/security/lock';
  const reviewActivityUrl =
    data.reviewActivityUrl || 'https://virasaat.com/security/audit';
  const subject = `Security Alert: ${data.alertTitle} on your Virasaat account`;

  const contentHtml = `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="left">
          ${renderStatusBadge({ label: 'Security Alert', variant: 'error' })}
          <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 700; color: ${BRAND_COLORS.deepForest}; line-height: 32px; margin-bottom: 12px;">
            ${escapeHtml(data.alertTitle)}
          </h1>
          <p style="font-family: 'Inter', sans-serif; font-size: 15px; color: ${BRAND_COLORS.textSecondary}; line-height: 24px; margin-bottom: 24px;">
            Hello ${escapeHtml(data.recipientName)},<br />
            Our security monitoring system detected new activity on your Virasaat account: <strong>${escapeHtml(data.alertDescription)}</strong>.
          </p>
        </td>
      </tr>

      <!-- Activity Details Card -->
      <tr>
        <td>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${BRAND_COLORS.warmIvory}; border: 1.5px solid ${BRAND_COLORS.border}; border-radius: 12px; margin-bottom: 24px;">
            <tr>
              <td style="padding: 20px;">
                <div style="font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${BRAND_COLORS.textMuted}; margin-bottom: 12px;">
                  INCIDENT DETAILS
                </div>

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-family: 'Inter', sans-serif; font-size: 13px;">
                  <tr>
                    <td width="35%" style="color: ${BRAND_COLORS.textMuted}; padding: 6px 0;">TIMESTAMP:</td>
                    <td width="65%" style="color: ${BRAND_COLORS.textPrimary}; font-weight: 600; padding: 6px 0;">${escapeHtml(data.eventTime)}</td>
                  </tr>
                  ${
                    data.deviceInfo
                      ? `
                  <tr>
                    <td style="color: ${BRAND_COLORS.textMuted}; padding: 6px 0;">DEVICE / BROWSER:</td>
                    <td style="color: ${BRAND_COLORS.textPrimary}; font-weight: 500; padding: 6px 0;">${escapeHtml(data.deviceInfo)}</td>
                  </tr>`
                      : ''
                  }
                  ${
                    data.ipAddress
                      ? `
                  <tr>
                    <td style="color: ${BRAND_COLORS.textMuted}; padding: 6px 0;">IP ADDRESS:</td>
                    <td style="color: ${BRAND_COLORS.textPrimary}; font-family: monospace; padding: 6px 0;">${escapeHtml(data.ipAddress)}</td>
                  </tr>`
                      : ''
                  }
                  ${
                    data.location
                      ? `
                  <tr>
                    <td style="color: ${BRAND_COLORS.textMuted}; padding: 6px 0;">LOCATION:</td>
                    <td style="color: ${BRAND_COLORS.textPrimary}; padding: 6px 0;">${escapeHtml(data.location)}</td>
                  </tr>`
                      : ''
                  }
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Action Buttons -->
      <tr>
        <td align="center">
          ${renderCtaButton({
            url: lockVaultUrl,
            label: 'Lock Vault & Terminate Sessions',
            variant: 'danger',
          })}
        </td>
      </tr>

      <tr>
        <td align="center" style="padding-top: 4px;">
          <p style="font-family: 'Inter', sans-serif; font-size: 13px; color: ${BRAND_COLORS.textSecondary};">
            If this was you, you can safely disregard this alert or <a href="${reviewActivityUrl}" style="color: ${BRAND_COLORS.primaryForest}; font-weight: 600; text-decoration: underline;">Review Audit Log</a>.
          </p>
        </td>
      </tr>
    </table>
  `;

  const html = wrapInEmailLayout({
    preheader: `Security alert: ${data.alertTitle} on your Virasaat account. Review immediate actions.`,
    title: subject,
    contentHtml,
    securityNotice:
      'This critical security notification was generated automatically by Virasaat sentinel guards.',
  });

  const bodyText = `
SECURITY ALERT: ${data.alertTitle.toUpperCase()}
------------------------------------------------------------
Hello ${data.recipientName},

We detected the following activity on your Virasaat account:
${data.alertDescription}

EVENT DETAILS:
- Time: ${data.eventTime}
- Device: ${data.deviceInfo || 'Unrecognized'}
- IP: ${data.ipAddress || 'Unavailable'}
- Location: ${data.location || 'Unknown'}

WAS THIS NOT YOU?
Immediately lock your vault and revoke all active sessions:
${lockVaultUrl}

If this was you, no action is needed. Review audit logs:
${reviewActivityUrl}
`;

  const text = wrapInPlainTextLayout({
    title: 'Security Alert Notice',
    bodyText,
  });

  return {
    templateType: EmailTemplateType.SECURITY_ALERT,
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
