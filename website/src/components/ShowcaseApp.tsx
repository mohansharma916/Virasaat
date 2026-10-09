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

export default function ShowcaseApp() {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [defaultEmail, setDefaultEmail] = useState('');

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
        <Hero onOpenWaitlist={openWaitlist} />
        <CrisisStats />
        <VaultPillars onOpenWaitlist={() => openWaitlist()} />
        <MobileAppShowcase onOpenWaitlist={() => openWaitlist()} />
        <HeartbeatProtocol />
        <AssetCalculator onOpenWaitlist={() => openWaitlist()} />
        <SecurityArchitecture />
        <ComparisonMatrix onOpenWaitlist={() => openWaitlist()} />
        <Testimonials />
        <FaqSection onOpenWaitlist={() => openWaitlist()} />
        <CtaBanner onOpenWaitlist={openWaitlist} />
      </main>
      <Footer />
      <WaitlistModal
        isOpen={waitlistOpen}
        onClose={closeWaitlist}
        defaultEmail={defaultEmail}
      />
    </>
  );
}
