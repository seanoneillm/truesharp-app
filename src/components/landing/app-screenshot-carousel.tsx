'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Download, Star } from 'lucide-react'
import Image from 'next/image'

const screenshots = [
  {
    id: 'analytics',
    title: 'Advanced Analytics Dashboard',
    subtitle: 'Track your performance with professional-grade analytics',
    image: '/images/screenshots/images/hero-analytics.png',
    fallback: '/images/app-screenshots/analytics-dashboard.svg',
    alt: 'TrueSharp Analytics Dashboard showing ROI, win rates, and performance metrics'
  },
  {
    id: 'dashboard',
    title: 'Performance Dashboard',
    subtitle: 'Comprehensive overview of your betting performance',
    image: '/images/screenshots/images/hero-dashboard.png',
    fallback: '/images/app-screenshots/analytics-dashboard.svg',
    alt: 'TrueSharp Dashboard showing comprehensive betting analytics'
  },
  {
    id: 'games',
    title: 'Odds Research Tools',
    subtitle: 'Research line movement and prop histories before betting',
    image: '/images/screenshots/images/hero-games.png',
    fallback: '/images/app-screenshots/games-screen.svg',
    alt: 'TrueSharp Games Screen with odds research and line movement tools'
  },
  {
    id: 'marketplace',
    title: 'Strategy Marketplace',
    subtitle: 'Discover and subscribe to winning strategies',
    image: '/images/screenshots/images/hero-marketplace.png',
    fallback: '/images/app-screenshots/marketplace.svg',
    alt: 'TrueSharp Marketplace showing top verified betting strategies'
  },
  {
    id: 'seller',
    title: 'Monetize Your Expertise',
    subtitle: 'Turn your track record into income',
    image: '/images/screenshots/images/hero-selling.png',
    fallback: '/images/app-screenshots/seller-dashboard.svg',
    alt: 'TrueSharp Seller Dashboard for monetizing betting strategies'
  }
]

export default function AppScreenshotCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % screenshots.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + screenshots.length) % screenshots.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % screenshots.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-16 sm:py-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/95 to-indigo-900/90"></div>
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-2000"></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="relative">
              <img 
                src="/images/truesharp-logo.png" 
                alt="TrueSharp Logo" 
                className="h-12 w-12 rounded-2xl shadow-lg border-2 border-white/20" 
              />
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-25"></div>
            </div>
            <div className="text-left">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Experience TrueSharp
              </h2>
            </div>
          </div>
          <p className="text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            The complete sports betting platform trusted by thousands of serious bettors
          </p>
        </div>

        {/* Main Carousel */}
        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Content Section */}
            <div className="lg:col-span-5 text-center lg:text-left space-y-6 z-10 relative">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 backdrop-blur-sm border border-blue-400/30">
                  <span className="text-blue-200 text-sm font-medium transition-all duration-300">
                    Feature {currentIndex + 1} of {screenshots.length}
                  </span>
                </div>
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight transition-all duration-500">
                  {screenshots[currentIndex].title}
                </h3>
                <p className="text-lg sm:text-xl text-blue-100 leading-relaxed max-w-lg lg:max-w-none transition-all duration-500">
                  {screenshots[currentIndex].subtitle}
                </p>
              </div>
              
              {/* App Store Download */}
              <div className="flex flex-col sm:flex-row gap-4 items-center lg:items-start">
                <a
                  href="https://apps.apple.com/us/app/truesharp-sports/id6753960332"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-4 rounded-2xl bg-white text-gray-900 px-6 py-4 font-semibold shadow-xl transition-all duration-200 hover:scale-105 hover:shadow-2xl"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                    <Download className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs opacity-70 font-medium">Download on the</div>
                    <div className="text-base font-bold">App Store</div>
                  </div>
                </a>
                <div className="text-sm text-blue-200 font-medium">
                  Free Download
                </div>
              </div>
            </div>

            {/* Phone Display Section */}
            <div className="lg:col-span-7 relative">
              <div className="relative flex justify-center">
                {/* Background Phones with Real Images */}
                <div className="absolute -right-8 top-8 opacity-40 transform rotate-12 scale-90 z-0 transition-all duration-700">
                  <div className="w-[280px] h-[560px] rounded-[3.2rem] bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 p-2 shadow-2xl">
                    <div className="w-full h-full rounded-[2.8rem] bg-black overflow-hidden">
                      {/* Dynamic Island */}
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20"></div>
                      {/* Next Image */}
                      <div className="relative w-full h-full p-1">
                        <div className="w-full h-full rounded-[2.4rem] overflow-hidden">
                          <Image
                            key={`next-${currentIndex}`}
                            src={screenshots[(currentIndex + 1) % screenshots.length].image}
                            alt={screenshots[(currentIndex + 1) % screenshots.length].alt}
                            fill
                            className="object-cover object-top transition-all duration-700"
                            sizes="280px"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = screenshots[(currentIndex + 1) % screenshots.length].fallback
                            }}
                          />
                        </div>
                      </div>
                      {/* Home Indicator */}
                      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-28 h-1 bg-white/50 rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div className="absolute -left-8 top-12 opacity-30 transform -rotate-12 scale-85 z-0 transition-all duration-700">
                  <div className="w-[280px] h-[560px] rounded-[3.2rem] bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 p-2 shadow-2xl">
                    <div className="w-full h-full rounded-[2.8rem] bg-black overflow-hidden">
                      {/* Dynamic Island */}
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20"></div>
                      {/* Previous Image */}
                      <div className="relative w-full h-full p-1">
                        <div className="w-full h-full rounded-[2.4rem] overflow-hidden">
                          <Image
                            key={`prev-${currentIndex}`}
                            src={screenshots[(currentIndex - 1 + screenshots.length) % screenshots.length].image}
                            alt={screenshots[(currentIndex - 1 + screenshots.length) % screenshots.length].alt}
                            fill
                            className="object-cover object-top transition-all duration-700"
                            sizes="280px"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = screenshots[(currentIndex - 1 + screenshots.length) % screenshots.length].fallback
                            }}
                          />
                        </div>
                      </div>
                      {/* Home Indicator */}
                      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-28 h-1 bg-white/50 rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* Main Phone */}
                <div className="relative z-10 transform hover:scale-105 transition-all duration-500">
                  <div className="w-[300px] h-[600px] sm:w-[320px] sm:h-[640px] rounded-[3.5rem] bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 p-2 shadow-2xl">
                    {/* Screen */}
                    <div className="relative w-full h-full rounded-[3.2rem] bg-black overflow-hidden">
                      {/* Dynamic Island */}
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-28 h-7 bg-black rounded-full z-20"></div>
                      
                      {/* Screenshot with smooth transitions */}
                      <div className="relative w-full h-full p-1">
                        <div className="w-full h-full rounded-[2.8rem] overflow-hidden relative">
                          <Image
                            key={`main-${currentIndex}`}
                            src={screenshots[currentIndex].image}
                            alt={screenshots[currentIndex].alt}
                            fill
                            className="object-cover object-top transition-all duration-700"
                            sizes="(max-width: 640px) 300px, 320px"
                            priority={currentIndex === 0}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = screenshots[currentIndex].fallback
                            }}
                          />
                          
                          {/* Overlay for transition */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none"></div>
                        </div>
                      </div>
                      
                      {/* Home Indicator */}
                      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white/50 rounded-full"></div>
                    </div>
                    
                    {/* Enhanced Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-indigo-500/20 rounded-[3.5rem] blur-2xl scale-110 -z-10"></div>
                  </div>
                  
                  {/* Floating Elements */}
                  <div className="absolute -top-4 -right-4 bg-green-500 rounded-full w-4 h-4 animate-pulse shadow-lg"></div>
                  <div className="absolute -bottom-4 -left-4 bg-blue-500 rounded-full w-3 h-3 animate-bounce shadow-lg"></div>
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-200 group border border-white/20"
                aria-label="Previous screenshot"
              >
                <ChevronLeft className="h-5 w-5 group-hover:scale-110 transition-transform" />
              </button>
              
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-200 group border border-white/20"
                aria-label="Next screenshot"
              >
                <ChevronRight className="h-5 w-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-12 gap-3">
            {screenshots.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex 
                    ? 'w-8 h-3 bg-white shadow-lg' 
                    : 'w-3 h-3 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to screenshot ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}