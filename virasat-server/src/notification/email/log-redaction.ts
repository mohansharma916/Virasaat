/**
 * Logs must not carry readable addresses: keep the first two characters of the
 * mailbox and the domain, enough to trace a delivery without exposing the owner.
 */
export function maskEmail(value: string | string[]): string {
  const addresses = Array.isArray(value) ? value : [value];
  return addresses
    .map((address) => {
      const [mailbox, domain] = address.trim().split('@');
      if (!domain) return '***';
      return `${mailbox.slice(0, 2)}***@${domain}`;
    })
    .join(', ');
}
