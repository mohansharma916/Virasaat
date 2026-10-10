'use client';

import React, { useState } from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import CrisisStats from './CrisisStats';
import VaultPillars from './VaultPillars';
import MobileAppShowcase from './MobileAppShowcase';
import HeartbeatProtocol from './HeartbeatProtocol';
import AssetCalculator from './AssetCalculator';
import SecurityArchitecture from './SecurityArchitecture';
import ComparisonMatrix from './ComparisonMatrix';
import Testimonials from './Testimonials';
import FaqSection from './FaqSection';
import CtaBanner from './CtaBanner';
import Footer from './Footer';
import WaitlistModal from './WaitlistModal';
import type { WaitlistRegistration } from '@/lib/waitlist';

export default function ShowcaseApp() {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [defaultEmail, setDefaultEmail] = useState('');
  const [registration, setRegistration] = useState<WaitlistRegistration | null>(null);

  const openWaitlist = (email?: string) => {
    if (typeof email === 'string' && email.trim()) {
      setDefaultEmail(email.trim());
    } else {
      setDefaultEmail('');
    }
    setWaitlistOpen(true);
  };

  const closeWaitlist = () => {
    setWaitlistOpen(false);
  };

  return (
    <>
      <Navbar onOpenWaitlist={() => openWaitlist()} />
      <main>
        <Hero onOpenWaitlist={openWaitlist} registration={registration} />
        <CrisisStats />
        <VaultPillars onOpenWaitlist={() => openWaitlist()} />
        <MobileAppShowcase onOpenWaitlist={() => openWaitlist()} />
        <HeartbeatProtocol />
        <AssetCalculator onOpenWaitlist={() => openWaitlist()} />
        <SecurityArchitecture />
        <ComparisonMatrix onOpenWaitlist={() => openWaitlist()} />
        <Testimonials />
        <FaqSection onOpenWaitlist={() => openWaitlist()} />
        <CtaBanner onOpenWaitlist={openWaitlist} registration={registration} />
      </main>
      <Footer />
      {waitlistOpen && <WaitlistModal
        onClose={closeWaitlist}
        defaultEmail={defaultEmail}
        onJoined={setRegistration}
      />}
    </>
  );
}
