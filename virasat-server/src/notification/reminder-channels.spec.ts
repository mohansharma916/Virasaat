jest.mock('@nestjs/config', () => ({ ConfigService: class {} }));
jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => undefined }));

import { reminderSms, toE164 } from './channels/exotel.senders';
import { ReminderChannelsService } from './reminder-channels.service';

describe('reminder channels', () => {
  it('normalizes saved phone numbers to E.164', () => {
    expect(toE164('98765 43210')).toBe('+919876543210');
    expect(toE164('09876543210')).toBe('+919876543210');
    expect(toE164('+91 98765-43210')).toBe('+919876543210');
    expect(toE164('+14155550100')).toBe('+14155550100');
    expect(toE164('12345')).toBeNull();
    expect(toE164(null)).toBeNull();
  });

  it('keeps the SMS within the DLT template wording', () => {
    expect(reminderSms(62, '17 January 2027')).toBe(
      'Virasat: you have not checked in for 62 days. Open the Virasat app and check in before 17 January 2027, or a release review will start. - Virasat',
    );
  });

  it('uses configured channels, skips unconfigured ones, and never counts a skip as delivered', async () => {
    const push = { channel: 'PUSH' as const, isConfigured: () => true, send: jest.fn(async () => undefined) };
    const sms = { channel: 'SMS' as const, isConfigured: () => false, send: jest.fn(async () => undefined) };
    const call = { channel: 'CALL' as const, isConfigured: () => true, send: jest.fn(async () => { throw new Error('busy'); }) };
    const service = new ReminderChannelsService(push as never, sms as never, call as never);
    const sendEmail = jest.fn(async () => undefined);
    const delivered = await service.deliver(
      { userId: 'owner', phone: '9876543210' },
      ['EMAIL', 'PUSH', 'SMS', 'CALL'],
      { title: 't', body: 'b', sms: 's', sendEmail },
    );
    expect(delivered).toEqual(['EMAIL', 'PUSH']);
    expect(sms.send).not.toHaveBeenCalled();
    expect(call.send).toHaveBeenCalledTimes(1);
  });
});
