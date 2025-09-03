import { cn } from '@/lib/utils'
import * as React from 'react'

interface ToggleProps {
  checked?: boolean | undefined
  onCheckedChange?: ((checked: boolean) => void) | undefined
  disabled?: boolean | undefined
  size?: 'sm' | 'default' | 'lg' | undefined
  className?: string | undefined
  id?: string | undefined
  'aria-label'?: string | undefined
  'aria-describedby'?: string | undefined
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  (
    { checked = false, onCheckedChange, disabled, size = 'default', className, id, ...props },
    ref
  ) => {
    const sizes = {
      sm: {
        switch: 'h-4 w-7',
        thumb: 'h-3 w-3',
        translate: 'translate-x-3',
      },
      default: {
        switch: 'h-6 w-11',
        thumb: 'h-5 w-5',
        translate: 'translate-x-5',
      },
      lg: {
        switch: 'h-7 w-12',
        thumb: 'h-6 w-6',
        translate: 'translate-x-5',
      },
    }

    const sizeClasses = sizes[size]

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        id={id}
        disabled={disabled}
        className={cn(
          'relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
          checked ? 'bg-primary' : 'bg-input',
          disabled && 'cursor-not-allowed opacity-50',
          sizeClasses.switch,
          className
        )}
        onClick={() => !disabled && onCheckedChange?.(!checked)}
        {...props}
      >
        <span
          className={cn(
            'pointer-events-none inline-block rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out',
            checked ? sizeClasses.translate : 'translate-x-0',
            sizeClasses.thumb
          )}
        />
      </button>
    )
  }
)
Toggle.displayName = 'Toggle'

// Labeled Toggle Component
interface LabeledToggleProps extends ToggleProps {
  label?: string
  description?: string
  labelPosition?: 'left' | 'right'
}

const LabeledToggle: React.FC<LabeledToggleProps> = ({
  label,
  description,
  labelPosition = 'right',
  className,
  id,
  ...toggleProps
}) => {
  const toggleId = id || React.useId()
  const descriptionId = description ? `${toggleId}-description` : undefined

  const toggleElement = <Toggle id={toggleId} aria-describedby={descriptionId} {...toggleProps} />

  const labelElement = (
    <div className="flex flex-col">
      {label && (
        <label
          htmlFor={toggleId}
          className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      )}
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  )

  return (
    <div className={cn('flex items-center space-x-3', className)}>
      {labelPosition === 'left' && labelElement}
      {toggleElement}
      {labelPosition === 'right' && labelElement}
    </div>
  )
}

// Toggle Group Component
interface ToggleOption {
  value: string
  label: string
  disabled?: boolean
}

interface ToggleGroupProps {
  type?: 'single' | 'multiple'
  value?: string | string[]
  onValueChange?: (value: string | string[]) => void
  options: ToggleOption[]
  className?: string
  size?: 'sm' | 'default' | 'lg'
}

const ToggleGroup: React.FC<ToggleGroupProps> = ({
  type = 'single',
  value,
  onValueChange,
  options,
  className,
  size = 'default',
}) => {
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    default: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  const handleToggle = (optionValue: string) => {
    if (type === 'single') {
      onValueChange?.(value === optionValue ? '' : optionValue)
    } else {
      const currentValues = Array.isArray(value) ? value : []
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue]
      onValueChange?.(newValues)
    }
  }

  const isSelected = (optionValue: string) => {
    if (type === 'single') {
      return value === optionValue
    }
    return Array.isArray(value) && value.includes(optionValue)
  }

  return (
    <div className={cn('inline-flex rounded-md shadow-sm', className)}>
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          disabled={option.disabled}
          onClick={() => handleToggle(option.value)}
          className={cn(
            'relative inline-flex items-center border font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            sizes[size],
            index === 0 && 'rounded-l-md',
            index === options.length - 1 && 'rounded-r-md',
            index !== 0 && '-ml-px',
            isSelected(option.value)
              ? 'bg-primary text-primary-foreground border-primary z-10'
              : 'border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export { LabeledToggle, Toggle, ToggleGroup }
