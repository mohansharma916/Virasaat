import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Delete Your Account | Virasat (विरासत)',
  description:
    'How to permanently delete your Virasat account and vault data, in the app or by email.',
  alternates: {
    canonical: '/delete-account/',
  },
};

const text = { color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '14px' };
const heading = {
  fontSize: '1.3rem',
  color: 'var(--warm-ivory)',
  margin: '32px 0 12px',
  fontWeight: 700,
};

export default function DeleteAccountPage() {
  return (
    <div style={{ background: '#021713', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 20px 80px' }}>
        <Link
          href="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--gold-light)', textDecoration: 'none', fontSize: '0.9rem' }}
        >
          <ArrowLeft size={16} /> Back to Virasat
        </Link>

        <h1 style={{ fontSize: '2.2rem', color: 'var(--warm-ivory)', margin: '24px 0 12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Trash2 size={28} color="#D94A4A" /> Delete your Virasat account
        </h1>
        <p style={text}>
          You can permanently delete your Virasat account and all of its data at any time. Deletion is immediate and cannot be undone.
        </p>

        <h2 style={heading}>Delete in the app</h2>
        <ol style={{ ...text, paddingLeft: '22px' }}>
          <li>Open the Virasat app and sign in.</li>
          <li>Go to <strong>Profile</strong> (☰ on the home screen) → <strong>Delete Account</strong>.</li>
          <li>Confirm with your password, or with Google if you signed up with Google.</li>
          <li>Type <strong>DELETE</strong> and tap <strong>Permanently Delete My Account</strong>.</li>
        </ol>

        <h2 style={heading}>No longer have the app?</h2>
        <p style={text}>
          Email{' '}
          <a href="mailto:privacy@virasat.app?subject=Account%20deletion%20request" style={{ color: '#ECC862' }}>
            privacy@virasat.app
          </a>{' '}
          from the address registered to your account, with the subject “Account deletion request”. We verify that the request comes from the account owner and delete the account within 30 days, then confirm by email.
        </p>

        <h2 style={heading}>What is deleted</h2>
        <ul style={{ ...text, paddingLeft: '22px' }}>
          <li>Your account and profile (name, email, sign-in details)</li>
          <li>All vault items: documents, files, photos, videos, messages and investment details</li>
          <li>Trusted people you added, and check-in and release settings</li>
          <li>Subscription, notification and security records linked to your account</li>
        </ul>
        <p style={text}>
          We do not keep deleted vault content. Encryption keys for your files are deleted with your records, so any copy still in storage during cleanup cannot be decrypted. Copies you downloaded or shared yourself are not affected.
        </p>
      </main>
    </div>
  );
}
