'use client';

import React from 'react';
import { Heart, Quote, ShieldCheck } from 'lucide-react';

export default function Testimonials() {
  const stories = [
    {
      name: 'A young family', role: 'Illustrative use case', location: 'Example scenario',
      quote: 'Organize account references, insurance details and personal messages in one place. Keep a separate plan for giving family access in an emergency.',
      badge: 'Family Records',
    },
    {
      name: 'A family living abroad', role: 'Illustrative use case', location: 'Example scenario',
      quote: 'Record where important property documents and investment references are kept. Use the check-in tools to record activity, without relying on automatic emergency alerts.',
      badge: 'Cross-Border Records',
    },
    {
      name: 'A busy professional', role: 'Illustrative use case', location: 'Example scenario',
      quote: 'Save important notes and intended assignments to trusted people. Invitation delivery, identity verification and family handover are still planned.',
      badge: 'Personal Organization',
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
            Illustrative situations showing how families could organize their records. These are examples, not customer testimonials.
          </p>
        </div>

        {/* Testimonials 3-Card Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
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
                  {st.quote}
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
