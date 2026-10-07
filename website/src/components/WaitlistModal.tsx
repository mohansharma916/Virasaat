'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Lock,
  User,
  Mail,
  Loader2,
} from 'lucide-react';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export default function WaitlistModal({ isOpen, onClose, defaultEmail = '' }: WaitlistModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(defaultEmail);
  const [country, setCountry] = useState('India');
  const [platform, setPlatform] = useState('Apple iPhone (iOS)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [queueNumber, setQueueNumber] = useState(420);

  useEffect(() => {
    if (defaultEmail && !email) {
      setEmail(defaultEmail);
    }
  }, [defaultEmail, email]);

  useEffect(() => {
    const savedQueue = localStorage.getItem('virasaat_queue_num');
    const savedEmail = localStorage.getItem('virasaat_user_email');
    if (savedQueue && savedEmail) {
      setQueueNumber(parseInt(savedQueue));
      setEmail(savedEmail);
      setIsSubmitted(true);
    }
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName,
          country,
          platform,
          source: 'modal_waitlist',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Something went wrong. Please try again.');
        setIsSubmitting(false);
        return;
      }

      const assignedNumber = data.queueNumber || queueNumber;
      setQueueNumber(assignedNumber);
      localStorage.setItem('virasaat_queue_num', assignedNumber.toString());
      localStorage.setItem('virasaat_user_email', email);
      setIsSubmitted(true);
    } catch {
      setErrorMessage('Could not connect to server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    const inviteLink = `https://virasaat.app/waitlist?ref=FOUNDER-${queueNumber}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(2, 23, 19, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-card-gold"
        style={{
          maxWidth: '520px',
          width: '100%',
          background: 'rgba(5, 34, 28, 0.98)',
          border: '1px solid var(--border-gold)',
          borderRadius: '24px',
          padding: '36px 30px',
          position: 'relative',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.75)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(220, 235, 229, 0.08)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--warm-ivory)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {!isSubmitted ? (
          <div>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #0B5D4B 0%, #063F34 100%)',
                  border: '1px solid var(--border-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                  boxShadow: '0 0 25px rgba(212, 175, 55, 0.35)',
                }}
              >
                <Sparkles size={24} color="#D4AF37" />
              </div>

              <div
                style={{
                  display: 'inline-block',
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  color: '#ECC862',
                  fontWeight: 700,
                  marginBottom: '10px',
                  letterSpacing: '0.05em',
                }}
              >
                COMING SOON • FREE EARLY ACCESS
              </div>

              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.75rem',
                  color: 'var(--warm-ivory)',
                  marginBottom: '8px',
                }}
              >
                Join the Waitlist
              </h3>

              <p style={{ fontSize: '0.92rem', color: 'var(--sage)', lineHeight: 1.5, margin: 0 }}>
                Be the first to protect your family's accounts and memories. Early members get free lifetime core access.
              </p>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div
                style={{
                  background: 'rgba(217, 74, 74, 0.18)',
                  border: '1px solid rgba(217, 74, 74, 0.5)',
                  color: '#FFBABA',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                  textAlign: 'center',
                }}
              >
                {errorMessage}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--sage)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>
                  Email Address <span style={{ color: '#ECC862' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--sage)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(6, 40, 33, 0.85)',
                      border: '1px solid rgba(220, 235, 229, 0.22)',
                      borderRadius: '12px',
                      padding: '12px 14px 12px 42px',
                      color: '#FFF',
                      fontSize: '0.92rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--sage)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>
                  Your Name (Optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="var(--sage)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                  <input
                    type="text"
                    placeholder="e.g. Vikram Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(6, 40, 33, 0.85)',
                      border: '1px solid rgba(220, 235, 229, 0.22)',
                      borderRadius: '12px',
                      padding: '12px 14px 12px 42px',
                      color: '#FFF',
                      fontSize: '0.92rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--sage)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>
                    Your Phone
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(6, 40, 33, 0.85)',
                      border: '1px solid rgba(220, 235, 229, 0.22)',
                      borderRadius: '12px',
                      padding: '12px',
                      color: '#FFF',
                      fontSize: '0.86rem',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="Apple iPhone (iOS)">Apple iPhone (iOS)</option>
                    <option value="Google Android">Android</option>
                    <option value="Both iOS & Android">Both</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--sage)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>
                    Country
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(6, 40, 33, 0.85)',
                      border: '1px solid rgba(220, 235, 229, 0.22)',
                      borderRadius: '12px',
                      padding: '12px',
                      color: '#FFF',
                      fontSize: '0.86rem',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="India">India</option>
                    <option value="USA">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="UAE">UAE</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '2px',
                }}
              >
                <Lock size={13} color="#D4AF37" />
                <span>Zero Spam Guarantee. We will only email you your invite.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-gold"
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '14px',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.75 : 1,
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Saving your spot...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Join Waitlist (Free)</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Confirmation Screen */
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(53, 184, 107, 0.2)',
                border: '2px solid #35B86B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
                boxShadow: '0 0 30px rgba(53, 184, 107, 0.4)',
              }}
            >
              <CheckCircle2 size={36} color="#35B86B" />
            </div>

            <div className="glass-pill" style={{ borderColor: '#35B86B', marginBottom: '14px' }}>
              <ShieldCheck size={14} color="#35B86B" />
              <span style={{ color: '#35B86B', fontWeight: 700 }}>YOU ARE ON THE WAITLIST</span>
            </div>

            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.85rem',
                color: 'var(--warm-ivory)',
                marginBottom: '10px',
              }}
            >
              Spot Secured, {fullName ? fullName.split(' ')[0] : 'Friend'}!
            </h3>

            <p style={{ fontSize: '0.94rem', color: 'var(--sage)', lineHeight: 1.6, marginBottom: '22px' }}>
              We sent a confirmation email to <strong>{email}</strong>. You'll be among the very first to get an invite when we launch.
            </p>

            {/* Queue Badge */}
            <div
              style={{
                background: 'rgba(8, 48, 40, 0.85)',
                border: '1px solid var(--border-gold)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '22px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: '#ECC862', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Your Founding Member Spot
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.6rem',
                  fontWeight: 800,
                  color: '#FFF',
                  lineHeight: 1.1,
                  margin: '6px 0',
                }}
              >
                #{queueNumber}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Early Access reserved for {platform} • Free Lifetime Core Vault
              </div>
            </div>

            {/* Invite Referral */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--sage)', marginBottom: '8px' }}>
                Share your invite link with family or friends:
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(6, 40, 33, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '6px 8px 6px 14px',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  https://virasaat.app/waitlist?ref=FOUNDER-{queueNumber}
                </span>
                <button
                  onClick={handleCopy}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.78rem', borderRadius: '8px' }}
                >
                  {copied ? <Check size={14} color="#35B86B" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn btn-gold"
              style={{ width: '100%', padding: '14px' }}
            >
              Back to Website
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
