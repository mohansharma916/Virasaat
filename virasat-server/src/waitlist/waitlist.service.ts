import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { Waitlist } from './entities/waitlist.entity';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { MailService } from '../notification/email/mail.service';
import { escapeHtml } from '../notification/email/email-layout';

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

    // Allocate positions and check duplicates under the same database lock.
    // The transaction commits before either notification is dispatched.
    const registration = await this.waitlistRepo.manager.transaction(
      async (manager) => {
        await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
          'waitlist:registration',
        ]);
        const repository = manager.getRepository(Waitlist);
        const existing = await repository.findOne({ where: { email } });
        if (existing)
          return { record: existing, alreadyRegistered: true, totalCount: 0 };

        const baseStart = this.baseStart();
        const [currentCount, maxRecord] = await Promise.all([
          repository.count(),
          repository
            .createQueryBuilder('waitlist')
            .select('MAX(waitlist.queueNumber)', 'max')
            .getRawOne<{ max: number | string | null }>(),
        ]);
        const currentMax = maxRecord?.max == null ? 0 : Number(maxRecord.max);
        const queueNumber = Math.max(baseStart, currentMax + 1);
        if (!Number.isSafeInteger(queueNumber) || queueNumber > 2147483647) {
          throw new ServiceUnavailableException(
            'Waitlist registration is temporarily unavailable.',
          );
        }
        const record = repository.create({
          email,
          fullName: fullName || null,
          country,
          platform,
          source,
          queueNumber,
          emailSentToAdmin: false,
          emailSentToUser: false,
        });
        return {
          record: await repository.save(record),
          alreadyRegistered: false,
          totalCount: currentCount + 1,
        };
      },
    );
    const savedRecord = registration.record;
    const queueNumber = savedRecord.queueNumber;
    if (registration.alreadyRegistered) {
      this.logger.log(`User already on waitlist: ${email} (#${queueNumber})`);
      return {
        success: true,
        alreadyRegistered: true,
        queueNumber,
        message:
          "You're already on the waitlist! We'll notify you as soon as early access begins.",
      };
    }

    this.logger.log(
      `New waitlist entry created in DB: ${email} (#${queueNumber})`,
    );

    const htmlEmail = escapeHtml(email);
    const mailtoHref = escapeHtml(`mailto:${email}`);
    const htmlName = escapeHtml(fullName || 'Not provided');
    const htmlCountry = escapeHtml(country);
    const htmlPlatform = escapeHtml(platform);
    const htmlSource = escapeHtml(source);
    const htmlGreeting = escapeHtml(
      fullName ? fullName.split(' ')[0] : 'friend',
    );

    // 4. Dispatch Email Notifications
    const adminEmail =
      this.configService.get<string>('ADMIN_EMAIL') ||
      'mohansharma916@gmail.com';

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
                    <a href="${mailtoHref}" style="color: #0B5D4B; font-weight: bold;">${htmlEmail}</a>
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #f0f0f0;">
                  <td style="padding: 10px 0; font-weight: bold; color: #555;">Name:</td>
                  <td style="padding: 10px 0; color: #111;">${htmlName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f0f0f0;">
                  <td style="padding: 10px 0; font-weight: bold; color: #555;">Country:</td>
                  <td style="padding: 10px 0; color: #111;">${htmlCountry}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f0f0f0;">
                  <td style="padding: 10px 0; font-weight: bold; color: #555;">Preferred App:</td>
                  <td style="padding: 10px 0; color: #111;">${htmlPlatform}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f0f0f0;">
                  <td style="padding: 10px 0; font-weight: bold; color: #555;">Signed Up Via:</td>
                  <td style="padding: 10px 0; color: #111;">${htmlSource}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-weight: bold; color: #555;">Total Signups:</td>
                  <td style="padding: 10px 0; color: #0B5D4B; font-weight: bold;">${registration.totalCount} members</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; border-top: 1px solid #eee; padding-top: 14px; font-size: 13px; color: #777;">
              Sent automatically by Virasat Server Waitlist System.
            </div>
          </div>
        `,
      })
      .then((res) => {
        if (res.success && !res.mock) savedRecord.emailSentToAdmin = true;
      })
      .catch((err: unknown) => {
        this.logger.error(
          `Failed to send waitlist admin email: ${err instanceof Error ? err.message : String(err)}`,
        );
      });

    // 4b. Confirmation to User
    const userMailPromise = this.mailService
      .sendMail({
        to: email,
        subject: `You're on the Virasat Waitlist! (Founding Member #${queueNumber})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background: #ffffff; border: 1px solid #e1e8e5; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; background: #0B5D4B; color: #ECC862; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 13px; letter-spacing: 0.5px;">
                VIRASAT • COMING SOON
              </div>
              <h1 style="color: #063F34; margin: 16px 0 6px; font-size: 26px;">You're on the waitlist!</h1>
              <p style="color: #4a5568; font-size: 16px; margin: 0;">
                Welcome, ${htmlGreeting}. Your waitlist registration is confirmed.
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
                Launch updates for ${htmlPlatform}. Waitlist signup does not activate a subscription or a lifetime entitlement.
              </div>
            </div>

            <p style="color: #2d3748; line-height: 1.65; font-size: 15px;">
              Virasat is designed to be the simplest, safest way to protect your family's financial future:
            </p>

            <ul style="color: #2d3748; line-height: 1.7; font-size: 14px; padding-left: 20px;">
              <li><strong>One clear list:</strong> Your bank accounts, investments, and policies in one place.</li>
              <li><strong>Check-in preferences:</strong> Record activity in the app. Scheduled reminders, escalation, and inheritance release are not available yet.</li>
              <li><strong>Personal video messages:</strong> Notes and videos saved for special milestones.</li>
              <li><strong>Server-managed encryption:</strong> Descriptions and uploaded files are encrypted on the server using AES-256-GCM. Authorized server processes can decrypt content; titles and categories are stored as metadata.</li>
            </ul>

            <p style="color: #2d3748; line-height: 1.65; font-size: 15px; margin-top: 20px;">
              Joining the waitlist registers you for launch updates. Paid checkout, recipient invitations, and automatic message delivery are not currently available. We will share availability updates when ready.
            </p>

            <div style="border-top: 1px solid #edf2f7; margin-top: 28px; padding-top: 18px; text-align: center; color: #718096; font-size: 13px;">
              Virasat — Simple, safe family heritage.<br />
              Have questions or suggestions? Just reply to this email!
            </div>
          </div>
        `,
      })
      .then((res) => {
        if (res.success && !res.mock) savedRecord.emailSentToUser = true;
      })
      .catch((err: unknown) => {
        this.logger.error(
          `Failed to send waitlist user confirmation email: ${err instanceof Error ? err.message : String(err)}`,
        );
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

  private baseStart(): number {
    const value = Number(
      this.configService.get<string>('WAITLIST_START_NUMBER'),
    );
    return Number.isSafeInteger(value) && value > 0 ? value : 72;
  }

  async getStats() {
    const baseStart = this.baseStart();
    const count = await this.waitlistRepo.count();

    const maxRecord = await this.waitlistRepo
      .createQueryBuilder('waitlist')
      .select('MAX(waitlist.queueNumber)', 'max')
      .getRawOne<{ max: number | string | null }>();

    const currentMax =
      maxRecord?.max != null && Number.isFinite(Number(maxRecord.max))
        ? Number(maxRecord.max)
        : null;

    const nextQueueNumber =
      currentMax !== null && currentMax >= baseStart
        ? currentMax + 1
        : baseStart;

    return {
      success: true,
      totalCount: count,
      nextQueueNumber,
    };
  }
}
