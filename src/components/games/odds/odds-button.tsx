'use client'

import { formatOdds } from '@/lib/formatters'

interface OddsButtonProps {
  odds: number
  line?: number
  isSelected?: boolean
  onClick: () => void
  sportsbook?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'success' | 'danger'
  disabled?: boolean
}

export default function OddsButton({
  odds,
  line,
  isSelected = false,
  onClick,
  sportsbook,
  size = 'md',
  variant = 'primary',
  disabled = false,
}: OddsButtonProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-1.5 sm:px-2 py-1.5 text-xs min-w-[55px] sm:min-w-[60px]'
      case 'lg':
        return 'px-4 py-3 text-base min-w-[80px]'
      default:
        return 'px-2.5 sm:px-3 py-2 text-sm min-w-[65px] sm:min-w-[70px]'
    }
  }

  const getVariantClasses = () => {
    if (disabled) {
      return 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
    }

    if (isSelected) {
      switch (variant) {
        case 'success':
          return 'bg-green-600 text-white border-green-600 shadow-sm'
        case 'danger':
          return 'bg-red-600 text-white border-red-600 shadow-sm'
        case 'secondary':
          return 'bg-slate-600 text-white border-slate-600 shadow-sm'
        default:
          return 'bg-blue-600 text-white border-blue-600 shadow-sm'
      }
    }

    switch (variant) {
      case 'success':
        return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300'
      case 'danger':
        return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300'
      case 'secondary':
        return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
    }
  }

  const formatLineDisplay = () => {
    if (line === undefined) return null

    // Format line based on value
    if (line > 0) {
      return `+${line}`
    } else if (line < 0) {
      return line.toString()
    } else {
      return `${line}`
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer rounded-full border text-center font-medium shadow-sm transition-all duration-200 hover:shadow-md ${getSizeClasses()} ${getVariantClasses()} ${disabled ? '' : 'active:scale-95'} `}
      title={sportsbook ? `${sportsbook}` : undefined}
    >
      <div className="flex flex-col items-center leading-tight">
        {line !== undefined && (
          <div className="text-xs font-medium leading-none opacity-80">{formatLineDisplay()}</div>
        )}
        <div className="mt-0.5 text-xs font-semibold leading-none sm:text-sm">
          {formatOdds(odds)}
        </div>
      </div>
    </button>
  )
}
