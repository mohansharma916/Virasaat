import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield,
  Lock,
  ArrowLeft,
  KeyRound,
  FileCheck2,
  Trash2,
  Clock,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy & Data Protection | Virasat (विरासत)',
  description:
    'How Virasat processes account details and vault content, manages server encryption keys and handles privacy requests.',
  alternates: {
    canonical: '/privacy/',
  },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'October 10, 2026';

  return (
    <div style={{ background: '#021713', color: 'var(--text-primary)', minHeight: '100vh' }}>
      {/* Top Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(4, 36, 30, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(220, 235, 229, 0.14)',
          padding: '16px 0',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0B5D4B 0%, #063F34 100%)',
                border: '1px solid var(--border-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={18} color="#D4AF37" />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.35rem',
                color: 'var(--warm-ivory)',
                fontWeight: 800,
              }}
            >
              VIRASAT
            </span>
          </Link>

          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--sage)',
              textDecoration: 'none',
              fontSize: '0.86rem',
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'rgba(220, 235, 229, 0.08)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <ArrowLeft size={15} />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <section
        style={{
          padding: '60px 0 40px',
          background: 'linear-gradient(180deg, rgba(6, 63, 52, 0.5) 0%, rgba(2, 23, 19, 0) 100%)',
          borderBottom: '1px solid rgba(220, 235, 229, 0.08)',
        }}
      >
        <div className="container" style={{ maxWidth: '880px' }}>
          <div className="glass-pill" style={{ marginBottom: '16px' }}>
            <Lock size={14} color="#D4AF37" />
            <span style={{ color: 'var(--gold-light)', fontWeight: 700 }}>
              SERVER-MANAGED ENCRYPTION
            </span>
            <span style={{ opacity: 0.5 }}>|</span>
            <span style={{ color: 'var(--sage)' }}>Current Product Information</span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)',
              color: 'var(--warm-ivory)',
              lineHeight: 1.18,
              marginBottom: '14px',
            }}
          >
            Privacy Policy & Data Custody
          </h1>

          <p
            style={{
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              marginBottom: '18px',
            }}
          >
            This policy describes the current Virasat service. Vault descriptions and files are encrypted by the server before storage. Virasat manages the encryption keys; authorized server processes can decrypt content. Automated family handover and recipient access are currently unavailable.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="#ECC862" />
              <span>Last Updated: {lastUpdated}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileCheck2 size={14} color="#35B86B" />
              <span>Effective Date: October 10, 2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container" style={{ maxWidth: '880px', padding: '50px 20px 80px' }}>
        {/* Core Guarantee Card */}
        <div
          className="glass-card-gold"
          style={{
            background: 'rgba(6, 40, 33, 0.85)',
            border: '1px solid var(--border-gold)',
            borderRadius: '20px',
            padding: '28px',
            marginBottom: '44px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <KeyRound size={22} color="#D4AF37" />
            <h2 style={{ fontSize: '1.25rem', color: 'var(--warm-ivory)', margin: 0, fontWeight: 700 }}>
              How Vault Encryption Works
            </h2>
          </div>
          <p style={{ color: 'var(--sage)', fontSize: '0.94rem', lineHeight: 1.65, margin: 0 }}>
            Descriptions and uploaded files reach the authenticated API before <strong>AES-256-GCM encryption</strong> on the server. The current service uses a server-managed master key to protect content encryption keys. <strong>Virasat has technical access to decrypt vault content.</strong> Basic metadata, including titles and categories, is stored separately and is not encrypted by this vault-content mechanism.
          </p>
        </div>

        {/* Section 1 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--warm-ivory)', marginBottom: '14px', fontWeight: 700 }}>
            1. Who We Are & Data Fiduciary Details
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '14px' }}>
            <strong>Virasat Technologies Inc.</strong> (&quot;Virasat&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides vault record organization, server-encrypted content storage and check-in tools. Verified family handover is planned and disabled in the current service. The service is being developed through our mobile applications (iOS and Android) and website.
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            For the purposes of the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act, India)</strong>, the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 (&quot;SPDI Rules&quot;), and applicable global privacy statutes, Virasat acts as a <strong>Data Fiduciary</strong> regarding basic account metadata and as a secure encrypted custodian regarding vault ciphertext.
          </p>
        </section>

        {/* Section 2 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--warm-ivory)', marginBottom: '14px', fontWeight: 700 }}>
            2. Categories of Information We Process
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                background: 'rgba(11, 93, 75, 0.16)',
                border: '1px solid rgba(220, 235, 229, 0.14)',
                borderRadius: '14px',
                padding: '18px',
              }}
            >
              <h3 style={{ fontSize: '1.05rem', color: 'var(--warm-ivory)', marginBottom: '6px' }}>
                A. Account & Contact Information (Plaintext Metadata)
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                When you register on our website or mobile app, we collect your <strong>full name</strong>, <strong>email address</strong>, <strong>country of residence</strong>, <strong>mobile operating system preference (iOS / Android)</strong>, and communication language where provided. This data is used for account verification, check-in recording and relevant account or waitlist notices.
              </p>
            </div>

            <div
              style={{
                background: 'rgba(11, 93, 75, 0.16)',
                border: '1px solid rgba(220, 235, 229, 0.14)',
                borderRadius: '14px',
                padding: '18px',
              }}
            >
              <h3 style={{ fontSize: '1.05rem', color: 'var(--warm-ivory)', marginBottom: '6px' }}>
                B. Vault Items & Personal Media
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                Vault records can include financial references, document descriptions, personal messages and supported media files. <strong>Descriptions and files are encrypted on the server before storage.</strong> Account and item metadata are stored in the database; Virasat operates the keys needed to decrypt vault content.
              </p>
            </div>

            <div
              style={{
                background: 'rgba(11, 93, 75, 0.16)',
                border: '1px solid rgba(220, 235, 229, 0.14)',
                borderRadius: '14px',
                padding: '18px',
              }}
            >
              <h3 style={{ fontSize: '1.05rem', color: 'var(--warm-ivory)', marginBottom: '6px' }}>
                C. Trusted Family Contacts (Nominees)
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                You may supply the name, mobile phone number, relationship and email address of intended trusted people. Obtain their permission before saving their details. Saving them does not send an invitation, verify their identity or grant vault access; these workflows are currently unavailable.
              </p>
            </div>

            <div
              style={{
                background: 'rgba(11, 93, 75, 0.16)',
                border: '1px solid rgba(220, 235, 229, 0.14)',
                borderRadius: '14px',
                padding: '18px',
              }}
            >
              <h3 style={{ fontSize: '1.05rem', color: 'var(--warm-ivory)', marginBottom: '6px' }}>
                D. Operational Heartbeat & Telemetry Data
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                We log heartbeat check-in confirmation timestamps, app crash reports, and device identifiers (device model, OS version). We maintain <strong>zero third-party advertising SDKs</strong> and <strong>never engage in cross-app behavioral tracking</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--warm-ivory)', marginBottom: '14px', fontWeight: 700 }}>
            3. Legal Grounds for Processing (DPDP Act & SPDI)
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '14px' }}>
            We use the information you provide to operate account verification, vault organization, check-in recording and waitlist updates. Planned handover capabilities are not an active processing workflow in the current service.
          </p>
          <div
            style={{
              background: 'rgba(53, 184, 107, 0.1)',
              border: '1px solid rgba(53, 184, 107, 0.3)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <FileCheck2 size={16} color="#35B86B" />
              <strong style={{ color: '#35B86B', fontSize: '0.92rem' }}>
                Trusted People & Data Requests
              </strong>
            </div>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
              A saved trusted person is an organizational record. It does not itself activate data-rights nomination, financial inheritance or a release of vault content. Contact us about data access requests; verified recipient workflows are still being developed.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--warm-ivory)', marginBottom: '14px', fontWeight: 700 }}>
            4. Check-Ins & Planned Family Handover
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '12px' }}>
            The current service records check-in activity. It does not determine whether a user is alive or healthy and does not provide an emergency response service:
          </p>
          <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '22px', marginBottom: '14px' }}>
            <li><strong>Check-Ins:</strong> Configure available schedule settings and confirm activity within your account.</li>
            <li><strong>Reminders:</strong> Scheduled delivery, SMS, push notifications and vacation pause are not currently available.</li>
            <li><strong>Release Controls:</strong> A missed check-in does not authorize access or start an automatic release countdown.</li>
            <li><strong>Recipient Access:</strong> Invitations, acceptance, recipient verification and family handover are planned and currently disabled.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--warm-ivory)', marginBottom: '14px', fontWeight: 700 }}>
            5. Data Storage, Residency & Security Controls
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '14px' }}>
            The deployment uses AWS services configured for the Mumbai region. Descriptions and uploaded files use server-managed encryption; metadata and account records remain accessible to authorized service processes. This statement is not a certification of data-residency compliance.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '14px',
            }}
          >
            <div style={{ background: 'rgba(6, 40, 33, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ color: '#ECC862', fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>
                Device Biometrics
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--sage)' }}>
                Supported devices perform biometric checks through the operating system to protect app access. Those checks do not derive or hold the server encryption key.
              </div>
            </div>

            <div style={{ background: 'rgba(6, 40, 33, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ color: '#ECC862', fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>
                HTTPS & AES-256-GCM
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--sage)' }}>
                Production API access uses HTTPS. Descriptions and files are encrypted using AES-256-GCM on the server before storage.
              </div>
            </div>

            <div style={{ background: 'rgba(6, 40, 33, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ color: '#ECC862', fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>
                Server Key Custody
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--sage)' }}>
                The server processes plaintext during upload and authorized retrieval. Key protection, access controls and metadata privacy are part of the security boundary.
              </div>
            </div>
          </div>
        </section>

        {/* Section 6 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--warm-ivory)', marginBottom: '14px', fontWeight: 700 }}>
            6. Zero Commercialization & Sub-Processor Disclosures
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '12px' }}>
            <strong>We do not sell, rent, monetize, or trade your personal or financial data under any circumstance.</strong> Our business model relies exclusively on premium subscription tiers, never on advertising or behavioral data mining.
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '10px' }}>
            The service uses the following infrastructure providers:
          </p>
          <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '22px' }}>
            <li><strong>AWS (Amazon Web Services):</strong> Encrypted cloud object storage & PostgreSQL compute (Mumbai, India).</li>
            <li><strong>Google Identity Services:</strong> Optional single sign-on authentication.</li>
            <li><strong>Transactional Email Provider:</strong> For supported account and waitlist messages. SMS and push delivery are not currently available.</li>
            <li><strong>Google Fonts:</strong> The website requests font files from Google, which receives the request metadata, including the IP address.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--warm-ivory)', marginBottom: '14px', fontWeight: 700 }}>
            7. Privacy Requests & Unavailable Account Deletion
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '14px' }}>
            You can contact the privacy address below about access, correction, consent withdrawal or deletion. <strong>Automated account deletion is not currently available.</strong> The app does not accept a deletion request it cannot execute.
          </p>
          <div
            style={{
              background: 'rgba(217, 74, 74, 0.12)',
              border: '1px solid rgba(217, 74, 74, 0.4)',
              borderRadius: '12px',
              padding: '16px 20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Trash2 size={16} color="#D94A4A" />
              <strong style={{ color: '#FFBABA', fontSize: '0.92rem' }}>
                Account Deletion Is Unavailable
              </strong>
            </div>
            <p style={{ color: 'var(--warm-ivory)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
              The app currently reports that the deletion lifecycle is not configured and leaves your account unchanged. Contact the privacy address below to discuss a privacy request. A complete deletion workflow must address account records, stored files, retention and backups. The shared server master key is not a per-user key. No automatic purge or immediate cryptographic erasure is currently provided.
            </p>
          </div>
        </section>

        {/* Section 8 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--warm-ivory)', marginBottom: '14px', fontWeight: 700 }}>
            8. Privacy Contact & Requests
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '14px' }}>
            For questions about how the current service handles your information or to raise a privacy request, use the following contact:
          </p>
          <div
            style={{
              background: 'rgba(6, 40, 33, 0.85)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '20px',
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--warm-ivory)', marginBottom: '4px' }}>
              Privacy & Data Requests
            </div>
            <div style={{ color: 'var(--sage)', fontSize: '0.9rem', marginBottom: '8px' }}>
              Name: Mohan Sharma · Virasat Technologies Inc.
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Email:{' '}
              <a href="mailto:privacy@virasat.app" style={{ color: '#ECC862', textDecoration: 'none' }}>
                privacy@virasat.app
              </a>{' '}
              / <a href="mailto:mohansharma916@gmail.com" style={{ color: '#ECC862', textDecoration: 'none' }}>mohansharma916@gmail.com</a>
              <br />
              Please describe your request and the account or waitlist email it relates to. Do not email account passwords or private vault contents.
            </div>
          </div>
        </section>

        {/* Navigation to Terms */}
        <div
          style={{
            borderTop: '1px solid rgba(220, 235, 229, 0.12)',
            paddingTop: '30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <Link
            href="/terms"
            style={{
              color: '#ECC862',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.92rem',
            }}
          >
            Read Terms & Conditions &rarr;
          </Link>
          <Link
            href="/"
            style={{
              color: 'var(--text-muted)',
              textDecoration: 'none',
              fontSize: '0.86rem',
            }}
          >
            &copy; {new Date().getFullYear()} Virasat Technologies Inc. All rights reserved.
          </Link>
        </div>
      </main>
    </div>
  );
}
