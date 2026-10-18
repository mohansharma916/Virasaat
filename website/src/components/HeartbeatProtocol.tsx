'use client';

import React, { useState } from 'react';
import {
  Activity,
  Bell,
  Clock,
  UserCheck,
  KeyRound,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

export default function HeartbeatProtocol() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      step: '01', title: 'Record a Check-In', subtitle: 'Current app capability',
      badge: 'Check-In', badgeColor: '#35B86B', icon: Activity,
      desc: 'The app lets you configure a check-in schedule and record a check-in. This records account activity; it is not proof of health or an emergency response service.',
      details: ['Choose available schedule settings in the app', 'Confirm a check-in from your account', 'Review the recorded date and next due date'],
      systemLog: 'DEMO::Check-in recorded. No emergency release authorized.',
    },
    {
      step: '02', title: 'Reminders', subtitle: 'If you miss a check-in',
      badge: 'Email', badgeColor: '#F4A62A', icon: Bell,
      desc: 'Check-in opens two days early and stays open. If you miss it, we email you after 7, 15, 21, 30 and 45 days, then more often, and every day in the final two weeks before your deadline.',
      details: ['Email reminders on a fixed schedule', 'Check in at any time to stop them', 'SMS, push and vacation pause are not available yet'],
      systemLog: 'DEMO::Reminder sent. Check-in still open.',
    },
    {
      step: '03', title: 'Safety Review', subtitle: 'After your deadline',
      badge: 'Reviewed', badgeColor: '#D4AF37', icon: Clock,
      desc: 'If you still have not checked in by the deadline you chose (1 to 6 months, 3 by default), Virasat opens a review and asks your trusted people what happened. A person reviews every case.',
      details: ['Missed check-ins alone never release anything', 'Checking in cancels the review', 'Not an emergency or health service'],
      systemLog: 'DEMO::Review opened. Nothing released.',
    },
    {
      step: '04', title: 'Trusted People', subtitle: 'Invite them now or later',
      badge: 'Invitations', badgeColor: '#3D68C5', icon: UserCheck,
      desc: 'Add the people you trust and choose what each one receives. Invite them now, or only if they are ever needed. They accept in the app and can see nothing until a release is approved.',
      details: ['Get permission before adding someone', 'Invitations are sent by email', 'Being invited never grants access on its own'],
      systemLog: 'DEMO::Invitation sent. No access granted.',
    },
    {
      step: '05', title: 'Family Handover', subtitle: 'Only after approval',
      badge: 'Released', badgeColor: '#ECC862', icon: KeyRound,
      desc: 'When Virasat approves a release, each trusted person can open only the items you assigned to them, in the app. If you check in afterwards, their access ends immediately.',
      details: ['Only assigned items, never the whole vault', 'Every access is logged', 'Keep a formal will and estate plan too'],
      systemLog: 'DEMO::Release approved for assigned items only.',
    },
  ];

  return (
    <section
      id="how-it-works"
      className="section"
      style={{
        background: 'rgba(4, 27, 22, 0.75)',
        position: 'relative',
        scrollMarginTop: '84px',
      }}
    >
      {/* Anchor for backward compatibility with #heartbeat */}
      <div id="heartbeat" style={{ position: 'absolute', top: 0, scrollMarginTop: '84px' }} />
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '840px', margin: '0 auto 54px' }}>
          <div className="glass-pill" style={{ marginBottom: '16px' }}>
            <Activity size={15} color="#35B86B" />
            <span style={{ color: '#EAF4F0' }}>How It Works</span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(2rem, 3.8vw, 3rem)',
              color: 'var(--warm-ivory)',
              marginBottom: '16px',
            }}
          >
            Check-Ins Today. <br />
            <span className="text-gradient-gold">A Reviewed Family Handover</span>
          </h2>

          <p style={{ fontSize: '1.08rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            See how check-ins, reminders and a reviewed handover work together. This interactive illustration does not send notifications or release any data.
          </p>
        </div>

        {/* Timeline Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            marginBottom: '36px',
            overflowX: 'auto',
            padding: '8px 0',
            gap: '8px',
          }}
        >
          {steps.map((st, idx) => {
            const isCurrent = activeStep === idx;
            const isCompleted = idx < activeStep;

            return (
              <button
                key={st.step}
                onClick={() => setActiveStep(idx)}
                style={{
                  background: isCurrent ? 'var(--primary-forest)' : isCompleted ? 'rgba(53, 184, 107, 0.2)' : 'rgba(220, 235, 229, 0.06)',
                  border: isCurrent ? '1px solid var(--gold-primary)' : isCompleted ? '1px solid #35B86B' : '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flex: '1',
                  minWidth: '170px',
                  textAlign: 'left',
                  transition: 'all 0.25s ease',
                  boxShadow: isCurrent ? '0 0 20px rgba(212, 175, 55, 0.25)' : 'none',
                }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: isCurrent ? 'var(--gold-primary)' : isCompleted ? '#35B86B' : 'rgba(220, 235, 229, 0.1)',
                    color: isCurrent ? '#04241E' : isCompleted ? '#04241E' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isCompleted ? <CheckCircle2 size={15} /> : st.step}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: isCurrent ? '#ECC862' : 'var(--text-muted)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}
                  >
                    Step {st.step}
                  </div>
                  <div
                    style={{
                      fontSize: '0.84rem',
                      color: isCurrent ? '#FFF' : 'var(--warm-ivory)',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {st.title.split(' ')[0]} {st.title.split(' ')[1] || ''}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Stage Detailed Display */}
        {(() => {
          const current = steps[activeStep];
          const Icon = current.icon;

          return (
            <div
              className="glass-card"
              style={{
                background: 'rgba(5, 34, 28, 0.92)',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                borderRadius: '24px',
                padding: '36px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.55)',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '36px',
                  alignItems: 'center',
                }}
              >
                {/* Left Explanation */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span
                      style={{
                        background: `${current.badgeColor}22`,
                        color: current.badgeColor,
                        border: `1px solid ${current.badgeColor}66`,
                        padding: '4px 12px',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                      }}
                    >
                      {current.badge}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--sage)' }}>STEP {current.step} OF 05</span>
                  </div>

                  <h3
                    style={{
                      fontSize: 'clamp(1.5rem, 2.3vw, 2.1rem)',
                      color: 'var(--warm-ivory)',
                      marginBottom: '6px',
                    }}
                  >
                    {current.title}
                  </h3>
                  <div style={{ fontSize: '0.98rem', color: '#ECC862', fontWeight: 600, marginBottom: '16px' }}>
                    {current.subtitle}
                  </div>

                  <p style={{ fontSize: '0.96rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '22px' }}>
                    {current.desc}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                    {current.details.map((dt, dIdx) => (
                      <div key={dIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'rgba(53, 184, 107, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: '2px',
                            flexShrink: 0,
                          }}
                        >
                          <CheckCircle2 size={12} color="#35B86B" />
                        </div>
                        <span style={{ fontSize: '0.88rem', color: 'var(--warm-ivory)' }}>{dt}</span>
                      </div>
                    ))}
                  </div>

                  {/* Simulator Controls */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {activeStep < steps.length - 1 ? (
                      <button
                        onClick={() => setActiveStep(activeStep + 1)}
                        className="btn btn-gold"
                        style={{ padding: '12px 22px', fontSize: '0.9rem' }}
                      >
                        <span>Next Step ({steps[activeStep + 1].step})</span>
                        <ArrowRight size={15} />
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveStep(0)}
                        className="btn btn-secondary"
                        style={{ padding: '12px 22px', fontSize: '0.9rem' }}
                      >
                        <RotateCcw size={15} />
                        <span>Replay from Step 1</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Visual State Mockup */}
                <div
                  style={{
                    background: 'rgba(2, 23, 19, 0.88)',
                    border: '1px solid rgba(220, 235, 229, 0.16)',
                    borderRadius: '20px',
                    padding: '28px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: `${current.badgeColor}22`,
                      border: `2px solid ${current.badgeColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}
                  >
                    <Icon size={28} color={current.badgeColor} />
                  </div>

                  <h4 style={{ fontSize: '1.2rem', color: 'var(--warm-ivory)', marginBottom: '8px' }}>
                    {current.title}
                  </h4>
                  <p style={{ fontSize: '0.86rem', color: 'var(--sage)', marginBottom: '20px', lineHeight: 1.5 }}>
                    {current.subtitle}
                  </p>

                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.45)',
                      border: '1px solid rgba(220, 235, 229, 0.1)',
                      borderRadius: '12px',
                      padding: '12px',
                      fontFamily: 'monospace',
                      fontSize: '0.78rem',
                      color: '#ECC862',
                      textAlign: 'left',
                    }}
                  >
                    &gt; {current.systemLog}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
}
