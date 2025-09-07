'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface HowToUseModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function HowToUseModal({
  isOpen,
  onClose,
}: HowToUseModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [isOpen, onClose])

  // Focus trap - only trap focus between interactive elements, allow content scrolling
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button:not([tabindex="-1"]), [href]:not([tabindex="-1"]), input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      const handleTabKey = (event: KeyboardEvent) => {
        // Only trap tab navigation, don't interfere with other keys like arrow keys for scrolling
        if (event.key === 'Tab') {
          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              event.preventDefault()
              lastElement?.focus()
            }
          } else {
            if (document.activeElement === lastElement) {
              event.preventDefault()
              firstElement?.focus()
            }
          }
        }
      }

      document.addEventListener('keydown', handleTabKey)
      // Don't auto-focus initially to allow natural scrolling
      
      return () => {
        document.removeEventListener('keydown', handleTabKey)
      }
    }
    
    return undefined
  }, [isOpen])

  // Prevent body scroll when modal is open, but allow modal content to scroll
  useEffect(() => {
    if (isOpen) {
      // Store original overflow value
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
    
    return undefined
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-to-use-modal-title"
      >
        <div className="bg-white rounded-xl shadow-xl flex flex-col h-full max-h-[90vh]">
          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
            <h2
              id="how-to-use-modal-title"
              className="text-2xl font-bold text-slate-900 flex items-center gap-2"
            >
              🎮 How to Use the Games Page
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1 hover:bg-slate-100"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div 
            className="flex-1 overflow-y-auto p-6 overscroll-contain" 
            style={{ maxHeight: 'calc(90vh - 180px)' }}
            tabIndex={-1}
          >
            <div className="prose prose-slate max-w-none">
              <p className="text-lg text-slate-700 mb-6">
                The Games Page is your all-in-one hub for exploring odds, testing strategies, and sharing picks. It's built for tracking, analyzing, and learning — not for real-money wagering. Here's how to make the most of it:
              </p>

              <div className="space-y-8">
                <section>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">1. Odds Screen – See the Market at a Glance</h3>
                  <ul className="space-y-2 text-slate-700">
                    <li>View consensus odds across games and props.</li>
                    <li>Compare lines quickly without switching between sportsbooks.</li>
                    <li>Use this feature to spot value, trends, and movement before making decisions.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">2. Pick Sellers – Post Verified Picks for Subscribers</h3>
                  <p className="text-slate-700 mb-3">For creators and strategy sellers, the Games Page acts like a mock sportsbook:</p>
                  <ul className="space-y-2 text-slate-700 mb-4">
                    <li>Place your bets directly in the system.</li>
                    <li>Assign them to one of your strategies so subscribers can follow along.</li>
                    <li>Our platform tracks results automatically and updates them daily.</li>
                    <li>Even if you can't sync your sportsbook, you can still build trust by having your picks verified through our system.</li>
                  </ul>
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                    <p className="text-blue-800 font-medium">
                      👉 This ensures your subscribers see real, tracked results instead of screenshots or unverified claims.
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">3. Paper Betting – Practice Without Risk</h3>
                  <p className="text-slate-700 mb-3">Want to test a new strategy before risking money? Use the Games Page for manual paper betting:</p>
                  <ul className="space-y-2 text-slate-700 mb-4">
                    <li>Place bets just like you would in a sportsbook.</li>
                    <li>Track the results inside your Analytics Page.</li>
                    <li>Experiment with bet types, parlays, and approaches without financial risk.</li>
                  </ul>
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                    <p className="text-green-800 font-medium">
                      👉 This feature is perfect for learning, experimenting, and building confidence before betting real money.
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Features & Rules</h3>
                  <ul className="space-y-2 text-slate-700">
                    <li>Place up to 10-leg parlays using multiple games.</li>
                    <li>No same-game parlays at this time.</li>
                    <li>All results are handled automatically — no manual scoring required.</li>
                    <li className="font-semibold">Remember: We are not a sportsbook and do not accept real wagers.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">🚀 Future Plans</h3>
                  <p className="text-slate-700 mb-3">We're continuing to expand the Games Page:</p>
                  <ul className="space-y-2 text-slate-700">
                    <li>Adding more leagues.</li>
                    <li>Offering more odds types.</li>
                    <li>Enhancing tools for analysis and strategy building.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">✅ Summary</h3>
                  <p className="text-slate-700 mb-3">The Games Page isn't just about looking at odds — it's about learning, testing, and building discipline.</p>
                  <ul className="space-y-2 text-slate-700">
                    <li>Use it as an odds screen for quick insights.</li>
                    <li>Use it as a pick seller tool to share verified strategies.</li>
                    <li>Use it as a paper betting lab to practice safely.</li>
                  </ul>
                </section>
              </div>
            </div>
          </div>

          {/* Footer - Fixed */}
          <div className="flex justify-end p-6 border-t border-slate-200 flex-shrink-0">
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}