import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#063F34',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'Virasat (विरासत) — Keep Your Family’s Money & Memories Safe | Coming Soon',
  description:
    'Organize financial records, important documents and personal messages with Virasat. Server-encrypted vault content and check-in tools; automated family handover is planned. Join for launch updates.',
  keywords: [
    'Virasat',
    'family vault',
    'unclaimed wealth India',
    'bank accounts organizer',
    'insurance policy tracker',
    'family emergency handover',
    'personal video messages',
    'Virasat waitlist',
    'Virasat iOS app',
    'Virasat Android app',
  ],
  authors: [{ name: 'Virasat Technologies Inc.' }],
  creator: 'Virasat',
  publisher: 'Virasat Technologies',
  metadataBase: new URL('https://virasat.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://virasat.app',
    title: 'Virasat (विरासत) — Keep Your Family’s Money & Memories Safe',
    description:
      'Keep all your bank accounts, investments, insurance, and personal video notes safe in one place. Join the free waitlist for launch updates.',
    siteName: 'Virasat',
    images: [
      {
        url: '/images/hero-vault.jpg',
        width: 1200,
        height: 630,
        alt: 'Virasat Vault',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Virasat — Keep Your Family’s Money & Memories Safe',
    description:
      'Keep all your bank accounts, investments, insurance, and personal video notes safe in one place. Join the free waitlist for launch updates.',
    images: ['/images/hero-vault.jpg'],
    creator: '@VirasatApp',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/images/vault-security.jpg',
    apple: '/images/vault-security.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">

      <body>{children}</body>
    </html>
  );
}
