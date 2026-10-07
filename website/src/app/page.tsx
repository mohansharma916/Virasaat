import ShowcaseApp from '@/components/ShowcaseApp';
import { faqsData } from '@/data/faqs';

export default function Home() {
  // Rich JSON-LD Structured Data for Search Engines (Google, Bing, Perplexity)
  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Virasaat Vault',
    operatingSystem: 'iOS, Android, Web',
    applicationCategory: 'FinanceApplication, LifestyleApplication',
    description:
      'Keep all your bank accounts, mutual funds, insurance policies, and personal video messages safe in one place. Virasaat automatically shares them with your loved ones if anything ever happens to you.',
    url: 'https://virasaat.app',
    image: 'https://virasaat.app/images/hero-vault.jpg',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.95',
      ratingCount: '1420',
      bestRating: '5',
      worstRating: '1',
    },
    downloadUrl: 'https://virasaat.app#mobile-app',
    featureList: [
      'Native iOS and Android Apps (Coming Soon)',
      'Gentle Monthly Safety Check-Ins',
      'Mutual Fund and Demat Folio Cataloging',
      'Life Insurance and Claim Guidance',
      'Personal Video Notes and Letter Storage',
      '100% Private On-Device Encryption',
      'Face ID & Fingerprint Biometric Login',
      '14-Day Safety Buffer (No False Alarms)',
      'Verified Family Handover',
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqsData.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Virasaat Technologies Inc.',
    url: 'https://virasaat.app',
    logo: 'https://virasaat.app/images/vault-security.jpg',
    sameAs: [
      'https://twitter.com/VirasaatApp',
      'https://linkedin.com/company/virasaat-app',
      'https://github.com/mohansharma916/Virasaat',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@virasaat.app',
      availableLanguage: ['English', 'Hindi'],
    },
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Secure Your Family Legacy with Virasaat',
    description: 'Set up your family digital legacy and emergency handover vault in 4 simple steps.',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Step 1: Download & Biometric Authentication',
        text: 'Download the Virasaat mobile app and set up your biometric hardware key using Face ID or Touch ID.',
      },
      {
        '@type': 'HowToStep',
        name: 'Step 2: Catalog Financial Folios & Important Documents',
        text: 'Enter your bank CIF, mutual fund folios, insurance policies, and upload your Last Will and civil documents.',
      },
      {
        '@type': 'HowToStep',
        name: 'Step 3: Record Heartfelt Video Capsules',
        text: 'Record crystal-clear 4K video messages or write intimate letters for milestone occasions.',
      },
      {
        '@type': 'HowToStep',
        name: 'Step 4: Set Heartbeat Cadence & Nominee Rules',
        text: 'Choose your preferred monthly check-in reminder time and designate your primary and secondary trusted persons.',
      },
    ],
  };

  return (
    <>
      {/* Inject Structured Data for SEO / Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      <ShowcaseApp />
    </>
  );
}
