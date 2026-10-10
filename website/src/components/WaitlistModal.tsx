'use client';

import { useEffect, useRef, useState } from 'react';
import { X, ShieldCheck, CheckCircle2, Copy, Check, ArrowRight, Lock, Loader2 } from 'lucide-react';
import { COUNTRIES, detectCountryFromTimeZone } from '@/data/countries';
import { submitWaitlist, type WaitlistRegistration } from '@/lib/waitlist';

interface WaitlistModalProps {
  onClose: () => void;
  defaultEmail?: string;
  onJoined: (registration: WaitlistRegistration) => void;
}

export default function WaitlistModal({ onClose, defaultEmail = '', onJoined }: WaitlistModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const pendingRef = useRef(false);
  const activeRef = useRef(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(defaultEmail);
  const [country, setCountry] = useState('India');
  const [platform, setPlatform] = useState('Apple iPhone (iOS)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registration, setRegistration] = useState<WaitlistRegistration | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const shareUrl = 'https://virasaat.app/';

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    activeRef.current = true;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    emailRef.current?.focus();
    return () => {
      activeRef.current = false;
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  useEffect(() => {
    if (registration) successRef.current?.focus();
  }, [registration]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pendingRef.current) return;
    if (!email.trim() || !fullName.trim()) {
      setErrorMessage('Please enter your name and a valid email address.');
      return;
    }
    pendingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const saved = await submitWaitlist({ email, fullName, country, platform });
      // Parent keeps only this acknowledged reservation for the current visit.
      onJoined(saved);
      if (activeRef.current) setRegistration(saved);
    } catch (error) {
      if (activeRef.current) {
        setErrorMessage(error instanceof Error ? error.message : 'Signup failed. Please retry.');
      }
    } finally {
      pendingRef.current = false;
      if (activeRef.current) setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      if (activeRef.current) {
        setCopied(true);
        setCopyError('');
      }
    } catch {
      if (activeRef.current) setCopyError('Copy is unavailable. Select the link below to share it.');
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="waitlist-dialog"
      aria-labelledby="waitlist-title"
      aria-describedby="waitlist-description"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="waitlist-content">
        <button type="button" onClick={onClose} className="waitlist-close" aria-label="Close waitlist">
          <X size={18} />
        </button>
        {registration ? (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle2 size={52} color="#35B86B" style={{ margin: '0 auto 20px' }} />
            <div className="glass-pill" style={{ marginBottom: '18px' }}>
              <ShieldCheck size={14} color="#35B86B" />
              <span>Signup confirmed</span>
            </div>
            <h2 id="waitlist-title" ref={successRef} tabIndex={-1}>You are on the waitlist</h2>
            <p id="waitlist-description" style={{ color: 'var(--sage)', margin: '16px 0' }}>
              Your signup for <strong>{registration.email}</strong> was saved. A confirmation email may arrive shortly; email delivery is not guaranteed.
            </p>
            <div className="glass-card" style={{ padding: '22px', margin: '22px 0' }}>
              <div style={{ color: 'var(--gold-light)' }}>Your waitlist number</div>
              <div style={{ fontSize: '2.6rem', color: 'var(--warm-ivory)', fontFamily: 'var(--font-display)' }}>#{registration.queueNumber}</div>
              <p style={{ color: 'var(--text-secondary)' }}>Preferred device: {registration.platform}</p>
            </div>
            <p style={{ color: 'var(--sage)', marginBottom: '12px' }}>Share Virasaat with family or friends:</p>
            <a href={shareUrl} style={{ color: 'var(--gold-light)', overflowWrap: 'anywhere' }}>{shareUrl}</a>
            <button type="button" onClick={handleCopy} className="btn btn-secondary" style={{ margin: '14px auto' }}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Link copied' : 'Copy homepage link'}
            </button>
            <p role="status" style={{ color: 'var(--text-secondary)' }}>{copyError}</p>
            <button type="button" onClick={onClose} className="btn btn-gold" style={{ width: '100%', marginTop: '16px' }}>Back to website</button>
          </div>
        ) : (
          <>
            <div className="glass-pill" style={{ marginBottom: '18px' }}>Coming soon · Early access updates</div>
            <h2 id="waitlist-title">Join the waitlist</h2>
            <p id="waitlist-description" style={{ color: 'var(--sage)', margin: '12px 0 24px' }}>
              Get launch updates for the family vault. Joining the waitlist does not activate a subscription or automated family handover.
            </p>
            {errorMessage && <p role="alert" className="waitlist-error">{errorMessage}</p>}
            <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="waitlist-form">
              <label htmlFor="waitlist-email">Email address</label>
              <input ref={emailRef} id="waitlist-email" type="email" required maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
              <label htmlFor="waitlist-name">Your full name</label>
              <input id="waitlist-name" type="text" required maxLength={200} autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" />
              <label htmlFor="waitlist-platform">Preferred device</label>
              <select id="waitlist-platform" value={platform} onChange={(event) => setPlatform(event.target.value)}>
                <option value="Apple iPhone (iOS)">Apple iPhone (iOS)</option>
                <option value="Google Android">Android</option>
                <option value="Both iOS & Android">Both</option>
              </select>
              <label htmlFor="waitlist-country">Country</label>
              <select id="waitlist-country" autoComplete="country-name" value={country} onChange={(event) => setCountry(event.target.value)}>
                {COUNTRIES.map((item) => <option key={item.code} value={item.name}>{item.name}</option>)}
              </select>
              <button type="button" className="btn btn-secondary" onClick={() => setCountry(detectCountryFromTimeZone() || 'India')} style={{ justifyContent: 'center' }}>Use my timezone to suggest a country</button>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                <Lock size={13} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                We use these details for waitlist and launch updates. Read our <a href="/privacy/">privacy policy</a> and <a href="/terms/">terms</a>.
              </p>
              <button type="submit" disabled={isSubmitting} className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }}>
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                {isSubmitting ? 'Confirming your signup…' : 'Join the waitlist'}
              </button>
            </form>
          </>
        )}
      </div>
    </dialog>
  );
}
