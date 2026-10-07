'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Sparkles, ArrowRight } from 'lucide-react';
import { faqsData } from '@/data/faqs';

interface FaqSectionProps {
  onOpenWaitlist: () => void;
}

export default function FaqSection({ onOpenWaitlist }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="section" style={{ background: 'rgba(4, 27, 22, 0.65)', position: 'relative' }}>
      <div className="container-narrow">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div className="glass-pill" style={{ marginBottom: '14px' }}>
            <HelpCircle size={15} color="#D4AF37" />
            <span style={{ color: '#F3E5AB' }}>Frequently Asked Questions</span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(2rem, 3.6vw, 2.8rem)',
              color: 'var(--warm-ivory)',
              marginBottom: '16px',
            }}
          >
            Everything You Need To Know About <br />
            <span className="text-gradient-gold">Protecting Your Heritage</span>
          </h2>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
            Clear, transparent answers to help you make an informed decision for your family.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '40px' }}>
          {faqsData.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className="glass-card"
                style={{
                  background: isOpen ? 'rgba(8, 48, 40, 0.85)' : 'rgba(6, 40, 33, 0.45)',
                  border: isOpen ? '1px solid var(--border-gold)' : '1px solid rgba(220, 235, 229, 0.1)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'all 0.25s ease',
                }}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                  aria-expanded={isOpen}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.12rem',
                      fontWeight: 600,
                      color: isOpen ? '#FFF' : 'var(--warm-ivory)',
                      lineHeight: 1.4,
                    }}
                  >
                    {faq.question}
                  </span>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isOpen ? 'rgba(212, 175, 55, 0.2)' : 'rgba(220, 235, 229, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s ease',
                    }}
                  >
                    <ChevronDown size={18} color={isOpen ? '#ECC862' : 'var(--sage)'} />
                  </div>
                </button>

                {isOpen && (
                  <div
                    style={{
                      padding: '0 24px 22px 24px',
                      color: 'var(--text-secondary)',
                      fontSize: '0.96rem',
                      lineHeight: 1.7,
                      borderTop: '1px solid rgba(220, 235, 229, 0.08)',
                      paddingTop: '16px',
                    }}
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions banner */}
        <div
          style={{
            textAlign: 'center',
            padding: '24px',
            background: 'rgba(11, 93, 75, 0.2)',
            borderRadius: '16px',
            border: '1px solid rgba(220, 235, 229, 0.12)',
          }}
        >
          <p style={{ fontSize: '0.95rem', color: 'var(--sage)', marginBottom: '12px' }}>
            Ready to secure your family's accounts and memories?
          </p>
          <button
            onClick={onOpenWaitlist}
            className="btn btn-gold"
            style={{ padding: '12px 24px', fontSize: '0.9rem' }}
          >
            <Sparkles size={16} />
            <span>Join the Waitlist (Free Early Access)</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
