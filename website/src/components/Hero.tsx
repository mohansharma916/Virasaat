'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Lock,
  Heart,
  TrendingUp,
  FileText,
  Activity,
  CheckCircle2,
  Play,
  Smartphone,
  Mail,
  Loader2,
  Check,
} from 'lucide-react';

interface HeroProps {
  onOpenWaitlist: () => void;
}

export default function Hero({ onOpenWaitlist }: HeroProps) {
  const [activeTab, setActiveTab] = useState<'financial' | 'memories' | 'documents' | 'heartbeat'>('financial');
  const [isPlayingVideoModal, setIsPlayingVideoModal] = useState(false);

  // Quick inline waitlist state
  const [emailInput, setEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedQueue, setSubmittedQueue] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState('');

  const handleHeroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      setSubmitError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput,
          source: 'hero_inline_input',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubmitError(data.error || 'Something went wrong. Please try again.');
        setIsSubmitting(false);
        return;
      }

      const qNum = data.queueNumber || 420;
      setSubmittedQueue(qNum);
      localStorage.setItem('virasaat_queue_num', qNum.toString());
      localStorage.setItem('virasaat_user_email', emailInput);
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        const navOffset = 84;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
        window.history.pushState(null, '', href);
      }
    }
  };

  return (
    <section
      style={{
        position: 'relative',
        paddingTop: '135px',
        paddingBottom: '80px',
        overflow: 'hidden',
      }}
    >
      {/* Background ambient lighting */}
      <div
        className="ambient-orb"
        style={{
          width: '600px',
          height: '600px',
          top: '-100px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'radial-gradient(circle, rgba(11, 93, 75, 0.45) 0%, rgba(6, 63, 52, 0.1) 70%, transparent 100%)',
        }}
      />
      <div
        className="ambient-orb"
        style={{
          width: '450px',
          height: '450px',
          top: '30%',
          right: '-10%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)',
        }}
      />

      <div className="container">
        {/* Top Coming Soon Badge */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="glass-pill animate-float">
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#35B86B',
                boxShadow: '0 0 10px #35B86B',
                display: 'inline-block',
              }}
            />
            <span style={{ color: 'var(--gold-light)', fontWeight: 700 }}>COMING SOON ON iOS & ANDROID</span>
            <span style={{ opacity: 0.5 }}>|</span>
            <span style={{ color: 'var(--sage)' }}>Join the Waitlist for Free Lifetime Access</span>
          </div>
        </div>

        {/* Hero Headings - Simple Words, Direct Message */}
        <div style={{ textAlign: 'center', maxWidth: '920px', margin: '0 auto 36px' }}>
          <h1
            style={{
              fontSize: 'clamp(2.3rem, 5.2vw, 4.2rem)',
              lineHeight: 1.15,
              marginBottom: '20px',
              color: 'var(--warm-ivory)',
              fontWeight: 800,
            }}
          >
            Make Sure Your Family Never Loses <br />
            <span className="text-gradient-gold">Your Money & Memories.</span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(1.05rem, 1.8vw, 1.25rem)',
              color: 'var(--text-secondary)',
              maxWidth: '740px',
              margin: '0 auto 34px',
              lineHeight: 1.65,
              fontWeight: 400,
            }}
          >
            Over <strong style={{ color: '#ECC862' }}>₹1.5 Lakh Crore</strong> sits forgotten in Indian banks and insurance companies because families didn't even know it existed. <strong style={{ color: '#FFF' }}>Virasaat</strong> keeps all your bank accounts, investments, policies, and personal video notes in one safe place—and automatically shares them with your loved ones if anything ever happens to you.
          </p>

          {/* INLINE COMING SOON WAITLIST BOX */}
          <div
            style={{
              maxWidth: '560px',
              margin: '0 auto 28px',
              background: 'rgba(6, 40, 33, 0.75)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              borderRadius: '20px',
              padding: '10px 10px 10px 18px',
              boxShadow: '0 15px 40px rgba(0, 0, 0, 0.45)',
            }}
          >
            {!submittedQueue ? (
              <form
                onSubmit={handleHeroSubmit}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 240px' }}>
                  <Mail size={18} color="#ECC862" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your email to join waitlist..."
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: '#FFF',
                      fontSize: '0.96rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-gold"
                  style={{
                    padding: '12px 24px',
                    fontSize: '0.96rem',
                    borderRadius: '14px',
                    whiteSpace: 'nowrap',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.75 : 1,
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Join Waitlist</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '6px 10px',
                  flexWrap: 'wrap',
                }}
              >
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
                  <div style={{ textAlign: 'left', lineHeight: 1.3 }}>
                    <div style={{ color: '#35B86B', fontWeight: 700, fontSize: '0.92rem' }}>
                      Spot #{submittedQueue} Secured! Confirmation email sent.
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--sage)' }}>
                      We will notify {emailInput} the moment the app is ready.
                    </div>
                  </div>
                </div>

                <button
                  onClick={onOpenWaitlist}
                  className="btn btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '0.78rem', borderRadius: '10px' }}
                >
                  View My Pass
                </button>
              </div>
            )}

            {submitError && (
              <div style={{ color: '#FF9494', fontSize: '0.82rem', textAlign: 'left', marginTop: '8px', paddingLeft: '8px' }}>
                {submitError}
              </div>
            )}
          </div>

          {/* Quick secondary action */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              marginBottom: '28px',
            }}
          >
            <a
              href="#mobile-app"
              onClick={(e) => handleScrollTo(e, '#mobile-app')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(11, 93, 75, 0.35)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                padding: '6px 16px',
                borderRadius: '999px',
                fontSize: '0.84rem',
                color: 'var(--sage)',
                textDecoration: 'none',
              }}
            >
              <Smartphone size={14} color="#ECC862" />
              <span>Mobile App Preview</span>
              <ArrowRight size={13} color="#ECC862" />
            </a>

            <a
              href="#how-it-works"
              onClick={(e) => handleScrollTo(e, '#how-it-works')}
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.84rem',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              See How It Works ↓
            </a>
          </div>

          {/* Simple Trust Points */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
              fontSize: '0.84rem',
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={15} color="#D4AF37" />
              <span>100% Private & Encrypted</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={15} color="#35B86B" />
              <span>Gentle Monthly Safety Check</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={15} color="#ECC862" />
              <span>Zero False Alarms Guarantee</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={15} color="#35B86B" />
              <span>Free for Early Waitlist Members</span>
            </div>
          </div>
        </div>

        {/* ===================================================================
           INTERACTIVE VAULT PREVIEW (SIMPLE LABELS)
           =================================================================== */}
        <div
          id="vault-preview"
          style={{
            maxWidth: '1060px',
            margin: '0 auto',
            position: 'relative',
          }}
        >
          {/* Subtle Outer Frame glow */}
          <div
            style={{
              position: 'absolute',
              inset: '-2px',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.45) 0%, rgba(11, 93, 75, 0.6) 50%, rgba(6, 63, 52, 0.2) 100%)',
              borderRadius: '26px',
              filter: 'blur(4px)',
              zIndex: 0,
            }}
          />

          <div
            className="glass-card"
            style={{
              position: 'relative',
              zIndex: 1,
              background: 'rgba(5, 34, 28, 0.94)',
              border: '1px solid rgba(220, 235, 229, 0.22)',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.55)',
            }}
          >
            {/* Header Tabs */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                borderBottom: '1px solid rgba(220, 235, 229, 0.12)',
                paddingBottom: '18px',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#ECC862', fontWeight: 700 }}>
                  ✦ Interactive App Preview
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  (Click any category below)
                </span>
              </div>

              {/* Tab Selector */}
              <div
                style={{
                  display: 'flex',
                  background: 'rgba(8, 43, 36, 0.75)',
                  padding: '4px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  gap: '4px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  onClick={() => setActiveTab('financial')}
                  style={{
                    background: activeTab === 'financial' ? 'var(--primary-forest)' : 'transparent',
                    color: activeTab === 'financial' ? '#FFF' : 'var(--text-secondary)',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <TrendingUp size={15} />
                  <span>Bank & Funds</span>
                </button>

                <button
                  onClick={() => setActiveTab('memories')}
                  style={{
                    background: activeTab === 'memories' ? 'var(--primary-forest)' : 'transparent',
                    color: activeTab === 'memories' ? '#FFF' : 'var(--text-secondary)',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Heart size={15} />
                  <span>Personal Videos</span>
                </button>

                <button
                  onClick={() => setActiveTab('documents')}
                  style={{
                    background: activeTab === 'documents' ? 'var(--primary-forest)' : 'transparent',
                    color: activeTab === 'documents' ? '#FFF' : 'var(--text-secondary)',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <FileText size={15} />
                  <span>Important Documents</span>
                </button>

                <button
                  onClick={() => setActiveTab('heartbeat')}
                  style={{
                    background: activeTab === 'heartbeat' ? 'var(--primary-forest)' : 'transparent',
                    color: activeTab === 'heartbeat' ? '#FFF' : 'var(--text-secondary)',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Activity size={15} />
                  <span>Safety Check</span>
                </button>
              </div>
            </div>

            {/* TAB 1: FINANCIAL ASSETS */}
            {activeTab === 'financial' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px',
                }}
              >
                {/* Asset 1: Mutual Funds */}
                <div
                  style={{
                    background: 'rgba(11, 93, 75, 0.2)',
                    border: '1px solid rgba(220, 235, 229, 0.16)',
                    borderRadius: '16px',
                    padding: '18px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#ECC862', fontWeight: 700 }}>
                      MUTUAL FUNDS & STOCKS
                    </span>
                    <span className="glass-pill" style={{ padding: '2px 8px', fontSize: '0.72rem' }}>
                      Encrypted
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1.05rem', color: 'var(--warm-ivory)', marginBottom: '4px' }}>
                    Zerodha & Groww Accounts
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Account ID: ••••••••••••8492 | 14 Index & Mutual Funds
                  </p>
                  <div
                    style={{
                      background: 'rgba(6, 63, 52, 0.5)',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      fontSize: '0.78rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Nominee:</span>
                      <span style={{ color: 'var(--warm-ivory)', fontWeight: 600 }}>Ananya Sharma (Spouse)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Claim Steps:</span>
                      <span style={{ color: '#35B86B' }}>Simple 1-Page Guide Ready</span>
                    </div>
                  </div>
                </div>

                {/* Asset 2: Term Life Insurance */}
                <div
                  style={{
                    background: 'rgba(11, 93, 75, 0.2)',
                    border: '1px solid rgba(220, 235, 229, 0.16)',
                    borderRadius: '16px',
                    padding: '18px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#ECC862', fontWeight: 700 }}>
                      LIFE INSURANCE
                    </span>
                    <span className="glass-pill" style={{ padding: '2px 8px', fontSize: '0.72rem' }}>
                      Active
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1.05rem', color: 'var(--warm-ivory)', marginBottom: '4px' }}>
                    HDFC Life Term Plan
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Policy: •••••••••7731 | ₹2.5 Crore Cover
                  </p>
                  <div
                    style={{
                      background: 'rgba(6, 63, 52, 0.5)',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      fontSize: '0.78rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Advisor Contact:</span>
                      <span style={{ color: 'var(--warm-ivory)', fontWeight: 600 }}>P. K. Verma (+91 98••• ••102)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Policy PDF:</span>
                      <span style={{ color: '#35B86B' }}>Attached in Vault</span>
                    </div>
                  </div>
                </div>

                {/* Asset 3: Bank Locker */}
                <div
                  style={{
                    background: 'rgba(11, 93, 75, 0.2)',
                    border: '1px solid rgba(220, 235, 229, 0.16)',
                    borderRadius: '16px',
                    padding: '18px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#ECC862', fontWeight: 700 }}>
                      BANK ACCOUNT & LOCKER
                    </span>
                    <span className="glass-pill" style={{ padding: '2px 8px', fontSize: '0.72rem' }}>
                      Protected
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1.05rem', color: 'var(--warm-ivory)', marginBottom: '4px' }}>
                    ICICI Bank Savings & Locker #42
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Bandra Branch | Key instructions stored
                  </p>
                  <div
                    style={{
                      background: 'rgba(6, 63, 52, 0.5)',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      fontSize: '0.78rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Locker Key Location:</span>
                      <span style={{ color: 'var(--warm-ivory)', fontWeight: 600 }}>Home Safe Compartment B</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Access:</span>
                      <span style={{ color: 'var(--mint)' }}>Only shared on handover</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PERSONAL VIDEOS & LETTERS */}
            {activeTab === 'memories' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '20px',
                  alignItems: 'center',
                }}
              >
                {/* Video Card */}
                <div
                  style={{
                    position: 'relative',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-gold)',
                    background: '#041B16',
                  }}
                >
                  <div style={{ height: '220px', position: 'relative' }}>
                    <Image
                      src="/images/family-peace.jpg"
                      alt="Family video message"
                      fill
                      style={{ objectFit: 'cover', opacity: 0.85 }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(4, 27, 22, 0.95) 0%, transparent 60%)',
                      }}
                    />
                    <button
                      onClick={() => setIsPlayingVideoModal(true)}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'rgba(212, 175, 55, 0.9)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 25px rgba(212, 175, 55, 0.6)',
                      }}
                      aria-label="Play video preview"
                    >
                      <Play size={24} color="#041B16" style={{ marginLeft: '3px' }} />
                    </button>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '14px',
                        right: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8F5EA' }}>
                        To My Son on Your Wedding Day
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          background: 'rgba(0, 0, 0, 0.6)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          color: '#ECC862',
                        }}
                      >
                        08:42 min
                      </span>
                    </div>
                  </div>
                </div>

                {/* Letter Card */}
                <div
                  style={{
                    background: 'rgba(248, 245, 234, 0.05)',
                    border: '1px solid rgba(220, 235, 229, 0.15)',
                    borderRadius: '16px',
                    padding: '24px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Heart size={18} color="#D4AF37" />
                    <span style={{ fontSize: '0.8rem', color: '#ECC862', fontWeight: 700 }}>
                      PERSONAL LETTER FOR FAMILY
                    </span>
                  </div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.25rem',
                      color: 'var(--warm-ivory)',
                      marginBottom: '10px',
                    }}
                  >
                    "The Values That Built Our Family"
                  </h3>
                  <p
                    className="font-handwriting"
                    style={{
                      fontSize: '1.28rem',
                      lineHeight: 1.5,
                      color: 'var(--warm-ivory)',
                      opacity: 0.92,
                      marginBottom: '16px',
                    }}
                  >
                    "My dearest Aarav, if you are reading this, know that you were my greatest joy. Always remember that wealth is not just money, but the kindness and dignity you share with everyone around you..."
                  </p>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--sage)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid rgba(220, 235, 229, 0.12)',
                      paddingTop: '12px',
                    }}
                  >
                    <span>For: Aarav Sharma (Son)</span>
                    <span style={{ color: '#35B86B' }}>Delivered on special milestone</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: IMPORTANT DOCUMENTS */}
            {activeTab === 'documents' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    background: 'rgba(11, 93, 75, 0.2)',
                    border: '1px solid rgba(220, 235, 229, 0.16)',
                    borderRadius: '16px',
                    padding: '18px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <FileText size={20} color="#D4AF37" />
                    <span style={{ fontSize: '0.75rem', color: '#35B86B', fontWeight: 600 }}>Verified Safe</span>
                  </div>
                  <h4 style={{ fontSize: '1.05rem', color: 'var(--warm-ivory)', marginBottom: '4px' }}>
                    Registered Last Will
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    Sub-Registrar Office, Bandra West #REG-99120
                  </p>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Physical paper copy: Home Safe Compartment B
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(11, 93, 75, 0.2)',
                    border: '1px solid rgba(220, 235, 229, 0.16)',
                    borderRadius: '16px',
                    padding: '18px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <FileText size={20} color="#D4AF37" />
                    <span style={{ fontSize: '0.75rem', color: '#35B86B', fontWeight: 600 }}>Emergency Ready</span>
                  </div>
                  <h4 style={{ fontSize: '1.05rem', color: 'var(--warm-ivory)', marginBottom: '4px' }}>
                    Healthcare Proxy & Living Will
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    Doctor contacts & medical emergency instructions
                  </p>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Immediate hospital access instructions included
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(11, 93, 75, 0.2)',
                    border: '1px solid rgba(220, 235, 229, 0.16)',
                    borderRadius: '16px',
                    padding: '18px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <FileText size={20} color="#D4AF37" />
                    <span style={{ fontSize: '0.75rem', color: '#35B86B', fontWeight: 600 }}>Encrypted</span>
                  </div>
                  <h4 style={{ fontSize: '1.05rem', color: 'var(--warm-ivory)', marginBottom: '4px' }}>
                    Identity, Tax & Property Papers
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    Aadhaar, PAN, Property Deed, and Passports
                  </p>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    One organized file package for family
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SAFETY CHECK */}
            {activeTab === 'heartbeat' && (
              <div
                style={{
                  background: 'rgba(4, 27, 22, 0.75)',
                  border: '1px solid rgba(212, 175, 55, 0.25)',
                  borderRadius: '16px',
                  padding: '24px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      className="animate-heartbeat"
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'rgba(53, 184, 107, 0.2)',
                        border: '2px solid #35B86B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Activity size={22} color="#35B86B" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', color: '#F8F5EA', margin: 0 }}>
                        Automatic Safety Check: All Good
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: 'var(--sage)', margin: 0 }}>
                        Checked once a month • Next reminder in 18 days
                      </p>
                    </div>
                  </div>

                  <div className="glass-pill" style={{ borderColor: '#35B86B' }}>
                    <CheckCircle2 size={15} color="#35B86B" />
                    <span style={{ color: '#35B86B' }}>Confirmed via Face ID</span>
                  </div>
                </div>

                {/* 4 Simple Steps */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '14px',
                    marginTop: '16px',
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(11, 93, 75, 0.25)',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      borderLeft: '3px solid #35B86B',
                    }}
                  >
                    <div style={{ fontSize: '0.74rem', color: '#35B86B', fontWeight: 700 }}>STEP 1 (NORMAL)</div>
                    <div style={{ fontSize: '0.85rem', color: '#FFF', fontWeight: 600 }}>1-Tap Monthly Check</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>A quick 2-second tap on phone</div>
                  </div>

                  <div
                    style={{
                      background: 'rgba(11, 93, 75, 0.15)',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      borderLeft: '3px solid #F4A62A',
                    }}
                  >
                    <div style={{ fontSize: '0.74rem', color: '#F4A62A', fontWeight: 700 }}>STEP 2 (IF MISSED)</div>
                    <div style={{ fontSize: '0.85rem', color: '#FFF', fontWeight: 600 }}>Gentle Reminders</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Email & SMS over 3 weeks</div>
                  </div>

                  <div
                    style={{
                      background: 'rgba(11, 93, 75, 0.15)',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      borderLeft: '3px solid #D4AF37',
                    }}
                  >
                    <div style={{ fontSize: '0.74rem', color: '#D4AF37', fontWeight: 700 }}>STEP 3 (SAFETY BUFFER)</div>
                    <div style={{ fontSize: '0.85rem', color: '#FFF', fontWeight: 600 }}>14-Day Grace Window</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Plenty of time to respond</div>
                  </div>

                  <div
                    style={{
                      background: 'rgba(11, 93, 75, 0.15)',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      borderLeft: '3px solid #3D68C5',
                    }}
                  >
                    <div style={{ fontSize: '0.74rem', color: '#3D68C5', fontWeight: 700 }}>STEP 4 (HANDOVER)</div>
                    <div style={{ fontSize: '0.85rem', color: '#FFF', fontWeight: 600 }}>Family Gets Access</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Only after verified confirmation</div>
                  </div>
                </div>
              </div>
            )}

            {/* Simulator Footer */}
            <div
              style={{
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(220, 235, 229, 0.1)',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                fontSize: '0.82rem',
                color: 'var(--sage)',
              }}
            >
              <div>
                <span>Chosen Family Contact: <strong>Ananya Sharma</strong> (Spouse)</span>
              </div>
              <button
                onClick={onOpenWaitlist}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--gold-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>Join Waitlist for Free Early Access</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal Preview */}
      {isPlayingVideoModal && (
        <div
          onClick={() => setIsPlayingVideoModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '680px',
              width: '100%',
              background: '#041B16',
              border: '1px solid var(--border-gold)',
              borderRadius: '20px',
              padding: '28px',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--warm-ivory)', margin: 0 }}>
                Video Message Example
              </h3>
              <button
                onClick={() => setIsPlayingVideoModal(false)}
                className="btn btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                Close
              </button>
            </div>

            <div style={{ position: 'relative', height: '340px', borderRadius: '14px', overflow: 'hidden', marginBottom: '16px' }}>
              <Image
                src="/images/family-peace.jpg"
                alt="Family message preview"
                fill
                style={{ objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.45)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(212, 175, 55, 0.95)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '14px',
                  }}
                >
                  <Play size={26} color="#041B16" style={{ marginLeft: '4px' }} />
                </div>
                <div style={{ color: '#FFF', fontWeight: 700, fontSize: '1.1rem' }}>
                  "To My Son on Your Wedding Day"
                </div>
                <div style={{ color: 'var(--sage)', fontSize: '0.85rem', marginTop: '6px' }}>
                  Encrypted on device. Delivered only on the milestone date.
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setIsPlayingVideoModal(false);
                onOpenWaitlist();
              }}
              className="btn btn-gold"
              style={{ width: '100%', padding: '12px' }}
            >
              Join the Waitlist to Save Your Own Videos
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
