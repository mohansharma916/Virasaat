'use client';

import React from 'react';
import Image from 'next/image';
import {
  ShieldCheck,
  Lock,
  Cpu,
  FileCheck2,
  EyeOff,
  Database,
  Fingerprint,
} from 'lucide-react';

export default function SecurityArchitecture() {
  const securityFeatures = [
    {
      icon: Lock,
      title: 'Encrypted on Your Device',
      desc: 'All documents, accounts, and video notes are locked right on your phone before being saved.',
    },
    {
      icon: EyeOff,
      title: 'Zero-Knowledge Privacy',
      desc: 'Even our team and engineers cannot read your documents or view your personal messages.',
    },
    {
      icon: Fingerprint,
      title: 'Face ID & Fingerprint Login',
      desc: 'Only you can open the app using your smartphone’s built-in biometric security.',
    },
    {
      icon: Cpu,
      title: 'Safe Handover Keys',
      desc: 'Handover keys are protected and only unlock when the safety check triggers and your nominee verifies.',
    },
    {
      icon: Database,
      title: 'Safe Cloud Backup',
      desc: 'Your encrypted vault is safely backed up so you never lose access if you change your phone.',
    },
    {
      icon: FileCheck2,
      title: 'Zero Ads, Zero Data Selling',
      desc: 'We never sell your data or share your details with banks, brokers, or third-party advertisers.',
    },
  ];

  return (
    <section id="security" className="section" style={{ position: 'relative' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 54px' }}>
          <div className="glass-pill" style={{ marginBottom: '16px', borderColor: 'rgba(53, 184, 107, 0.4)' }}>
            <ShieldCheck size={15} color="#35B86B" />
            <span style={{ color: '#EAF4F0' }}>Privacy & Security</span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(2rem, 3.8vw, 3rem)',
              color: 'var(--warm-ivory)',
              marginBottom: '16px',
            }}
          >
            Bank-Grade Security. <br />
            <span className="text-gradient-gold">100% Private to You.</span>
          </h2>

          <p style={{ fontSize: '1.08rem', color: 'var(--text-secondary)' }}>
            Your family’s financial accounts and heartfelt memories deserve complete protection. Only you and your chosen family have the keys.
          </p>
        </div>

        {/* Top Showcase: Feature Visual + Overview */}
        <div
          className="glass-card"
          style={{
            background: 'rgba(5, 34, 28, 0.85)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '24px',
            padding: '36px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '40px',
              alignItems: 'center',
            }}
          >
            {/* Visual Graphic */}
            <div style={{ position: 'relative', height: '300px', borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(220, 235, 229, 0.15)' }}>
              <Image
                src="/images/vault-security.jpg"
                alt="Virasaat Security"
                fill
                style={{ objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(4, 27, 22, 0.85) 0%, transparent 60%)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  right: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="#D4AF37" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFF' }}>
                    Hardware Face ID Protection
                  </span>
                </div>
                <span className="glass-pill" style={{ padding: '3px 10px', fontSize: '0.72rem' }}>
                  100% Encrypted
                </span>
              </div>
            </div>

            {/* Explanation text */}
            <div>
              <div style={{ fontSize: '0.78rem', color: '#ECC862', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '8px' }}>
                PRIVACY GUARANTEE
              </div>
              <h3
                style={{
                  fontSize: 'clamp(1.4rem, 2.1vw, 1.85rem)',
                  color: 'var(--warm-ivory)',
                  marginBottom: '12px',
                }}
              >
                We Cannot See Your Data. <br />
                Even If We Wanted To.
              </h3>
              <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '16px' }}>
                When you list an account or save a personal video in Virasaat, the encryption happens locally on your smartphone before anything is saved.
              </p>
              <p style={{ fontSize: '0.94rem', color: 'var(--sage)', lineHeight: 1.65, margin: 0 }}>
                Our servers only hold scrambled, unreadable data. You hold the master key right on your phone.
              </p>
            </div>
          </div>
        </div>

        {/* 6 Security Pillars Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {securityFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="glass-card"
                style={{
                  padding: '26px 22px',
                  background: 'rgba(6, 40, 33, 0.45)',
                  border: '1px solid rgba(220, 235, 229, 0.1)',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'rgba(212, 175, 55, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <Icon size={20} color="#D4AF37" />
                </div>
                <h4 style={{ fontSize: '1.05rem', color: 'var(--warm-ivory)', marginBottom: '8px' }}>
                  {feat.title}
                </h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
