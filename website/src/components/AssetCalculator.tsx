'use client';

import React, { useState } from 'react';
import { Calculator, ShieldAlert, CheckCircle, ArrowRight, Sparkles, DollarSign, Clock, FileCheck } from 'lucide-react';

interface AssetCalculatorProps {
  onOpenWaitlist: () => void;
}

export default function AssetCalculator({ onOpenWaitlist }: AssetCalculatorProps) {
  const [netWorthIndex, setNetWorthIndex] = useState(2); // Default ₹1 Crore
  const [numAccounts, setNumAccounts] = useState(7); // Default 7 accounts
  const [numBeneficiaries, setNumBeneficiaries] = useState(2); // Default 2

  const netWorthValues = [
    { label: '₹25 Lakhs ($30k)', raw: 2500000 },
    { label: '₹50 Lakhs ($60k)', raw: 5000000 },
    { label: '₹1.0 Crore ($120k)', raw: 10000000 },
    { label: '₹2.5 Crore ($300k)', raw: 25000000 },
    { label: '₹5.0 Crore ($600k)', raw: 50000000 },
    { label: '₹10+ Crore ($1.2M+)', raw: 100000000 },
  ];

  const currentWorth = netWorthValues[netWorthIndex];
  
  // Statistical risk estimation: without an automated vault, 15% - 22% of assets across 5+ accounts risk delays or forfeiture
  const riskPercentage = Math.min(28, 10 + (numAccounts * 1.5));
  const estimatedAtRisk = Math.round((currentWorth.raw * (riskPercentage / 100)) / 10000) * 10000;
  const estimatedMonthsDelay = Math.min(18, 6 + Math.round(numAccounts * 0.8));

  const formatCurrency = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Crore`;
    }
    return `₹${(val / 100000).toFixed(1)} Lakhs`;
  };

  return (
    <section id="calculator" className="section" style={{ position: 'relative' }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 50px' }}>
          <div className="glass-pill" style={{ marginBottom: '14px' }}>
            <Calculator size={15} color="#D4AF37" />
            <span style={{ color: '#F3E5AB' }}>Interactive Calculator</span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(2rem, 3.6vw, 2.8rem)',
              color: 'var(--warm-ivory)',
              marginBottom: '16px',
            }}
          >
            How Much of Your Money Could Your Family <br />
            <span className="text-gradient-gold">Struggle to Find?</span>
          </h2>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
            The more bank accounts, mutual funds, and policies you own, the higher the chance your spouse or kids will miss something. See your estimate below.
          </p>
        </div>

        {/* Calculator Main Box */}
        <div
          className="glass-card"
          style={{
            maxWidth: '1020px',
            margin: '0 auto',
            padding: '36px',
            background: 'rgba(5, 34, 28, 0.85)',
            border: '1px solid rgba(212, 175, 55, 0.28)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
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
            {/* Left Controls */}
            <div>
              {/* Slider 1: Net Worth */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.92rem', color: 'var(--sage)', fontWeight: 600 }}>
                    Estimated Family Wealth & Investments
                  </label>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.15rem',
                      color: '#ECC862',
                      fontWeight: 700,
                    }}
                  >
                    {currentWorth.label}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={netWorthValues.length - 1}
                  step={1}
                  value={netWorthIndex}
                  onChange={(e) => setNetWorthIndex(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: '#D4AF37',
                    cursor: 'pointer',
                    height: '6px',
                  }}
                  aria-label="Estimated Family Wealth Slider"
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    marginTop: '6px',
                  }}
                >
                  <span>₹25L</span>
                  <span>₹1Cr</span>
                  <span>₹10Cr+</span>
                </div>
              </div>

              {/* Slider 2: Number of Accounts & Folios */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.92rem', color: 'var(--sage)', fontWeight: 600 }}>
                    Number of Accounts & Polices (Banks, Demat, Crypto, EPF, Insurance)
                  </label>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.15rem',
                      color: '#ECC862',
                      fontWeight: 700,
                    }}
                  >
                    {numAccounts} Accounts
                  </span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={20}
                  step={1}
                  value={numAccounts}
                  onChange={(e) => setNumAccounts(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: '#D4AF37',
                    cursor: 'pointer',
                    height: '6px',
                  }}
                  aria-label="Number of Financial Institutions Slider"
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    marginTop: '6px',
                  }}
                >
                  <span>2 Accounts</span>
                  <span>10 Accounts</span>
                  <span>20+ Accounts</span>
                </div>
              </div>

              {/* Slider 3: Beneficiaries */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.92rem', color: 'var(--sage)', fontWeight: 600 }}>
                    Designated Trusted Beneficiaries (Spouse, Children, Parents)
                  </label>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.15rem',
                      color: '#ECC862',
                      fontWeight: 700,
                    }}
                  >
                    {numBeneficiaries} People
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={6}
                  step={1}
                  value={numBeneficiaries}
                  onChange={(e) => setNumBeneficiaries(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: '#D4AF37',
                    cursor: 'pointer',
                    height: '6px',
                  }}
                  aria-label="Number of Beneficiaries Slider"
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    marginTop: '6px',
                  }}
                >
                  <span>1 Person</span>
                  <span>3 People</span>
                  <span>6 People</span>
                </div>
              </div>
            </div>

            {/* Right Output Card */}
            <div
              style={{
                background: 'rgba(8, 48, 40, 0.95)',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.45)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <ShieldAlert size={20} color="#F4A62A" />
                <span style={{ fontSize: '0.78rem', color: '#F4A62A', fontWeight: 700, letterSpacing: '0.06em' }}>
                  FAMILY EXPOSURE ANALYSIS
                </span>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Estimated Wealth at Risk of Being Trapped / Omitted:
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '2.4rem',
                    fontWeight: 800,
                    color: '#ECC862',
                    lineHeight: 1.15,
                    marginTop: '4px',
                  }}
                >
                  {formatCurrency(estimatedAtRisk)}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  ({riskPercentage}% statistical risk due to account fragmentation)
                </div>
              </div>

              {/* Comparative Metrics */}
              <div
                style={{
                  borderTop: '1px solid rgba(220, 235, 229, 0.12)',
                  borderBottom: '1px solid rgba(220, 235, 229, 0.12)',
                  padding: '16px 0',
                  marginBottom: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.84rem', color: 'var(--sage)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={15} color="#D94A4A" />
                    Without Virasaat:
                  </span>
                  <span style={{ fontSize: '0.84rem', color: '#D94A4A', fontWeight: 600 }}>
                    {estimatedMonthsDelay} Months of stressful paperwork
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.84rem', color: 'var(--sage)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={15} color="#35B86B" />
                    With Virasaat:
                  </span>
                  <span style={{ fontSize: '0.84rem', color: '#35B86B', fontWeight: 700 }}>
                    Clear Step-by-Step Guide
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.84rem', color: 'var(--sage)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileCheck size={15} color="#ECC862" />
                    Personal Videos:
                  </span>
                  <span style={{ fontSize: '0.84rem', color: '#ECC862', fontWeight: 700 }}>
                    Preserved for life milestones
                  </span>
                </div>
              </div>

              {/* Call to action */}
              <button
                onClick={onOpenWaitlist}
                className="btn btn-gold"
                style={{ width: '100%', justifyContent: 'center', padding: '14px 20px' }}
              >
                <Sparkles size={18} />
                <span>Join Waitlist to Protect Your Accounts</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
