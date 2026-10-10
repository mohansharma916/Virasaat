jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));
jest.mock('@nestjs/config', () => ({ ConfigService: class {} }));

import { validate } from 'class-validator';
import { WaitlistService } from './waitlist.service';
import { Waitlist } from './entities/waitlist.entity';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import type { SendEmailOptions } from '../notification/email/mail.service';
import { wrapInEmailLayout } from '../notification/email/email-layout';

function fixture(mockMail = false) {
  const rows = new Map<string, Waitlist>();
  const locks: string[] = [];
  let tail = Promise.resolve();
  let nextId = 0;
  const committedPositions = new Set<number>();
  let failSave = false;
  const repository = {
    findOne: ({ where }: { where: { email: string } }) =>
      Promise.resolve(rows.get(where.email) ?? null),
    count: () => Promise.resolve(rows.size),
    createQueryBuilder: () => ({
      select: () => ({
        getRawOne: <T>() =>
          Promise.resolve({
            max: rows.size
              ? Math.max(...Array.from(rows.values(), (row) => row.queueNumber))
              : null,
          } as T),
      }),
    }),
    create: (value: Partial<Waitlist>) =>
      Object.assign(
        new Waitlist(),
        {
          id: `registration-${++nextId}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        value,
      ),
    save: (value: Waitlist) => {
      if (failSave) return Promise.reject(new Error('Database write failed'));
      rows.set(value.email, structuredClone(value));
      return Promise.resolve(value);
    },
  };
  const transaction = async <T>(
    run: (manager: {
      query: (sql: string, values: string[]) => Promise<void>;
      getRepository: (entity: unknown) => typeof repository;
    }) => Promise<T>,
  ): Promise<T> => {
    let release: (() => void) | undefined;
    try {
      const result = await run({
        query: async (sql, values) => {
          expect(sql).toBe('SELECT pg_advisory_xact_lock(hashtext($1))');
          expect(values).toEqual(['waitlist:registration']);
          const previous = tail;
          tail = new Promise<void>((resolve) => {
            release = resolve;
          });
          await previous;
          locks.push(values[0]);
        },
        getRepository: (entity) => {
          expect(entity).toBe(Waitlist);
          expect(release).toBeDefined();
          return repository;
        },
      });
      if (
        typeof result === 'object' &&
        result !== null &&
        'record' in result &&
        result.record instanceof Waitlist
      ) {
        committedPositions.add(result.record.queueNumber);
      }
      return result;
    } finally {
      release?.();
    }
  };
  const sendMail = jest.fn((options: SendEmailOptions) => {
    const position = Number(options.subject.match(/#(\d+)/)?.[1]);
    expect(committedPositions.has(position)).toBe(true);
    expect(rows.size).toBeGreaterThan(0);
    return Promise.resolve({ success: true, mock: mockMail });
  });
  const service = new WaitlistService(
    { ...repository, manager: { transaction } } as never,
    { sendMail } as never,
    {
      get: (key: string) =>
        key === 'ADMIN_EMAIL' ? 'admin@example.test' : undefined,
    } as never,
  );
  return {
    service,
    rows,
    locks,
    sendMail,
    failNextSave: () => {
      failSave = true;
    },
  };
}

describe('Waitlist registration and email safety', () => {
  it('allocates separate positions for concurrent registrations under the shared database lock', async () => {
    const f = fixture();
    const results = await Promise.all([
      f.service.joinWaitlist({ email: 'first@example.test' }),
      f.service.joinWaitlist({ email: 'second@example.test' }),
      f.service.joinWaitlist({ email: 'third@example.test' }),
    ]);
    expect(results.map((result) => result.queueNumber)).toEqual([72, 73, 74]);
    expect(f.rows.size).toBe(3);
    expect(f.locks).toHaveLength(3);
    expect(f.sendMail).toHaveBeenCalledTimes(6);
  });

  it('rechecks normalized duplicate emails after locking and dispatches notifications only once', async () => {
    const f = fixture();
    const results = await Promise.all([
      f.service.joinWaitlist({ email: 'OWNER@example.test ' }),
      f.service.joinWaitlist({ email: 'owner@example.test' }),
    ]);
    expect(results.map((result) => result.queueNumber)).toEqual([72, 72]);
    expect(results[1].alreadyRegistered).toBe(true);
    expect(f.rows.size).toBe(1);
    expect(f.sendMail).toHaveBeenCalledTimes(2);
  });

  it('does not send notifications or acknowledge a failed database write', async () => {
    const f = fixture();
    f.failNextSave();
    await expect(
      f.service.joinWaitlist({ email: 'owner@example.test' }),
    ).rejects.toThrow('Database write failed');
    expect(f.sendMail).not.toHaveBeenCalled();
    expect(f.rows.size).toBe(0);
  });

  it('escapes every interpolated signup field while storing original strings', async () => {
    const f = fixture();
    const signup = {
      email: 'owner@example.test',
      fullName: '<b>Owner</b> & "Family"',
      country: '<img src=x onerror=alert(1)>',
      platform: '<a href="https://evil.test">iOS</a>',
      source: "<script>bad()</script>'",
    };
    await f.service.joinWaitlist(signup);
    const adminHtml = f.sendMail.mock.calls[0][0].html ?? '';
    const userHtml = f.sendMail.mock.calls[1][0].html ?? '';
    expect(adminHtml).toContain(
      '&lt;b&gt;Owner&lt;/b&gt; &amp; &quot;Family&quot;',
    );
    expect(adminHtml).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(adminHtml).toContain(
      '&lt;a href=&quot;https://evil.test&quot;&gt;iOS&lt;/a&gt;',
    );
    expect(adminHtml).toContain('&lt;script&gt;bad()&lt;/script&gt;&#39;');
    expect(userHtml).toContain('&lt;b&gt;Owner&lt;/b&gt;');
    expect(userHtml).toContain(
      '&lt;a href=&quot;https://evil.test&quot;&gt;iOS&lt;/a&gt;',
    );
    expect(userHtml).not.toMatch(
      /<script>|<img|<b>Owner|href="https:\/\/evil\.test"/,
    );
    expect(f.rows.get(signup.email)?.fullName).toBe(signup.fullName);
  });

  it('describes actual encryption and feature availability without granting subscriptions', async () => {
    const f = fixture();
    await f.service.joinWaitlist({ email: 'owner@example.test' });
    const userHtml = f.sendMail.mock.calls[1][0].html ?? '';
    expect(userHtml).toContain(
      'Waitlist signup does not activate a subscription or a lifetime entitlement',
    );
    expect(userHtml).toContain(
      'Authorized server processes can decrypt content',
    );
    expect(userHtml).toContain('inheritance release are not available yet');
    expect(userHtml).not.toMatch(
      /Free Lifetime|encrypted on your phone|Even we can't see/,
    );
    const layout = wrapInEmailLayout({
      title: 'Welcome',
      contentHtml: '<p>Welcome</p>',
    });
    expect(layout).toContain('Server-Managed Encryption');
    expect(layout).toContain('Authorized server processes can decrypt content');
    expect(layout).toContain('href="virasat://security"');
    expect(layout).toContain('https://virasaat.app/privacy');
    expect(layout).not.toMatch(
      /Zero-Knowledge|client-side encryption|virasaat\.com|>Preferences</,
    );
  });

  it('does not mark mock SMTP notifications as delivered', async () => {
    const f = fixture(true);
    await f.service.joinWaitlist({ email: 'owner@example.test' });
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(f.rows.get('owner@example.test')?.emailSentToAdmin).toBe(false);
    expect(f.rows.get('owner@example.test')?.emailSentToUser).toBe(false);
  });

  it.each([
    ['email', `${'a'.repeat(243)}@example.test`],
    ['fullName', 'a'.repeat(201)],
    ['country', 'a'.repeat(121)],
    ['platform', 'a'.repeat(121)],
    ['source', 'a'.repeat(121)],
  ])('rejects oversized %s before a database call', async (key, value) => {
    const dto = Object.assign(new CreateWaitlistDto(), {
      email: 'owner@example.test',
      [key]: value,
    });
    const errors = await validate(dto);
    expect(
      errors.some(
        (error) => error.property === key && error.constraints?.maxLength,
      ),
    ).toBe(true);
  });
});
