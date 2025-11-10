'use client'

import { useState, useEffect } from 'react'
import { Smartphone } from 'lucide-react'

const AppLaunchSection = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const section = document.getElementById('app-launch-section')
    if (section) {
      observer.observe(section)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section 
      id="app-launch-section"
      className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className={`mx-auto max-w-5xl transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            
            {/* Left Column - App Logo and Download */}
            <div className="flex flex-col items-center justify-center lg:items-start">
              <div className="mb-8 rounded-3xl bg-white/80 p-8 shadow-lg backdrop-blur-sm">
                <img 
                  src="/images/truesharp-logo.png" 
                  alt="TrueSharp Sports App" 
                  className="h-32 w-32 mx-auto rounded-2xl shadow-sm" 
                />
              </div>
              
              <a
                href="https://apps.apple.com/us/app/truesharp-sports/id6753960332"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 rounded-2xl bg-black px-8 py-4 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-medium opacity-80">Download on the</div>
                  <div className="text-lg font-semibold">App Store</div>
                </div>
              </a>
            </div>

            {/* Right Column - Text Content */}
            <div className="flex flex-col justify-center space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 self-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 lg:self-start">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                </span>
                Now Available
              </div>
              
              <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                📱 The TrueSharp Sports iOS App is Here!
              </h2>
              
              <p className="text-xl leading-8 text-gray-600">
                Sync, track, analyze, and sell your verified picks — all from one place.
                The TrueSharp Sports app brings the full TrueSharp experience to your phone.
              </p>
              
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="text-center lg:text-left">
                  <div className="text-2xl font-bold text-gray-900">15+</div>
                  <div className="text-sm text-gray-600">Supported Sportsbooks</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl font-bold text-gray-900">100%</div>
                  <div className="text-sm text-gray-600">Verified Data</div>
                </div>
              </div>
              
              <div className="mt-6 rounded-lg bg-white/60 p-4 backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-700">"Finally, a verified way to track my picks. The app syncs seamlessly with DraftKings!"</div>
                  <div className="mt-2 text-xs text-gray-500">— Verified bettor with +18% ROI</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AppLaunchSection