import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header with Back Link */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to TrueSharp
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-slate max-w-none">
          {/* Title and Last Updated */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-sm text-gray-600 font-medium">Last Updated: October 2025</p>
          </div>

          {/* Privacy Policy Content */}
          <div className="text-gray-700 leading-relaxed space-y-6">
            <div className="mb-6">
              <p className="font-semibold text-gray-900 mb-2">
                TrueSharp LLC – Privacy Policy
              </p>
              <p className="font-semibold text-gray-800 mb-4">
                Effective Date: July 16, 2025
              </p>
            </div>

            <p className="mb-4">
              TrueSharp LLC ("TrueSharp," "we," "our," or "us") values your trust and is committed to protecting your privacy. This Privacy Policy explains how we collect, use, share, and protect your personal information when you use our web application, website, and related services (collectively, the "Platform").
            </p>

            <p className="mb-6">
              By accessing or using the Platform, you agree to this Privacy Policy. If you do not agree, please discontinue use immediately.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
            <p className="mb-4">We collect information in the following categories:</p>
            <ul className="mb-6 space-y-2 list-disc list-inside">
              <li><strong>Account Information:</strong> Name, email address, username, password or login credentials.</li>
              <li><strong>Activity Data:</strong> Content you create (such as strategy posts, comments, likes, follows), interactions with other users, and subscription preferences.</li>
              <li><strong>Transactional Data:</strong> Payment history, subscription details, and limited information processed via third-party payment processors (we do not store full credit card details).</li>
              <li><strong>Technical & Device Data:</strong> IP address, browser type, operating system, cookies, session identifiers, log files, and usage analytics.</li>
              <li><strong>Communications:</strong> Messages you send to our support team, feedback, or survey responses.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <p className="mb-4">We process personal data only for legitimate business purposes, including:</p>
            <ul className="mb-6 space-y-2 list-disc list-inside">
              <li><strong>Platform Functionality:</strong> Operating, maintaining, and improving the Platform.</li>
              <li><strong>User Experience:</strong> Delivering analytics, insights, and personalized features.</li>
              <li><strong>Communications:</strong> Sending confirmations, account updates, onboarding guidance, alerts, and optional marketing communications (with opt-out options).</li>
              <li><strong>Compliance & Safety:</strong> Detecting fraud, preventing misuse, and meeting legal or regulatory obligations.</li>
              <li><strong>Research & Development:</strong> Improving features, content, and services through aggregated and anonymized data analysis.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Sharing of Information</h2>
            <p className="mb-4">We do not sell your personal data to advertisers or data brokers. We may share limited data in the following ways:</p>
            <ul className="mb-6 space-y-2 list-disc list-inside">
              <li><strong>Service Providers:</strong> With trusted vendors such as payment processors (e.g., Stripe), hosting providers, analytics partners, and customer support tools.</li>
              <li><strong>Business Transactions:</strong> In the event of a merger, acquisition, or sale of assets, your data may be transferred to the new entity.</li>
              <li><strong>Legal & Regulatory:</strong> When required to comply with applicable law, regulation, subpoena, or government request.</li>
              <li><strong>Protection:</strong> To enforce our Terms of Service, protect our rights, property, or safety, or safeguard the rights and safety of other users.</li>
            </ul>
            <p className="mb-6">All partners and service providers are bound by strict confidentiality and security obligations.</p>

            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Security</h2>
            <p className="mb-6">
              We implement industry-standard safeguards, including encryption in transit and at rest, access controls, monitoring, and secure infrastructure practices. However, no system is 100% secure, and we cannot guarantee absolute protection against unauthorized access, loss, or misuse.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. International Transfers</h2>
            <p className="mb-6">
              TrueSharp operates primarily in the United States. If you access the Platform from outside the U.S., your data may be transferred, stored, and processed in the United States or other jurisdictions. By using the Platform, you consent to such transfers, which we handle in compliance with applicable data protection laws.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Children's Privacy</h2>
            <p className="mb-6">
              Our Platform is intended for individuals 21 years of age or older. We do not knowingly collect personal data from anyone under 21. If we become aware that a user is under 21, we will immediately suspend the account and delete associated data.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Data Retention</h2>
            <p className="mb-4">We retain personal data for as long as necessary to:</p>
            <ul className="mb-6 space-y-2 list-disc list-inside">
              <li>Provide services to you;</li>
              <li>Comply with legal, regulatory, and tax obligations;</li>
              <li>Enforce agreements and resolve disputes.</li>
            </ul>
            <p className="mb-6">When retention is no longer required, data is securely deleted or anonymized. You may request deletion of your account at any time (see Section 8).</p>

            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Your Rights</h2>
            <p className="mb-4">Depending on your jurisdiction, you may have the following rights:</p>
            <ul className="mb-6 space-y-2 list-disc list-inside">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Update or correct inaccurate or incomplete information.</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated personal data.</li>
              <li><strong>Restriction & Objection:</strong> Limit or object to certain processing activities.</li>
              <li><strong>Portability:</strong> Request a copy of your data in a portable format (where legally applicable).</li>
              <li><strong>Marketing Preferences:</strong> Opt out of receiving promotional communications at any time.</li>
            </ul>
            <p className="mb-6">To exercise these rights, contact us at support@truesharp.com. We may require verification of your identity before fulfilling requests.</p>

            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Compliance and Legal Disclosures</h2>
            <p className="mb-4">We may disclose your information when necessary to:</p>
            <ul className="mb-6 space-y-2 list-disc list-inside">
              <li>Comply with laws, regulations, or legal processes;</li>
              <li>Respond to valid requests from public authorities;</li>
              <li>Protect the safety, rights, or property of TrueSharp, our users, or others;</li>
              <li>Prevent or investigate fraud, misuse, or violations of our Terms of Service.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Updates to This Policy</h2>
            <p className="mb-6">
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. If we make material changes, we will notify you by email or through a prominent notice on the Platform prior to the changes taking effect.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact Us</h2>
            <p className="mb-4">If you have questions or concerns about this Privacy Policy, please contact:</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-900">TrueSharp LLC</p>
              <p className="text-gray-700">Email: info@truesharp.com</p>
            </div>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              © 2025 TrueSharp LLC. All rights reserved.
            </div>
            <Link 
              href="/" 
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Return to TrueSharp
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}