import * as React from 'react'
import { cn } from '@/lib/utils'

interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

interface TabsContextType {
  value?: string
  onValueChange?: (value: string) => void
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined)

const useTabsContext = () => {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider')
  }
  return context
}

const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className,
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '')

  const value = controlledValue !== undefined ? controlledValue : internalValue

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (controlledValue === undefined) {
        setInternalValue(newValue)
      }
      onValueChange?.(newValue)
    },
    [controlledValue, onValueChange]
  )

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

const TabsList: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
        className
      )}
    >
      {children}
    </div>
  )
}

const TabsTrigger: React.FC<{
  value: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}> = ({ value: triggerValue, children, className, disabled }) => {
  const { value, onValueChange } = useTabsContext()
  const isActive = value === triggerValue

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isActive ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50',
        className
      )}
      onClick={() => onValueChange?.(triggerValue)}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  )
}

const TabsContent: React.FC<{
  value: string
  children: React.ReactNode
  className?: string
}> = ({ value: contentValue, children, className }) => {
  const { value } = useTabsContext()

  if (value !== contentValue) {
    return null
  }

  return (
    <div
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
    >
      {children}
    </div>
  )
}

// Navigation Tabs (different style)
const NavTabs: React.FC<{
  tabs: Array<{
    id: string
    label: string
    count?: number
    disabled?: boolean
  }>
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}> = ({ tabs, activeTab, onTabChange, className }) => {
  return (
    <div className={cn('border-b border-gray-200', className)}>
      <nav className="-mb-px flex space-x-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            className={cn(
              'whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
              tab.disabled && 'cursor-not-allowed opacity-50'
            )}
            disabled={tab.disabled}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                  activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-900'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}

// Pill Tabs (another style)
const PillTabs: React.FC<{
  tabs: Array<{
    id: string
    label: string
    icon?: React.ReactNode
  }>
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}> = ({ tabs, activeTab, onTabChange, className }) => {
  return (
    <div className={cn('flex space-x-1 rounded-lg bg-gray-100 p-1', className)}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all',
            activeTab === tab.id
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
          )}
        >
          {tab.icon && <span className="mr-2 h-4 w-4">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, NavTabs, PillTabs }
