import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { parseTrustProxy } from './auth/trust-proxy.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));

  app.disable('x-powered-by');
  app.use(
    (
      _req: unknown,
      res: { setHeader(name: string, value: string): void },
      next: () => void,
    ) => {
      // JSON API only: nothing should be framed, sniffed or cached by proxies.
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'none'; frame-ancestors 'none'",
      );
      res.setHeader('Cache-Control', 'no-store');
      if (process.env.NODE_ENV === 'production')
        res.setHeader(
          'Strict-Transport-Security',
          'max-age=31536000; includeSubDomains',
        );
      next();
    },
  );

  // Native apps do not need CORS. Browsers (website waitlist, Expo web) are
  // limited to the configured origins once CORS_ORIGINS is set.
  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const production = process.env.NODE_ENV === 'production';
  if (corsOrigins.length === 0 && production)
    console.error(
      'CORS_ORIGINS is not set; browser requests are refused. Set it to the website origin.',
    );
  app.enableCors({
    // Fail closed in production; allow any origin only during development.
    origin: corsOrigins.length > 0 ? corsOrigins : !production,
    credentials: false,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 3000;

  await app.listen(port, '0.0.0.0');

  console.log(`Application running on port ${port}`);
}

bootstrap();
