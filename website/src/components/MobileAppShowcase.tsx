'use client';

import React, { useState } from 'react';
import {
  Smartphone,
  ShieldCheck,
  Lock,
  Heart,
  TrendingUp,
  FileText,
  Activity,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Play,
  UserCheck,
  Clock,
  Eye,
  Camera,
  Layers,
  ChevronRight,
  Bell,
  Fingerprint,
} from 'lucide-react';

interface MobileAppShowcaseProps {
  onOpenWaitlist: () => void;
}

export default function MobileAppShowcase({ onOpenWaitlist }: MobileAppShowcaseProps) {
  const [activeScreen, setActiveScreen] = useState<'home' | 'finance' | 'video' | 'heartbeat' | 'security'>('home');
  const [devicePlatform, setDevicePlatform] = useState<'ios' | 'android'>('ios');
  const [heartbeatChecked, setHeartbeatChecked] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [biometricSimStatus, setBiometricSimStatus] = useState<'idle' | 'scanning' | 'success'>('idle');

  const handleSimulateBiometric = () => {
    if (biometricSimStatus === 'scanning') return;
    setBiometricSimStatus('scanning');
    setTimeout(() => {
      setBiometricSimStatus('success');
    }, 1000);
  };

  const screens = [
    {
      id: 'home' as const,
      name: 'Vault Home',
      tag: 'Overview',
      icon: Layers,
      headline: 'All Your Savings & Family Items in One Place',
      desc: 'See your protected bank accounts, documents, videos, and chosen family contact in seconds.',
    },
    {
      id: 'finance' as const,
      name: 'Bank & Investments',
      tag: 'No Lost Money',
      icon: TrendingUp,
      headline: 'Mutual Funds, Stocks, Bank Lockers & Policies',
      desc: 'List accounts from Zerodha, Groww, banks, and term insurance with simple claim guides for family.',
    },
    {
      id: 'video' as const,
      name: 'Personal Videos',
      tag: 'Memories',
      icon: Heart,
      headline: 'Personal Video Messages Saved for Loved Ones',
      desc: 'Record video notes for your children or spouse—only delivered on special milestones or emergencies.',
    },
    {
      id: 'heartbeat' as const,
      name: 'Safety Check',
      tag: 'Safety Check',
      icon: Activity,
      headline: 'Gentle Monthly Check-In & Safe Family Handover',
      desc: 'A quick 1-tap check-in once a month with a full 14-day safety buffer so false alarms never occur.',
    },
    {
      id: 'security' as const,
      name: 'Face ID & Fingerprint',
      tag: '1-Tap Unlock',
      icon: Fingerprint,
      headline: 'Instant Face ID & Fingerprint Login',
      desc: 'Unlock your private vault in under 1 second using your smartphone’s native biometric sensor—no typing passwords in public.',
    },
  ];

  return (
    <section id="mobile-app" className="section" style={{ position: 'relative', overflow: 'hidden', background: '#021713' }}>
      {/* Background ambient lighting */}
      <div
        className="ambient-orb"
        style={{
          width: '550px',
          height: '550px',
          top: '15%',
          left: '-10%',
          background: 'radial-gradient(circle, rgba(11, 93, 75, 0.35) 0%, transparent 70%)',
        }}
      />
      <div
        className="ambient-orb"
        style={{
          width: '500px',
          height: '500px',
          bottom: '10%',
          right: '-5%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.18) 0%, transparent 70%)',
        }}
      />

      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '880px', margin: '0 auto 50px' }}>
          <div className="glass-pill" style={{ marginBottom: '16px', borderColor: 'var(--gold-primary)' }}>
            <Sparkles size={15} color="#D4AF37" />
            <span style={{ color: '#F3E5AB', fontWeight: 600 }}>✦ Native Mobile Applications • Coming Soon</span>
            <span style={{ opacity: 0.5 }}>|</span>
            <span style={{ color: 'var(--sage)' }}>iOS & Android</span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(2.2rem, 4.4vw, 3.6rem)',
              color: 'var(--warm-ivory)',
              lineHeight: 1.15,
              marginBottom: '20px',
              fontWeight: 800,
            }}
          >
            Built for Your Smartphone. <br />
            <span className="text-gradient-gold">Simple, Fast, and Private.</span>
          </h2>

          <p style={{ fontSize: '1.12rem', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '720px', margin: '0 auto 28px' }}>
            Virasaat is designed natively for <strong style={{ color: '#FFF' }}>Apple iOS</strong> and <strong style={{ color: '#FFF' }}>Google Android</strong>. Protect your accounts with Face ID, keep everything 100% private, and check in with one simple tap once a month.
          </p>

          {/* Platform Toggle & Store Badges */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
            }}
          >
            {/* iOS & Android Device Preview Switch */}
            <div
              style={{
                display: 'inline-flex',
                background: 'rgba(8, 43, 36, 0.75)',
                padding: '4px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <button
                onClick={() => setDevicePlatform('ios')}
                style={{
                  background: devicePlatform === 'ios' ? 'var(--primary-forest)' : 'transparent',
                  color: devicePlatform === 'ios' ? '#FFF' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Apple Icon */}
                <svg width="15" height="15" viewBox="0 0 170 170" fill="currentColor">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.66-7.85-11.92-14.42-6.53-10.08-11.66-21.68-15.39-34.79-3.72-13.11-5.59-25.26-5.59-36.46 0-14.94 3.82-27.18 11.46-36.72 7.64-9.54 17.06-14.42 28.27-14.65 4.8 0 10.08 1.3 15.84 3.9 5.76 2.6 9.49 4.01 11.19 4.24 2.12-.45 5.97-1.96 11.55-4.53 5.58-2.58 10.59-3.75 15.02-3.52 11.45.69 20.67 4.96 27.67 12.82-9.84 5.96-14.65 14.37-14.42 25.22.23 8.7 3.52 15.93 9.87 21.68 6.35 5.76 13.9 9.07 22.65 9.94-2.23 6.64-4.8 13.06-7.72 19.26zM119.22 33.15c0-6.73 2.45-13.25 7.35-19.56 4.9-6.31 11.08-10.63 18.54-12.96-1.12 7.06-3.82 13.56-8.11 19.5-4.29 5.94-10.19 10.27-17.78 13.02z" />
                </svg>
                <span>Apple iOS Preview</span>
              </button>

              <button
                onClick={() => setDevicePlatform('android')}
                style={{
                  background: devicePlatform === 'android' ? 'var(--primary-forest)' : 'transparent',
                  color: devicePlatform === 'android' ? '#FFF' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
              >
                <Smartphone size={16} />
                <span>Google Android Preview</span>
              </button>
            </div>

            {/* Coming Soon Store Badges */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div
                onClick={onOpenWaitlist}
                className="glass-card"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(220, 235, 229, 0.2)',
                }}
                title="Pre-register for iOS TestFlight & App Store launch"
              >
                <svg width="20" height="20" viewBox="0 0 170 170" fill="#FFF">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.66-7.85-11.92-14.42-6.53-10.08-11.66-21.68-15.39-34.79-3.72-13.11-5.59-25.26-5.59-36.46 0-14.94 3.82-27.18 11.46-36.72 7.64-9.54 17.06-14.42 28.27-14.65 4.8 0 10.08 1.3 15.84 3.9 5.76 2.6 9.49 4.01 11.19 4.24 2.12-.45 5.97-1.96 11.55-4.53 5.58-2.58 10.59-3.75 15.02-3.52 11.45.69 20.67 4.96 27.67 12.82-9.84 5.96-14.65 14.37-14.42 25.22.23 8.7 3.52 15.93 9.87 21.68 6.35 5.76 13.9 9.07 22.65 9.94-2.23 6.64-4.8 13.06-7.72 19.26zM119.22 33.15c0-6.73 2.45-13.25 7.35-19.56 4.9-6.31 11.08-10.63 18.54-12.96-1.12 7.06-3.82 13.56-8.11 19.5-4.29 5.94-10.19 10.27-17.78 13.02z" />
                </svg>
                <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
                  <div style={{ fontSize: '0.62rem', color: '#ECC862', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    COMING SOON ON
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#FFF', fontWeight: 700 }}>
                    Apple App Store
                  </div>
                </div>
              </div>

              <div
                onClick={onOpenWaitlist}
                className="glass-card"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(220, 235, 229, 0.2)',
                }}
                title="Pre-register for Google Play early access"
              >
                {/* Google Play Tri-color SVG */}
                <svg width="20" height="20" viewBox="0 0 512 512">
                  <path fill="#4285F4" d="M325.3 234.3L104.6 13l280 161.8z" />
                  <path fill="#34A853" d="M47 0C21.1 0 0 21.1 0 47v418c0 25.9 21.1 47 47 47c7.4 0 14.5-1.7 20.8-4.8l257.5-148.8L47 0z" />
                  <path fill="#FBBC04" d="M407.4 281.8l-82.1-47.5-24.6 24.6 24.6 24.6 82.1-47.5c12.3-7.1 12.3-18.7 0-25.8z" />
                  <path fill="#EA4335" d="M104.6 499l220.7-221.3 59.3 34.3L104.6 499z" />
                </svg>
                <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
                  <div style={{ fontSize: '0.62rem', color: '#35B86B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    COMING SOON ON
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#FFF', fontWeight: 700 }}>
                    Google Play
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================
           INTERACTIVE MOBILE DEVICE SHOWCASE GRID
           =================================================================== */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '40px',
            alignItems: 'center',
            maxWidth: '1140px',
            margin: '0 auto',
          }}
          className="mobile-showcase-layout"
        >
          {/* Top/Side Interactive Screen Selector Tabs */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '10px',
            }}
          >
            {screens.map((scr) => {
              const Icon = scr.icon;
              const isSelected = activeScreen === scr.id;
              return (
                <button
                  key={scr.id}
                  onClick={() => setActiveScreen(scr.id)}
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(11, 93, 75, 0.95) 0%, rgba(6, 63, 52, 0.98) 100%)'
                      : 'rgba(8, 43, 36, 0.55)',
                    border: isSelected ? '1px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                    color: isSelected ? '#FFF' : 'var(--text-secondary)',
                    padding: '10px 18px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 8px 24px rgba(212, 175, 55, 0.25)' : 'none',
                  }}
                >
                  <Icon size={16} color={isSelected ? '#ECC862' : 'var(--sage)'} />
                  <span>{scr.name}</span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      background: isSelected ? 'rgba(212, 175, 55, 0.25)' : 'rgba(220, 235, 229, 0.1)',
                      color: isSelected ? '#ECC862' : 'var(--text-muted)',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      fontWeight: 600,
                    }}
                  >
                    {scr.tag}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Central Stage: The Smartphone Device Mockup + Feature Callouts */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(280px, 340px) 1fr',
              gap: '40px',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="mobile-device-stage"
          >
            {/* THE PHONE FRAME */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  position: 'relative',
                  width: '320px',
                  height: '650px',
                  background: '#041B16',
                  borderRadius: devicePlatform === 'ios' ? '48px' : '36px',
                  border: '10px solid #1A362F',
                  boxShadow:
                    '0 0 0 2px #0B5D4B, 0 30px 80px rgba(0, 0, 0, 0.8), 0 0 50px rgba(11, 93, 75, 0.35)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                }}
              >
                {/* Metallic Frame Highlights */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: devicePlatform === 'ios' ? '38px' : '26px',
                    pointerEvents: 'none',
                    zIndex: 20,
                  }}
                />

                {/* Status Bar */}
                <div
                  style={{
                    height: '44px',
                    padding: '0 22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#FFF',
                    position: 'relative',
                    zIndex: 15,
                    background: 'rgba(4, 27, 22, 0.95)',
                  }}
                >
                  <span>9:41</span>

                  {/* Notch / Dynamic Island */}
                  {devicePlatform === 'ios' ? (
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '94px',
                        height: '24px',
                        background: '#000',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 10px',
                      }}
                    >
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0B5D4B' }} />
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#35B86B', boxShadow: '0 0 4px #35B86B' }} />
                    </div>
                  ) : (
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '12px',
                        height: '12px',
                        background: '#000',
                        borderRadius: '50%',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    />
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>5G</span>
                    <div
                      style={{
                        width: '20px',
                        height: '10px',
                        border: '1px solid #FFF',
                        borderRadius: '3px',
                        padding: '1px',
                        display: 'flex',
                      }}
                    >
                      <div style={{ width: '90%', height: '100%', background: '#35B86B', borderRadius: '1px' }} />
                    </div>
                  </div>
                </div>

                {/* PHONE SCREEN CONTENT */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    background: '#031E18',
                    padding: '14px 16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                  }}
                >
                  {/* =========================================================
                      SCREEN 1: VAULT HOME (Dashboard)
                      ========================================================= */}
                  {activeScreen === 'home' && (
                    <div className="animate-fade-in">
                      {/* Top Bar inside App */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '14px',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.65rem', color: '#ECC862', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            VIRASAAT VAULT • SECURE
                          </div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFF' }}>
                            Namaste, Vikram
                          </div>
                        </div>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            background: 'rgba(11, 93, 75, 0.6)',
                            border: '1px solid var(--border-gold)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Lock size={14} color="#ECC862" />
                        </div>
                      </div>

                      {/* Master Portfolio Card */}
                      <div
                        style={{
                          background: 'linear-gradient(135deg, #0B5D4B 0%, #063F34 100%)',
                          borderRadius: '16px',
                          padding: '14px',
                          border: '1px solid rgba(212, 175, 55, 0.4)',
                          marginBottom: '12px',
                          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.68rem', color: '#EAF4F0', letterSpacing: '0.04em' }}>
                            TOTAL PROTECTED ASSETS
                          </span>
                          <span
                            style={{
                              fontSize: '0.62rem',
                              background: 'rgba(53, 184, 107, 0.25)',
                              color: '#35B86B',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 700,
                            }}
                          >
                            AES-256
                          </span>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFF', letterSpacing: '-0.02em' }}>
                          ₹ 2,48,50,000
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--sage)', marginTop: '2px' }}>
                          Across 14 Folios, Policies & Real Estate
                        </div>

                        {/* Heartbeat Status Strip */}
                        <div
                          style={{
                            marginTop: '10px',
                            paddingTop: '8px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#35B86B' }} />
                            <span style={{ fontSize: '0.66rem', color: '#EAF4F0' }}>Heartbeat: Active</span>
                          </div>
                          <span style={{ fontSize: '0.64rem', color: '#ECC862' }}>Next: in 24 days</span>
                        </div>
                      </div>

                      {/* 4 Legacy Categories Grid */}
                      <div style={{ fontSize: '0.72rem', color: 'var(--sage)', fontWeight: 600, marginBottom: '8px' }}>
                        VAULT CATEGORIES
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                        <div
                          onClick={() => setActiveScreen('finance')}
                          style={{
                            background: 'rgba(8, 43, 36, 0.7)',
                            border: '1px solid rgba(220, 235, 229, 0.14)',
                            borderRadius: '12px',
                            padding: '10px',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <TrendingUp size={16} color="#ECC862" />
                            <span style={{ fontSize: '0.64rem', color: '#ECC862', fontWeight: 700 }}>4 Items</span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#FFF', fontWeight: 700 }}>Financial</div>
                          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Mutual Funds, Demat</div>
                        </div>

                        <div
                          onClick={() => setActiveScreen('video')}
                          style={{
                            background: 'rgba(8, 43, 36, 0.7)',
                            border: '1px solid rgba(220, 235, 229, 0.14)',
                            borderRadius: '12px',
                            padding: '10px',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <Heart size={16} color="#E86262" />
                            <span style={{ fontSize: '0.64rem', color: '#E86262', fontWeight: 700 }}>2 Videos</span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#FFF', fontWeight: 700 }}>Milestones</div>
                          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>4K Video Capsules</div>
                        </div>

                        <div
                          style={{
                            background: 'rgba(8, 43, 36, 0.7)',
                            border: '1px solid rgba(220, 235, 229, 0.14)',
                            borderRadius: '12px',
                            padding: '10px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <FileText size={16} color="#35B86B" />
                            <span style={{ fontSize: '0.64rem', color: '#35B86B', fontWeight: 700 }}>5 Docs</span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#FFF', fontWeight: 700 }}>Legal Wills</div>
                          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Will, Deeds, Passports</div>
                        </div>

                        <div
                          onClick={() => setActiveScreen('heartbeat')}
                          style={{
                            background: 'rgba(8, 43, 36, 0.7)',
                            border: '1px solid rgba(220, 235, 229, 0.14)',
                            borderRadius: '12px',
                            padding: '10px',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <Activity size={16} color="#3D8BFF" />
                            <span style={{ fontSize: '0.64rem', color: '#3D8BFF', fontWeight: 700 }}>Active</span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#FFF', fontWeight: 700 }}>Heartbeat</div>
                          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Safety Protocol</div>
                        </div>
                      </div>

                      {/* Designated Guardian Card */}
                      <div
                        style={{
                          background: 'rgba(6, 34, 28, 0.8)',
                          border: '1px solid rgba(212, 175, 55, 0.25)',
                          borderRadius: '12px',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(53, 184, 107, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <UserCheck size={16} color="#35B86B" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.74rem', color: '#FFF', fontWeight: 700 }}>
                            Dr. Ananya Sharma (Wife)
                          </div>
                          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                            Designated Beneficiary • Verified
                          </div>
                        </div>
                        <span style={{ fontSize: '0.65rem', color: '#35B86B', fontWeight: 700 }}>Active</span>
                      </div>
                    </div>
                  )}

                  {/* =========================================================
                      SCREEN 2: FINANCIAL FOLIOS (legacy-investments.tsx)
                      ========================================================= */}
                  {activeScreen === 'finance' && (
                    <div className="animate-fade-in">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: '#ECC862', textTransform: 'uppercase' }}>ASSET REGISTRY</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF' }}>Financial Folios</div>
                        </div>
                        <span style={{ fontSize: '0.65rem', background: 'rgba(53, 184, 107, 0.2)', color: '#35B86B', padding: '3px 8px', borderRadius: '6px' }}>
                          Verified
                        </span>
                      </div>

                      {/* Item 1: Mutual Funds */}
                      <div
                        style={{
                          background: 'rgba(8, 43, 36, 0.8)',
                          border: '1px solid rgba(220, 235, 229, 0.16)',
                          borderRadius: '12px',
                          padding: '10px 12px',
                          marginBottom: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFF' }}>Parag Parikh Flexi Cap</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ECC862' }}>₹ 42.8 L</span>
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--sage)' }}>Folio #982341209 • CAMS Linked</div>
                        <div style={{ fontSize: '0.6rem', color: '#35B86B', marginTop: '4px' }}>
                          ✓ Nominee: Ananya (100%) • Redemption Guide Attached
                        </div>
                      </div>

                      {/* Item 2: Term Life Insurance */}
                      <div
                        style={{
                          background: 'rgba(8, 43, 36, 0.8)',
                          border: '1px solid rgba(220, 235, 229, 0.16)',
                          borderRadius: '12px',
                          padding: '10px 12px',
                          marginBottom: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFF' }}>HDFC Life Click 2 Protect</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ECC862' }}>₹ 2.0 Cr Cover</span>
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--sage)' }}>Policy #89421877 • Advisor: Ramesh K.</div>
                        <div style={{ fontSize: '0.6rem', color: '#35B86B', marginTop: '4px' }}>
                          ✓ 1-Tap Claim Dossier & Medical Certificate Prepared
                        </div>
                      </div>

                      {/* Item 3: Demat Stock Portfolio */}
                      <div
                        style={{
                          background: 'rgba(8, 43, 36, 0.8)',
                          border: '1px solid rgba(220, 235, 229, 0.16)',
                          borderRadius: '12px',
                          padding: '10px 12px',
                          marginBottom: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFF' }}>Zerodha Demat Account</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ECC862' }}>₹ 34.5 L</span>
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--sage)' }}>BOID: 1208160002938190 • CDSL</div>
                        <div style={{ fontSize: '0.6rem', color: '#35B86B', marginTop: '4px' }}>
                          ✓ Power of Attorney & Form ISR-1 Template Saved
                        </div>
                      </div>

                      {/* Item 4: Bank Safe Locker */}
                      <div
                        style={{
                          background: 'rgba(8, 43, 36, 0.8)',
                          border: '1px solid rgba(220, 235, 229, 0.16)',
                          borderRadius: '12px',
                          padding: '10px 12px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFF' }}>HDFC Bank Safe Locker #402</span>
                          <span style={{ fontSize: '0.68rem', color: '#ECC862' }}>Physical Safe</span>
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--sage)' }}>Indiranagar Branch • Key in Study Desk False Bottom</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          🔐 Encrypted instructions revealed on emergency handover only
                        </div>
                      </div>
                    </div>
                  )}

                  {/* =========================================================
                      SCREEN 3: 4K VIDEO CAPSULE (legacy-video-message.tsx)
                      ========================================================= */}
                  {activeScreen === 'video' && (
                    <div className="animate-fade-in">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: '#ECC862', textTransform: 'uppercase' }}>EMOTIONAL HERITAGE</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF' }}>Video Capsule</div>
                        </div>
                        <span style={{ fontSize: '0.65rem', background: 'rgba(217, 74, 74, 0.2)', color: '#FF7B7B', padding: '3px 8px', borderRadius: '6px' }}>
                          4K UHD
                        </span>
                      </div>

                      {/* Video Player Card */}
                      <div
                        style={{
                          position: 'relative',
                          borderRadius: '14px',
                          overflow: 'hidden',
                          background: 'linear-gradient(135deg, #09372E 0%, #041B16 100%)',
                          border: '1px solid var(--border-gold)',
                          padding: '16px',
                          marginBottom: '12px',
                          textAlign: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: videoPlaying ? 'rgba(53, 184, 107, 0.3)' : 'rgba(212, 175, 55, 0.3)',
                            border: '2px solid var(--gold-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '12px auto',
                            cursor: 'pointer',
                            boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)',
                          }}
                          onClick={() => setVideoPlaying(!videoPlaying)}
                        >
                          <Play size={20} color="#FFF" style={{ marginLeft: '3px' }} />
                        </div>

                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFF', marginBottom: '4px' }}>
                          "For Ananya on her 18th Birthday"
                        </div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--sage)', marginBottom: '8px' }}>
                          Duration: 04:32 • Encrypted Client-Side with AES-256
                        </div>

                        <div
                          style={{
                            background: 'rgba(0, 0, 0, 0.5)',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '0.62rem',
                            color: '#ECC862',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Lock size={12} />
                          <span>Release Rule: 14 Oct 2029 (Milestone Locked)</span>
                        </div>
                      </div>

                      {/* Capsule Details */}
                      <div
                        style={{
                          background: 'rgba(8, 43, 36, 0.6)',
                          border: '1px solid rgba(220, 235, 229, 0.12)',
                          borderRadius: '12px',
                          padding: '10px 12px',
                          fontSize: '0.66rem',
                          color: 'var(--sage)',
                          lineHeight: 1.5,
                        }}
                      >
                        <div style={{ color: '#FFF', fontWeight: 700, marginBottom: '2px' }}>
                          Intimate Words of Wisdom
                        </div>
                        “Recorded in 4K resolution on mobile. This recording will remain permanently encrypted until either the milestone date arrives or dual-verified emergency handover occurs.”
                      </div>
                    </div>
                  )}

                  {/* =========================================================
                      SCREEN 4: HEARTBEAT PROTOCOL (check-in-preferences.tsx)
                      ========================================================= */}
                  {activeScreen === 'heartbeat' && (
                    <div className="animate-fade-in">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: '#ECC862', textTransform: 'uppercase' }}>PROOF OF LIFE</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF' }}>Heartbeat Protocol</div>
                        </div>
                        <span style={{ fontSize: '0.65rem', background: 'rgba(53, 184, 107, 0.2)', color: '#35B86B', padding: '3px 8px', borderRadius: '6px' }}>
                          30-Day Cycle
                        </span>
                      </div>

                      {/* Interactive Heartbeat Button */}
                      <div
                        style={{
                          background: 'linear-gradient(135deg, rgba(11, 93, 75, 0.8) 0%, rgba(6, 63, 52, 0.9) 100%)',
                          border: '1px solid var(--border-gold)',
                          borderRadius: '16px',
                          padding: '16px',
                          textAlign: 'center',
                          marginBottom: '12px',
                        }}
                      >
                        <div style={{ fontSize: '0.7rem', color: '#ECC862', textTransform: 'uppercase', marginBottom: '8px' }}>
                          {heartbeatChecked ? 'STATUS: CONFIRMED HEALTHY' : 'MONTHLY CHECK-IN READY'}
                        </div>

                        <button
                          onClick={() => setHeartbeatChecked(!heartbeatChecked)}
                          style={{
                            background: heartbeatChecked
                              ? 'linear-gradient(135deg, #35B86B 0%, #20874B 100%)'
                              : 'linear-gradient(135deg, #ECC862 0%, #D4AF37 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '12px 20px',
                            color: '#000',
                            fontWeight: 800,
                            fontSize: '0.84rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Activity size={16} />
                          <span>{heartbeatChecked ? 'Checked In! Safe' : 'Tap: I Am Safe & Healthy'}</span>
                        </button>

                        <div style={{ fontSize: '0.62rem', color: 'var(--sage)', marginTop: '8px' }}>
                          {heartbeatChecked
                            ? 'Next check-in scheduled in 30 days.'
                            : 'Takes 2 seconds. Confirms your continuous safety.'}
                        </div>
                      </div>

                      {/* Escalation Track */}
                      <div style={{ fontSize: '0.68rem', color: 'var(--sage)', fontWeight: 600, marginBottom: '6px' }}>
                        FAIL-SAFE HANDOVER TIMELINE
                      </div>
                      <div
                        style={{
                          background: 'rgba(8, 43, 36, 0.7)',
                          border: '1px solid rgba(220, 235, 229, 0.12)',
                          borderRadius: '12px',
                          padding: '10px 12px',
                          fontSize: '0.62rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <CheckCircle2 size={12} color="#35B86B" />
                          <span><strong>Day 0:</strong> Discrete notification to phone</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <Clock size={12} color="#ECC862" />
                          <span><strong>Day 14:</strong> Fail-safe quiet grace period</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldCheck size={12} color="#3D8BFF" />
                          <span><strong>Day 30:</strong> Dual-key encrypted release to Dr. Ananya</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* =========================================================
                      SCREEN 5: BIOMETRIC SECURITY (security.tsx)
                      ========================================================= */}
                  {activeScreen === 'security' && (
                    <div className="animate-fade-in">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: '#ECC862', textTransform: 'uppercase' }}>BIOMETRIC SECURITY</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF' }}>
                            {devicePlatform === 'ios' ? 'Face ID Login' : 'Fingerprint Login'}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.65rem', background: 'rgba(53, 184, 107, 0.2)', color: '#35B86B', padding: '3px 8px', borderRadius: '6px' }}>
                          Native Sensor
                        </span>
                      </div>

                      <div
                        style={{
                          background: 'linear-gradient(135deg, rgba(8, 43, 36, 0.95) 0%, rgba(4, 27, 22, 0.98) 100%)',
                          border: '1px solid var(--border-gold)',
                          borderRadius: '16px',
                          padding: '18px 14px',
                          textAlign: 'center',
                          marginBottom: '12px',
                        }}
                      >
                        {/* Interactive Biometric Sensor Circle */}
                        <div
                          onClick={handleSimulateBiometric}
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background:
                              biometricSimStatus === 'success'
                                ? 'rgba(53, 184, 107, 0.25)'
                                : biometricSimStatus === 'scanning'
                                ? 'rgba(212, 175, 55, 0.25)'
                                : 'rgba(11, 93, 75, 0.35)',
                            border: `2px solid ${
                              biometricSimStatus === 'success'
                                ? '#35B86B'
                                : biometricSimStatus === 'scanning'
                                ? '#ECC862'
                                : 'var(--gold-primary)'
                            }`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 10px',
                            cursor: 'pointer',
                            boxShadow:
                              biometricSimStatus === 'success'
                                ? '0 0 24px rgba(53, 184, 107, 0.5)'
                                : biometricSimStatus === 'scanning'
                                ? '0 0 24px rgba(236, 200, 98, 0.6)'
                                : '0 0 16px rgba(212, 175, 55, 0.25)',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {biometricSimStatus === 'success' ? (
                            <CheckCircle2 size={32} color="#35B86B" />
                          ) : (
                            <Fingerprint
                              size={32}
                              color={biometricSimStatus === 'scanning' ? '#ECC862' : '#D4AF37'}
                              style={{
                                transform: biometricSimStatus === 'scanning' ? 'scale(1.1)' : 'scale(1)',
                                transition: 'transform 0.2s ease',
                              }}
                            />
                          )}
                        </div>

                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FFF', marginBottom: '4px' }}>
                          {biometricSimStatus === 'idle' && (
                            devicePlatform === 'ios' ? 'Face ID Ready' : 'Fingerprint Ready'
                          )}
                          {biometricSimStatus === 'scanning' && (
                            devicePlatform === 'ios' ? 'Scanning Face...' : 'Reading Fingerprint...'
                          )}
                          {biometricSimStatus === 'success' && 'Unlocked: Vikram Sharma'}
                        </div>

                        <div style={{ fontSize: '0.64rem', color: 'var(--sage)', marginBottom: '12px' }}>
                          {biometricSimStatus === 'idle' && 'Tap below to test instant biometric login in the app.'}
                          {biometricSimStatus === 'scanning' && 'Verifying on-device Secure Enclave hardware...'}
                          {biometricSimStatus === 'success' && '✓ Master AES-256 key unlocked locally. No passwords needed.'}
                        </div>

                        <button
                          onClick={
                            biometricSimStatus === 'success'
                              ? () => setBiometricSimStatus('idle')
                              : handleSimulateBiometric
                          }
                          disabled={biometricSimStatus === 'scanning'}
                          style={{
                            background:
                              biometricSimStatus === 'success'
                                ? 'rgba(53, 184, 107, 0.2)'
                                : 'linear-gradient(135deg, #ECC862 0%, #D4AF37 100%)',
                            border: biometricSimStatus === 'success' ? '1px solid #35B86B' : 'none',
                            borderRadius: '10px',
                            padding: '8px 16px',
                            color: biometricSimStatus === 'success' ? '#35B86B' : '#000',
                            fontWeight: 700,
                            fontSize: '0.76rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Fingerprint size={14} />
                          <span>
                            {biometricSimStatus === 'idle'
                              ? devicePlatform === 'ios'
                                ? 'Tap to Test Face ID'
                                : 'Tap to Test Fingerprint'
                              : biometricSimStatus === 'scanning'
                              ? 'Verifying...'
                              : 'Test Again'}
                          </span>
                        </button>
                      </div>

                      <div
                        style={{
                          background: 'rgba(6, 34, 28, 0.6)',
                          border: '1px solid rgba(220, 235, 229, 0.12)',
                          borderRadius: '12px',
                          padding: '10px 12px',
                          fontSize: '0.64rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                        }}
                      >
                        <span style={{ color: '#FFF', fontWeight: 700 }}>100% On-Device Protection: </span>
                        Biometric data stays in your phone’s Secure Enclave. Virasaat servers never see or store your face or fingerprint.
                      </div>
                    </div>
                  )}
                </div>

                {/* APP BOTTOM NAVIGATION BAR */}
                <div
                  style={{
                    height: '54px',
                    background: 'rgba(4, 27, 22, 0.98)',
                    borderTop: '1px solid rgba(220, 235, 229, 0.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    padding: '0 6px',
                    position: 'relative',
                    zIndex: 15,
                  }}
                >
                  <button
                    onClick={() => setActiveScreen('home')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: activeScreen === 'home' ? '#ECC862' : 'var(--text-muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      cursor: 'pointer',
                    }}
                  >
                    <Layers size={15} />
                    <span style={{ fontSize: '0.55rem', fontWeight: 600 }}>Vault</span>
                  </button>

                  <button
                    onClick={() => setActiveScreen('finance')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: activeScreen === 'finance' ? '#ECC862' : 'var(--text-muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      cursor: 'pointer',
                    }}
                  >
                    <TrendingUp size={15} />
                    <span style={{ fontSize: '0.55rem', fontWeight: 600 }}>Assets</span>
                  </button>

                  <button
                    onClick={() => setActiveScreen('video')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: activeScreen === 'video' ? '#ECC862' : 'var(--text-muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      cursor: 'pointer',
                    }}
                  >
                    <Heart size={15} />
                    <span style={{ fontSize: '0.55rem', fontWeight: 600 }}>Capsules</span>
                  </button>

                  <button
                    onClick={() => setActiveScreen('security')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: activeScreen === 'security' ? '#ECC862' : 'var(--text-muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      cursor: 'pointer',
                    }}
                  >
                    <Fingerprint size={15} />
                    <span style={{ fontSize: '0.55rem', fontWeight: 600 }}>Face ID</span>
                  </button>

                  <button
                    onClick={() => setActiveScreen('heartbeat')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: activeScreen === 'heartbeat' ? '#ECC862' : 'var(--text-muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      cursor: 'pointer',
                    }}
                  >
                    <Activity size={15} />
                    <span style={{ fontSize: '0.55rem', fontWeight: 600 }}>Heartbeat</span>
                  </button>
                </div>

                {/* Home Indicator bar */}
                <div
                  style={{
                    height: '18px',
                    background: 'rgba(4, 27, 22, 0.98)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '110px',
                      height: '4px',
                      background: 'rgba(255, 255, 255, 0.45)',
                      borderRadius: '999px',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* FEATURE EXPLANATION & PRE-REGISTRATION SIDE PANEL */}
            <div>
              <div className="glass-pill" style={{ marginBottom: '14px', borderColor: 'var(--border-gold)' }}>
                <ShieldCheck size={14} color="#D4AF37" />
                <span style={{ color: '#F3E5AB' }}>✦ Mobile-First Cryptographic Sanctuary</span>
              </div>

              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.6rem, 2.8vw, 2.3rem)',
                  color: 'var(--warm-ivory)',
                  marginBottom: '14px',
                  lineHeight: 1.25,
                }}
              >
                {screens.find((s) => s.id === activeScreen)?.headline}
              </h3>

              <p style={{ fontSize: '1.05rem', color: 'var(--sage)', lineHeight: 1.68, marginBottom: '24px' }}>
                {screens.find((s) => s.id === activeScreen)?.desc}
              </p>

              {/* 3 Mobile Capability Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
                <div
                  className="glass-card"
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(53, 184, 107, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Fingerprint size={18} color="#35B86B" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFF', marginBottom: '2px' }}>
                      Native Face ID & Fingerprint Login
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Unlock in 0.2 seconds with Apple Face ID or Android fingerprint scanner. No master passwords to write on paper or risk leaking in public.
                    </div>
                  </div>
                </div>

                <div
                  className="glass-card"
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(212, 175, 55, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Activity size={18} color="#D4AF37" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFF', marginBottom: '2px' }}>
                      1-Tap Push Heartbeat Verification
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Confirm you are safe directly from lock screen notifications, Apple Watch, or Wear OS without opening the app.
                    </div>
                  </div>
                </div>

                <div
                  className="glass-card"
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(61, 139, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Camera size={18} color="#3D8BFF" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFF', marginBottom: '2px' }}>
                      In-App 4K Video Milestone Studio
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Record high-definition video capsules with your smartphone camera, encrypted immediately before leaving your device.
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Pre-Registration Callout */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(11, 93, 75, 0.6) 0%, rgba(6, 63, 52, 0.8) 100%)',
                  border: '1px solid var(--border-gold)',
                  borderRadius: '18px',
                  padding: '22px 24px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#ECC862', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
                    EARLY ACCESS TESTFLIGHT & PLAY STORE BETA
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFF' }}>
                    Be the First to Install on Android & iOS
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--sage)' }}>
                    Exclusive TestFlight & Google Play pre-launch rollout starting Q4 2026.
                  </div>
                </div>

                <button
                  onClick={onOpenWaitlist}
                  className="btn btn-gold"
                  style={{
                    padding: '12px 26px',
                    fontSize: '0.95rem',
                    borderRadius: '12px',
                  }}
                >
                  <Sparkles size={16} />
                  <span>Get Mobile Early Access</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
