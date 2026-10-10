'use client';

import { useState } from 'react';
import { Activity, ArrowRight, Check, FileText, Home, Lock, ShieldCheck, Smartphone, Video, Wallet } from 'lucide-react';

interface MobileAppShowcaseProps { onOpenWaitlist: () => void; }
const screens = [
  { id: 'home', label: 'Overview', icon: Home },
  { id: 'finance', label: 'Records', icon: Wallet },
  { id: 'video', label: 'Messages', icon: Video },
  { id: 'heartbeat', label: 'Check-In', icon: Activity },
  { id: 'security', label: 'Security', icon: Lock },
] as const;
type Screen = typeof screens[number]['id'];

export default function MobileAppShowcase({ onOpenWaitlist }: MobileAppShowcaseProps) {
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [devicePlatform, setDevicePlatform] = useState<'ios' | 'android'>('ios');
  const [checked, setChecked] = useState(false);

  return (
    <section id="mobile-app" className="section">
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 36px' }}>
          <div className="glass-pill" style={{ marginBottom: '16px' }}><Smartphone size={15} color="#D4AF37" />iOS & Android · Coming soon</div>
          <h2 style={{ fontSize: 'clamp(2rem, 4.4vw, 3.4rem)', marginBottom: '18px' }}>Your Records, on Your Phone.<br /><span className="text-gradient-gold">A Preview of the Family Vault.</span></h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>Explore example records, personal messages and check-in tools. This website illustration uses sample data and does not authenticate you, save vault items, send reminders or release content to family.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" aria-pressed={devicePlatform === 'ios'} onClick={() => setDevicePlatform('ios')}>iPhone preview</button>
            <button type="button" className="btn btn-secondary" aria-pressed={devicePlatform === 'android'} onClick={() => setDevicePlatform('android')}>Android preview</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', alignItems: 'center', gap: '40px', maxWidth: '940px', margin: '0 auto' }}>
          <div style={{ maxWidth: '350px', width: '100%', margin: '0 auto', border: '8px solid #172d27', borderRadius: devicePlatform === 'ios' ? '44px' : '30px', background: '#04241e', overflow: 'hidden', boxShadow: '0 24px 70px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '18px 22px 8px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}><span>9:41</span><span>Sample screen</span></div>
            <div style={{ padding: '20px', minHeight: '460px' }}>
              <div style={{ color: 'var(--gold-light)', fontSize: '0.7rem', letterSpacing: '0.12em', marginBottom: '10px' }}>VIRASAAT · DEMO</div>
              {activeScreen === 'home' && <>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Your family records</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '22px' }}>Organize the details that matter to you.</p>
                {[
                  { label: 'Financial & document records', id: 'finance' as const, icon: FileText },
                  { label: 'Personal messages', id: 'video' as const, icon: Video },
                  { label: 'Check-in activity', id: 'heartbeat' as const, icon: Activity },
                ].map((item) => <button key={item.id} type="button" className="glass-card" onClick={() => setActiveScreen(item.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '18px', marginBottom: '12px', color: 'var(--sage)', textAlign: 'left', cursor: 'pointer' }}><item.icon size={20} color="#D4AF37" />{item.label}<ArrowRight size={14} style={{ marginLeft: 'auto' }} /></button>)}
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '24px' }}>Family handover and recipient access are planned and currently disabled.</p>
              </>}
              {activeScreen === 'finance' && <>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '18px' }}>Important records</h3>
                {[['Bank account reference', 'HDFC account ending ••1234'], ['Investment reference', 'Example mutual fund folio ••5678'], ['Important document', 'Where the original will is kept']].map(([title, detail]) => <div key={title} className="glass-card" style={{ padding: '18px', marginBottom: '12px' }}><div style={{ color: 'var(--gold-light)', marginBottom: '8px' }}>{title}</div><p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{detail}</p></div>)}
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '20px' }}>These are sample records, not linked bank accounts or verified financial statements.</p>
              </>}
              {activeScreen === 'video' && <>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '18px' }}>Personal messages</h3>
                <div className="glass-card" style={{ padding: '28px 18px', textAlign: 'center' }}><Video size={38} color="#D4AF37" style={{ margin: '0 auto 18px' }} /><h4 style={{ marginBottom: '12px' }}>A note for my family</h4><p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Save text messages and supported video files in the app.</p></div>
                <p style={{ color: 'var(--sage)', fontSize: '0.85rem', marginTop: '22px' }}>Milestone and emergency delivery are not currently available. Keep an independent copy of important memories.</p>
              </>}
              {activeScreen === 'heartbeat' && <>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '18px' }}>Check-in activity</h3>
                <div className="glass-card" style={{ padding: '28px 18px', textAlign: 'center' }}><Activity size={38} color="#35B86B" style={{ margin: '0 auto 18px' }} /><p style={{ color: 'var(--sage)', marginBottom: '18px' }}>Try the example check-in.</p><button type="button" className="btn btn-gold" onClick={() => setChecked(!checked)} aria-pressed={checked}>{checked ? <Check size={17} /> : <Activity size={17} />}{checked ? 'Demo check-in recorded' : 'Try demo check-in'}</button><p role="status" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '18px' }}>{checked ? 'This changes the preview only; no account activity was saved.' : 'Check-ins record activity, not proof of health.'}</p></div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '24px' }}>Scheduled reminders, SMS, push notifications, vacation pause and automated release are unavailable.</p>
              </>}
              {activeScreen === 'security' && <>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '18px' }}>Your security model</h3>
                <div className="glass-card" style={{ padding: '22px' }}><ShieldCheck size={32} color="#D4AF37" style={{ marginBottom: '16px' }} /><p style={{ color: 'var(--sage)', fontSize: '0.9rem', lineHeight: 1.7 }}>The server encrypts descriptions and uploaded files before storage. Virasaat manages the decryption keys.</p></div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '22px' }}>Device biometrics help protect app access on supported phones. They do not provide end-to-end vault encryption. Titles and categories are stored as metadata.</p>
                <a href="#security" style={{ display: 'inline-block', color: 'var(--gold-light)', marginTop: '20px' }}>Read the security details</a>
              </>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid var(--border-subtle)', padding: '12px 4px 18px', gap: '2px' }}>
              {screens.map((screen) => <button key={screen.id} type="button" aria-pressed={activeScreen === screen.id} aria-label={`Preview ${screen.label}`} onClick={() => setActiveScreen(screen.id)} style={{ border: 0, background: 'transparent', color: activeScreen === screen.id ? 'var(--gold-light)' : 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.6rem', padding: '4px' }}><screen.icon size={20} />{screen.label}</button>)}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', marginBottom: '24px' }}>Start with organized records.</h3>
            {[
              ['Account & document details', 'Record references and upload supported documents so you can find them in one place.'],
              ['Personal messages', 'Store text and supported media without promising future milestone delivery.'],
              ['Trusted people & check-ins', 'Save intended contacts and record activity. Saving a contact does not grant access.'],
            ].map(([title, detail]) => <div key={title} style={{ marginBottom: '26px' }}><h4 style={{ color: 'var(--gold-light)', marginBottom: '8px' }}>{title}</h4><p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{detail}</p></div>)}
            <div className="glass-card" style={{ padding: '22px', marginBottom: '26px' }}><p style={{ color: 'var(--sage)', lineHeight: 1.7 }}>Verified family handover, recipient invitations and access are planned. Keep a separate estate and emergency plan while these features are unavailable.</p></div>
            <button type="button" onClick={onOpenWaitlist} className="btn btn-gold"><Smartphone size={18} />Join for launch updates<ArrowRight size={17} /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
