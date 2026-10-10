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
      title: 'Server-Managed Encryption',
      desc: 'Vault descriptions and uploaded files are encrypted by the server before storage.',
    },
    {
      icon: EyeOff,
      title: 'Clear Key Custody',
      desc: 'Virasaat operates the encryption keys. Authorized server processes can decrypt vault content.',
    },
    {
      icon: Fingerprint,
      title: 'Face ID & Fingerprint Login',
      desc: 'Biometrics help protect app access on supported devices. They do not hold the vault encryption key.',
    },
    {
      icon: Cpu,
      title: 'Release Access Disabled',
      desc: 'Automated handover and recipient access are disabled until verified release controls are ready.',
    },
    {
      icon: Database,
      title: 'Safe Cloud Backup',
      desc: 'Stored content is associated with your account. Keep an independent copy of important documents.',
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
            Understand Your Security. <br />
            <span className="text-gradient-gold">Know Who Holds the Keys.</span>
          </h2>

          <p style={{ fontSize: '1.08rem', color: 'var(--text-secondary)' }}>
            Your account controls access to your vault. The current service uses server-managed encryption; basic item titles and categories are stored as metadata.
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
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
                    Account & App Access Protection
                  </span>
                </div>
                <span className="glass-pill" style={{ padding: '3px 10px', fontSize: '0.72rem' }}>
                  Encrypted Vault Content
                </span>
              </div>
            </div>

            {/* Explanation text */}
            <div>
              <div style={{ fontSize: '0.78rem', color: '#ECC862', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '8px' }}>
                CURRENT SECURITY MODEL
              </div>
              <h3
                style={{
                  fontSize: 'clamp(1.4rem, 2.1vw, 1.85rem)',
                  color: 'var(--warm-ivory)',
                  marginBottom: '12px',
                }}
              >
                Encryption at Rest. <br />
                Keys Managed by Virasaat.
              </h3>
              <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '16px' }}>
                Descriptions and uploaded files reach the authenticated API before AES-256-GCM encryption on the server. This is not end-to-end encryption.
              </p>
              <p style={{ fontSize: '0.94rem', color: 'var(--sage)', lineHeight: 1.65, margin: 0 }}>
                Virasaat holds the server encryption key and can decrypt stored content through authorized server processes. Your phone’s biometrics protect app access, not encryption key custody.
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
