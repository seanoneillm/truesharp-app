'use client'

import { BetSelection } from '@/lib/types/games'
import { formatOdds } from '@/lib/formatters'
import { X, ShoppingCart, Calculator } from 'lucide-react'
import { useState } from 'react'

interface BetSlipProps {
  selections: BetSelection[]
  onRemoveSelection: (index: number) => void
  onClearAll: () => void
  onSubmitPicks: () => void
  isOpen: boolean
  onToggle: () => void
}

// Helper function to calculate parlay odds (multiplicative approach)
const calculateParlayOdds = (selections: BetSelection[]): number => {
  if (selections.length <= 1) return selections[0]?.odds || 0

  let totalDecimal = 1
  for (const selection of selections) {
    // Convert American odds to decimal
    const decimal =
      selection.odds > 0 ? selection.odds / 100 + 1 : 100 / Math.abs(selection.odds) + 1
    totalDecimal *= decimal
  }

  // Convert back to American odds
  if (totalDecimal >= 2) {
    return Math.round((totalDecimal - 1) * 100)
  } else {
    return Math.round(-100 / (totalDecimal - 1))
  }
}

export default function BetSlip({
  selections,
  onRemoveSelection,
  onClearAll,
  onSubmitPicks,
  isOpen,
  onToggle,
}: BetSlipProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const parlayOdds = calculateParlayOdds(selections)
  const isParlay = selections.length > 1

  const formatSelectionLine = (selection: BetSelection): string => {
    if (selection.line !== undefined) {
      if (selection.marketType === 'spread') {
        return selection.line > 0 ? `+${selection.line}` : `${selection.line}`
      } else if (selection.marketType === 'total') {
        return `${selection.selection} ${selection.line}`
      }
    }
    return selection.selection
  }

  return (
    <>
      {/* Mobile Bottom Drawer */}
      <div className="md:hidden">
        {/* Mobile Bet Slip Toggle */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
            selections.length > 0 ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="border-t border-slate-200 bg-white p-4">
            <button
              onClick={onToggle}
              className="flex w-full items-center justify-between rounded-lg bg-blue-600 p-3 text-white shadow-lg"
            >
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5" />
                <span className="font-medium">
                  {selections.length} Pick{selections.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="text-sm font-bold">
                {isParlay
                  ? formatOdds(parlayOdds)
                  : selections[0]
                    ? formatOdds(selections[0].odds)
                    : ''}
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Drawer Overlay */}
        {isOpen && <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={onToggle} />}

        {/* Mobile Drawer Content */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 transform rounded-t-2xl bg-white transition-transform duration-300 ${
            isOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Bet Slip</h3>
              <button
                onClick={onToggle}
                className="rounded-lg p-2 text-slate-500 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto p-4">
            {selections.length === 0 ? (
              <div className="py-8 text-center">
                <ShoppingCart className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                <p className="text-slate-500">Your bet slip is empty.</p>
                <p className="mt-1 text-sm text-slate-400">Click an odd to add a pick.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selections.map((selection, index) => (
                  <div key={index} className="rounded-lg border border-slate-200 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-sm font-medium text-slate-900">
                        {selection.homeTeam} vs {selection.awayTeam}
                      </div>
                      <button
                        onClick={() => onRemoveSelection(index)}
                        className="p-1 text-slate-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mb-1 text-sm text-slate-600">
                      {selection.marketType === 'moneyline'
                        ? 'Moneyline'
                        : selection.marketType === 'spread'
                          ? 'Spread'
                          : selection.marketType === 'total'
                            ? 'Total'
                            : 'Prop'}
                      : {formatSelectionLine(selection)}
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {formatOdds(selection.odds)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selections.length > 0 && (
            <div className="space-y-3 border-t border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {isParlay ? `${selections.length}-Pick Parlay` : 'Straight Bet'}
                </span>
                <div className="text-lg font-bold text-blue-600">
                  {formatOdds(isParlay ? parlayOdds : selections[0].odds)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onClearAll}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-slate-600 hover:bg-slate-50"
                >
                  Clear All
                </button>
                <button
                  onClick={onSubmitPicks}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Submit Picks
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Fixed Panel */}
      <div className="hidden md:block">
        <div
          className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
            selections.length > 0
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-4 opacity-0'
          }`}
        >
          <div className="max-h-96 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900">Bet Slip</h3>
                <span className="text-sm text-slate-500">({selections.length})</span>
              </div>
              <div className="flex items-center space-x-2">
                {selections.length > 1 && (
                  <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="rounded p-1 text-slate-500 hover:text-slate-700"
                  >
                    <Calculator className="h-4 w-4" />
                  </button>
                )}
                <button onClick={onClearAll} className="text-sm text-slate-500 hover:text-red-500">
                  Clear
                </button>
              </div>
            </div>

            {/* Content */}
            <div
              className={`transition-all duration-300 ${isCollapsed ? 'max-h-0' : 'max-h-64'} overflow-y-auto`}
            >
              {selections.length === 0 ? (
                <div className="p-6 text-center">
                  <ShoppingCart className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                  <p className="text-slate-500">Your bet slip is empty.</p>
                  <p className="mt-1 text-sm text-slate-400">Click an odd to add a pick.</p>
                </div>
              ) : (
                <div className="space-y-3 p-4">
                  {selections.map((selection, index) => (
                    <div key={index} className="rounded-lg border border-slate-200 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="truncate text-sm font-medium text-slate-900">
                          {selection.homeTeam} vs {selection.awayTeam}
                        </div>
                        <button
                          onClick={() => onRemoveSelection(index)}
                          className="ml-2 p-1 text-slate-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mb-1 text-sm text-slate-600">
                        {selection.marketType === 'moneyline'
                          ? 'Moneyline'
                          : selection.marketType === 'spread'
                            ? 'Spread'
                            : selection.marketType === 'total'
                              ? 'Total'
                              : 'Prop'}
                        : {formatSelectionLine(selection)}
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatOdds(selection.odds)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {selections.length > 0 && (
              <div className="space-y-3 border-t border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">
                    {isParlay ? `${selections.length}-Pick Parlay` : 'Straight Bet'}
                  </span>
                  <div className="text-lg font-bold text-blue-600">
                    {formatOdds(isParlay ? parlayOdds : selections[0].odds)}
                  </div>
                </div>
                <button
                  onClick={onSubmitPicks}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                >
                  Submit Picks
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
