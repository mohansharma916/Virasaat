'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Menu, X, ArrowRight, Lock, Smartphone } from 'lucide-react';

interface NavbarProps {
  onOpenWaitlist: () => void;
}

export default function Navbar({ onOpenWaitlist }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.replace('#', '');
      if (!targetId) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.pushState(null, '', window.location.pathname);
        return;
      }
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

  const navLinks = [
    { label: 'Why It Matters', href: '#problem' },
    { label: 'What You Can Store', href: '#vault' },
    { label: 'Mobile App', href: '#mobile-app' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Calculator', href: '#calculator' },
    { label: 'Safety & Privacy', href: '#security' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          transition: 'all 0.3s ease',
          background: scrolled
            ? 'rgba(4, 36, 30, 0.88)'
            : 'rgba(4, 36, 30, 0.4)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: scrolled
            ? '1px solid rgba(220, 235, 229, 0.14)'
            : '1px solid transparent',
          padding: scrolled ? '12px 0' : '20px 0',
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <a
            href="#"
            onClick={(e) => handleAnchorClick(e, '#')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0B5D4B 0%, #063F34 100%)',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(11, 93, 75, 0.5)',
              }}
            >
              <Shield size={22} color="#D4AF37" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: '#F8F5EA',
                  }}
                >
                  VIRASAAT
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    background: 'rgba(212, 175, 55, 0.2)',
                    border: '1px solid rgba(212, 175, 55, 0.4)',
                    color: '#ECC862',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                  }}
                >
                  VAULT
                </span>
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--sage)',
                  letterSpacing: '0.12em',
                  fontFamily: 'var(--font-ui)',
                  opacity: 0.85,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>विरासत</span>
                <span style={{ opacity: 0.4 }}>•</span>
                <span>Simple Family Legacy</span>
              </div>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
            }}
            className="desktop-nav"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href)}
                style={{
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  transition: 'color 0.2s ease',
                  padding: '6px 4px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F8F5EA')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

            {/* App Coming Soon Badge (Desktop) */}
            <a
              href="#mobile-app"
              onClick={(e) => handleAnchorClick(e, '#mobile-app')}
              className="desktop-nav"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(11, 93, 75, 0.35)',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                borderRadius: '999px',
                padding: '6px 14px',
                textDecoration: 'none',
                color: '#ECC862',
                fontSize: '0.78rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
            >
              <Smartphone size={13} color="#ECC862" />
              <span>App Coming Soon</span>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#35B86B',
                  boxShadow: '0 0 6px #35B86B',
                }}
              />
            </a>

            {/* Waitlist Button */}
            <button
              onClick={onOpenWaitlist}
              className="btn btn-gold"
              style={{
                padding: '10px 20px',
                fontSize: '0.88rem',
                borderRadius: '10px',
              }}
            >
              <Sparkles size={16} />
              <span>Join Waitlist</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-toggle"
              style={{
                display: 'none',
                background: 'rgba(220, 235, 229, 0.08)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--warm-ivory)',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99,
            background: 'rgba(2, 23, 19, 0.96)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            padding: '100px 24px 32px',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  handleAnchorClick(e, link.href);
                }}
                style={{
                  color: 'var(--text-primary)',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  padding: '10px 0',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenWaitlist();
              }}
              className="btn btn-gold"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Sparkles size={18} />
              <span>Join Waitlist (Free)</span>
            </button>
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Lock size={14} />
              <span>100% Private & Device Encrypted</span>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 980px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
