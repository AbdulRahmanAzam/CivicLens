/**
 * Privacy Policy Page
 * Privacy policy and data protection information
 */

import React from 'react';
import { Navbar, Footer } from '../components/landing';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-foreground/70">
              Last updated: January 28, 2026
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Introduction</h2>
              <p className="text-foreground/70 mb-4">
                CivicLens ("we", "our", or "us") is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard 
                your information when you use our civic complaint reporting platform.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-3">Personal Information</h3>
              <p className="text-foreground/70 mb-4">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 text-foreground/70 space-y-2 mb-4">
                <li>Name, email address, and phone number</li>
                <li>CNIC (for identity verification)</li>
                <li>Location data (when reporting issues)</li>
                <li>Images and voice recordings (attached to reports)</li>
                <li>Complaint details and descriptions</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3">Automatically Collected Information</h3>
              <ul className="list-disc pl-6 text-foreground/70 space-y-2 mb-4">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Usage data and analytics</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">How We Use Your Information</h2>
              <p className="text-foreground/70 mb-4">
                We use the collected information for:
              </p>
              <ul className="list-disc pl-6 text-foreground/70 space-y-2 mb-4">
                <li>Processing and managing your civic complaints</li>
                <li>Communicating with you about your reports</li>
                <li>Improving our services and platform functionality</li>
                <li>Analyzing trends and usage patterns</li>
                <li>Preventing fraud and maintaining security</li>
                <li>Complying with legal obligations</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Information Sharing</h2>
              <p className="text-foreground/70 mb-4">
                We may share your information with:
              </p>
              <ul className="list-disc pl-6 text-foreground/70 space-y-2 mb-4">
                <li><strong>Government Officials:</strong> To process and resolve your complaints</li>
                <li><strong>Service Providers:</strong> Who assist in operating our platform</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
              </ul>
              <p className="text-foreground/70">
                We do not sell your personal information to third parties.
              </p>
            </section>

            {/* Data Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Data Security</h2>
              <p className="text-foreground/70 mb-4">
                We implement appropriate technical and organizational measures to protect your 
                personal information, including:
              </p>
              <ul className="list-disc pl-6 text-foreground/70 space-y-2 mb-4">
                <li>Encryption of sensitive data</li>
                <li>Secure authentication mechanisms</li>
                <li>Regular security audits</li>
                <li>Access controls and monitoring</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Your Rights</h2>
              <p className="text-foreground/70 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-foreground/70 space-y-2 mb-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Withdraw consent for data processing</li>
              </ul>
            </section>

            {/* Cookies */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Cookies and Tracking</h2>
              <p className="text-foreground/70 mb-4">
                We use cookies and similar technologies to enhance your experience. You can 
                control cookie preferences through your browser settings.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Children's Privacy</h2>
              <p className="text-foreground/70 mb-4">
                Our platform is not intended for users under 18 years of age. We do not 
                knowingly collect personal information from children.
              </p>
            </section>

            {/* Changes to Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Changes to This Policy</h2>
              <p className="text-foreground/70 mb-4">
                We may update this Privacy Policy periodically. We will notify you of any 
                significant changes via email or through our platform.
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Contact Us</h2>
              <p className="text-foreground/70">
                If you have questions about this Privacy Policy, please contact us at:{' '}
                <a href="mailto:privacy@civiclens.org" className="text-primary hover:underline">
                  privacy@civiclens.org
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

export default PrivacyPolicyPage;
