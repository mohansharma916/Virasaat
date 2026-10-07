import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#063F34',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'Virasaat (विरासत) — Keep Your Family’s Money & Memories Safe | Coming Soon',
  description:
    'Keep all your bank accounts, investments, insurance policies, and personal video messages safe in one place. Virasaat automatically shares them with your family if anything ever happens to you. Join the waitlist today for free lifetime access.',
  keywords: [
    'Virasaat',
    'family vault',
    'unclaimed wealth India',
    'bank accounts organizer',
    'insurance policy tracker',
    'family emergency handover',
    'personal video messages',
    'Virasaat waitlist',
    'Virasaat iOS app',
    'Virasaat Android app',
  ],
  authors: [{ name: 'Virasaat Technologies Inc.' }],
  creator: 'Virasaat',
  publisher: 'Virasaat Technologies',
  metadataBase: new URL('https://virasaat.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://virasaat.app',
    title: 'Virasaat (विरासत) — Keep Your Family’s Money & Memories Safe',
    description:
      'Keep all your bank accounts, investments, insurance, and personal video notes safe in one place. Join the waitlist for free early access.',
    siteName: 'Virasaat',
    images: [
      {
        url: '/images/hero-vault.jpg',
        width: 1200,
        height: 630,
        alt: 'Virasaat Vault',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Virasaat — Keep Your Family’s Money & Memories Safe',
    description:
      'Keep all your bank accounts, investments, insurance, and personal video notes safe in one place. Join the waitlist for free early access.',
    images: ['/images/hero-vault.jpg'],
    creator: '@VirasaatApp',
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
    icon: '/favicon.ico',
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,400;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
