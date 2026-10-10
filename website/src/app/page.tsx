import ShowcaseApp from '@/components/ShowcaseApp';
import { faqsData } from '@/data/faqs';

export default function Home() {
  // Rich JSON-LD Structured Data for Search Engines (Google, Bing, Perplexity)
  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Virasat Vault',
    operatingSystem: 'iOS, Android',
    applicationCategory: 'FinanceApplication',
    description:
      'Organize financial records, documents and personal messages. Automated family handover and recipient access are planned and currently unavailable.',
    url: 'https://virasat.app',
    image: 'https://virasat.app/images/hero-vault.jpg',
    featureList: [
      'Mobile apps in development for iOS and Android',
      'Financial and document record organization',
      'Personal messages and supported file uploads',
      'Server-managed encryption of descriptions and files',
      'Trusted person records and intended item assignments',
      'Check-in schedule settings and activity recording',
      'Automated family handover is not currently available',
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
    name: 'Virasat Technologies Inc.',
    url: 'https://virasat.app',
    logo: 'https://virasat.app/images/vault-security.jpg',
    sameAs: [
      'https://twitter.com/VirasatApp',
      'https://linkedin.com/company/virasat-app',
      'https://github.com/mohansharma916/Virasat',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@virasat.app',
      availableLanguage: ['English', 'Hindi'],
    },
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


      <ShowcaseApp />
    </>
  );
}
