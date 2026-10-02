import {
  BRAND_COLORS,
  renderCtaButton,
  renderStatusBadge,
  wrapInEmailLayout,
  wrapInPlainTextLayout,
} from '../email-layout';
import {
  EmailTemplateType,
  PasswordResetEmailData,
  RenderedEmail,
} from '../email-template.types';

export function renderPasswordResetTemplate(
  data: PasswordResetEmailData,
): RenderedEmail {
  const expiryMinutes = data.expiryMinutes || 15;
  const resetUrl = data.resetUrl || 'https://virasaat.com/auth/reset-password';
  const subject = `Reset your Virasaat account password`;

  const contentHtml = `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="left">
          ${renderStatusBadge({ label: 'Security • Password Reset', variant: 'warning' })}
          <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 700; color: ${BRAND_COLORS.deepForest}; line-height: 32px; margin-bottom: 12px;">
            Reset your account password
          </h1>
          <p style="font-family: 'Inter', sans-serif; font-size: 15px; color: ${BRAND_COLORS.textSecondary}; line-height: 24px; margin-bottom: 24px;">
            Hello ${escapeHtml(data.recipientName || 'there')},<br />
            We received a request to reset the master password associated with your Virasaat digital vault account.
          </p>
        </td>
      </tr>

      ${
        data.resetCode
          ? `
      <!-- Reset OTP Code Display -->
      <tr>
        <td align="center" style="padding: 10px 0 24px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="background-color: ${BRAND_COLORS.warmIvory}; border: 1.5px solid ${BRAND_COLORS.border}; border-radius: 12px; padding: 18px 28px;">
            <tr>
              <td align="center">
                <div style="font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: ${BRAND_COLORS.textMuted}; margin-bottom: 8px;">
                  PASSWORD RESET CODE
                </div>
                <div style="font-family: 'Inter', monospace; font-size: 30px; font-weight: 700; letter-spacing: 6px; color: ${BRAND_COLORS.deepForest};">
                  ${escapeHtml(data.resetCode)}
                </div>
                <div style="font-family: 'Inter', sans-serif; font-size: 12px; color: ${BRAND_COLORS.textSecondary}; margin-top: 10px;">
                  &#9201; Valid for <strong>${expiryMinutes} minutes</strong>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      `
          : ''
      }

      <!-- Reset Password Button -->
      <tr>
        <td align="center">
          ${renderCtaButton({ url: resetUrl, label: 'Reset My Password' })}
        </td>
      </tr>

      <!-- Request Metadata & Security Note -->
      <tr>
        <td style="padding-top: 12px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAFBFB; border-radius: 8px; border: 1px solid ${BRAND_COLORS.borderLight}; margin-bottom: 20px;">
            <tr>
              <td style="padding: 14px 16px;">
                <div style="font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600; color: ${BRAND_COLORS.textMuted}; text-transform: uppercase; margin-bottom: 6px;">
                  REQUEST DETAILS
                </div>
                <div style="font-family: 'Inter', sans-serif; font-size: 12px; color: ${BRAND_COLORS.textSecondary}; line-height: 18px;">
                  Timestamp: ${escapeHtml(data.requestTime || 'Just now')}<br />
                  ${data.requestDevice ? `Device: ${escapeHtml(data.requestDevice)}<br />` : ''}
                  ${data.requestIp ? `IP Address: ${escapeHtml(data.requestIp)}` : ''}
                </div>
              </td>
            </tr>
          </table>

          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${BRAND_COLORS.errorSoft}; border-left: 3px solid ${BRAND_COLORS.error}; border-radius: 6px;">
            <tr>
              <td style="padding: 12px 14px;">
                <div style="font-family: 'Inter', sans-serif; font-size: 12px; color: ${BRAND_COLORS.error}; line-height: 18px;">
                  <strong>Didn't make this request?</strong> If you didn't ask to reset your password, please ignore this email or contact <a href="mailto:security@virasaat.com" style="color: ${BRAND_COLORS.error}; text-decoration: underline;">security@virasaat.com</a> immediately.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  const html = wrapInEmailLayout({
    preheader: `Password reset request for your Virasaat account. Valid for ${expiryMinutes} minutes.`,
    title: subject,
    contentHtml,
    securityNotice:
      'This password reset link was generated on behalf of your Virasaat account.',
  });

  const bodyText = `
Hello ${data.recipientName || 'there'},

We received a request to reset your Virasaat account password.

${data.resetCode ? `Your reset code is: ${data.resetCode}\n` : ''}
Reset your password using this link (valid for ${expiryMinutes} minutes):
${resetUrl}

REQUEST DETAILS:
- Time: ${data.requestTime || 'Just now'}
- Device: ${data.requestDevice || 'Unknown'}
- IP: ${data.requestIp || 'Not recorded'}

If you did not request this, please disregard this email or email security@virasaat.com.
`;

  const text = wrapInPlainTextLayout({
    title: 'Password Reset Request',
    bodyText,
  });

  return {
    templateType: EmailTemplateType.PASSWORD_RESET,
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
