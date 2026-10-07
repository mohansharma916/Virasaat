'use client';

import React from 'react';
import Image from 'next/image';
import { Heart, Star, Quote, ShieldCheck } from 'lucide-react';

export default function Testimonials() {
  const stories = [
    {
      name: 'Aditya & Tanvi Kulkarni',
      role: 'Fintech Director & Parents of two (Ages 4 & 7)',
      location: 'Bengaluru, India',
      quote:
        'Between Zerodha, IndMoney, EPF, and term life insurance, my wife wouldn’t know how to initiate a claim if something happened to me on a business trip. In 10 minutes on Virasaat, I linked every folio and recorded a video capsule for my daughter’s 18th birthday. The peace of mind is priceless.',
      badge: 'Family & Wealth Vault',
    },
    {
      name: 'Siddharth Roy',
      role: 'Staff Engineer & NRI Resident',
      location: 'San Francisco & Kolkata',
      quote:
        'Living abroad while maintaining ancestral property and mutual funds in India used to be an administrative nightmare. The 30-day heartbeat with automatic timezone awareness ensures my family across two continents is synchronized with zero friction.',
      badge: 'Cross-Border Portfolio',
    },
    {
      name: 'Dr. Meenakshi Sundaram',
      role: 'Surgeon & Private Practice Owner',
      location: 'Chennai, India',
      quote:
        'As a doctor, I see sudden life emergencies every day. Traditional paper wills get locked away in court probate for years. Virasaat’s dual-confirmation protocol with my spouse and legal advisor ensures instant, dignified clarity.',
      badge: 'Zero-Knowledge Security',
    },
  ];

  return (
    <section className="section" style={{ position: 'relative' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 50px' }}>
          <div className="glass-pill" style={{ marginBottom: '14px' }}>
            <Heart size={15} color="#D4AF37" />
            <span style={{ color: '#F3E5AB' }}>Peace of Mind</span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(2rem, 3.8vw, 3rem)',
              color: 'var(--warm-ivory)',
              marginBottom: '16px',
            }}
          >
            Built for People Who Love <br />
            <span className="text-gradient-gold">Their Family Too Much to Leave Things to Chance</span>
          </h2>

          <p style={{ fontSize: '1.08rem', color: 'var(--text-secondary)' }}>
            Real stories from parents and professionals who organized their accounts and personal messages.
          </p>
        </div>

        {/* Testimonials 3-Card Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            marginBottom: '48px',
          }}
        >
          {stories.map((st, idx) => (
            <div
              key={idx}
              className="glass-card"
              style={{
                padding: '36px 30px',
                background: 'rgba(6, 40, 33, 0.5)',
                border: '1px solid rgba(220, 235, 229, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill="#D4AF37" color="#D4AF37" />
                    ))}
                  </div>
                  <span className="glass-pill" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                    {st.badge}
                  </span>
                </div>

                <Quote size={28} color="rgba(212, 175, 55, 0.35)" style={{ marginBottom: '12px' }} />

                <p
                  style={{
                    fontSize: '0.96rem',
                    color: 'var(--warm-ivory)',
                    lineHeight: 1.68,
                    marginBottom: '28px',
                    fontStyle: 'italic',
                  }}
                >
                  "{st.quote}"
                </p>
              </div>

              <div
                style={{
                  borderTop: '1px solid rgba(220, 235, 229, 0.1)',
                  paddingTop: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '1.05rem', color: '#FFF', marginBottom: '2px' }}>
                    {st.name}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--sage)' }}>
                    {st.role} • {st.location}
                  </div>
                </div>
                <ShieldCheck size={20} color="#35B86B" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
