import {
  Body,
  Controller,
  Get,
  Header,
  NotFoundException,
  Optional,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { EmailTemplateService } from './email-template.service';
import { EmailTemplateType } from './email-template.types';
import { MailService } from './mail.service';
import { SendTestEmailDto } from '../dto/send-test-email.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { EmailDiagnosticsGuard } from './email-diagnostics.guard';

@Controller('notifications/email-templates')
@UseGuards(EmailDiagnosticsGuard, JwtAuthGuard)
export class EmailPreviewController {
  constructor(
    private readonly emailTemplateService: EmailTemplateService,
    @Optional()
    private readonly mailService?: MailService,
  ) {}

  /**
   * Diagnostic endpoint to check Nodemailer & SMTP transport configuration.
   */
  @Get('status')
  getStatus() {
    return {
      service: 'Virasat Email Notification Engine',
      smtp: this.mailService
        ? this.mailService.getStatus()
        : { configured: false, mock: true },
      supportedTemplates: this.emailTemplateService.getAllTemplateTypes(),
    };
  }

  /**
   * Dispatch a real test email to verify Nodemailer credentials.
   */
  @Post('test-send')
  async sendTestEmail(@Body() dto: SendTestEmailDto) {
    let subject: string;
    let html: string;
    let text: string;

    if (dto.templateType) {
      const rendered = this.emailTemplateService.renderSample(dto.templateType);
      subject = dto.subject || `[Test Demo] ${rendered.subject}`;
      html = rendered.html;
      text = rendered.text;
    } else {
      subject = dto.subject || '🎉 Virasat Demo Email Test';
      const sample = this.emailTemplateService.renderSample(
        EmailTemplateType.WELCOME,
      );
      html = sample.html;
      text = dto.message || sample.text;
    }

    if (!this.mailService) {
      return {
        success: true,
        mock: true,
        message: 'MailService is not initialized. Email logged in mock mode.',
        to: dto.to,
        subject,
      };
    }

    const result = await this.mailService.sendMail({
      to: dto.to,
      subject,
      html,
      text,
    });

    return {
      to: dto.to,
      subject,
      deliveryResult: result,
      info: result.mock
        ? 'Sent in MOCK mode because SMTP credentials are not set in .env. Configure SMTP_USER and SMTP_PASS to send real emails.'
        : result.success
          ? 'Email sent successfully via Nodemailer!'
          : `Email delivery failed: ${result.error}`,
    };
  }

  /**
   * List all available email templates with descriptions
   */
  @Get()
  listTemplates() {
    const types = this.emailTemplateService.getAllTemplateTypes();
    return types.map((type) => {
      const sample = this.emailTemplateService.renderSample(type);
      return {
        type,
        subject: sample.subject,
        previewUrl: `/notifications/email-templates/preview/${type}`,
        textPreviewUrl: `/notifications/email-templates/preview/${type}/text`,
      };
    });
  }

  /**
   * Preview an email template as full HTML in the browser
   */
  @Get('preview/:type')
  @Header('Content-Type', 'text/html; charset=utf-8')
  previewHtml(@Param('type') type: string, @Res() res: Response) {
    const templateType = type.toUpperCase() as EmailTemplateType;
    if (!Object.values(EmailTemplateType).includes(templateType)) {
      throw new NotFoundException(
        `Template '${type}' not found. Available: ${Object.values(EmailTemplateType).join(', ')}`,
      );
    }

    const rendered = this.emailTemplateService.renderSample(templateType);
    return res.send(rendered.html);
  }

  /**
   * Preview the plain text version of a template
   */
  @Get('preview/:type/text')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  previewText(@Param('type') type: string, @Res() res: Response) {
    const templateType = type.toUpperCase() as EmailTemplateType;
    if (!Object.values(EmailTemplateType).includes(templateType)) {
      throw new NotFoundException(`Template '${type}' not found.`);
    }

    const rendered = this.emailTemplateService.renderSample(templateType);
    return res.send(rendered.text);
  }
}
