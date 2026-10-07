'use client';

import React from 'react';
import { Check, X, Shield, Sparkles } from 'lucide-react';

interface ComparisonMatrixProps {
  onOpenWaitlist: () => void;
}

export default function ComparisonMatrix({ onOpenWaitlist }: ComparisonMatrixProps) {
  const comparisonData = [
    {
      feature: 'Automatic Monthly Safety Check',
      virasaat: true,
      lawyer: false,
      google: 'Only for Gmail',
      cloud: false,
      pwManager: false,
      note: 'Checks in with you quietly and safely notifies family if you stop responding.',
    },
    {
      feature: 'Complete Bank & Investment List',
      virasaat: true,
      lawyer: 'Static paper',
      google: false,
      cloud: 'Messy text files',
      pwManager: 'Only passwords',
      note: 'Lists mutual funds, demat accounts, insurance policies, and banks in one place.',
    },
    {
      feature: 'Personal Video Messages & Letters',
      virasaat: true,
      lawyer: false,
      google: false,
      cloud: 'No delivery triggers',
      pwManager: false,
      note: 'Heartfelt personal messages delivered on birthdays or emergencies.',
    },
    {
      feature: '100% Private & Device Encrypted',
      virasaat: true,
      lawyer: false,
      google: false,
      cloud: false,
      pwManager: true,
      note: 'Encrypted on your smartphone. Even our team cannot see your data.',
    },
    {
      feature: 'Step-by-Step Claim Guides for Family',
      virasaat: true,
      lawyer: 'Extra legal fees',
      google: false,
      cloud: false,
      pwManager: false,
      note: 'Simple instructions for claiming mutual funds, banks, and term insurance.',
    },
    {
      feature: '14-Day Safety Buffer (No False Alarms)',
      virasaat: true,
      lawyer: false,
      google: false,
      cloud: false,
      pwManager: false,
      note: 'Zero risk of accidental handover while traveling or on vacation.',
    },
    {
      feature: 'Time to Set Up',
      virasaat: '5 - 10 Minutes',
      lawyer: 'Weeks of meetings',
      google: '20 Minutes',
      cloud: 'Hours of sorting',
      pwManager: 'Days of typing',
      note: 'Fast, step-by-step setup right on your mobile phone.',
    },
    {
      feature: 'Cost',
      virasaat: 'Free Waitlist Tier',
      lawyer: '₹25,000 - ₹50,000+',
      google: 'Free (Account only)',
      cloud: '$10 - $20 / month',
      pwManager: '$36 - $60 / year',
      note: 'Free core access for early waitlist members.',
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
            Why Other Options <br />
            <span className="text-gradient-gold">Leave Your Family In The Dark</span>
          </h2>

          <p style={{ fontSize: '1.08rem', color: 'var(--text-secondary)' }}>
            Paper wills get locked in courts for months. Cloud drives are messy and unorganized. Password managers don't tell your spouse how to claim insurance. Here is how Virasaat solves every problem.
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
                      <span>Virasaat</span>
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

                    {/* Virasaat Column */}
                    <td
                      style={{
                        padding: '18px 20px',
                        background: 'rgba(11, 93, 75, 0.25)',
                        borderLeft: '2px solid rgba(212, 175, 55, 0.4)',
                        borderRight: '2px solid rgba(212, 175, 55, 0.4)',
                      }}
                    >
                      {typeof row.virasaat === 'boolean' ? (
                        row.virasaat ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#35B86B', fontWeight: 700, fontSize: '0.9rem' }}>
                            <Check size={18} />
                            <span>Included</span>
                          </div>
                        ) : (
                          <X size={18} color="#D94A4A" />
                        )
                      ) : (
                        <span style={{ color: '#ECC862', fontWeight: 700, fontSize: '0.92rem' }}>
                          {row.virasaat}
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
                Early members get lifetime access to the core vault completely free.
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
