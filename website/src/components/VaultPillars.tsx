'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  FileText,
  Video,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Lock,
  Check,
  Layers,
} from 'lucide-react';

interface VaultPillarsProps {
  onOpenWaitlist: () => void;
}

export default function VaultPillars({ onOpenWaitlist }: VaultPillarsProps) {
  const [selectedPillar, setSelectedPillar] = useState(0);

  const pillars = [
    {
      id: 'financial',
      title: 'Bank Accounts & Investments',
      badge: 'Never Lose a Rupee',
      icon: TrendingUp,
      accent: '#ECC862',
      tagline: 'List your bank accounts, mutual funds, and policies so your family never has to guess.',
      description:
        'Financial institutions will not call your family to inform them about accounts. In Virasaat, list all your bank accounts, mutual funds, demat portfolios, and insurance policies so your loved ones get a clear roadmap.',
      features: [
        'Mutual Funds & Stocks: Zerodha, Groww, CAMS, and KFintech folios',
        'Life & Health Insurance: Policy numbers and claim advisor contacts',
        'Bank Accounts & Fixed Deposits: Account details and locker locations',
        'Real Estate & Safe: Property registry numbers and locker key instructions',
      ],
      sampleUI: {
        title: 'HDFC Life & Zerodha Accounts',
        subtitle: '2 Items Cataloged • Encrypted & Private',
        items: ['Zerodha Demat: 12081600••••••••', 'HDFC Life Term Plan: ₹2.5 Cr Cover'],
      },
    },
    {
      id: 'documents',
      title: 'Important Documents & Wills',
      badge: 'Ready for Emergencies',
      icon: FileText,
      accent: '#35B86B',
      tagline: 'Keep your Will, property papers, and identity documents safe and easy to find.',
      description:
        'Save your registered Last Will, medical emergency directions, and identity documents. No more rummaging through old cupboards or bank lockers during an emergency.',
      features: [
        'Registered Will: Clear instructions for your executor',
        'Medical Emergency Directives: Healthcare preferences and doctor contacts',
        'Identity Archive: Aadhaar, PAN, Passport, and OCI copies',
        'Physical Key Notes: Simple instructions on where original papers are kept',
      ],
      sampleUI: {
        title: 'Registered Will & Testament',
        subtitle: 'Bandra West Sub-Registrar #REG-99120',
        items: ['Executor: Adv. Rajesh Singhania', 'Original paper copy: Home Safe Compartment B'],
      },
    },
    {
      id: 'memories',
      title: 'Personal Videos & Letters',
      badge: 'Heartfelt Memories',
      icon: Video,
      accent: '#F4A62A',
      tagline: 'Leave personal video messages and loving words for your children and spouse.',
      description:
        'Record personal video notes and write letters for your children or partner. You can choose to have them delivered for special life moments—like an 18th birthday, graduation, or wedding.',
      features: [
        'Record video notes directly on your phone camera',
        'Write letters with personal advice, values, and blessings',
        'Milestone delivery: Delivered on birthdays or weddings',
        'Keep family stories, lessons, and memories alive forever',
      ],
      sampleUI: {
        title: '"To My Little Girl On Your Wedding Day"',
        subtitle: 'Personal Video Capsule • 12:40 mins',
        items: ['For: Meera (Daughter)', 'Trigger: Handover or Milestone Date'],
      },
    },
    {
      id: 'passkeys',
      title: 'Device & Password Instructions',
      badge: 'Zero Lockout',
      icon: KeyRound,
      accent: '#3D68C5',
      tagline: 'Make sure your family is not permanently locked out of family photos and accounts.',
      description:
        'Help your family access irreplaceable photos, documents, and key online accounts safely without exposing your passwords to anyone today.',
      features: [
        'Emergency instructions for Apple Keychain and password managers',
        'Simple steps for unlocking family laptops and devices in an emergency',
        'Social media legacy guidelines',
        'Google Photos & iCloud family photo recovery guidance',
      ],
      sampleUI: {
        title: 'Emergency Master Access Guide',
        subtitle: 'Encrypted & Released Only on Verified Handover',
        items: ['Apple ID Legacy Contact Configured', 'Home Laptop Emergency Access Notes'],
      },
    },
  ];

  return (
    <section id="vault" className="section" style={{ position: 'relative' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 54px' }}>
          <div className="glass-pill" style={{ marginBottom: '16px' }}>
            <Layers size={15} color="#D4AF37" />
            <span style={{ color: '#F3E5AB' }}>What You Can Store</span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(2rem, 3.8vw, 3rem)',
              color: 'var(--warm-ivory)',
              marginBottom: '16px',
            }}
          >
            Everything Your Family Needs, <br />
            <span className="text-gradient-gold">Kept Safe in One Simple Place.</span>
          </h2>

          <p style={{ fontSize: '1.08rem', color: 'var(--text-secondary)' }}>
            Set it up once in 10 minutes. 100% private today—and automatically shared with your family only when you decide.
          </p>
        </div>

        {/* 4 Interactive Selector Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '36px',
          }}
        >
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            const isSelected = selectedPillar === idx;
            return (
              <div
                key={pillar.id}
                onClick={() => setSelectedPillar(idx)}
                className="glass-card"
                style={{
                  padding: '18px 20px',
                  cursor: 'pointer',
                  borderColor: isSelected ? pillar.accent : 'rgba(220, 235, 229, 0.12)',
                  background: isSelected ? 'rgba(11, 93, 75, 0.35)' : 'rgba(5, 34, 28, 0.5)',
                  boxShadow: isSelected ? `0 0 25px rgba(212, 175, 55, 0.2)` : 'none',
                  transition: 'all 0.25s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: isSelected ? pillar.accent : 'rgba(220, 235, 229, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={18} color={isSelected ? '#04241E' : pillar.accent} />
                  </div>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: pillar.accent,
                    }}
                  >
                    {pillar.badge}
                  </span>
                </div>
                <h4 style={{ fontSize: '1.02rem', color: isSelected ? '#FFF' : 'var(--warm-ivory)' }}>
                  {pillar.title}
                </h4>
              </div>
            );
          })}
        </div>

        {/* Active Pillar Detailed View */}
        {(() => {
          const active = pillars[selectedPillar];
          const Icon = active.icon;

          return (
            <div
              className="glass-card"
              style={{
                background: 'rgba(5, 34, 28, 0.88)',
                border: `1px solid ${active.accent}55`,
                borderRadius: '24px',
                padding: '36px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.55)',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '36px',
                  alignItems: 'center',
                }}
              >
                {/* Left Description */}
                <div>
                  <div className="glass-pill" style={{ borderColor: active.accent, marginBottom: '14px' }}>
                    <Icon size={15} color={active.accent} />
                    <span style={{ color: active.accent }}>{active.badge}</span>
                  </div>

                  <h3
                    style={{
                      fontSize: 'clamp(1.5rem, 2.3vw, 2rem)',
                      color: 'var(--warm-ivory)',
                      marginBottom: '12px',
                    }}
                  >
                    {active.title}
                  </h3>

                  <p
                    style={{
                      fontSize: '1.04rem',
                      color: 'var(--sage)',
                      marginBottom: '14px',
                      fontWeight: 500,
                      lineHeight: 1.5,
                    }}
                  >
                    {active.tagline}
                  </p>

                  <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '22px' }}>
                    {active.description}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                    {active.features.map((feat, fIdx) => (
                      <div key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'rgba(53, 184, 107, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: '2px',
                            flexShrink: 0,
                          }}
                        >
                          <Check size={12} color="#35B86B" />
                        </div>
                        <span style={{ fontSize: '0.88rem', color: 'var(--warm-ivory)' }}>{feat}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={onOpenWaitlist}
                    className="btn btn-gold"
                    style={{ padding: '13px 26px', fontSize: '0.95rem' }}
                  >
                    <Sparkles size={16} />
                    <span>Join Waitlist for Free Access</span>
                    <ArrowRight size={16} />
                  </button>
                </div>

                {/* Right Mockup Card Preview */}
                <div
                  style={{
                    background: 'rgba(2, 23, 19, 0.85)',
                    border: '1px solid rgba(220, 235, 229, 0.16)',
                    borderRadius: '20px',
                    padding: '24px',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Lock size={15} color={active.accent} />
                      <span style={{ fontSize: '0.78rem', color: 'var(--sage)' }}>
                        Encrypted Item
                      </span>
                    </div>
                    <span className="glass-pill" style={{ padding: '3px 8px', fontSize: '0.72rem' }}>
                      Family Handover Ready
                    </span>
                  </div>

                  <h4
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.25rem',
                      color: 'var(--warm-ivory)',
                      marginBottom: '6px',
                    }}
                  >
                    {active.sampleUI.title}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
                    {active.sampleUI.subtitle}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {active.sampleUI.items.map((it, itIdx) => (
                      <div
                        key={itIdx}
                        style={{
                          background: 'rgba(11, 93, 75, 0.25)',
                          border: '1px solid rgba(220, 235, 229, 0.1)',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          fontSize: '0.86rem',
                          color: '#F8F5EA',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>{it}</span>
                        <ShieldCheck size={16} color="#35B86B" />
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      marginTop: '18px',
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'rgba(212, 175, 55, 0.08)',
                      border: '1px solid rgba(212, 175, 55, 0.2)',
                      fontSize: '0.76rem',
                      color: 'var(--sage)',
                      lineHeight: 1.4,
                    }}
                  >
                    ✦ Private & Protected: Only you and your chosen family can unlock this.
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
}
