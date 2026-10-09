import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { Waitlist } from './entities/waitlist.entity';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { MailService } from '../notification/email/mail.service';

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);

  constructor(
    @InjectRepository(Waitlist)
    private readonly waitlistRepo: Repository<Waitlist>,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async joinWaitlist(dto: CreateWaitlistDto) {
    const email = dto.email.trim().toLowerCase();
    const fullName = (dto.fullName || '').trim();
    const country = (dto.country || 'India').trim();
    const platform = (dto.platform || 'Both iOS & Android').trim();
    const source = (dto.source || 'website').trim();

    // 1. Check if already registered
    const existing = await this.waitlistRepo.findOne({ where: { email } });
    if (existing) {
      this.logger.log(`User already on waitlist: ${email} (#${existing.queueNumber})`);
      return {
        success: true,
        alreadyRegistered: true,
        queueNumber: existing.queueNumber,
        message: "You're already on the waitlist! We'll notify you as soon as early access begins.",
      };
    }

    // 2. Calculate next queue number (start at 72, increment by 1, maintained in DB)
    const baseStart =
      parseInt(this.configService.get<string>('WAITLIST_START_NUMBER') || '72', 10) || 72;

    const [currentCount, maxRecord] = await Promise.all([
      this.waitlistRepo.count(),
      this.waitlistRepo
        .createQueryBuilder('waitlist')
        .select('MAX(waitlist.queueNumber)', 'max')
        .getRawOne(),
    ]);

    const currentMax =
      maxRecord?.max != null && !isNaN(parseInt(maxRecord.max, 10))
        ? parseInt(maxRecord.max, 10)
        : null;

    const queueNumber =
      currentMax !== null && currentMax >= baseStart ? currentMax + 1 : baseStart;

    // 3. Save new record to DB
    const record = this.waitlistRepo.create({
      email,
      fullName: fullName || null,
      country,
      platform,
      source,
      queueNumber,
      emailSentToAdmin: false,
      emailSentToUser: false,
    });

    const savedRecord = await this.waitlistRepo.save(record);
    this.logger.log(`New waitlist entry created in DB: ${email} (#${queueNumber})`);

    // 4. Dispatch Email Notifications
    const adminEmail =
      this.configService.get<string>('ADMIN_EMAIL') || 'mohansharma916@gmail.com';

    // 4a. Notification to Admin
    const adminMailPromise = this.mailService
      .sendMail({
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
                  <td style="padding: 10px 0; font-weight: bold; color: #555;">Total Signups:</td>
                  <td style="padding: 10px 0; color: #0B5D4B; font-weight: bold;">${currentCount + 1} members</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; border-top: 1px solid #eee; padding-top: 14px; font-size: 13px; color: #777;">
              Sent automatically by Virasaat Server Waitlist System.
            </div>
          </div>
        `,
      })
      .then((res) => {
        if (res.success) savedRecord.emailSentToAdmin = true;
      })
      .catch((err) => {
        this.logger.error(`Failed to send waitlist admin email: ${err.message}`);
      });

    // 4b. Confirmation to User
    const userMailPromise = this.mailService
      .sendMail({
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
              We're currently putting the finishing touches on our mobile app. You will receive an exclusive download link as soon as early invites open.
            </p>

            <div style="border-top: 1px solid #edf2f7; margin-top: 28px; padding-top: 18px; text-align: center; color: #718096; font-size: 13px;">
              Virasaat — Simple, safe family heritage.<br />
              Have questions or suggestions? Just reply to this email!
            </div>
          </div>
        `,
      })
      .then((res) => {
        if (res.success) savedRecord.emailSentToUser = true;
      })
      .catch((err) => {
        this.logger.error(`Failed to send waitlist user confirmation email: ${err.message}`);
      });

    // Await both email sends asynchronously without failing the request
    void Promise.allSettled([adminMailPromise, userMailPromise]).then(() => {
      this.waitlistRepo.save(savedRecord).catch(() => {});
    });

    return {
      success: true,
      queueNumber,
      message: 'You have been added to the waitlist!',
    };
  }

  async getStats() {
    const baseStart =
      parseInt(this.configService.get<string>('WAITLIST_START_NUMBER') || '72', 10) || 72;
    const count = await this.waitlistRepo.count();

    const maxRecord = await this.waitlistRepo
      .createQueryBuilder('waitlist')
      .select('MAX(waitlist.queueNumber)', 'max')
      .getRawOne();

    const currentMax =
      maxRecord?.max != null && !isNaN(parseInt(maxRecord.max, 10))
        ? parseInt(maxRecord.max, 10)
        : null;

    const nextQueueNumber =
      currentMax !== null && currentMax >= baseStart ? currentMax + 1 : baseStart;

    return {
      success: true,
      totalCount: count,
      nextQueueNumber,
    };
  }
}
