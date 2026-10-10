'use client';

import React from 'react';
import { Check, X, Shield, Sparkles } from 'lucide-react';

interface ComparisonMatrixProps {
  onOpenWaitlist: () => void;
}

export default function ComparisonMatrix({ onOpenWaitlist }: ComparisonMatrixProps) {
  const comparisonData = [
    {
      feature: 'Automated Reminder & Family Workflow',
      virasat: 'Planned',
      lawyer: false,
      google: 'Only for Gmail',
      cloud: false,
      pwManager: false,
      note: 'Check-in recording is available; automated notification and family handover are planned.',
    },
    {
      feature: 'Complete Bank & Investment List',
      virasat: true,
      lawyer: 'Static paper',
      google: false,
      cloud: 'Messy text files',
      pwManager: 'Only passwords',
      note: 'Lists mutual funds, demat accounts, insurance policies, and banks in one place.',
    },
    {
      feature: 'Personal Video Messages & Letters',
      virasat: true,
      lawyer: false,
      google: false,
      cloud: 'No delivery triggers',
      pwManager: false,
      note: 'Save personal messages and supported files. Milestone and emergency delivery are unavailable.',
    },
    {
      feature: 'Encryption Model',
      virasat: 'Server-managed',
      lawyer: false,
      google: false,
      cloud: false,
      pwManager: true,
      note: 'The server encrypts descriptions and files and manages their decryption keys.',
    },
    {
      feature: 'Personal Claim Instructions',
      virasat: 'User-written notes',
      lawyer: 'Extra legal fees',
      google: false,
      cloud: false,
      pwManager: false,
      note: 'Record your own instructions; Virasat does not claim assets or provide automatic claim guides.',
    },
    {
      feature: 'Verified Family Handover',
      virasat: 'Unavailable',
      lawyer: false,
      google: false,
      cloud: false,
      pwManager: false,
      note: 'Release and recipient access are disabled while verified controls are developed.',
    },
    {
      feature: 'Time to Set Up',
      virasat: '5 - 10 Minutes',
      lawyer: 'Weeks of meetings',
      google: '20 Minutes',
      cloud: 'Hours of sorting',
      pwManager: 'Days of typing',
      note: 'Fast, step-by-step setup right on your mobile phone.',
    },
    {
      feature: 'Cost',
      virasat: 'Free signup; app plans vary',
      lawyer: '₹25,000 - ₹50,000+',
      google: 'Free (Account only)',
      cloud: '$10 - $20 / month',
      pwManager: '$36 - $60 / year',
      note: 'Joining the waitlist does not activate a subscription or lifetime entitlement.',
    },
  ];

  return (
    <section id="comparison" className="section" style={{ background: 'rgba(2, 23, 19, 0.95)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 54px' }}>
          <div className="glass-pill" style={{ marginBottom: '16px' }}>
            <Shield size={15} color="#D4AF37" />
            <span style={{ color: '#F3E5AB' }}>How We Compare</span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(2rem, 3.8vw, 3rem)',
              color: 'var(--warm-ivory)',
              marginBottom: '16px',
            }}
          >
            Choose the Tools <br />
            <span className="text-gradient-gold">That Fit Your Plans</span>
          </h2>

          <p style={{ fontSize: '1.08rem', color: 'var(--text-secondary)' }}>
            Virasat helps organize your records alongside your other estate planning tools. Planned features are marked below; it does not replace a will or an emergency plan.
          </p>
        </div>

        {/* Comparison Table Container */}
        <div
          className="glass-card"
          style={{
            background: 'rgba(6, 40, 33, 0.65)',
            border: '1px solid rgba(220, 235, 229, 0.16)',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
              <thead>
                <tr style={{ background: 'rgba(8, 48, 40, 0.9)', borderBottom: '1px solid rgba(220, 235, 229, 0.15)' }}>
                  <th style={{ padding: '20px 24px', color: 'var(--warm-ivory)', fontSize: '0.94rem', width: '28%' }}>
                    Key Feature
                  </th>
                  <th
                    style={{
                      padding: '20px 20px',
                      background: 'rgba(11, 93, 75, 0.5)',
                      borderLeft: '2px solid var(--gold-primary)',
                      borderRight: '2px solid var(--gold-primary)',
                      color: '#ECC862',
                      fontSize: '1rem',
                      fontWeight: 700,
                      width: '24%',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={16} />
                      <span>Virasat</span>
                    </div>
                  </th>
                  <th style={{ padding: '20px 18px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    Paper Will / Lawyer
                  </th>
                  <th style={{ padding: '20px 18px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    Google Inactive
                  </th>
                  <th style={{ padding: '20px 18px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    Cloud Drive (Drive/Dropbox)
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid rgba(220, 235, 229, 0.08)',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                    }}
                  >
                    {/* Feature Name */}
                    <td style={{ padding: '18px 24px' }}>
                      <div style={{ color: 'var(--warm-ivory)', fontWeight: 600, fontSize: '0.92rem', marginBottom: '3px' }}>
                        {row.feature}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {row.note}
                      </div>
                    </td>

                    {/* Virasat Column */}
                    <td
                      style={{
                        padding: '18px 20px',
                        background: 'rgba(11, 93, 75, 0.25)',
                        borderLeft: '2px solid rgba(212, 175, 55, 0.4)',
                        borderRight: '2px solid rgba(212, 175, 55, 0.4)',
                      }}
                    >
                      {typeof row.virasat === 'boolean' ? (
                        row.virasat ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#35B86B', fontWeight: 700, fontSize: '0.9rem' }}>
                            <Check size={18} />
                            <span>Included</span>
                          </div>
                        ) : (
                          <X size={18} color="#D94A4A" />
                        )
                      ) : (
                        <span style={{ color: '#ECC862', fontWeight: 700, fontSize: '0.92rem' }}>
                          {row.virasat}
                        </span>
                      )}
                    </td>

                    {/* Lawyer Column */}
                    <td style={{ padding: '18px 18px', color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                      {typeof row.lawyer === 'boolean' ? (
                        row.lawyer ? <Check size={16} color="#35B86B" /> : <X size={16} color="#D94A4A" />
                      ) : (
                        row.lawyer
                      )}
                    </td>

                    {/* Google Column */}
                    <td style={{ padding: '18px 18px', color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                      {typeof row.google === 'boolean' ? (
                        row.google ? <Check size={16} color="#35B86B" /> : <X size={16} color="#D94A4A" />
                      ) : (
                        row.google
                      )}
                    </td>

                    {/* Cloud Drive Column */}
                    <td style={{ padding: '18px 18px', color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                      {typeof row.cloud === 'boolean' ? (
                        row.cloud ? <Check size={16} color="#35B86B" /> : <X size={16} color="#D94A4A" />
                      ) : (
                        row.cloud
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer CTA */}
          <div
            style={{
              padding: '24px 32px',
              background: 'rgba(8, 48, 40, 0.8)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ color: 'var(--warm-ivory)', fontWeight: 700, fontSize: '1.02rem' }}>
                Join the Founding Waitlist Today
              </div>
              <div style={{ color: 'var(--sage)', fontSize: '0.85rem' }}>
                Join for launch updates. See the app for plan limits and purchase availability.
              </div>
            </div>

            <button
              onClick={onOpenWaitlist}
              className="btn btn-gold"
              style={{ padding: '12px 26px', fontSize: '0.92rem' }}
            >
              <Sparkles size={16} />
              <span>Join Waitlist (Free)</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
