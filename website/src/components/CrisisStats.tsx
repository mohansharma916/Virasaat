'use client';

import React from 'react';
import { AlertTriangle, TrendingDown, HelpCircle, FileX, ArrowRight, ShieldCheck, HeartHandshake } from 'lucide-react';

export default function CrisisStats() {
  const painPoints = [
    {
      stat: '₹1.5 Lakh Crore+',
      label: 'Money Left Forgotten',
      desc: 'Lying unclaimed in Indian banks and insurance funds because families never knew the accounts existed.',
      icon: TrendingDown,
      color: '#D94A4A',
    },
    {
      stat: '84% of Spouses',
      label: 'Kept in the Dark',
      desc: 'Most partners and children cannot name more than 2 financial apps or policy numbers where their spouse holds money.',
      icon: HelpCircle,
      color: '#F4A62A',
    },
    {
      stat: 'Months of Stress',
      label: 'Running Between Banks',
      desc: 'Grieving families waste months running around bank branches and offices trying to track down paperwork.',
      icon: FileX,
      color: '#E5C07B',
    },
    {
      stat: 'No Personal Words',
      label: 'Wills Miss What Matters',
      desc: 'A legal will is just cold legal text. It cannot leave heartfelt video notes, memories, or loving words for your children.',
      icon: HeartHandshake,
      color: '#35B86B',
    },
  ];

  return (
    <section id="problem" className="section" style={{ background: 'rgba(2, 23, 19, 0.98)' }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 54px' }}>
          <div className="glass-pill" style={{ marginBottom: '16px', borderColor: 'rgba(217, 74, 74, 0.3)' }}>
            <AlertTriangle size={15} color="#D94A4A" />
            <span style={{ color: '#FCE9E9' }}>The Real Problem</span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(2rem, 3.8vw, 3rem)',
              color: 'var(--warm-ivory)',
              marginBottom: '18px',
            }}
          >
            Banks & Apps Will Never <br />
            <span style={{ color: '#ECC862' }}>Proactively Tell Your Family.</span>
          </h2>

          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            Between Zerodha, Groww, multiple bank accounts, term life policies, and mutual funds—your hard-earned money is spread across 10+ different apps. If something happens to you tomorrow, where would your family even begin?
          </p>
        </div>

        {/* 4 Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px',
            marginBottom: '50px',
          }}
        >
          {painPoints.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="glass-card"
                style={{
                  padding: '30px 24px',
                  background: 'rgba(6, 40, 33, 0.55)',
                  border: '1px solid rgba(220, 235, 229, 0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: `rgba(${item.color === '#D94A4A' ? '217, 74, 74' : item.color === '#F4A62A' ? '244, 166, 42' : '212, 175, 55'}, 0.15)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '18px',
                    }}
                  >
                    <Icon size={24} color={item.color} />
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '2.1rem',
                      fontWeight: 700,
                      color: item.color,
                      marginBottom: '8px',
                    }}
                  >
                    {item.stat}
                  </div>
                  <h3
                    style={{
                      fontSize: '1.15rem',
                      color: 'var(--warm-ivory)',
                      marginBottom: '10px',
                    }}
                  >
                    {item.label}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* The Solution Banner Callout */}
        <div
          className="glass-card-gold"
          style={{
            padding: '32px 36px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
          }}
        >
          <div style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <ShieldCheck size={20} color="#35B86B" />
              <span style={{ fontSize: '0.82rem', color: '#35B86B', fontWeight: 700, letterSpacing: '0.08em' }}>
                HOW VIRASAAT HELPS
              </span>
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.55rem',
                color: 'var(--warm-ivory)',
                marginBottom: '8px',
              }}
            >
              One Simple List. Total Peace of Mind.
            </h3>
            <p style={{ fontSize: '0.94rem', color: 'var(--sage)', lineHeight: 1.6, margin: 0 }}>
              Virasaat brings all your accounts, policies, and personal messages together in 10 minutes. 100% private today, and automatically shared with your family when needed.
            </p>
          </div>

          <a
            href="#vault"
            className="btn btn-gold"
            style={{ padding: '13px 26px', fontSize: '0.94rem' }}
          >
            <span>See What You Can Store</span>
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
