import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield,
  Lock,
  ArrowLeft,
  KeyRound,
  FileCheck2,
  Users2,
  Database,
  Trash2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy & Data Protection | Virasaat (विरासत)',
  description:
    'Virasaat zero-knowledge privacy policy. How we safeguard your bank accounts, investments, personal videos, and family handover data in full compliance with the DPDP Act 2023.',
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
              VIRASAAT
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
              ZERO-KNOWLEDGE ARCHITECTURE
            </span>
            <span style={{ opacity: 0.5 }}>|</span>
            <span style={{ color: 'var(--sage)' }}>DPDP Act 2023 Compliant</span>
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
            At Virasaat, your financial secrets and personal family memories are sacred. We engineered our entire platform on a <strong>Zero-Knowledge Cryptographic Model</strong>: your data is encrypted directly on your phone with keys that only you and your designated loved ones ever hold.
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
              <span>Effective Date: November 1, 2026</span>
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
              The Virasaat Zero-Knowledge Promise
            </h2>
          </div>
          <p style={{ color: 'var(--sage)', fontSize: '0.94rem', lineHeight: 1.65, margin: 0 }}>
            Every bank account number, locker location, insurance policy, mutual fund entry, will draft, and personal video note is encrypted on your hardware device using <strong>AES-256-GCM encryption</strong>. Virasaat engineers, administrators, and servers <strong>do not possess your decryption keys</strong> and cannot read your private vault under any circumstances—even under legal subpoena or physical server inspection.
          </p>
        </div>

        {/* Section 1 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--warm-ivory)', marginBottom: '14px', fontWeight: 700 }}>
            1. Who We Are & Data Fiduciary Details
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '14px' }}>
            <strong>Virasaat Technologies Inc.</strong> (&quot;Virasaat&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides zero-knowledge encrypted vault storage, digital heritage organization, and automated inactivity-triggered asset handover workflows through our mobile applications (iOS and Android) and website.
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            For the purposes of the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act, India)</strong>, the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 (&quot;SPDI Rules&quot;), and applicable global privacy statutes, Virasaat acts as a <strong>Data Fiduciary</strong> regarding basic account metadata and as a secure encrypted custodian regarding vault ciphertext.
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
                When you register on our website or mobile app, we collect your <strong>full name</strong>, <strong>email address</strong>, <strong>country of residence</strong>, <strong>mobile operating system preference (iOS / Android)</strong>, and communication language. This data is strictly used for account identity, monthly security check-ins, and transactional notices.
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
                B. Vault Items & Personal Media (Client-Side Encrypted Ciphertext)
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                Financial assets (bank accounts, Demat IDs, fixed deposits, mutual funds, insurance policies, locker combinations, property references) and personal media (video messages, handwritten letters, audio notes, will drafts). <strong>All such data is encrypted on your device prior to cloud backup.</strong> We only store unreadable encrypted binary blobs on our secure AWS cloud infrastructure.
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
                To enable automated handover, you may supply the name, mobile phone number, relationship, and email address of your designated recipients. You confirm you have their consent to provide these details solely for handover notifications.
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
            Under the Indian DPDP Act 2023, we process personal data based on your explicit, informed consent for the specified purpose of digital estate organization and emergency succession handover.
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
                Section 14 Statutory Nomination Right (DPDP Act 2023)
              </strong>
            </div>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
              Section 14 of the DPDP Act guarantees every Data Principal the right to nominate any other individual who, in the event of death or incapacity of the Data Principal, shall exercise their data rights. Virasaat directly fulfills this statutory right through its encrypted handover workflows.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--warm-ivory)', marginBottom: '14px', fontWeight: 700 }}>
            4. The Heartbeat Protocol: Inactivity Handover Safeguards
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '12px' }}>
            Virasaat operates an automated inactivity verification protocol designed with redundant fail-safes to ensure <strong>zero false alarms</strong>:
          </p>
          <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '22px', marginBottom: '14px' }}>
            <li><strong>Cadence Check-Ins:</strong> You select your routine check-in cadence (every 30, 60, or 90 days) via 1-tap push notification or email confirmation.</li>
            <li><strong>Gentle Reminder Escalations:</strong> If a scheduled check-in is missed, automated reminders are dispatched via SMS, Email, and Push Notifications over multiple consecutive weeks.</li>
            <li><strong>Mandatory Safety Buffer Window:</strong> A 14 to 30-day grace window must elapse without response before handover eligibility is reached.</li>
            <li><strong>Recipient Verification:</strong> Handover instructions and decryption capabilities are only unlocked for verified trusted persons following independent two-factor authentication.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--warm-ivory)', marginBottom: '14px', fontWeight: 700 }}>
            5. Data Storage, Residency & Security Controls
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '14px' }}>
            All encrypted vault backups and databases are hosted in <strong>Amazon Web Services (AWS ap-south-1 Mumbai region)</strong>, fulfilling Indian domestic data residency standards.
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
                Hardware Secure Enclave
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--sage)' }}>
                Biometric Face ID / Fingerprint auth keys are bound directly to your phone hardware and never leave your device.
              </div>
            </div>

            <div style={{ background: 'rgba(6, 40, 33, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ color: '#ECC862', fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>
                TLS 1.3 & AES-256-GCM
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--sage)' }}>
                Military-grade authenticated encryption at rest and in transit across all network communications.
              </div>
            </div>

            <div style={{ background: 'rgba(6, 40, 33, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ color: '#ECC862', fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>
                Zero Plaintext Exposure
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--sage)' }}>
                Even in the hypothetical event of a database breach, attackers obtain only mathematically uncrackable ciphertext.
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
            We engage only essential, audited infrastructure sub-processors:
          </p>
          <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '22px' }}>
            <li><strong>AWS (Amazon Web Services):</strong> Encrypted cloud object storage & PostgreSQL compute (Mumbai, India).</li>
            <li><strong>Google Identity Services:</strong> Optional single sign-on authentication.</li>
            <li><strong>Transactional Email / SMS Gateways:</strong> For sending heartbeat verification links and security alerts.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--warm-ivory)', marginBottom: '14px', fontWeight: 700 }}>
            7. Your Rights: Right to Erasure & Account Deletion
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '14px' }}>
            In full accordance with Apple App Store Guideline 5.1.1(v), Google Play User Data policies, and Section 12 of the DPDP Act 2023, you hold the complete, unhindered <strong>Right to be Forgotten</strong>:
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
                Instant In-App Account Deletion
              </strong>
            </div>
            <p style={{ color: 'var(--warm-ivory)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
              You may initiate complete account deletion at any time directly within the mobile application under <strong>Profile &rarr; Delete Account</strong>. When confirmed, all encryption keys are invalidated, all ciphertext vault files on S3 are permanently purged, and your database record is expunged within 30 days.
            </p>
          </div>
        </section>

        {/* Section 8 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--warm-ivory)', marginBottom: '14px', fontWeight: 700 }}>
            8. Data Protection Officer & Grievance Redressal
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '14px' }}>
            Pursuant to the DPDP Act 2023 and Rule 5(9) of the Information Technology (SPDI) Rules, 2011, Virasaat has appointed a dedicated Data Protection & Grievance Officer:
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
              Data Protection & Grievance Redressal Officer
            </div>
            <div style={{ color: 'var(--sage)', fontSize: '0.9rem', marginBottom: '8px' }}>
              Name: Mohan Sharma · Virasaat Technologies Inc.
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Email:{' '}
              <a href="mailto:privacy@virasaat.app" style={{ color: '#ECC862', textDecoration: 'none' }}>
                privacy@virasaat.app
              </a>{' '}
              / <a href="mailto:mohansharma916@gmail.com" style={{ color: '#ECC862', textDecoration: 'none' }}>mohansharma916@gmail.com</a>
              <br />
              Response SLA: All data subject inquiries and grievances will be acknowledged within 24 hours and resolved within 72 hours.
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
            &copy; {new Date().getFullYear()} Virasaat Technologies Inc. All rights reserved.
          </Link>
        </div>
      </main>
    </div>
  );
}
