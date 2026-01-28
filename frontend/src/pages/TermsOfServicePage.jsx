/**
 * Terms of Service Page
 * Terms and conditions for using CivicLens
 */

import React from 'react';
import { Navbar, Footer } from '../components/landing';

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Terms of Service
            </h1>
            <p className="text-foreground/70">
              Last updated: January 28, 2026
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-foreground/70 mb-4">
                By accessing and using CivicLens ("the Platform"), you accept and agree to be 
                bound by these Terms of Service. If you do not agree to these terms, please do 
                not use the Platform.
              </p>
            </section>

            {/* User Accounts */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">2. User Accounts</h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-3">2.1 Registration</h3>
              <p className="text-foreground/70 mb-4">
                To use certain features, you must register for an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-foreground/70 space-y-2 mb-4">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3">2.2 Eligibility</h3>
              <p className="text-foreground/70 mb-4">
                You must be at least 18 years old to use this Platform. By registering, you 
                represent that you meet this requirement.
              </p>
            </section>

            {/* Permitted Use */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">3. Permitted Use</h2>
              <p className="text-foreground/70 mb-4">
                You agree to use the Platform only for lawful purposes, including:
              </p>
              <ul className="list-disc pl-6 text-foreground/70 space-y-2 mb-4">
                <li>Reporting genuine civic issues and complaints</li>
                <li>Tracking the status of your reports</li>
                <li>Engaging constructively with government officials</li>
                <li>Providing feedback on resolved issues</li>
              </ul>
            </section>

            {/* Prohibited Conduct */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Prohibited Conduct</h2>
              <p className="text-foreground/70 mb-4">
                You must NOT:
              </p>
              <ul className="list-disc pl-6 text-foreground/70 space-y-2 mb-4">
                <li>Submit false, misleading, or fraudulent complaints</li>
                <li>Harass, threaten, or abuse other users or officials</li>
                <li>Upload malicious code or attempt to hack the Platform</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Impersonate another person or entity</li>
                <li>Spam or submit duplicate complaints unnecessarily</li>
                <li>Use the Platform for commercial purposes without authorization</li>
              </ul>
            </section>

            {/* Content Submission */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Content Submission</h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-3">5.1 Your Content</h3>
              <p className="text-foreground/70 mb-4">
                When you submit complaints, images, voice recordings, or other content, you:
              </p>
              <ul className="list-disc pl-6 text-foreground/70 space-y-2 mb-4">
                <li>Retain ownership of your content</li>
                <li>Grant us a license to use, display, and share it with relevant authorities</li>
                <li>Confirm that your content does not violate any laws or third-party rights</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3">5.2 Content Moderation</h3>
              <p className="text-foreground/70 mb-4">
                We reserve the right to review, modify, or remove any content that violates 
                these terms or is deemed inappropriate.
              </p>
            </section>

            {/* Data and Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Data and Privacy</h2>
              <p className="text-foreground/70 mb-4">
                Your use of the Platform is also governed by our Privacy Policy. By using the 
                Platform, you consent to our data practices as described in the Privacy Policy.
              </p>
            </section>

            {/* Government Access */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Government Access</h2>
              <p className="text-foreground/70 mb-4">
                You acknowledge that:
              </p>
              <ul className="list-disc pl-6 text-foreground/70 space-y-2 mb-4">
                <li>Complaints are shared with relevant government officials</li>
                <li>Your contact information may be used for follow-up</li>
                <li>Some complaint data may be made public for transparency</li>
              </ul>
            </section>

            {/* Disclaimers */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">8. Disclaimers</h2>
              <p className="text-foreground/70 mb-4">
                The Platform is provided "AS IS" without warranties of any kind. We do not 
                guarantee:
              </p>
              <ul className="list-disc pl-6 text-foreground/70 space-y-2 mb-4">
                <li>Resolution of all complaints</li>
                <li>Specific response times from government officials</li>
                <li>Uninterrupted or error-free service</li>
                <li>Complete accuracy of information</li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">9. Limitation of Liability</h2>
              <p className="text-foreground/70 mb-4">
                To the maximum extent permitted by law, CivicLens shall not be liable for any 
                indirect, incidental, special, or consequential damages arising from your use 
                of the Platform.
              </p>
            </section>

            {/* Termination */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">10. Termination</h2>
              <p className="text-foreground/70 mb-4">
                We reserve the right to suspend or terminate your account if you violate these 
                terms or engage in conduct we deem harmful to the Platform or other users.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">11. Changes to Terms</h2>
              <p className="text-foreground/70 mb-4">
                We may modify these Terms of Service at any time. Continued use of the Platform 
                after changes constitutes acceptance of the new terms.
              </p>
            </section>

            {/* Governing Law */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">12. Governing Law</h2>
              <p className="text-foreground/70 mb-4">
                These terms are governed by the laws of Pakistan. Any disputes shall be 
                resolved in the courts of [Your Jurisdiction].
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">13. Contact Information</h2>
              <p className="text-foreground/70">
                For questions about these Terms of Service, contact us at:{' '}
                <a href="mailto:legal@civiclens.org" className="text-primary hover:underline">
                  legal@civiclens.org
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfServicePage;
