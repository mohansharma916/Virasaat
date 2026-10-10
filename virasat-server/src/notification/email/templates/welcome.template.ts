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
  WelcomeEmailData,
} from '../email-template.types';

export function renderWelcomeTemplate(data: WelcomeEmailData): RenderedEmail {
  const dashboardUrl = data.dashboardUrl || getEmailAppLink('home');
  const subject = `Welcome to Virasaat — Safeguarding your digital legacy`;

  const contentHtml = `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="left">
          ${renderStatusBadge({ label: 'Vault Established', variant: 'success' })}
          <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 700; color: ${BRAND_COLORS.deepForest}; line-height: 34px; margin-bottom: 12px;">
            Welcome to Virasaat, ${escapeHtml(data.recipientName)}
          </h1>
          <p style="font-family: 'Inter', sans-serif; font-size: 15px; color: ${BRAND_COLORS.textSecondary}; line-height: 24px; margin-bottom: 24px;">
            Your account is verified and your secure digital vault has been initialized. You have taken a profound step toward ensuring your life's work, financial legacy, and heartfelt memories remain protected and seamlessly passed to those who matter most.
          </p>
        </td>
      </tr>

      <!-- 3 Key Steps Card -->
      <tr>
        <td>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${BRAND_COLORS.warmIvory}; border: 1px solid ${BRAND_COLORS.border}; border-radius: 12px; margin-bottom: 24px;">
            <tr>
              <td style="padding: 24px 20px;">
                <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 18px; font-weight: 700; color: ${BRAND_COLORS.deepForest}; margin-bottom: 16px;">
                  Three Steps to Complete Your Vault Setup
                </div>

                <!-- Step 1 -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
                  <tr>
                    <td width="36" valign="top">
                      <div style="width: 28px; height: 28px; border-radius: 50%; background-color: ${BRAND_COLORS.primaryForest}; color: #FFFFFF; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700; text-align: center; line-height: 28px;">
                        1
                      </div>
                    </td>
                    <td style="padding-left: 10px;">
                      <div style="font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; color: ${BRAND_COLORS.textPrimary};">
                        Preserve Important Assets &amp; Documents
                      </div>
                      <div style="font-family: 'Inter', sans-serif; font-size: 13px; color: ${BRAND_COLORS.textSecondary}; line-height: 19px; margin-top: 2px;">
                        Store wills, insurance policies, property deeds, financial account references, and personal letters or video messages.
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Step 2 -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
                  <tr>
                    <td width="36" valign="top">
                      <div style="width: 28px; height: 28px; border-radius: 50%; background-color: ${BRAND_COLORS.primaryForest}; color: #FFFFFF; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700; text-align: center; line-height: 28px;">
                        2
                      </div>
                    </td>
                    <td style="padding-left: 10px;">
                      <div style="font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; color: ${BRAND_COLORS.textPrimary};">
                        Appoint Your Trusted Contacts
                      </div>
                      <div style="font-family: 'Inter', sans-serif; font-size: 13px; color: ${BRAND_COLORS.textSecondary}; line-height: 19px; margin-top: 2px;">
                        Save trusted person details privately. Invitations, verification, and inheritance release are not available yet.
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Step 3 -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td width="36" valign="top">
                      <div style="width: 28px; height: 28px; border-radius: 50%; background-color: ${BRAND_COLORS.primaryForest}; color: #FFFFFF; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700; text-align: center; line-height: 28px;">
                        3
                      </div>
                    </td>
                    <td style="padding-left: 10px;">
                      <div style="font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; color: ${BRAND_COLORS.textPrimary};">
                        Configure Your Routine Check-in
                      </div>
                      <div style="font-family: 'Inter', sans-serif; font-size: 13px; color: ${BRAND_COLORS.textSecondary}; line-height: 19px; margin-top: 2px;">
                        Save your check-in preferences and confirm activity in the app. Scheduled reminders and escalation are not available yet.
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
          ${renderCtaButton({ url: dashboardUrl, label: 'Open My Vault & Complete Setup' })}
        </td>
      </tr>

      <!-- Help info -->
      <tr>
        <td style="padding-top: 12px;">
          <p style="font-family: 'Inter', sans-serif; font-size: 13px; color: ${BRAND_COLORS.textMuted}; line-height: 20px; text-align: center;">
            Open the app to review your saved records and account settings.
          </p>
        </td>
      </tr>
    </table>
  `;

  const html = wrapInEmailLayout({
    preheader: `Welcome to Virasaat, ${data.recipientName}. Your digital vault is ready for setup.`,
    title: subject,
    contentHtml,
    recipientEmail: data.userEmail,
  });

  const bodyText = `
Welcome to Virasaat, ${data.recipientName}!

Your account is verified and your secure digital vault has been initialized.

THREE STEPS TO COMPLETE YOUR SETUP:
1. Preserve Important Assets & Documents
   Store wills, deeds, financial folios, insurance policies, and video messages.

2. Appoint Your Trusted Contacts
   Save trusted person details privately. Invitations, verification, and inheritance release are not available yet.

3. Configure Your Routine Check-in
   Save check-in preferences and confirm activity in the app. Scheduled reminders and escalation are not available yet.

GET STARTED:
Open your vault: ${dashboardUrl}

Open the app to review your records and account settings.
`;

  const text = wrapInPlainTextLayout({
    title: 'Welcome to Virasaat',
    bodyText,
  });

  return {
    templateType: EmailTemplateType.WELCOME,
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
