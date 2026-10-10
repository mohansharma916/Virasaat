'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, ArrowUp } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        const navOffset = 84;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
        window.history.pushState(null, '', href);
      }
    }
  };

  return (
    <footer
      style={{
        background: '#01120F',
        borderTop: '1px solid rgba(220, 235, 229, 0.12)',
        padding: '70px 0 40px',
        color: 'var(--text-secondary)',
        fontSize: '0.9rem',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '40px',
            marginBottom: '50px',
          }}
        >
          {/* Brand Info */}
          <div style={{ maxWidth: '320px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
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
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#F8F5EA', fontWeight: 800 }}>
                VIRASAT
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>
              The safe, simple way to organize your bank accounts, investments, insurance policies, and personal video notes for your family.
            </p>

            <div style={{ fontSize: '0.78rem', color: '#ECC862', fontFamily: 'monospace' }}>
              SERVER-MANAGED VAULT ENCRYPTION
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 style={{ color: 'var(--warm-ivory)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px' }}>
              Explore
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <a href="#problem" onClick={(e) => handleScrollTo(e, '#problem')} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  Why It Matters
                </a>
              </li>
              <li>
                <a href="#vault" onClick={(e) => handleScrollTo(e, '#vault')} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  What You Can Store
                </a>
              </li>
              <li>
                <a href="#mobile-app" onClick={(e) => handleScrollTo(e, '#mobile-app')} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  Mobile App
                </a>
              </li>
              <li>
                <a href="#how-it-works" onClick={(e) => handleScrollTo(e, '#how-it-works')} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  How It Works
                </a>
              </li>
              <li>
                <a href="#calculator" onClick={(e) => handleScrollTo(e, '#calculator')} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  Calculator
                </a>
              </li>
              <li>
                <a href="#security" onClick={(e) => handleScrollTo(e, '#security')} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  Safety & Privacy
                </a>
              </li>
              <li>
                <a href="#faq" onClick={(e) => handleScrollTo(e, '#faq')} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Security */}
          <div>
            <h4 style={{ color: 'var(--warm-ivory)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px' }}>
              Legal & Compliance
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <Link href="/privacy" style={{ color: '#ECC862', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/terms" style={{ color: '#ECC862', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Terms & Digital Custody</span>
                </Link>
              </li>
              <li>
                <span style={{ color: 'var(--sage)' }}>Biometric App Access on Supported Devices</span>
              </li>
              <li>
                <span style={{ color: 'var(--sage)' }}>Zero Third-Party Ad Tracking</span>
              </li>
              <li>
                <span style={{ color: 'var(--sage)' }}>Server-Managed Encryption Keys</span>
              </li>
              <li>
                <a href="#faq" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  Security & Architecture FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Mobile Apps Column */}
          <div>
            <h4 style={{ color: 'var(--warm-ivory)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px' }}>
              Native Mobile Apps
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <a href="#mobile-app" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📱 Apple iOS (App Store Soon)</span>
                </a>
              </li>
              <li>
                <a href="#mobile-app" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🤖 Google Android (Play Store Soon)</span>
                </a>
              </li>
              <li>
                <a href="#mobile-app" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  Interactive Mobile Preview
                </a>
              </li>
              <li>
                <span style={{ color: 'var(--sage)', fontSize: '0.82rem' }}>
                  Supported Device Biometrics
                </span>
              </li>
              <li>
                <span style={{ color: 'var(--sage)', fontSize: '0.82rem' }}>
                  In-App Check-In Activity
                </span>
              </li>
            </ul>
          </div>

          {/* Mission & Heritage */}
          <div>
            <h4 style={{ color: 'var(--warm-ivory)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px' }}>
              Our Philosophy
            </h4>
            <p
              className="font-handwriting"
              style={{
                fontSize: '1.3rem',
                color: 'var(--warm-ivory)',
                lineHeight: 1.4,
                marginBottom: '14px',
              }}
            >
              &quot;विरासत केवल धन नहीं, बल्कि प्रेम, संस्कार और सुरक्षा की अखंड डोर है।&quot;
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Legacy is not merely financial balance sheets—it is the unbroken thread of love, guidance, and generational security.
            </p>
          </div>
        </div>

        {/* Compliance Disclaimer */}
        <div
          style={{
            borderTop: '1px solid rgba(220, 235, 229, 0.08)',
            paddingTop: '24px',
            marginBottom: '24px',
            fontSize: '0.76rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: 'var(--sage)' }}>Legal & Regulatory Disclaimer:</strong> Virasat provides record organization and server-encrypted vault content. Automated handover, recipient access and scheduled notifications are planned and currently unavailable. Virasat does not act as a law firm, investment advisor, or substitute for formal probate court certification. Users are encouraged to execute their formal legal testamentary wills in accordance with local state and national statutes.
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            borderTop: '1px solid rgba(220, 235, 229, 0.08)',
            paddingTop: '20px',
            fontSize: '0.8rem',
          }}
        >
          <div>
            © {new Date().getFullYear()} Virasat Technologies Inc. All rights reserved.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <Link href="/privacy" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Privacy Policy
            </Link>
            <span style={{ opacity: 0.3 }}>•</span>
            <Link href="/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Terms & Conditions
            </Link>
          </div>

          <button
            onClick={scrollToTop}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--gold-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
            }}
          >
            <span>Back to top</span>
            <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </footer>
  );
}
