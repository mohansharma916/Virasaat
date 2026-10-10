import { parseTrustProxy } from './trust-proxy.config';

describe('Trusted reverse proxy configuration', () => {
  it('defaults to the direct peer address and permits explicit disabling', () => {
    expect(parseTrustProxy()).toBe(false);
    expect(parseTrustProxy('false')).toBe(false);
    expect(parseTrustProxy('0')).toBe(0);
  });

  it('accepts a known bounded hop count or specific IP/CIDR ranges', () => {
    expect(parseTrustProxy('1')).toBe(1);
    expect(parseTrustProxy('127.0.0.1, 10.0.0.0/24, ::1, fd00::/64')).toEqual([
      '127.0.0.1',
      '10.0.0.0/24',
      '::1',
      'fd00::/64',
    ]);
  });

  it.each([
    'true',
    '*',
    '0.0.0.0/0',
    '::/0',
    '10.0.0.1/33',
    '::1/129',
    '11',
    '127.0.0.1,',
    'proxy.example.test',
    '-1',
  ])('rejects unsafe or malformed setting %s', (setting) => {
    expect(() => parseTrustProxy(setting)).toThrow('TRUST_PROXY');
  });
});
