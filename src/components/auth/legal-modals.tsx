'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useState } from 'react'

interface LegalModalsProps {
  isOpen: boolean
  onClose: () => void
}

export function LegalModals({ isOpen, onClose }: LegalModalsProps) {
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | null>(null)

  return (
    <>
      {/* Terms and Privacy Selection Modal */}
      <Dialog open={isOpen && !activeModal} onOpenChange={(open: boolean) => !open && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Legal Documents</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <button
              onClick={() => setActiveModal('terms')}
              className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-slate-50"
            >
              <h3 className="font-medium text-slate-900">Terms of Service</h3>
              <p className="mt-1 text-sm text-slate-600">
                Our terms and conditions for using TrueSharp
              </p>
            </button>

            <button
              onClick={() => setActiveModal('privacy')}
              className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-slate-50"
            >
              <h3 className="font-medium text-slate-900">Privacy Policy</h3>
              <p className="mt-1 text-sm text-slate-600">
                How we collect, use, and protect your data
              </p>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms of Service Modal */}
      <Dialog
        open={activeModal === 'terms'}
        onOpenChange={(open: boolean) => !open && setActiveModal(null)}
      >
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Terms of Service</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none px-6 py-4">
            <div className="space-y-6 text-sm text-slate-700">
              <p className="text-slate-600 mb-4">
                <strong>TrueSharp LLC – Terms of Service</strong>
              </p>
              <p className="text-slate-600 mb-6">
                <strong>Effective Date: July 16, 2025</strong><br />
                <strong>Last Updated: July 16, 2025</strong>
              </p>

              <p className="mb-6">
                Welcome to TrueSharp, a platform operated by TrueSharp LLC ("TrueSharp," "we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of the TrueSharp website, mobile application, and related services (collectively, the "Service").
              </p>

              <p className="mb-6">
                By creating an account, accessing, or using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree, do not use the Service.
              </p>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">1. Eligibility</h3>
                <ul className="mb-6 space-y-2 list-disc list-inside">
                  <li>You must be at least 21 years of age (or the legal age of majority in your jurisdiction, whichever is higher).</li>
                  <li>You are solely responsible for ensuring that your use of the Service complies with local, state, and federal laws where you reside.</li>
                  <li>We may suspend or terminate accounts that violate eligibility requirements.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">2. Nature of Service</h3>
                <p className="mb-4">TrueSharp is a content and analytics platform that enables users to:</p>
                <ul className="mb-4 space-y-2 list-disc list-inside">
                  <li>Publish, track, and evaluate sports betting strategies;</li>
                  <li>Monetize strategies via paid subscriptions;</li>
                  <li>Access analytics, rankings, and community features.</li>
                </ul>
                <p className="mb-4">TrueSharp is not a sportsbook. We:</p>
                <ul className="mb-4 space-y-2 list-disc list-inside">
                  <li>Do not accept, process, or facilitate wagers of any kind;</li>
                  <li>Do not provide gambling services;</li>
                  <li>Do not guarantee the accuracy, profitability, or outcomes of any strategies.</li>
                </ul>
                <p className="mb-6">All information and content are provided for entertainment and educational purposes only.</p>
              </section>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">3. Account Registration and User Conduct</h3>
                <p className="mb-4">When creating an account, you agree to:</p>
                <ul className="mb-4 space-y-2 list-disc list-inside">
                  <li>Provide truthful, accurate, and current information;</li>
                  <li>Keep your login credentials secure;</li>
                  <li>Be responsible for all activity on your account.</li>
                </ul>
                <p className="mb-4">You may not:</p>
                <ul className="mb-6 space-y-2 list-disc list-inside">
                  <li>Misrepresent your identity or impersonate others;</li>
                  <li>Attempt to manipulate platform rankings, metrics, or payouts;</li>
                  <li>Post unlawful, defamatory, fraudulent, or harmful content;</li>
                  <li>Engage in harassment, spamming, or exploitation of other users.</li>
                </ul>
                <p className="mb-6">We reserve the right to investigate, suspend, or terminate accounts that violate these Terms or applicable law.</p>
              </section>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">4. Monetizing Strategies</h3>
                <ul className="mb-6 space-y-2 list-disc list-inside">
                  <li>Users may publish strategies upon registration.</li>
                  <li>Sellers may monetize strategies through paid subscriptions.</li>
                  <li>All submissions are timestamped, permanently recorded, and locked upon posting.</li>
                  <li>Verified Seller status may be granted based on transparent and consistent performance.</li>
                  <li>TrueSharp may suspend, limit, or revoke monetization privileges if abuse, manipulation, or policy violations are detected.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">5. Subscriptions, Billing & Cancellation</h3>
                <ul className="mb-6 space-y-2 list-disc list-inside">
                  <li>Payments are securely processed through Stripe or other authorized providers.</li>
                  <li>Subscriptions renew automatically each billing cycle until canceled.</li>
                  <li>No refunds are provided once a payment has been processed.</li>
                  <li>Users may cancel at any time via the account dashboard (cancellations stop future charges but do not refund the current cycle).</li>
                  <li>Sellers receive periodic payouts, net of platform and processing fees.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">6. Contact Us</h3>
                <p className="mb-4">For questions or concerns about these Terms, please contact:</p>
                <p>
                  <strong>TrueSharp LLC</strong><br />
                  📧 Email: info@truesharp.com
                </p>
              </section>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Modal */}
      <Dialog
        open={activeModal === 'privacy'}
        onOpenChange={(open: boolean) => !open && setActiveModal(null)}
      >
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none px-6 py-4">
            <div className="space-y-6 text-sm text-slate-700">
              <p className="text-slate-600 mb-4">
                <strong>TrueSharp LLC – Privacy Policy</strong>
              </p>
              <p className="text-slate-600 mb-6">
                <strong>Effective Date: July 16, 2025</strong>
              </p>

              <p className="mb-4">
                TrueSharp LLC ("TrueSharp," "we," "our," or "us") values your trust and is committed to protecting your privacy. This Privacy Policy explains how we collect, use, share, and protect your personal information when you use our web application, website, and related services (collectively, the "Platform").
              </p>

              <p className="mb-6">
                By accessing or using the Platform, you agree to this Privacy Policy. If you do not agree, please discontinue use immediately.
              </p>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">1. Information We Collect</h3>
                <p className="mb-4">We collect information in the following categories:</p>
                <ul className="mb-6 space-y-2 list-disc list-inside">
                  <li><strong>Account Information:</strong> Name, email address, username, password or login credentials.</li>
                  <li><strong>Activity Data:</strong> Content you create (such as strategy posts, comments, likes, follows), interactions with other users, and subscription preferences.</li>
                  <li><strong>Transactional Data:</strong> Payment history, subscription details, and limited information processed via third-party payment processors (we do not store full credit card details).</li>
                  <li><strong>Technical & Device Data:</strong> IP address, browser type, operating system, cookies, session identifiers, log files, and usage analytics.</li>
                  <li><strong>Communications:</strong> Messages you send to our support team, feedback, or survey responses.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">2. How We Use Your Information</h3>
                <p className="mb-4">We process personal data only for legitimate business purposes, including:</p>
                <ul className="mb-6 space-y-2 list-disc list-inside">
                  <li><strong>Platform Functionality:</strong> Operating, maintaining, and improving the Platform.</li>
                  <li><strong>User Experience:</strong> Delivering analytics, insights, and personalized features.</li>
                  <li><strong>Communications:</strong> Sending confirmations, account updates, onboarding guidance, alerts, and optional marketing communications (with opt-out options).</li>
                  <li><strong>Compliance & Safety:</strong> Detecting fraud, preventing misuse, and meeting legal or regulatory obligations.</li>
                  <li><strong>Research & Development:</strong> Improving features, content, and services through aggregated and anonymized data analysis.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">3. Your Rights</h3>
                <p className="mb-4">Depending on your jurisdiction, you may have the following rights:</p>
                <ul className="mb-6 space-y-2 list-disc list-inside">
                  <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate or incomplete information.</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and associated personal data.</li>
                  <li><strong>Marketing Preferences:</strong> Opt out of receiving promotional communications at any time.</li>
                </ul>
                <p className="mb-6">To exercise these rights, contact us at support@truesharp.com. We may require verification of your identity before fulfilling requests.</p>
              </section>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">4. Contact Us</h3>
                <p className="mb-4">If you have questions or concerns about this Privacy Policy, please contact:</p>
                <p>
                  <strong>TrueSharp LLC</strong><br />
                  Email: info@truesharp.com
                </p>
              </section>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
