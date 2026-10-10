'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import type { WaitlistRegistration } from '@/lib/waitlist';
import { Sparkles, ArrowRight, Lock, CheckCircle2, Mail, Check } from 'lucide-react';

interface CtaBannerProps {
  onOpenWaitlist: (email?: string) => void;
  registration?: WaitlistRegistration | null;
}

export default function CtaBanner({ onOpenWaitlist, registration }: CtaBannerProps) {
  const [email, setEmail] = useState('');
  const submittedQueue = registration?.queueNumber ?? null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenWaitlist(email.trim());
  };

  return (
    <section className="section" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="container">
        <div
          className="glass-card-gold"
          style={{
            position: 'relative',
            borderRadius: '28px',
            overflow: 'hidden',
            padding: '54px 36px',
            background: 'linear-gradient(135deg, rgba(11, 93, 75, 0.95) 0%, rgba(6, 63, 52, 0.97) 50%, rgba(4, 36, 30, 0.99) 100%)',
            border: '1px solid var(--border-gold)',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.7)',
          }}
        >
          {/* Background image overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '50%',
              opacity: 0.16,
              pointerEvents: 'none',
            }}
          >
            <Image
              src="/images/hero-vault.jpg"
              alt="Virasat"
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '720px' }}>
            <div className="glass-pill" style={{ marginBottom: '18px', borderColor: 'var(--gold-primary)' }}>
              <Sparkles size={15} color="#D4AF37" />
              <span style={{ color: '#F3E5AB' }}>✦ COMING SOON — JOIN THE WAITLIST</span>
            </div>

            <h2
              style={{
                fontSize: 'clamp(2.1rem, 4vw, 3.2rem)',
                color: 'var(--warm-ivory)',
                lineHeight: 1.18,
                marginBottom: '16px',
                fontWeight: 800,
              }}
            >
              Protect Your Entire Family’s Future. <br />
              <span className="text-gradient-gold">In 10 Simple Minutes.</span>
            </h2>

            <p style={{ fontSize: '1.1rem', color: 'var(--mint)', lineHeight: 1.65, marginBottom: '28px' }}>
              No complicated legal paperwork. No expensive fees. List your accounts, save personal video messages, and give your family total peace of mind.
            </p>

            {/* Direct Email Signup Box */}
            <div
              style={{
                background: 'rgba(4, 27, 22, 0.85)',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                borderRadius: '18px',
                padding: '8px 8px 8px 16px',
                marginBottom: '22px',
                maxWidth: '540px',
              }}
            >
              {!submittedQueue ? (
                <form
                  onSubmit={handleSubmit}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 220px' }}>
                    <Mail size={18} color="#ECC862" />
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        color: '#FFF',
                        fontSize: '0.94rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-gold"
                    style={{
                      padding: '12px 24px',
                      fontSize: '0.94rem',
                      borderRadius: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <Sparkles size={16} />
                    <span>Join Waitlist</span>
                    <ArrowRight size={15} />
                  </button>
                </form>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '6px 8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(53, 184, 107, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={18} color="#35B86B" />
                    </div>
                    <div>
                      <div style={{ color: '#35B86B', fontWeight: 700, fontSize: '0.92rem' }}>
                        Spot #{submittedQueue} Reserved! Signup confirmed.
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--sage)' }}>
                        Launch updates will go to {registration?.email}.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenWaitlist()}
                    className="btn btn-secondary"
                    style={{ padding: '6px 14px', fontSize: '0.78rem', borderRadius: '10px' }}
                  >
                    View My Pass
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Store Badges - Coming Soon */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '26px',
              }}
            >
              <span style={{ fontSize: '0.82rem', color: '#ECC862', fontWeight: 600 }}>
                ⚡ Mobile Apps Launching Soon:
              </span>

              {/* Apple Store Pill */}
              <div
                onClick={() => onOpenWaitlist()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(220, 235, 229, 0.2)',
                  borderRadius: '10px',
                  padding: '6px 14px',
                  cursor: 'pointer',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 170 170" fill="#FFF">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.66-7.85-11.92-14.42-6.53-10.08-11.66-21.68-15.39-34.79-3.72-13.11-5.59-25.26-5.59-36.46 0-14.94 3.82-27.18 11.46-36.72 7.64-9.54 17.06-14.42 28.27-14.65 4.8 0 10.08 1.3 15.84 3.9 5.76 2.6 9.49 4.01 11.19 4.24 2.12-.45 5.97-1.96 11.55-4.53 5.58-2.58 10.59-3.75 15.02-3.52 11.45.69 20.67 4.96 27.67 12.82-9.84 5.96-14.65 14.37-14.42 25.22.23 8.7 3.52 15.93 9.87 21.68 6.35 5.76 13.9 9.07 22.65 9.94-2.23 6.64-4.8 13.06-7.72 19.26zM119.22 33.15c0-6.73 2.45-13.25 7.35-19.56 4.9-6.31 11.08-10.63 18.54-12.96-1.12 7.06-3.82 13.56-8.11 19.5-4.29 5.94-10.19 10.27-17.78 13.02z" />
                </svg>
                <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                  <div style={{ fontSize: '0.58rem', color: '#ECC862' }}>COMING SOON</div>
                  <div style={{ fontSize: '0.78rem', color: '#FFF', fontWeight: 700 }}>App Store (iOS)</div>
                </div>
              </div>

              {/* Google Play Pill */}
              <div
                onClick={() => onOpenWaitlist()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(220, 235, 229, 0.2)',
                  borderRadius: '10px',
                  padding: '6px 14px',
                  cursor: 'pointer',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 512 512">
                  <path fill="#4285F4" d="M325.3 234.3L104.6 13l280 161.8z" />
                  <path fill="#34A853" d="M47 0C21.1 0 0 21.1 0 47v418c0 25.9 21.1 47 47 47c7.4 0 14.5-1.7 20.8-4.8l257.5-148.8L47 0z" />
                  <path fill="#FBBC04" d="M407.4 281.8l-82.1-47.5-24.6 24.6 24.6 24.6 82.1-47.5c12.3-7.1 12.3-18.7 0-25.8z" />
                  <path fill="#EA4335" d="M104.6 499l220.7-221.3 59.3 34.3L104.6 499z" />
                </svg>
                <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                  <div style={{ fontSize: '0.58rem', color: '#35B86B' }}>COMING SOON</div>
                  <div style={{ fontSize: '0.78rem', color: '#FFF', fontWeight: 700 }}>Google Play (Android)</div>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '18px',
                fontSize: '0.84rem',
                color: 'var(--sage)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} color="#35B86B" />
                <span>Free Waitlist Signup for Launch Updates</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={16} color="#D4AF37" />
                <span>Server-Managed Vault Encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
