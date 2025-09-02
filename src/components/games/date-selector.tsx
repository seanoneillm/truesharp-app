'use client'

import { Calendar } from 'lucide-react'
import { useState } from 'react'

interface DateSelectorProps {
  selectedDate: Date | null
  onDateChange: (date: Date) => void
}

export default function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const [showCalendar, setShowCalendar] = useState(false)

  // Get normalized dates for comparison (removes time component)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  // Helper function to check if a date matches today/yesterday/tomorrow
  const isToday = (date: Date) => {
    const normalizedDate = new Date(date)
    normalizedDate.setHours(0, 0, 0, 0)
    return normalizedDate.getTime() === today.getTime()
  }

  const isYesterday = (date: Date) => {
    const normalizedDate = new Date(date)
    normalizedDate.setHours(0, 0, 0, 0)
    return normalizedDate.getTime() === yesterday.getTime()
  }

  const isTomorrow = (date: Date) => {
    const normalizedDate = new Date(date)
    normalizedDate.setHours(0, 0, 0, 0)
    return normalizedDate.getTime() === tomorrow.getTime()
  }

  // Format date for input field
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0] || ''
  }

  // Handle date selection from input
  const handleDateSelect = (dateString: string) => {
    const newDate = new Date(dateString + 'T00:00:00')
    onDateChange(newDate)
    setShowCalendar(false)
  }

  // Handle quick date button clicks
  const handleQuickDate = (targetDate: Date) => {
    onDateChange(targetDate)
  }

  // Return loading state if selectedDate is null
  if (!selectedDate) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-10 w-20 animate-pulse rounded-lg bg-slate-200"></div>
        <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-200"></div>
        <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-200"></div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="p-4">
        {/* Header with current date */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Date Selection</h3>
          </div>
          <span className="text-sm text-slate-600">
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Quick Date Tabs */}
        <div className="mb-4 flex items-center space-x-1 rounded-lg bg-slate-50 p-1">
          <button
            onClick={() => handleQuickDate(yesterday)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              isYesterday(selectedDate)
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => handleQuickDate(today)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              isToday(selectedDate)
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => handleQuickDate(tomorrow)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              isTomorrow(selectedDate)
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
            }`}
          >
            Tomorrow
          </button>
        </div>

        {/* Date Picker and Toggle */}
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <input
              type="date"
              value={formatDateForInput(selectedDate)}
              onChange={e => handleDateSelect(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
          >
            {showCalendar ? 'Hide' : 'More'}
          </button>
        </div>

        {/* Expandable Calendar Options */}
        {showCalendar && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  handleQuickDate(today)
                  setShowCalendar(false)
                }}
                className="rounded-lg bg-blue-50 px-3 py-2 text-center text-sm text-blue-600 transition-colors hover:bg-blue-100"
              >
                Jump to Today
              </button>
              <button
                onClick={() => {
                  const nextWeek = new Date(today)
                  nextWeek.setDate(today.getDate() + 7)
                  handleQuickDate(nextWeek)
                  setShowCalendar(false)
                }}
                className="rounded-lg bg-slate-50 px-3 py-2 text-center text-sm text-slate-600 transition-colors hover:bg-slate-100"
              >
                Next Week
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
