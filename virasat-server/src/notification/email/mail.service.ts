import {
  Injectable,
  Logger,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: nodemailer.SendMailOptions['attachments'];
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  mock?: boolean;
  error?: string;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private isVerified = false;

  constructor(
    @Optional()
    private readonly configService?: ConfigService,
  ) {}

  async onModuleInit() {
    this.initTransporter();
  }

  /**
   * Initialize nodemailer transport based on environment configuration.
   */
  private initTransporter(): boolean {
    const service = this.getConfig('SMTP_SERVICE') || this.getConfig('MAIL_SERVICE');
    const host =
      this.getConfig('SMTP_HOST') ||
      this.getConfig('MAIL_HOST') ||
      (service ? undefined : 'smtp.gmail.com');
    const port = Number(
      this.getConfig('SMTP_PORT') || this.getConfig('MAIL_PORT') || 587,
    );
    const secureConfig =
      this.getConfig('SMTP_SECURE') || this.getConfig('MAIL_SECURE');
    const secure =
      secureConfig === 'true'
        ? true
        : secureConfig === 'false'
          ? false
          : port === 465;

    const user =
      this.getConfig('SMTP_USER') ||
      this.getConfig('MAIL_USER') ||
      this.getConfig('EMAIL_USER');
    const pass =
      this.getConfig('SMTP_PASS') ||
      this.getConfig('MAIL_PASS') ||
      this.getConfig('EMAIL_PASS');

    if (!user || !pass) {
      this.logger.warn(
        '⚠️ [MailService] SMTP credentials are not configured (SMTP_USER / SMTP_PASS). ' +
          'Running in MOCK mode. Emails will be logged to the console instead of delivered. ' +
          'To send real emails, set SMTP_USER and SMTP_PASS in your .env file.',
      );
      this.transporter = null;
      return false;
    }

    try {
      if (service) {
        this.transporter = nodemailer.createTransport({
          service,
          auth: { user, pass },
        });
        this.logger.log(
          `📧 [MailService] Initialized Nodemailer with service "${service}" for account "${user}".`,
        );
      } else {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
        });
        this.logger.log(
          `📧 [MailService] Initialized Nodemailer with SMTP ${host}:${port} (secure: ${secure}) for "${user}".`,
        );
      }

      // Verify connection in background
      this.verifyConnection()
        .then((res) => {
          if (res.success) {
            this.isVerified = true;
            this.logger.log(
              `✅ [MailService] SMTP connection verified successfully. Ready to send emails from "${user}".`,
            );
          } else {
            this.logger.warn(
              `⚠️ [MailService] SMTP connection verification failed: ${res.message}. If using Gmail, make sure you generated an App Password (not your normal password).`,
            );
          }
        })
        .catch((err) => {
          this.logger.warn(
            `⚠️ [MailService] Error during SMTP connection verification: ${err.message}`,
          );
        });

      return true;
    } catch (err) {
      this.logger.error(
        `Failed to create Nodemailer transport: ${err instanceof Error ? err.message : String(err)}`,
      );
      this.transporter = null;
      return false;
    }
  }

  /**
   * Verify SMTP connection status.
   */
  async verifyConnection(): Promise<{ success: boolean; message?: string }> {
    if (!this.transporter) {
      return {
        success: false,
        message: 'No SMTP transport configured (SMTP_USER / SMTP_PASS missing)',
      };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'SMTP connection verified successfully' };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Check if real SMTP transport is active and available.
   */
  isConfigured(): boolean {
    return this.transporter !== null;
  }

  /**
   * Get non-sensitive configuration status for diagnostics.
   */
  getStatus() {
    const user =
      this.getConfig('SMTP_USER') ||
      this.getConfig('MAIL_USER') ||
      this.getConfig('EMAIL_USER');
    const service =
      this.getConfig('SMTP_SERVICE') || this.getConfig('MAIL_SERVICE');
    const host =
      this.getConfig('SMTP_HOST') ||
      this.getConfig('MAIL_HOST') ||
      (service ? undefined : 'smtp.gmail.com');
    const port = Number(
      this.getConfig('SMTP_PORT') || this.getConfig('MAIL_PORT') || 587,
    );

    return {
      configured: this.isConfigured(),
      verified: this.isVerified,
      service: service || null,
      host: host || null,
      port,
      user: user ? `${user.substring(0, 3)}***@${user.split('@')[1] || ''}` : null,
      defaultFrom: this.getDefaultFrom(),
    };
  }

  /**
   * Default sender address.
   */
  getDefaultFrom(): string {
    const customFrom =
      this.getConfig('SMTP_FROM') ||
      this.getConfig('MAIL_FROM') ||
      this.getConfig('EMAIL_FROM');
    if (customFrom) {
      return customFrom;
    }

    const user =
      this.getConfig('SMTP_USER') ||
      this.getConfig('MAIL_USER') ||
      this.getConfig('EMAIL_USER');
    if (user) {
      return `"Virasaat" <${user}>`;
    }

    return '"Virasaat" <noreply@virasaat.app>';
  }

  /**
   * Send an email via Nodemailer if configured, or log in mock mode.
   */
  async sendMail(options: SendEmailOptions): Promise<SendEmailResult> {
    const toAddress = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    const fromAddress = options.from || this.getDefaultFrom();

    // If transporter is not configured or failed to create, log mock dispatch
    if (!this.transporter) {
      this.logger.log(
        `📬 [MOCK EMAIL] (SMTP not configured) To: ${toAddress} | Subject: "${options.subject}"`,
      );
      return {
        success: true,
        mock: true,
      };
    }

    try {
      this.logger.log(
        `🚀 [MailService] Sending email to ${toAddress} | Subject: "${options.subject}" | From: ${fromAddress}`,
      );

      const info = await this.transporter.sendMail({
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments,
      });

      this.logger.log(
        `✅ [MailService] Email successfully delivered to ${toAddress} | MessageId: ${info.messageId}`,
      );

      return {
        success: true,
        messageId: info.messageId,
        mock: false,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `❌ [MailService] Failed to deliver email to ${toAddress}: ${errorMessage}`,
      );

      return {
        success: false,
        error: errorMessage,
        mock: false,
      };
    }
  }

  private getConfig(key: string): string | undefined {
    return (
      this.configService?.get<string>(key) ||
      process.env[key] ||
      undefined
    );
  }
}
