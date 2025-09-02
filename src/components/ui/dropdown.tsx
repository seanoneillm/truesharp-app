import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, Check } from 'lucide-react'

interface DropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  className?: string
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'bottom' | 'left' | 'right'
}

const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  children,
  className,
  align = 'start',
  side = 'bottom',
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 transform -translate-x-1/2',
    end: 'right-0',
  }

  const sideClasses = {
    top: 'bottom-full mb-1',
    bottom: 'top-full mt-1',
    left: 'right-full mr-1',
    right: 'left-full ml-1',
  }

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 min-w-[200px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
            alignmentClasses[align],
            sideClasses[side],
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

const DropdownItem: React.FC<{
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  icon?: React.ReactNode
}> = ({ children, onClick, disabled, className, icon }) => {
  return (
    <div
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
        disabled
          ? 'pointer-events-none opacity-50'
          : 'cursor-pointer hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        className
      )}
      onClick={disabled ? undefined : onClick}
    >
      {icon && <div className="mr-2 h-4 w-4">{icon}</div>}
      {children}
    </div>
  )
}

const DropdownSeparator: React.FC<{ className?: string }> = ({ className }) => {
  return <div className={cn('-mx-1 my-1 h-px bg-muted', className)} />
}

const DropdownLabel: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  return <div className={cn('px-2 py-1.5 text-sm font-semibold', className)}>{children}</div>
}

// Select Dropdown Component
export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  options: SelectOption[]
  className?: string
  disabled?: boolean
}

const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  placeholder = 'Select an option...',
  options,
  className,
  disabled,
}) => {
  const selectedOption = options.find(option => option.value === value)

  const trigger = (
    <button
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      disabled={disabled}
    >
      <span>{selectedOption ? selectedOption.label : placeholder}</span>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )

  return (
    <Dropdown trigger={trigger}>
      {options.map(option => (
        <DropdownItem
          key={option.value}
          onClick={() => onValueChange?.(option.value)}
          disabled={option.disabled}
          className="flex items-center justify-between"
        >
          {option.label}
          {value === option.value && <Check className="h-4 w-4" />}
        </DropdownItem>
      ))}
    </Dropdown>
  )
}

// User Menu Dropdown
export const UserMenu: React.FC<{
  user: {
    name: string
    email: string
    avatar?: string
  }
  onProfileClick?: () => void
  onSettingsClick?: () => void
  onLogoutClick?: () => void
}> = ({ user, onProfileClick, onSettingsClick, onLogoutClick }) => {
  const trigger = (
    <button className="flex items-center space-x-2 rounded-md p-2 hover:bg-accent">
      <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full" />
        ) : (
          user.name.charAt(0).toUpperCase()
        )}
      </div>
      <div className="hidden text-left lg:block">
        <div className="text-sm font-medium">{user.name}</div>
        <div className="text-xs text-muted-foreground">{user.email}</div>
      </div>
      <ChevronDown className="hidden h-4 w-4 lg:block" />
    </button>
  )

  return (
    <Dropdown trigger={trigger} align="end">
      <DropdownLabel>My Account</DropdownLabel>
      <DropdownSeparator />
      <DropdownItem onClick={onProfileClick}>Profile</DropdownItem>
      <DropdownItem onClick={onSettingsClick}>Settings</DropdownItem>
      <DropdownSeparator />
      <DropdownItem onClick={onLogoutClick}>Log out</DropdownItem>
    </Dropdown>
  )
}

export { Dropdown, DropdownItem, DropdownSeparator, DropdownLabel, Select }
