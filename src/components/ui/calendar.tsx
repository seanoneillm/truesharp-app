'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import * as React from 'react'
import { DayPicker } from 'react-day-picker'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-3',
        caption: 'flex justify-between items-center px-2 py-2 mb-2',
        caption_label: 'text-sm font-semibold text-foreground px-3',
        nav: 'flex items-center space-x-1',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-accent transition-all duration-200'
        ),
        nav_button_previous: '',
        nav_button_next: '',
        table: 'w-full border-collapse',
        head_row: 'flex mb-1',
        head_cell: 'text-muted-foreground text-center w-10 font-medium text-xs py-2 flex items-center justify-center',
        row: 'flex w-full',
        cell: 'text-center text-sm p-0 relative flex-1 h-10 flex items-center justify-center [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground transition-colors duration-150'
        ),
        day_range_end: 'day-range-end',
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md',
        day_today: 'bg-accent text-accent-foreground font-semibold',
        day_outside:
          'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
        day_disabled: 'text-muted-foreground opacity-30 cursor-not-allowed',
        day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        PreviousMonthButton: ({ ...props }) => (
          <button 
            type="button"
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-accent transition-all duration-200'
            )}
            {...props}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ),
        NextMonthButton: ({ ...props }) => (
          <button 
            type="button"
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-accent transition-all duration-200'
            )}
            {...props}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
