'use client'

import { X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface TermsOfServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TermsOfServiceDialog({ open, onOpenChange }: TermsOfServiceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            <span>Terms of Service</span>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-md p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
          <div className="prose prose-slate max-w-none text-sm">
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

            <h3 className="text-lg font-semibold text-slate-900 mb-3">1. Eligibility</h3>
            <ul className="mb-6 space-y-2">
              <li>You must be at least 21 years of age (or the legal age of majority in your jurisdiction, whichever is higher).</li>
              <li>You are solely responsible for ensuring that your use of the Service complies with local, state, and federal laws where you reside.</li>
              <li>We may suspend or terminate accounts that violate eligibility requirements.</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">2. Nature of Service</h3>
            <p className="mb-4">TrueSharp is a content and analytics platform that enables users to:</p>
            <ul className="mb-4 space-y-2">
              <li>Publish, track, and evaluate sports betting strategies;</li>
              <li>Monetize strategies via paid subscriptions;</li>
              <li>Access analytics, rankings, and community features.</li>
            </ul>
            <p className="mb-4">TrueSharp is not a sportsbook. We:</p>
            <ul className="mb-4 space-y-2">
              <li>Do not accept, process, or facilitate wagers of any kind;</li>
              <li>Do not provide gambling services;</li>
              <li>Do not guarantee the accuracy, profitability, or outcomes of any strategies.</li>
            </ul>
            <p className="mb-6">All information and content are provided for entertainment and educational purposes only.</p>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">3. Account Registration and User Conduct</h3>
            <p className="mb-4">When creating an account, you agree to:</p>
            <ul className="mb-4 space-y-2">
              <li>Provide truthful, accurate, and current information;</li>
              <li>Keep your login credentials secure;</li>
              <li>Be responsible for all activity on your account.</li>
            </ul>
            <p className="mb-4">You may not:</p>
            <ul className="mb-6 space-y-2">
              <li>Misrepresent your identity or impersonate others;</li>
              <li>Attempt to manipulate platform rankings, metrics, or payouts;</li>
              <li>Post unlawful, defamatory, fraudulent, or harmful content;</li>
              <li>Engage in harassment, spamming, or exploitation of other users.</li>
            </ul>
            <p className="mb-6">We reserve the right to investigate, suspend, or terminate accounts that violate these Terms or applicable law.</p>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">4. Monetizing Strategies</h3>
            <ul className="mb-6 space-y-2">
              <li>Users may publish strategies upon registration.</li>
              <li>Sellers may monetize strategies through paid subscriptions.</li>
              <li>All submissions are timestamped, permanently recorded, and locked upon posting.</li>
              <li>Verified Seller status may be granted based on transparent and consistent performance.</li>
              <li>TrueSharp may suspend, limit, or revoke monetization privileges if abuse, manipulation, or policy violations are detected.</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">5. Subscriptions, Billing & Cancellation</h3>
            <ul className="mb-6 space-y-2">
              <li>Payments are securely processed through Stripe or other authorized providers.</li>
              <li>Subscriptions renew automatically each billing cycle until canceled.</li>
              <li>No refunds are provided once a payment has been processed.</li>
              <li>Users may cancel at any time via the account dashboard (cancellations stop future charges but do not refund the current cycle).</li>
              <li>Sellers receive periodic payouts, net of platform and processing fees.</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">6. Disclaimers and Limitation of Liability</h3>
            <ul className="mb-4 space-y-2">
              <li>All strategies and content are user-generated. TrueSharp does not endorse, verify, or guarantee their accuracy or profitability.</li>
              <li>You are solely responsible for any wagering decisions made outside of the Service.</li>
            </ul>
            <p className="mb-4">To the maximum extent permitted by law, TrueSharp is not liable for:</p>
            <ul className="mb-6 space-y-2">
              <li>Financial losses, lost profits, or indirect damages;</li>
              <li>Interruptions, errors, or technical issues;</li>
              <li>Reliance on any user-generated content.</li>
            </ul>
            <p className="mb-6">Use of the Service is entirely at your own risk.</p>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">7. Intellectual Property</h3>
            <ul className="mb-6 space-y-2">
              <li>Users retain ownership of their strategies and content.</li>
              <li>By publishing content, you grant TrueSharp a non-exclusive, royalty-free, worldwide license to host, display, and promote such content on or in connection with the Service.</li>
              <li>All trademarks, technology, software, and branding related to TrueSharp remain the exclusive property of TrueSharp LLC and its licensors.</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">8. Termination</h3>
            <p className="mb-4">We may suspend or terminate your account without notice if:</p>
            <ul className="mb-6 space-y-2">
              <li>You violate these Terms;</li>
              <li>Your activity is unlawful, abusive, or fraudulent;</li>
              <li>We are required by law or regulatory authority.</li>
            </ul>
            <p className="mb-6">Termination does not relieve you of outstanding payment obligations or limit our right to seek damages.</p>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">9. Governing Law & Jurisdiction</h3>
            <p className="mb-6">
              These Terms are governed by the laws of the State of New Jersey, without regard to conflict of law principles. You agree to submit to the exclusive jurisdiction of the state and federal courts located in New Jersey for any disputes.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">10. Indemnification</h3>
            <p className="mb-4">You agree to defend, indemnify, and hold harmless TrueSharp LLC, its officers, employees, affiliates, and partners from and against any claims, damages, losses, liabilities, and expenses (including attorney's fees) arising out of:</p>
            <ul className="mb-6 space-y-2">
              <li>Your use of the Service;</li>
              <li>Your violation of these Terms or applicable law;</li>
              <li>Any infringement of third-party rights.</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">11. No Warranty</h3>
            <p className="mb-4">The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, express or implied. We do not warrant that:</p>
            <ul className="mb-6 space-y-2">
              <li>The Service will be uninterrupted, error-free, or secure;</li>
              <li>Content will be accurate, reliable, or profitable;</li>
              <li>The Service will meet your specific expectations.</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">12. Force Majeure</h3>
            <p className="mb-6">
              We are not responsible for delays or failures caused by events beyond our reasonable control, including but not limited to: natural disasters, acts of war, government actions, cyberattacks, labor disputes, or internet outages.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">13. Severability</h3>
            <p className="mb-6">
              If any provision of these Terms is deemed unenforceable, the remaining provisions will remain in full force and effect.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">14. Entire Agreement</h3>
            <p className="mb-6">
              These Terms, together with our Privacy Policy and any supplemental policies posted on the Platform, constitute the entire agreement between you and TrueSharp LLC regarding the Service.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">15. Waiver</h3>
            <p className="mb-6">
              Failure by TrueSharp to enforce any provision of these Terms shall not constitute a waiver of that provision or our rights.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">16. Contact Us</h3>
            <p className="mb-4">For questions or concerns about these Terms, please contact:</p>
            <p>
              <strong>TrueSharp LLC</strong><br />
              📧 Email: info@truesharp.com
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}