import {
  BRAND_COLORS,
  renderStatusBadge,
  wrapInEmailLayout,
  wrapInPlainTextLayout,
} from '../email-layout';
import {
  EmailTemplateType,
  OtpVerificationEmailData,
  RenderedEmail,
} from '../email-template.types';

export function renderOtpVerificationTemplate(
  data: OtpVerificationEmailData,
): RenderedEmail {
  const expiryMinutes = data.expiryMinutes || 10;
  const digits = data.otpCode.split('');
  const formattedPurpose =
    data.purpose === 'PASSWORD_RESET'
      ? 'password reset'
      : data.purpose === 'LOGIN'
        ? 'sign in verification'
        : 'account registration';

  const subject = `${data.otpCode} is your Virasat verification code`;

  // HTML content
  const contentHtml = `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="left">
          ${renderStatusBadge({ label: 'Identity Verification', variant: 'info' })}
          <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 700; color: ${BRAND_COLORS.deepForest}; line-height: 32px; margin-bottom: 12px;">
            Verify your email address
          </h1>
          <p style="font-family: 'Inter', sans-serif; font-size: 15px; color: ${BRAND_COLORS.textSecondary}; line-height: 24px; margin-bottom: 24px;">
            Hello ${escapeHtml(data.recipientName || 'there')},<br />
            Please use the 6-digit one-time code below to complete your ${formattedPurpose} on <strong>Virasat</strong>.
          </p>
        </td>
      </tr>

      <!-- OTP Display Box -->
      <tr>
        <td align="center" style="padding: 16px 0 28px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="background-color: ${BRAND_COLORS.warmIvory}; border: 1.5px solid ${BRAND_COLORS.border}; border-radius: 12px; padding: 18px 28px;">
            <tr>
              <td align="center">
                <div style="font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: ${BRAND_COLORS.textMuted}; margin-bottom: 10px;">
                  ONE-TIME VERIFICATION CODE
                </div>
                <!-- Digit Boxes -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    ${digits
                      .map(
                        (d) => `
                      <td class="otp-digit" align="center" width="44" height="52" style="background-color: #FFFFFF; border: 1px solid ${BRAND_COLORS.primaryForest}; border-radius: 8px; font-family: 'Inter', monospace; font-size: 26px; font-weight: 700; color: ${BRAND_COLORS.deepForest}; margin: 0 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
                        ${d}
                      </td>
                      <td width="6">&nbsp;</td>
                    `,
                      )
                      .join('')}
                  </tr>
                </table>
                <div style="font-family: 'Inter', sans-serif; font-size: 12px; color: ${BRAND_COLORS.textSecondary}; margin-top: 14px;">
                  &#9201; Expires in <strong>${expiryMinutes} minutes</strong>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Security advice note -->
      <tr>
        <td>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAFBFB; border-radius: 8px; border-left: 3px solid ${BRAND_COLORS.primaryForest}; margin-bottom: 24px;">
            <tr>
              <td style="padding: 14px 16px;">
                <div style="font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; color: ${BRAND_COLORS.deepForest};">
                  Security Reminder
                </div>
                <div style="font-family: 'Inter', sans-serif; font-size: 12px; color: ${BRAND_COLORS.textSecondary}; line-height: 18px; margin-top: 4px;">
                  Never disclose this code to anyone. Virasat staff or support agents will never ask for your verification code.
                </div>
              </td>
            </tr>
          </table>

          <p style="font-family: 'Inter', sans-serif; font-size: 13px; color: ${BRAND_COLORS.textMuted}; line-height: 20px;">
            If you did not initiate this request, you can safely disregard this email. Your email address remains secure.
          </p>
        </td>
      </tr>
    </table>
  `;

  const html = wrapInEmailLayout({
    preheader: `Your Virasat verification code is ${data.otpCode}. It expires in ${expiryMinutes} minutes.`,
    title: subject,
    contentHtml,
    securityNotice:
      'This one-time verification code was requested from the Virasat application.',
  });

  const bodyText = `
Hello ${data.recipientName || 'there'},

Your 6-digit one-time verification code for Virasat is:

    ${data.otpCode}

This code is valid for ${expiryMinutes} minutes.

SECURITY REMINDER:
Never share this code with anyone. Virasat personnel will never ask for your verification code.
If you did not make this request, you can safely disregard this message.
`;

  const text = wrapInPlainTextLayout({
    title: 'Verify Your Email Address',
    bodyText,
  });

  return {
    templateType: EmailTemplateType.OTP_VERIFICATION,
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
