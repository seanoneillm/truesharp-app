'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { HelpCircle, X } from 'lucide-react'

interface HowToLinkSportsbooksModalProps {
  trigger?: React.ReactNode
}

export function HowToLinkSportsbooksModal({ trigger }: HowToLinkSportsbooksModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Trigger Button */}
      <div onClick={() => setIsOpen(true)}>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            How to Link Sportsbooks
          </Button>
        )}
      </div>

      {/* Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-4xl max-h-[90vh] mx-auto">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <HelpCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">How to Link Your Sportsbooks</h2>
                    <p className="text-sm text-slate-600 font-normal">Step-by-step guide to connect your accounts</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="max-h-[70vh] overflow-y-auto px-6 pb-6">
            <div className="space-y-8">
              
              {/* Step 1 */}
              <div className="border-l-4 border-blue-500 pl-6">
                <div className="flex items-start space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm flex-shrink-0 mt-1">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Open the Manage Sportsbooks Menu
                    </h3>
                    <div className="text-slate-700 space-y-2">
                      <p>• On the Analytics → Overview tab, look for the blue <strong>Manage Sportsbooks</strong> button in the bottom-right corner.</p>
                      <p>• Click it to open the SharpSports UI.</p>
                      <p>• <strong>Make sure pop-ups are enabled in your browser</strong> — otherwise the SharpSports window won&apos;t appear.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="border-l-4 border-green-500 pl-6">
                <div className="flex items-start space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 font-bold text-sm flex-shrink-0 mt-1">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Install SharpSports Extension (If Required)
                    </h3>
                    <div className="text-slate-700 space-y-2">
                      <p>• Some sportsbooks require the SharpSports browser extension to link your account.</p>
                      <p>• If prompted, follow the instructions in the SharpSports UI to install it.</p>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                        <p className="text-amber-800 text-sm">
                          <strong>💡 Tip:</strong> The extension works best with Chrome or Edge browsers.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="border-l-4 border-purple-500 pl-6">
                <div className="flex items-start space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 font-bold text-sm flex-shrink-0 mt-1">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Sign in to Your Sportsbooks
                    </h3>
                    <div className="text-slate-700 space-y-2">
                      <p>• In the SharpSports UI, you will see a list of supported sportsbooks.</p>
                      <p>• Sign in to as many as you&apos;d like.</p>
                      <p>• Once finished, you can close the SharpSports window.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="border-l-4 border-orange-500 pl-6">
                <div className="flex items-start space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-bold text-sm flex-shrink-0 mt-1">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Refresh Your Accounts in SharpSports UI
                    </h3>
                    <div className="text-slate-700 space-y-2">
                      <p>• To fetch new bets, you must first re-open <strong>Manage Sportsbooks</strong> and refresh your accounts inside the SharpSports UI.</p>
                      <p>• Make sure all books show as up to date.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="border-l-4 border-red-500 pl-6">
                <div className="flex items-start space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 font-bold text-sm flex-shrink-0 mt-1">
                    5
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Refresh Bets in Analytics
                    </h3>
                    <div className="text-slate-700 space-y-2">
                      <p>• Go back to the Analytics page, and press <strong>Refresh Bets</strong> (directly under the Manage Sportsbooks button).</p>
                      <p>• Accept the confirmation pop-up and wait — this may take up to a minute.</p>
                      <p>• Once complete, your latest bets will appear in Analytics.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Warning */}
              <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-6">
                <div className="flex items-start space-x-3">
                  <div className="text-red-500 text-xl">⚠️</div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-900 mb-2">Important</h3>
                    <p className="text-red-800">
                      You cannot just press <strong>Refresh Bets</strong> directly — you must refresh your accounts in SharpSports UI first, then press Refresh Bets in Analytics.
                    </p>
                  </div>
                </div>
              </div>

              {/* Troubleshooting Section */}
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Troubleshooting Tips</h3>
                <div className="space-y-3 text-slate-700">
                  <div className="flex items-start space-x-2">
                    <span className="text-slate-500">•</span>
                    <span>If the SharpSports window doesn&apos;t open, check if your browser is blocking pop-ups</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-slate-500">•</span>
                    <span>For best results, use Chrome or Edge browsers</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-slate-500">•</span>
                    <span>If bets aren&apos;t syncing, make sure you refreshed accounts in SharpSports UI before clicking Refresh Bets</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-slate-500">•</span>
                    <span>Some sportsbooks may take longer to sync than others</span>
                  </div>
                </div>
              </div>

              {/* Quick Reference */}
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Quick Reference</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">To Link New Sportsbooks:</h4>
                    <p className="text-blue-800">Click Manage Sportsbooks → Sign in to accounts → Close window</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">To Sync New Bets:</h4>
                    <p className="text-blue-800">Manage Sportsbooks → Refresh accounts → Close → Refresh Bets</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}