'use client';

import { Calendar } from 'lucide-react';
import { useState } from 'react';

interface DateSelectorProps {
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
}

export default function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Get normalized dates for comparison (removes time component)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Helper function to check if a date matches today/yesterday/tomorrow
  const isToday = (date: Date) => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    return normalizedDate.getTime() === today.getTime();
  };

  const isYesterday = (date: Date) => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    return normalizedDate.getTime() === yesterday.getTime();
  };

  const isTomorrow = (date: Date) => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    return normalizedDate.getTime() === tomorrow.getTime();
  };

  // Format date for input field
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0] || '';
  };

  // Handle date selection from input
  const handleDateSelect = (dateString: string) => {
    const newDate = new Date(dateString + 'T00:00:00');
    onDateChange(newDate);
    setShowCalendar(false);
  };

  // Handle quick date button clicks
  const handleQuickDate = (targetDate: Date) => {
    onDateChange(targetDate);
  };

  // Return loading state if selectedDate is null
  if (!selectedDate) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-pulse bg-slate-200 h-10 w-20 rounded-lg"></div>
        <div className="animate-pulse bg-slate-200 h-10 w-24 rounded-lg"></div>
        <div className="animate-pulse bg-slate-200 h-10 w-32 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-4">
        {/* Header with current date */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Date Selection</h3>
          </div>
          <span className="text-sm text-slate-600">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>

        {/* Quick Date Tabs */}
        <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-lg mb-4">
          <button
            onClick={() => handleQuickDate(yesterday)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex-1 ${
              isYesterday(selectedDate)
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => handleQuickDate(today)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex-1 ${
              isToday(selectedDate)
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => handleQuickDate(tomorrow)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex-1 ${
              isTomorrow(selectedDate)
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
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
              onChange={(e) => handleDateSelect(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
          >
            {showCalendar ? 'Hide' : 'More'}
          </button>
        </div>

        {/* Expandable Calendar Options */}
        {showCalendar && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  handleQuickDate(today);
                  setShowCalendar(false);
                }}
                className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-center"
              >
                Jump to Today
              </button>
              <button
                onClick={() => {
                  const nextWeek = new Date(today);
                  nextWeek.setDate(today.getDate() + 7);
                  handleQuickDate(nextWeek);
                  setShowCalendar(false);
                }}
                className="px-3 py-2 text-sm text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-center"
              >
                Next Week
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
