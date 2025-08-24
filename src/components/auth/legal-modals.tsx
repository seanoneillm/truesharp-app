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
              className="w-full p-4 text-left border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <h3 className="font-medium text-slate-900">Terms of Service</h3>
              <p className="text-sm text-slate-600 mt-1">
                Our terms and conditions for using TrueSharp
              </p>
            </button>
            
            <button
              onClick={() => setActiveModal('privacy')}
              className="w-full p-4 text-left border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <h3 className="font-medium text-slate-900">Privacy Policy</h3>
              <p className="text-sm text-slate-600 mt-1">
                How we collect, use, and protect your data
              </p>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms of Service Modal */}
      <Dialog open={activeModal === 'terms'} onOpenChange={(open: boolean) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Terms of Service</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none">
            <div className="space-y-6 text-sm text-slate-700">
              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">1. Acceptance of Terms</h3>
                <p>
                  By accessing and using TrueSharp (&ldquo;the Service&rdquo;), you accept and agree to be bound by the terms and provision of this agreement.
                </p>
              </section>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">2. Age Requirement</h3>
                <p>
                  You must be at least 21 years old to use TrueSharp. By using our service, you represent and warrant that you are at least 21 years of age.
                </p>
              </section>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">3. Sports Betting Information</h3>
                <p>
                  TrueSharp provides sports betting analysis, predictions, and information. All content is for informational purposes only and should not be considered as guaranteed outcomes.
                </p>
              </section>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">4. User Responsibilities</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>You are responsible for maintaining the confidentiality of your account</li>
                  <li>You agree to provide accurate and current information</li>
                  <li>You will not use the service for any unlawful purposes</li>
                  <li>You understand that sports betting involves risk</li>
                </ul>
              </section>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">5. Disclaimer</h3>
                <p>
                  TrueSharp does not guarantee the accuracy of any predictions or analysis. Sports betting involves risk, and you should never bet more than you can afford to lose.
                </p>
              </section>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">6. Limitation of Liability</h3>
                <p>
                  TrueSharp shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use of our service.
                </p>
              </section>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">7. Termination</h3>
                <p>
                  We reserve the right to terminate or suspend access to our service immediately, without prior notice, for any reason whatsoever.
                </p>
              </section>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">8. Changes to Terms</h3>
                <p>
                  We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
                </p>
              </section>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">9. Contact Information</h3>
                <p>
                  If you have any questions about these Terms, please contact us at legal@truesharp.com.
                </p>
              </section>

              <div className="mt-8 p-4 bg-slate-100 rounded-lg">
                <p className="text-xs text-slate-600">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Modal */}
      <Dialog open={activeModal === 'privacy'} onOpenChange={(open: boolean) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none">
            <div className="space-y-6 text-sm text-slate-700">
              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">1. Information We Collect</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-slate-800">Personal Information</h4>
                    <p>We collect information you provide directly to us, such as when you create an account, including your email address, username, and age verification.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">Usage Information</h4>
                    <p>We collect information about how you use our service, including your interactions with content, features used, and time spent on the platform.</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">2. How We Use Your Information</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>To provide, maintain, and improve our services</li>
                  <li>To process transactions and send related information</li>
                  <li>To send you technical notices and support messages</li>
                  <li>To communicate with you about products, services, and events</li>
                  <li>To monitor and analyze trends and usage</li>
                  <li>To detect, investigate, and prevent fraudulent transactions</li>
                </ul>
              </section>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">3. Information Sharing</h3>
                <p>
                  We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this Privacy Policy.
                </p>
                <div className="mt-3 space-y-2">
                  <div>
                    <h4 className="font-medium text-slate-800">Service Providers</h4>
                    <p>We may share your information with third-party service providers who perform services on our behalf.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">Legal Requirements</h4>
                    <p>We may disclose your information if required to do so by law or in response to valid requests by public authorities.</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">4. Data Security</h3>
                <p>
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                </p>
              </section>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">5. Data Retention</h3>
                <p>
                  We retain your personal information for as long as necessary to provide you with our services and as described in this Privacy Policy.
                </p>
              </section>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">6. Your Rights</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Access and update your personal information</li>
                  <li>Request deletion of your personal information</li>
                  <li>Opt out of certain communications</li>
                  <li>Request a copy of your personal information</li>
                </ul>
              </section>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">7. Cookies and Tracking</h3>
                <p>
                  We use cookies and similar tracking technologies to collect and track information and to improve and analyze our service.
                </p>
              </section>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">8. Changes to Privacy Policy</h3>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
                </p>
              </section>

              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-3">9. Contact Us</h3>
                <p>
                  If you have any questions about this Privacy Policy, please contact us at privacy@truesharp.com.
                </p>
              </section>

              <div className="mt-8 p-4 bg-slate-100 rounded-lg">
                <p className="text-xs text-slate-600">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
