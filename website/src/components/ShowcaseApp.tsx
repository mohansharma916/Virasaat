'use client';

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

export default function ShowcaseApp() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <CrisisStats />
        <VaultPillars />
        <MobileAppShowcase />
        <HeartbeatProtocol />
        <AssetCalculator />
        <SecurityArchitecture />
        <ComparisonMatrix />
        <Testimonials />
        <FaqSection />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
