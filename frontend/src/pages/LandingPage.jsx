import React from 'react';
import {
  Navbar,
  Hero,
  Features,
  HowItWorks,
  TargetUsers,
  TechStack,
  CTA,
  Footer,
} from '../components/landing';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <TargetUsers />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
