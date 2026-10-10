#!/usr/bin/env node

/**
 * Virasaat - CLI Email Delivery & SMTP Test Utility
 *
 * Usage:
 *   node scripts/test-email.cjs [recipient-email]
 *
 * Example:
 *   node scripts/test-email.cjs recipient@gmail.com
 *   npm run email:test -- recipient@gmail.com
 */

const path = require('path');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

// Load environment variables from virasaat-server/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const service = process.env.SMTP_SERVICE || process.env.MAIL_SERVICE;
const host =
  process.env.SMTP_HOST ||
  process.env.MAIL_HOST ||
  (service ? undefined : 'smtp.gmail.com');
const port = Number(
  process.env.SMTP_PORT || process.env.MAIL_PORT || (service ? 465 : 587),
);
const secure =
  process.env.SMTP_SECURE === 'true' ||
  process.env.MAIL_SECURE === 'true' ||
  port === 465;
const user =
  process.env.SMTP_USER ||
  process.env.MAIL_USER ||
  process.env.EMAIL_USER;
const pass =
  process.env.SMTP_PASS ||
  process.env.MAIL_PASS ||
  process.env.EMAIL_PASS;
const from =
  process.env.SMTP_FROM ||
  process.env.MAIL_FROM ||
  (user ? `"Virasaat Demo" <${user}>` : '"Virasaat Demo" <demo@virasaat.app>');

const recipient = process.argv[2] || user;

console.log('='.repeat(60));
console.log('📧 Virasaat Email & Nodemailer Diagnostic Tool');
console.log('='.repeat(60));

console.log('\n[Configuration Detected]');
console.log(`  SMTP Service : ${service || '(custom host)'}`);
console.log(`  SMTP Host    : ${host || service}`);
console.log(`  SMTP Port    : ${port} (Secure: ${secure})`);
console.log(`  SMTP User    : ${user ? `${user.substring(0, 3)}***@${user.split('@')[1] || ''}` : '❌ NOT CONFIGURED'}`);
console.log(`  SMTP Pass    : ${pass ? '••••••••' : '❌ NOT CONFIGURED'}`);
console.log(`  From Header  : ${from}`);
console.log(`  Target Email : ${recipient || '❌ NO RECIPIENT SPECIFIED'}`);

if (!user || !pass) {
  console.log('\n❌ [ERROR] Missing SMTP credentials!');
  console.log('Please add the following to your .env file:');
  console.log('\n  SMTP_SERVICE=gmail');
  console.log('  SMTP_USER=your-email@gmail.com');
  console.log('  SMTP_PASS=your-16-char-google-app-password');
  console.log('\nTip for Gmail users:');
  console.log('1. Go to your Google Account -> Security -> 2-Step Verification');
  console.log('2. Search for "App passwords" (https://myaccount.google.com/apppasswords)');
  console.log('3. Generate an app password for "Virasaat Demo" and paste the 16 characters in SMTP_PASS.\n');
  process.exit(1);
}

if (!recipient) {
  console.log('\n❌ [ERROR] Please provide a destination email address:');
  console.log('  npm run email:test -- your-email@example.com\n');
  process.exit(1);
}

async function main() {
  console.log('\n⏳ Connecting to SMTP server...');

  const transportConfig = service
    ? { service, auth: { user, pass } }
    : { host, port, secure, auth: { user, pass } };

  const transporter = nodemailer.createTransport(transportConfig);

  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
  } catch (err) {
    console.log(`\n❌ [SMTP Connection Error]: ${err.message}`);
    if (err.message.includes('Username and Password not accepted') || err.message.includes('535')) {
      console.log('\n💡 For Gmail: You must generate a Google App Password (16 characters) instead of using your real password.');
      console.log('   Visit: https://myaccount.google.com/apppasswords');
    }
    process.exit(1);
  }

  console.log(`\n⏳ Sending demo email to ${recipient}...`);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FAF8F5; padding: 40px 20px;">
        <div style="max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 14px; border: 1px solid #E8E2D9; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="display: inline-block; padding: 6px 12px; background: #EBF5EE; border-radius: 20px; color: #2D6A4F; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px;">
            Demo Verification
          </div>
          <h1 style="color: #1A362B; font-size: 24px; margin-top: 0; margin-bottom: 12px;">Virasaat Email Service is Ready!</h1>
          <p style="color: #4A5568; line-height: 1.6; font-size: 15px;">
            This email confirms that your <strong>Nodemailer</strong> SMTP configuration is active and working properly.
          </p>
          <div style="background: #F8F9FA; border-left: 4px solid #2D6A4F; padding: 14px 18px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #2D3748;">
              <strong>Sent by:</strong> ${user}<br/>
              <strong>Delivered to:</strong> ${recipient}<br/>
              <strong>Timestamp:</strong> ${new Date().toISOString()}
            </p>
          </div>
          <p style="color: #718096; font-size: 13px; margin-bottom: 0;">
            Virasaat Secure Legacy & Vault Platform &bull; Demo Delivery System
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from,
      to: recipient,
      subject: '✨ Virasaat Nodemailer Demo Verification',
      text: `Hello! This confirms that your Virasaat Nodemailer integration is configured and running. Sent from: ${user} to ${recipient} at ${new Date().toISOString()}`,
      html: htmlContent,
    });

    console.log('\n🎉 [SUCCESS] Demo email sent successfully!');
    console.log(`  Message ID: ${info.messageId}`);
    console.log(`  Accepted  : ${info.accepted.join(', ')}`);
    console.log(`\nCheck the inbox for ${recipient} to view the delivered message.\n`);
  } catch (err) {
    console.log(`\n❌ [Send Error]: ${err.message}`);
    process.exit(1);
  }
}

main();
