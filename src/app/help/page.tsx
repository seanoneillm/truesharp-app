import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Help & Support - TrueSharp',
  description: 'Get help and support for TrueSharp platform features, account management, and more.',
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Help & Support
          </h1>
          <p className="text-xl text-gray-600">
            Find answers to common questions and get the help you need
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Common Questions
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How do I track my betting performance?
              </h3>
              <p className="text-gray-600">
                Navigate to your Dashboard to see your recent bets and overall performance metrics. 
                For detailed analytics, visit the Analytics page where you can filter by sport, time period, and more.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How do I become a seller?
              </h3>
              <p className="text-gray-600">
                Go to Settings → Seller Settings and enable seller mode. You'll need to track your betting 
                performance for at least 30 days before you can monetize your strategies.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What is TrueSharp Pro?
              </h3>
              <p className="text-gray-600">
                TrueSharp Pro provides advanced analytics, unlimited filtering options, line movement charts, 
                and priority support for $20/month.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How do I contact support?
              </h3>
              <p className="text-gray-600">
                For additional support, please email us at{' '}
                <a href="mailto:support@truesharp.io" className="text-blue-600 hover:text-blue-700">
                  support@truesharp.io
                </a>
                {' '}or use the chat widget in the bottom right corner.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
