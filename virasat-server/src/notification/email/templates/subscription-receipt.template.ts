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
  SubscriptionReceiptEmailData,
} from '../email-template.types';

export function renderSubscriptionReceiptTemplate(
  data: SubscriptionReceiptEmailData,
): RenderedEmail {
  const manageUrl = data.manageUrl || getEmailAppLink('home');
  const features = data.features || [
    'Unlimited encrypted legacy items & documents',
    'Up to 10 designated Trusted Contacts & Verifiers',
    'Custom weekly & monthly check-in cadence',
    'Video & audio personal legacy letter vault',
    'Dual-approval release policy with step-up verification',
    'Priority concierge & estate support',
  ];
  const subject = `Your Virasat ${data.planName} Subscription Confirmation`;

  const contentHtml = `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="left">
          ${renderStatusBadge({ label: 'Subscription Confirmed', variant: 'success' })}
          <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 700; color: ${BRAND_COLORS.deepForest}; line-height: 32px; margin-bottom: 12px;">
            Thank you for subscribing to ${escapeHtml(data.planName)}
          </h1>
          <p style="font-family: 'Inter', sans-serif; font-size: 15px; color: ${BRAND_COLORS.textSecondary}; line-height: 24px; margin-bottom: 22px;">
            Hello ${escapeHtml(data.recipientName)},<br />
            This illustrative receipt shows <strong>${escapeHtml(data.planName)}</strong>. Paid checkout is unavailable, and this sample does not activate a subscription.
          </p>
        </td>
      </tr>

      <!-- Invoice Details Card -->
      <tr>
        <td>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${BRAND_COLORS.warmIvory}; border: 1.5px solid ${BRAND_COLORS.border}; border-radius: 12px; margin-bottom: 24px;">
            <tr>
              <td style="padding: 20px;">
                <div style="font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${BRAND_COLORS.textMuted}; margin-bottom: 12px;">
                  PAYMENT RECEIPT
                </div>

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-family: 'Inter', sans-serif; font-size: 13px;">
                  <tr>
                    <td width="50%" style="color: ${BRAND_COLORS.textMuted}; padding: 6px 0;">PLAN:</td>
                    <td width="50%" align="right" style="color: ${BRAND_COLORS.textPrimary}; font-weight: 700; padding: 6px 0;">${escapeHtml(data.planName)}</td>
                  </tr>
                  <tr>
                    <td style="color: ${BRAND_COLORS.textMuted}; padding: 6px 0;">AMOUNT PAID:</td>
                    <td align="right" style="color: ${BRAND_COLORS.primaryForest}; font-weight: 700; font-size: 15px; padding: 6px 0;">${escapeHtml(data.amountPaid)}</td>
                  </tr>
                  <tr>
                    <td style="color: ${BRAND_COLORS.textMuted}; padding: 6px 0;">BILLING CYCLE:</td>
                    <td align="right" style="color: ${BRAND_COLORS.textPrimary}; padding: 6px 0;">${escapeHtml(data.billingInterval)}</td>
                  </tr>
                  <tr>
                    <td style="color: ${BRAND_COLORS.textMuted}; padding: 6px 0;">INVOICE NUMBER:</td>
                    <td align="right" style="color: ${BRAND_COLORS.textPrimary}; font-family: monospace; padding: 6px 0;">#${escapeHtml(data.invoiceNumber)}</td>
                  </tr>
                  ${
                    data.nextRenewalDate
                      ? `
                  <tr>
                    <td style="color: ${BRAND_COLORS.textMuted}; padding: 6px 0;">NEXT RENEWAL:</td>
                    <td align="right" style="color: ${BRAND_COLORS.textPrimary}; padding: 6px 0;">${escapeHtml(data.nextRenewalDate)}</td>
                  </tr>`
                      : ''
                  }
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Features Unlocked Checklist -->
      <tr>
        <td>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAFBFB; border-radius: 12px; border: 1px solid ${BRAND_COLORS.borderLight}; margin-bottom: 24px;">
            <tr>
              <td style="padding: 20px;">
                <div style="font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: ${BRAND_COLORS.textMuted}; margin-bottom: 12px;">
                  INCLUDED IN YOUR PLAN
                </div>

                ${features
                  .map(
                    (feature) => `
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 8px;">
                  <tr>
                    <td width="22" valign="top" style="color: ${BRAND_COLORS.primaryForest}; font-size: 14px;">&#10004;</td>
                    <td style="font-family: 'Inter', sans-serif; font-size: 13px; color: ${BRAND_COLORS.textPrimary};">
                      ${escapeHtml(feature)}
                    </td>
                  </tr>
                </table>`,
                  )
                  .join('')}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- CTA Button -->
      <tr>
        <td align="center">
          ${renderCtaButton({ url: manageUrl, label: 'Open Virasat App' })}
        </td>
      </tr>
    </table>
  `;

  const html = wrapInEmailLayout({
    preheader: `Thank you for subscribing to ${data.planName}. Your receipt #${data.invoiceNumber} is inside.`,
    title: subject,
    contentHtml:
      `<p><strong>Illustrative sample only. Scheduled reminders, invitations, verification, inheritance release, automatic delivery, and paid checkout are unavailable. This message performs no account action.</strong></p>` +
      contentHtml,
    securityNotice:
      'This payment confirmation receipt was issued for your Virasat subscription purchase.',
  });

  const bodyText = `
Hello ${data.recipientName},

Thank you for subscribing to ${data.planName}.

RECEIPT SUMMARY:
- Plan: ${data.planName}
- Amount: ${data.amountPaid} (${data.billingInterval})
- Invoice: #${data.invoiceNumber}
- Purchase Date: ${data.purchaseDate}
${data.nextRenewalDate ? `- Next Renewal: ${data.nextRenewalDate}\n` : ''}

FEATURES UNLOCKED:
${features.map((f) => `* ${f}`).join('\n')}

Manage your subscription and vault settings:
${manageUrl}
`;

  const text = wrapInPlainTextLayout({
    title: 'Subscription Confirmation',
    bodyText:
      'Illustrative sample only. Scheduled reminders, invitations, verification, inheritance release, automatic delivery, and paid checkout are unavailable. This message performs no account action.\n\n' +
      bodyText,
  });

  return {
    templateType: EmailTemplateType.SUBSCRIPTION_RECEIPT,
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
