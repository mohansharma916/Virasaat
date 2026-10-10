import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  let mockSendMail: jest.Mock;
  let mockVerify: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendMail = jest.fn().mockResolvedValue({ messageId: 'msg-12345' });
    mockVerify = jest.fn().mockResolvedValue(true);

    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
      verify: mockVerify,
    });
  });

  describe('when SMTP credentials are missing', () => {
    beforeEach(async () => {
      const mockConfigService = {
        get: jest.fn().mockReturnValue(undefined),
      };

      service = new MailService(mockConfigService as any);
      await service.onModuleInit();
    });

    it('should be marked as not configured', () => {
      expect(service.isConfigured()).toBe(false);
      expect(service.getStatus().configured).toBe(false);
    });

    it('should operate in mock mode without throwing', async () => {
      const result = await service.sendMail({
        to: 'demo@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(true);
      expect(result.mock).toBe(true);
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });

  describe('when SMTP credentials are provided', () => {
    beforeEach(async () => {
      const mockConfigService = {
        get: jest.fn().mockImplementation((key: string) => {
          const config: Record<string, string> = {
            SMTP_USER: 'demo@gmail.com',
            SMTP_PASS: 'app-password-1234',
            SMTP_SERVICE: 'gmail',
            SMTP_FROM: '"Virasaat Demo" <demo@gmail.com>',
          };
          return config[key];
        }),
      };

      service = new MailService(mockConfigService as any);
      await service.onModuleInit();
    });

    it('should initialize transporter and verify', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'gmail',
          auth: {
            user: 'demo@gmail.com',
            pass: 'app-password-1234',
          },
        }),
      );
      expect(service.isConfigured()).toBe(true);
    });

    it('should send email using transporter', async () => {
      const result = await service.sendMail({
        to: 'recipient@example.com',
        subject: 'Welcome to Virasaat',
        html: '<h1>Welcome!</h1>',
        text: 'Welcome!',
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'recipient@example.com',
          from: '"Virasaat Demo" <demo@gmail.com>',
          subject: 'Welcome to Virasaat',
        }),
      );
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-12345');
      expect(result.mock).toBe(false);
    });

    it('should handle sendMail failure gracefully', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP connection timed out'));

      const result = await service.sendMail({
        to: 'recipient@example.com',
        subject: 'Failure Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('SMTP connection timed out');
      expect(result.mock).toBe(false);
    });
  });
});
