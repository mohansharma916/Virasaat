import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield,
  ArrowLeft,
  Scale,
  AlertTriangle,
  Lock,
  HeartHandshake,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  Gavel,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms & Conditions (Digital Custody Agreement) | Virasaat (विरासत)',
  description:
    'Terms of service, digital custody agreements, heartbeat protocol rules, and testamentary legal disclaimers for the Virasaat mobile application and platform.',
  alternates: {
    canonical: '/terms/',
  },
};

export default function TermsAndConditionsPage() {
  const lastUpdated = 'October 10, 2026';

  return (
    <div style={{ background: '#021713', color: 'var(--text-primary)', minHeight: '100vh' }}>
      {/* Header */}
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
            <Scale size={14} color="#D4AF37" />
            <span style={{ color: 'var(--gold-light)', fontWeight: 700 }}>
              TERMS OF SERVICE
            </span>
            <span style={{ opacity: 0.5 }}>|</span>
            <span style={{ color: 'var(--sage)' }}>Digital Custody Agreement</span>
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
            Terms & Conditions
          </h1>

          <p
            style={{
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              marginBottom: '18px',
            }}
          >
            Please read this Digital Custody Agreement carefully before creating a vault on Virasaat. By creating an account, you enter into a legally binding contract with Virasaat Technologies Inc.
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
              <span>Last Revised: {lastUpdated}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Gavel size={14} color="#35B86B" />
              <span>Governing Jurisdiction: New Delhi, India</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Body */}
      <main className="container" style={{ maxWidth: '880px', padding: '50px 20px 80px' }}>
        {/* MANDATORY LEGAL & TESTAMENTARY DISCLAIMER BOX */}
        <div
          style={{
            background: 'rgba(212, 175, 55, 0.1)',
            border: '2px solid rgba(212, 175, 55, 0.5)',
            borderRadius: '20px',
            padding: '28px',
            marginBottom: '44px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <AlertTriangle size={24} color="#ECC862" />
            <h2
              style={{
                fontSize: '1.25rem',
                color: '#F3E5AB',
                margin: 0,
                fontWeight: 800,
                letterSpacing: '0.02em',
              }}
            >
              CRITICAL LEGAL & SUCCESSION NOTICE
            </h2>
          </div>

          <p style={{ color: 'var(--warm-ivory)', fontSize: '0.94rem', lineHeight: 1.7, marginBottom: '12px' }}>
            <strong>1. Not a Substitute for a Legal Will:</strong> Virasaat is a technological organization, zero-knowledge digital custody, and emergency handover orchestration platform. <strong>Virasaat does not act as a law firm, wealth management fiduciary, or court of probate.</strong>
          </p>
          <p style={{ color: 'var(--warm-ivory)', fontSize: '0.94rem', lineHeight: 1.7, marginBottom: '12px' }}>
            <strong>2. No Alteration of Statutory Heirship:</strong> Providing your bank details, insurance policies, or locker instructions to designated recipients via Virasaat does <em>not</em> legally substitute for a formal registered Last Will and Testament, nor does it override statutory succession rights governed by the <strong>Indian Succession Act, 1925</strong>, the <strong>Hindu Succession Act, 1956</strong>, <strong>Muslim Personal Law (Shariat)</strong>, or corresponding jurisdictional succession statutes.
          </p>
          <p style={{ color: 'var(--warm-ivory)', fontSize: '0.94rem', lineHeight: 1.7, margin: 0 }}>
            <strong>3. Informational Roadmap:</strong> Virasaat is designed to prevent your family from losing awareness of your ₹1.5+ Lakh Crore in forgotten accounts. Users are encouraged to execute their formal legal testamentary instruments in accordance with local statutes.
          </p>
        </div>

        {/* Section 1 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--warm-ivory)', marginBottom: '14px', fontWeight: 700 }}>
            1. Eligibility & Account Creation
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '12px' }}>
            To register an account on the Virasaat mobile app or website, you must:
          </p>
          <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '22px' }}>
            <li>Be at least 18 years of age or the age of majority in your jurisdiction.</li>
            <li>Possess the full legal capacity to enter into binding digital contracts.</li>
            <li>Provide accurate, genuine contact details for identity verification and safety check-ins.</li>
            <li>Maintain exclusive physical and biometric control over the mobile device running the application.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--warm-ivory)', marginBottom: '14px', fontWeight: 700 }}>
            2. Zero-Knowledge Cryptography & User Key Custody
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '14px' }}>
            Virasaat employs a zero-knowledge architecture. You acknowledge and agree to the following technical realities:
          </p>
          <div
            style={{
              background: 'rgba(6, 40, 33, 0.75)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '20px',
            }}
          >
            <ul style={{ color: 'var(--sage)', lineHeight: 1.7, paddingLeft: '20px', margin: 0 }}>
              <li><strong>Local Encryption:</strong> Your vault assets are encrypted locally on your phone using keys derived from your passphrase and device hardware enclave prior to cloud synchronization.</li>
              <li><strong>No Master Backdoor:</strong> Virasaat does not hold a master recovery key. If you forget your passphrase, lose access to your biometric device, and have not configured an active heartbeat handover fallback, <strong>Virasaat cannot recover your encrypted data</strong>.</li>
              <li><strong>Device Security:</strong> You are solely responsible for preventing unauthorized physical or biometric access to your smartphone.</li>
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--warm-ivory)', marginBottom: '14px', fontWeight: 700 }}>
            3. The Heartbeat Handover Protocol Agreement
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '12px' }}>
            By enabling the Virasaat Heartbeat Protocol, you explicitly authorize and instruct Virasaat to carry out automated succession release workflows under the following agreed conditions:
          </p>
          <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '22px', marginBottom: '14px' }}>
            <li><strong>Obligation to Check In:</strong> You agree to respond to periodic safety check-ins according to your chosen cadence (monthly or quarterly).</li>
            <li><strong>Automated Escalation:</strong> If you miss a scheduled check-in, our automated systems will initiate escalation notifications via Push Notifications, SMS, and registered email.</li>
            <li><strong>Grace Period Window:</strong> Handover will <em>never</em> trigger prematurely. A mandatory safety grace period (minimum 14 to 30 days) must fully elapse without any response before handover eligibility is attained.</li>
            <li><strong>Release Authorization:</strong> Once the safety grace period expires with zero response across all channels, you irrevocably authorize Virasaat to contact your verified trusted contacts and release the digital asset roadmap and instructions you designated for each recipient.</li>
            <li><strong>Release Immunity:</strong> Virasaat shall not be held liable for any damages or disclosures resulting from handover executed in accordance with your configured settings if you failed to respond to reminders during the grace window.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--warm-ivory)', marginBottom: '14px', fontWeight: 700 }}>
            4. Nominees & Trusted Person Designations
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '12px' }}>
            When designating family members, spouses, children, or financial advisers as trusted recipients:
          </p>
          <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '22px' }}>
            <li>You warrant that you have obtained their authorization to record their contact information on the platform.</li>
            <li>You acknowledge that Virasaat delivers the digital roadmap and encrypted notes you entered. Virasaat does not manage the underlying bank accounts, claim insurance proceeds, or arbitrate inheritance disputes among legal heirs.</li>
            <li>Recipients must undergo independent phone and email identity verification before viewing handover notes.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--warm-ivory)', marginBottom: '14px', fontWeight: 700 }}>
            5. Subscriptions, Founding Waitlist & Billing
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                background: 'rgba(11, 93, 75, 0.16)',
                border: '1px solid rgba(220, 235, 229, 0.14)',
                borderRadius: '12px',
                padding: '16px 20px',
              }}
            >
              <h3 style={{ fontSize: '1rem', color: 'var(--warm-ivory)', marginBottom: '4px' }}>
                Founding Waitlist Free Lifetime Tier
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                Early founding members who join the official waitlist and verify their email receive free lifetime access to the Core Vault tier, including financial account cataloging, document storage, personal video notes, and heartbeat check-in protocol.
              </p>
            </div>

            <div
              style={{
                background: 'rgba(11, 93, 75, 0.16)',
                border: '1px solid rgba(220, 235, 229, 0.14)',
                borderRadius: '12px',
                padding: '16px 20px',
              }}
            >
              <h3 style={{ fontSize: '1rem', color: 'var(--warm-ivory)', marginBottom: '4px' }}>
                Premium Tiers & In-App Purchases
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                Advanced tiers offering high-capacity 4K video note storage, multi-nominee cryptographic threshold recovery, and priority concierge are billed annually or monthly through Apple App Store (In-App Purchases) or Google Play Billing in compliance with platform guidelines.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--warm-ivory)', marginBottom: '14px', fontWeight: 700 }}>
            6. Acceptable Use & Prohibited Content
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '12px' }}>
            You agree not to use Virasaat to store or transmit:
          </p>
          <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '22px' }}>
            <li>Malicious code, spyware, or keyloggers.</li>
            <li>Stolen payment instruments or unauthorized credentials of third parties without consent.</li>
            <li>Child sexual abuse material (CSAM) or content violating Indian penal laws and international statutes.</li>
            <li>Any materials infringing third-party copyrights or intellectual property.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--warm-ivory)', marginBottom: '14px', fontWeight: 700 }}>
            7. User Content Ownership & Intellectual Property
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '14px' }}>
            You retain <strong>100% intellectual property ownership</strong> of all notes, letters, images, videos, and documents you upload to your Virasaat vault. Virasaat claims zero copyright, ownership, or licensing rights over your personal memories.
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            The Virasaat trademark, brand identity, UI design, client-side encryption algorithms, and source code are the exclusive property of Virasaat Technologies Inc.
          </p>
        </section>

        {/* Section 8 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--warm-ivory)', marginBottom: '14px', fontWeight: 700 }}>
            8. Limitation of Liability
          </h2>
          <div
            style={{
              background: 'rgba(6, 40, 33, 0.75)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '20px',
            }}
          >
            <p style={{ color: 'var(--sage)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, VIRASAAT TECHNOLOGIES INC. AND ITS DIRECTORS, EMPLOYEES, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOSS OF BANK ASSETS, LOSS OF PROFITS, BANKING DISPUTES, SUCCESSION DISPUTES AMONG NOMINEES AND STATUTORY HEIRS, OR UNRECOVERABLE CIPHERTEXT RESULTING FROM LOST USER MASTER PASSWORDS. IN NO EVENT SHALL VIRASAAT&apos;S AGGREGATE LIABILITY EXCEED THE TOTAL FEES PAID BY YOU IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>
          </div>
        </section>

        {/* Section 9 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--warm-ivory)', marginBottom: '14px', fontWeight: 700 }}>
            9. Governing Law, Arbitration & Dispute Resolution
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '14px' }}>
            This Agreement shall be governed by and construed in accordance with the <strong>laws of the Republic of India</strong>, without regard to conflict of law principles.
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Any dispute, controversy, or claim arising out of or relating to this contract shall be submitted to binding arbitration in <strong>New Delhi, India</strong>, conducted in English under the Arbitration and Conciliation Act, 1996. The courts of New Delhi, India shall have exclusive jurisdiction for interim relief and enforcement.
          </p>
        </section>

        {/* Section 10 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--warm-ivory)', marginBottom: '14px', fontWeight: 700 }}>
            10. Termination & Permanent Erasure
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '14px' }}>
            You may terminate this Agreement at any time by deleting your account from within the mobile app (<strong>Profile &rarr; Delete Account</strong>). Upon termination:
          </p>
          <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '22px' }}>
            <li>Your encryption keys are revoked and invalidated.</li>
            <li>All encrypted vault files are permanently purged from AWS S3 storage.</li>
            <li>Heartbeat monitoring stops immediately and no future notifications or handovers will occur.</li>
          </ul>
        </section>

        {/* Section 11 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--warm-ivory)', marginBottom: '14px', fontWeight: 700 }}>
            11. Contact & Legal Notices
          </h2>
          <div
            style={{
              background: 'rgba(6, 40, 33, 0.85)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '20px',
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--warm-ivory)', marginBottom: '4px' }}>
              Virasaat Technologies Inc. Legal Department
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Legal Inquiries:{' '}
              <a href="mailto:legal@virasaat.app" style={{ color: '#ECC862', textDecoration: 'none' }}>
                legal@virasaat.app
              </a>{' '}
              / <a href="mailto:mohansharma916@gmail.com" style={{ color: '#ECC862', textDecoration: 'none' }}>mohansharma916@gmail.com</a>
              <br />
              New Delhi, India
            </div>
          </div>
        </section>

        {/* Navigation to Privacy */}
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
            href="/privacy"
            style={{
              color: '#ECC862',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.92rem',
            }}
          >
            &larr; View Privacy Policy
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
