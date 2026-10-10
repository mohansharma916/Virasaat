import { EmailLayoutOptions } from './email-template.types';
import { getEmailAppLink } from './email-links';

export const BRAND_COLORS = {
  primaryForest: '#0B5D4B',
  deepForest: '#063F34',
  forestDark: '#0A463A',
  sage: '#DCEBE5',
  mint: '#EAF4F0',
  warmIvory: '#F8F5EA',
  white: '#FFFFFF',
  textPrimary: '#14231F',
  textSecondary: '#52615D',
  textMuted: '#7A8783',
  border: '#D7E1DD',
  borderLight: '#E8EFEA',
  goldAccent: '#C59B27',
  goldSoft: '#FCF7E9',
  success: '#2E9E5B',
  successSoft: '#EBF8F0',
  warning: '#D97706',
  warningSoft: '#FEF8EB',
  error: '#DC2626',
  errorSoft: '#FEECEC',
  info: '#2563EB',
  infoSoft: '#EFF6FF',
};

/**
 * Universal responsive HTML email layout wrapper for Virasat emails.
 * Bulletproof across Gmail, Outlook, Apple Mail, Yahoo, iOS and Android clients.
 */
export function wrapInEmailLayout(options: EmailLayoutOptions): string {
  const {
    preheader = 'Virasat — Digital Legacy & Inheritance Vault',
    title,
    contentHtml,
    recipientEmail,
    unsubscribeUrl,
    securityNotice = 'This is an automated communication regarding your Virasat digital vault and security settings.',
  } = options;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');

    /* Reset Styles */
    body, p, h1, h2, h3, h4, h5, h6 {
      margin: 0;
      padding: 0;
    }
    body {
      width: 100% !important;
      height: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      background-color: ${BRAND_COLORS.warmIvory};
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      color: ${BRAND_COLORS.textPrimary};
      line-height: 1.6;
    }
    table, td {
      border-collapse: collapse !important;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    a {
      color: ${BRAND_COLORS.primaryForest};
      text-decoration: none;
    }

    /* Responsive Rules */
    @media screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        margin: 0 auto !important;
      }
      .content-cell {
        padding: 24px 20px !important;
      }
      .header-cell {
        padding: 24px 20px 20px !important;
      }
      .footer-cell {
        padding: 24px 16px !important;
      }
      .mobile-stack {
        display: block !important;
        width: 100% !important;
      }
      .mobile-center {
        text-align: center !important;
      }
      .otp-digit {
        width: 36px !important;
        height: 44px !important;
        font-size: 22px !important;
        margin: 0 2px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F5EA; -webkit-font-smoothing: antialiased;">
  <!-- Preheader preview text (hidden from layout) -->
  <div style="display: none; font-size: 1px; color: #F8F5EA; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${escapeHtml(preheader)} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <!-- Outer wrapper -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8F5EA; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 32px 16px 40px 16px;">
        
        <!-- Main Card Container (max-width: 600px) -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid ${BRAND_COLORS.border}; box-shadow: 0 4px 20px rgba(11, 93, 75, 0.05); overflow: hidden;">
          
          <!-- Top Accent Bar: Forest to Gold Gradient -->
          <tr>
            <td height="5" style="background: linear-gradient(90deg, #063F34 0%, #0B5D4B 40%, #C59B27 75%, #063F34 100%); line-height: 5px; font-size: 5px;">&nbsp;</td>
          </tr>

          <!-- Header / Brand Logo -->
          <tr>
            <td align="center" class="header-cell" style="padding: 36px 36px 24px 36px; border-bottom: 1px solid ${BRAND_COLORS.borderLight}; background-color: #FFFFFF;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td align="center">
                    <!-- Brand Monogram Crest -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                      <tr>
                        <td align="center" width="46" height="46" style="background-color: ${BRAND_COLORS.primaryForest}; border-radius: 12px; text-align: center; vertical-align: middle; box-shadow: 0 2px 8px rgba(11, 93, 75, 0.25);">
                          <span style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 700; color: #FFFFFF; line-height: 46px; display: block;">V</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 10px;">
                    <span style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; letter-spacing: 3px; color: ${BRAND_COLORS.deepForest}; text-transform: uppercase; display: block;">VIRASAT</span>
                    <span style="font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 1.5px; color: ${BRAND_COLORS.textMuted}; text-transform: uppercase; display: block; margin-top: 2px;">DIGITAL LEGACY &amp; INHERITANCE VAULT</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td class="content-cell" style="padding: 36px 36px; background-color: #FFFFFF;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Security Assurance Card in Footer Area -->
          <tr>
            <td style="padding: 0 36px 28px 36px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${BRAND_COLORS.mint}; border-radius: 12px; border: 1px solid ${BRAND_COLORS.sage};">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="28" valign="top" style="padding-top: 2px;">
                          <!-- Security Lock Symbol -->
                          <div style="width: 22px; height: 22px; line-height: 22px; background-color: ${BRAND_COLORS.primaryForest}; border-radius: 50%; color: #FFFFFF; font-size: 11px; text-align: center; font-weight: bold;">&#128274;</div>
                        </td>
                        <td style="padding-left: 12px;">
                          <div style="font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600; color: ${BRAND_COLORS.deepForest};">
                            Server-Managed Encryption
                          </div>
                          <div style="font-family: 'Inter', sans-serif; font-size: 11px; color: ${BRAND_COLORS.textSecondary}; line-height: 15px; margin-top: 2px;">
                            Descriptions and uploaded files are encrypted on the server using AES-256-GCM. Authorized server processes can decrypt content. Titles and categories are stored as metadata.
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td class="footer-cell" align="center" style="padding: 24px 36px 32px 36px; background-color: #FAFBFB; border-top: 1px solid ${BRAND_COLORS.borderLight};">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="font-family: 'Inter', sans-serif; font-size: 12px; color: ${BRAND_COLORS.textMuted}; line-height: 18px;">
                    ${escapeHtml(securityNotice)}
                  </td>
                </tr>

                ${
                  recipientEmail
                    ? `
                <tr>
                  <td align="center" style="padding-top: 8px; font-family: 'Inter', sans-serif; font-size: 11px; color: ${BRAND_COLORS.textMuted};">
                    Sent securely to <span style="color: ${BRAND_COLORS.textPrimary}; font-weight: 500;">${escapeHtml(recipientEmail)}</span>
                  </td>
                </tr>`
                    : ''
                }

                <!-- Footer Navigation Links -->
                <tr>
                  <td align="center" style="padding-top: 16px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                      <tr>
                        <td style="padding: 0 10px;">
                          <a href="${escapeHtml(getEmailAppLink('security'))}" target="_blank" style="font-family: 'Inter', sans-serif; font-size: 12px; color: ${BRAND_COLORS.primaryForest}; font-weight: 500; text-decoration: none;">Security Settings</a>
                        </td>
                        <td style="color: ${BRAND_COLORS.border}; font-size: 12px;">&bull;</td>
                        <td style="padding: 0 10px;">
                          <a href="https://virasat.app/privacy" target="_blank" style="font-family: 'Inter', sans-serif; font-size: 12px; color: ${BRAND_COLORS.primaryForest}; font-weight: 500; text-decoration: none;">Privacy Policy</a>
                        </td>
                        <td style="color: ${BRAND_COLORS.border}; font-size: 12px;">&bull;</td>
                        <td style="padding: 0 10px;">
                          <a href="https://virasat.app/terms" target="_blank" style="font-family: 'Inter', sans-serif; font-size: 12px; color: ${BRAND_COLORS.primaryForest}; font-weight: 500; text-decoration: none;">Terms of Service</a>
                        </td>
                        ${
                          unsubscribeUrl
                            ? `<td style="color: ${BRAND_COLORS.border}; font-size: 12px;">&bull;</td>
                        <td style="padding: 0 10px;">
                          <a href="${escapeHtml(unsubscribeUrl)}" target="_blank" style="font-family: 'Inter', sans-serif; font-size: 12px; color: ${BRAND_COLORS.textMuted}; text-decoration: underline;">Preferences</a>
                        </td>`
                            : ''
                        }
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Copyright -->
                <tr>
                  <td align="center" style="padding-top: 16px; font-family: 'Inter', sans-serif; font-size: 11px; color: ${BRAND_COLORS.textMuted};">
                    &copy; ${new Date().getFullYear()} Virasat Technologies Inc. All rights reserved.<br />
                    Safeguarding digital legacies with sovereignty, dignity, and care.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- End Main Card Container -->

      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Universal plain text email wrapper
 */
export function wrapInPlainTextLayout(options: {
  title: string;
  bodyText: string;
  securityNotice?: string;
}): string {
  const divider =
    '============================================================';
  const subDivider =
    '------------------------------------------------------------';
  const year = new Date().getFullYear();

  return `
VIRASAT
Digital Legacy & Inheritance Vault
${divider}

${options.title.toUpperCase()}
${subDivider}

${options.bodyText}

${subDivider}
SECURITY REASSURANCE:
Descriptions and uploaded files are encrypted on the server using AES-256-GCM. Authorized server processes can decrypt content. Titles and categories are stored as metadata.

${options.securityNotice || 'This is an automated communication regarding your Virasat digital vault and security settings.'}

Security Settings: ${getEmailAppLink('security')}
Privacy Policy: https://virasat.app/privacy
Terms of Service: https://virasat.app/terms

(C) ${year} Virasat Technologies Inc. All rights reserved.
Safeguarding digital legacies with sovereignty, dignity, and care.
${divider}
`.trim();
}

/**
 * Reusable HTML helper for primary CTA button
 */
export function renderCtaButton(options: {
  url: string;
  label: string;
  variant?: 'primary' | 'warning' | 'gold' | 'danger';
}): string {
  const { url, label, variant = 'primary' } = options;

  let bgColor = BRAND_COLORS.primaryForest;
  const textColor = '#FFFFFF';
  let shadow = 'rgba(11, 93, 75, 0.25)';

  if (variant === 'warning' || variant === 'danger') {
    bgColor = '#DC2626';
    shadow = 'rgba(220, 38, 38, 0.25)';
  } else if (variant === 'gold') {
    bgColor = '#A17B1B';
    shadow = 'rgba(197, 155, 39, 0.25)';
  }

  return `
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 20px 0;">
    <tr>
      <td align="center">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="20%" stroke="f" fillcolor="${bgColor}">
          <w:anchorlock/>
          <center style="color:${textColor};font-family:'Inter',sans-serif;font-size:15px;font-weight:600;">${escapeHtml(label)}</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-- -->
        <a href="${url}" target="_blank" style="display: inline-block; background-color: ${bgColor}; color: ${textColor}; font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600; line-height: 48px; text-align: center; text-decoration: none; padding: 0 32px; border-radius: 10px; box-shadow: 0 4px 12px ${shadow}; -webkit-text-size-adjust: none;">
          ${escapeHtml(label)} &rarr;
        </a>
        <!--<![endif]-->
      </td>
    </tr>
  </table>`;
}

/**
 * Reusable HTML badge helper
 */
export function renderStatusBadge(options: {
  label: string;
  variant?: 'success' | 'warning' | 'info' | 'error' | 'neutral';
}): string {
  const { label, variant = 'info' } = options;

  let bg = BRAND_COLORS.mint;
  let text = BRAND_COLORS.primaryForest;
  let border = BRAND_COLORS.sage;

  if (variant === 'warning') {
    bg = BRAND_COLORS.warningSoft;
    text = BRAND_COLORS.warning;
    border = '#FDE68A';
  } else if (variant === 'error') {
    bg = BRAND_COLORS.errorSoft;
    text = BRAND_COLORS.error;
    border = '#FECACA';
  } else if (variant === 'success') {
    bg = BRAND_COLORS.successSoft;
    text = BRAND_COLORS.success;
    border = '#BCE7CD';
  } else if (variant === 'neutral') {
    bg = '#F1F4F3';
    text = BRAND_COLORS.textSecondary;
    border = BRAND_COLORS.border;
  }

  return `
  <div style="display: inline-block; background-color: ${bg}; border: 1px solid ${border}; border-radius: 20px; padding: 4px 12px; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600; color: ${text}; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px;">
    ${escapeHtml(label)}
  </div>`;
}

export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
