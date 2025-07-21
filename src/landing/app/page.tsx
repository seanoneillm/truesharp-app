'use client'

import EmailSignup from './components/EmailSignup'

// TrueSharp Shield Component
const TrueSharpShield = ({ className = "h-6 w-6", variant = "default" }) => (
  <svg className={className} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={`shieldGradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={variant === "light" ? "#3b82f6" : "#1e40af"} />
        <stop offset="100%" stopColor={variant === "light" ? "#1e40af" : "#1e3a8a"} />
      </linearGradient>
    </defs>
    <path 
      d="M50 5 L80 20 L80 50 Q80 85 50 110 Q20 85 20 50 L20 20 Z" 
      fill={`url(#shieldGradient-${variant})`} 
      stroke={variant === "light" ? "#60a5fa" : "#3b82f6"} 
      strokeWidth="2"
    />
    <path 
      d="M35 45 L45 55 L65 35" 
      stroke="white" 
      strokeWidth="4" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      fill="none"
    />
  </svg>
)

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-700">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <TrueSharpShield className="h-10 w-10" variant="light" />
            <span className="text-white text-2xl font-bold">TrueSharp</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <TrueSharpShield className="h-20 w-20 mx-auto mb-6" variant="light" />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-8">
            Verified Sports Betting
            <span className="text-blue-200 block mt-2">Community</span>
          </h1>
          
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto">
            The most trusted platform for sports betting analytics and strategy sharing is coming soon.
          </p>

          {/* Features List */}
          <div className="mb-12 max-w-2xl mx-auto">
            <ul className="space-y-4 text-left">
              <li className="flex items-start space-x-3 text-blue-100">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-lg">Seamlessly sync your bets from every major sportsbook</span>
              </li>
              <li className="flex items-start space-x-3 text-blue-100">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-lg">Track performance with in-depth analysis and advanced filters</span>
              </li>
              <li className="flex items-start space-x-3 text-blue-100">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-lg">Monetize your best strategies with verified performance records</span>
              </li>
              <li className="flex items-start space-x-3 text-blue-100">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-lg">Subscribe to proven bettors and follow winning strategies</span>
              </li>
            </ul>
          </div>

          <div className="mb-12">
            <EmailSignup />
          </div>

          <div className="flex justify-center items-center space-x-6 text-blue-200">
            <div className="flex items-center">
              <TrueSharpShield className="h-5 w-5 mr-2" variant="light" />
              <span className="text-sm font-medium">100% Verified Data</span>
            </div>
            <div className="flex items-center">
              <TrueSharpShield className="h-5 w-5 mr-2" variant="light" />
              <span className="text-sm font-medium">No Fake Records</span>
            </div>
            <div className="flex items-center">
              <TrueSharpShield className="h-5 w-5 mr-2" variant="light" />
              <span className="text-sm font-medium">Automatic Tracking</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-blue-500/30">
        <div className="text-center text-blue-200">
          <p>&copy; 2025 TrueSharp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

