import { isIP } from 'node:net';

/** Trust forwarded addresses only from an explicitly described deployment path. */
export function parseTrustProxy(value?: string): false | number | string[] {
  const setting = value?.trim();
  if (!setting || setting === 'false') return false;
  if (/^(0|[1-9]\d*)$/.test(setting)) {
    const hops = Number(setting);
    if (hops <= 10) return hops;
    throw new Error('TRUST_PROXY hop count must be between 0 and 10.');
  }
  const ranges = setting.split(',').map((range) => range.trim());
  for (const range of ranges) {
    const segments = range.split('/');
    const version = isIP(segments[0]);
    if (!version || segments.length > 2)
      throw new Error(
        'TRUST_PROXY must specify IP addresses, CIDRs, or a known hop count.',
      );
    if (segments.length === 2) {
      const prefix = segments[1];
      if (
        !/^[1-9]\d*$/.test(prefix) ||
        Number(prefix) > (version === 4 ? 32 : 128)
      ) {
        throw new Error(
          'TRUST_PROXY requires specific CIDRs; all-address /0 ranges are forbidden.',
        );
      }
    }
  }
  return ranges;
}
