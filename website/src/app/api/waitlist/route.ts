import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import nodemailer from 'nodemailer';

const DATA_FILE = path.join(process.cwd(), 'data', 'waitlist.json');

// Interface for Waitlist Entry
interface WaitlistEntry {
  id: string;
  email: string;
  fullName: string;
  country: string;
  platform: string;
  source: string;
  queueNumber: number;
  createdAt: string;
  emailSentToAdmin?: boolean;
  emailSentToUser?: boolean;
}

// Helper to ensure file exists and read entries
async function getWaitlist(): Promise<WaitlistEntry[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    // If directory or file doesn't exist, create it
    const dataDir = path.join(process.cwd(), 'data');
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch {}
    await fs.writeFile(DATA_FILE, '[]', 'utf-8');
    return [];
  }
}

// Helper to save entries
async function saveWaitlist(entries: WaitlistEntry[]): Promise<void> {
  const dataDir = path.join(process.cwd(), 'data');
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

export async function GET() {
  try {
    const entries = await getWaitlist();
    return NextResponse.json({
      success: true,
      totalCount: entries.length,
      nextQueueNumber: 420 + entries.length,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch waitlist' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const fullName = (body.fullName || '').trim();
    const country = (body.country || 'India').trim();
    const platform = (body.platform || 'Both iOS & Android').trim();
    const source = (body.source || 'website').trim();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const entries = await getWaitlist();

    // Check if user is already signed up
    const existing = entries.find((item) => item.email.toLowerCase() === email);
    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyRegistered: true,
        queueNumber: existing.queueNumber,
        message: "You're already on the waitlist! We'll notify you as soon as early access begins.",
      });
    }

    const queueNumber = 420 + entries.length + 1;
    const newEntry: WaitlistEntry = {
      id: `wl_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      email,
      fullName,
      country,
      platform,
      source,
      queueNumber,
      createdAt: new Date().toISOString(),
      emailSentToAdmin: false,
      emailSentToUser: false,
    };

    entries.push(newEntry);
    await saveWaitlist(entries);

    // Send Email notifications if SMTP credentials are provided
    const adminEmail = process.env.ADMIN_EMAIL || 'mohansharma916@gmail.com';
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        // 1. Send notification to Website Owner ("Send me an email")
        const adminMailPromise = transporter.sendMail({
          from: process.env.SMTP_FROM || `"Virasaat Waitlist" <${smtpUser}>`,
          to: adminEmail,
          subject: `🎉 New Waitlist Signup #${queueNumber}: ${email}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #d4e3dc; border-radius: 12px; background: #ffffff;">
              <div style="background: #0B5D4B; padding: 18px; border-radius: 8px; text-align: center; color: #ffffff;">
                <h2 style="margin: 0; font-size: 22px;">New Waitlist Signup!</h2>
                <p style="margin: 6px 0 0; color: #ECC862; font-size: 14px;">Founding Member #${queueNumber}</p>
              </div>

              <div style="padding: 20px 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                  <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 10px 0; font-weight: bold; color: #555; width: 140px;">Email:</td>
                    <td style="padding: 10px 0; color: #111;">
                      <a href="mailto:${email}" style="color: #0B5D4B; font-weight: bold;">${email}</a>
                    </td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 10px 0; font-weight: bold; color: #555;">Name:</td>
                    <td style="padding: 10px 0; color: #111;">${fullName || 'Not provided'}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 10px 0; font-weight: bold; color: #555;">Country:</td>
                    <td style="padding: 10px 0; color: #111;">${country}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 10px 0; font-weight: bold; color: #555;">Preferred App:</td>
                    <td style="padding: 10px 0; color: #111;">${platform}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 10px 0; font-weight: bold; color: #555;">Signed Up Via:</td>
                    <td style="padding: 10px 0; color: #111;">${source}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #555;">Total Members:</td>
                    <td style="padding: 10px 0; color: #0B5D4B; font-weight: bold;">${entries.length} members</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; border-top: 1px solid #eee; padding-top: 14px; font-size: 13px; color: #777;">
                Sent automatically by Virasaat Website Waitlist System.
              </div>
            </div>
          `,
        });

        // 2. Send confirmation to the user who signed up
        const userMailPromise = transporter.sendMail({
          from: process.env.SMTP_FROM || `"Virasaat" <${smtpUser}>`,
          to: email,
          subject: `You're on the Virasaat Waitlist! (Founding Member #${queueNumber})`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background: #ffffff; border: 1px solid #e1e8e5; border-radius: 16px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; background: #0B5D4B; color: #ECC862; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 13px; letter-spacing: 0.5px;">
                  VIRASAAT • COMING SOON
                </div>
                <h1 style="color: #063F34; margin: 16px 0 6px; font-size: 26px;">You're on the waitlist!</h1>
                <p style="color: #4a5568; font-size: 16px; margin: 0;">
                  Welcome, ${fullName ? fullName.split(' ')[0] : 'friend'}. Your spot is secured.
                </p>
              </div>

              <div style="background: #F4F9F6; border: 1px solid #CDE5DB; border-radius: 12px; padding: 22px; text-align: center; margin: 24px 0;">
                <div style="font-size: 13px; color: #0B5D4B; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">
                  Your Founding Member Number
                </div>
                <div style="font-size: 42px; font-weight: 800; color: #0B5D4B; margin: 6px 0;">
                  #${queueNumber}
                </div>
                <div style="font-size: 13px; color: #4a5568;">
                  Priority Early Access for ${platform} • Free Lifetime Core Vault
                </div>
              </div>

              <p style="color: #2d3748; line-height: 1.65; font-size: 15px;">
                Virasaat is designed to be the simplest, safest way to protect your family's financial future:
              </p>

              <ul style="color: #2d3748; line-height: 1.7; font-size: 14px; padding-left: 20px;">
                <li><strong>One clear list:</strong> Your bank accounts, investments, and policies in one place.</li>
                <li><strong>Automatic safety check-ins:</strong> If you stop responding, your trusted family gets access.</li>
                <li><strong>Personal video messages:</strong> Notes and videos saved for special milestones.</li>
                <li><strong>100% Private:</strong> Everything is encrypted on your phone. Even we can't see your data.</li>
              </ul>

              <p style="color: #2d3748; line-height: 1.65; font-size: 15px; margin-top: 20px;">
                We're currently putting the finishing touches on our mobile app. You will receive an exclusive download link as soon as we roll out early invites.
              </p>

              <div style="border-top: 1px solid #edf2f7; margin-top: 28px; padding-top: 18px; text-align: center; color: #718096; font-size: 13px;">
                Virasaat — Simple, safe family heritage.<br />
                Have questions or suggestions? Just reply to this email!
              </div>
            </div>
          `,
        });

        // Run both emails concurrently
        await Promise.allSettled([adminMailPromise, userMailPromise]);

        // Update record with status
        newEntry.emailSentToAdmin = true;
        newEntry.emailSentToUser = true;
        await saveWaitlist(entries);
      } catch (mailError) {
        console.error('Failed to send waitlist email notification:', mailError);
        // We still return success because their email has been safely saved!
      }
    }

    return NextResponse.json({
      success: true,
      queueNumber,
      message: 'You have been added to the waitlist!',
    });
  } catch (error) {
    console.error('Waitlist submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
