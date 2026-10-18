import type { ConfigService } from '@nestjs/config';

const APP_LINKS = {
  home: ['APP_HOME_URL', 'virasat://home'],
  recovery: ['APP_RECOVERY_URL', 'virasat://forgot-password'],
  security: ['APP_SECURITY_URL', 'virasat://security'],
  shared: ['APP_SHARED_URL', 'virasat://shared'],
  adminReview: ['APP_ADMIN_REVIEW_URL', 'virasat://admin-cases'],
  // Trusted people may not have the app yet.
  download: [
    'APP_DOWNLOAD_URL',
    'https://play.google.com/store/apps/details?id=in.virasat.app',
  ],
} as const;

/** Only link to an implemented app route or an explicitly configured HTTPS page. */
export function getEmailAppLink(
  kind: keyof typeof APP_LINKS,
  query: Record<string, string> = {},
  config?: ConfigService,
): string {
  const [setting, fallback] = APP_LINKS[kind];
  const url = new URL(
    config?.get<string>(setting) || process.env[setting] || fallback,
  );
  if (!['https:', 'virasat:'].includes(url.protocol)) {
    throw new Error(`${setting} must use HTTPS or the virasat app scheme.`);
  }
  for (const [key, value] of Object.entries(query))
    url.searchParams.set(key, value);
  return url.toString();
}
