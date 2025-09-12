'use client'

import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface DateSelectorProps {
  selectedDate: Date | null
  onDateChange: (date: Date) => void
}

export default function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {

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
  }

  // Handle quick date button clicks
  const handleQuickDate = (targetDate: Date) => {
    onDateChange(targetDate)
  }

  // Handle date navigation with arrows
  const goToPreviousDay = () => {
    if (selectedDate) {
      const prevDate = new Date(selectedDate)
      prevDate.setDate(selectedDate.getDate() - 1)
      onDateChange(prevDate)
    }
  }

  const goToNextDay = () => {
    if (selectedDate) {
      const nextDate = new Date(selectedDate)
      nextDate.setDate(selectedDate.getDate() + 1)
      onDateChange(nextDate)
    }
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
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="px-4 py-2">
        {/* Compact Date Navigation */}
        <div className="flex items-center justify-center space-x-2">
          {/* Left Arrow */}
          <button
            onClick={goToPreviousDay}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 transition-colors hover:bg-slate-50 hover:border-slate-300 flex-shrink-0"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Quick Date Buttons */}
          <div className="flex items-center space-x-1 rounded-md bg-slate-50 p-1">
            <button
              onClick={() => handleQuickDate(yesterday)}
              className={`rounded-sm px-2 py-1 text-xs font-medium transition-all ${
                isYesterday(selectedDate)
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => handleQuickDate(today)}
              className={`rounded-sm px-2 py-1 text-xs font-medium transition-all ${
                isToday(selectedDate)
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handleQuickDate(tomorrow)}
              className={`rounded-sm px-2 py-1 text-xs font-medium transition-all ${
                isTomorrow(selectedDate)
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
              }`}
            >
              Tomorrow
            </button>
          </div>

          {/* Date Picker */}
          <div className="flex items-center space-x-1.5">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={formatDateForInput(selectedDate)}
              onChange={e => handleDateSelect(e.target.value)}
              className="rounded-md border border-slate-200 px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Right Arrow */}
          <button
            onClick={goToNextDay}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 transition-colors hover:bg-slate-50 hover:border-slate-300 flex-shrink-0"
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
