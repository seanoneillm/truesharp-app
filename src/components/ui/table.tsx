import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronUp, ChevronDown, MoreHorizontal } from 'lucide-react'

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
)
Table.displayName = 'Table'

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
))
TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
))
TableBody.displayName = 'TableBody'

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', className)}
    {...props}
  />
))
TableFooter.displayName = 'TableFooter'

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & {
    clickable?: boolean
  }
>(({ className, clickable, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
      clickable && 'cursor-pointer',
      className
    )}
    {...props}
  />
))
TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    sortable?: boolean
    sortDirection?: 'asc' | 'desc' | null
    onSort?: () => void
  }
>(({ className, sortable, sortDirection, onSort, children, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
      sortable && 'cursor-pointer select-none hover:bg-muted/50',
      className
    )}
    onClick={sortable ? onSort : undefined}
    {...props}
  >
    <div className="flex items-center space-x-2">
      <span>{children}</span>
      {sortable && (
        <div className="flex flex-col">
          <ChevronUp
            className={cn(
              'h-3 w-3',
              sortDirection === 'asc' ? 'text-foreground' : 'text-muted-foreground'
            )}
          />
          <ChevronDown
            className={cn(
              '-mt-1 h-3 w-3',
              sortDirection === 'desc' ? 'text-foreground' : 'text-muted-foreground'
            )}
          />
        </div>
      )}
    </div>
  </th>
))
TableHead.displayName = 'TableHead'

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
    {...props}
  />
))
TableCell.displayName = 'TableCell'

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn('mt-4 text-sm text-muted-foreground', className)} {...props} />
))
TableCaption.displayName = 'TableCaption'

// Data Table with built-in sorting and pagination
interface Column<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  className?: string
  emptyMessage?: string
  onRowClick?: (row: T) => void
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  className,
  emptyMessage = 'No data available',
  onRowClick,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = React.useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')

  const handleSort = (column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn]
      const bValue = b[sortColumn]

      if (aValue === bValue) return 0

      const comparison = aValue < bValue ? -1 : 1
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, sortColumn, sortDirection])

  if (data.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {columns.map(column => (
            <TableHead
              key={String(column.key)}
              sortable={column.sortable}
              sortDirection={sortColumn === column.key ? sortDirection : null}
              onSort={() => column.sortable && handleSort(column.key)}
              className={column.className}
            >
              {column.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((row, index) => (
          <TableRow key={index} clickable={!!onRowClick} onClick={() => onRowClick?.(row)}>
            {columns.map(column => (
              <TableCell key={String(column.key)} className={column.className}>
                {column.render
                  ? column.render(row[column.key], row)
                  : String(row[column.key] || '')}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// Action Menu for table rows
export const TableActions: React.FC<{
  actions: Array<{
    label: string
    onClick: () => void
    icon?: React.ReactNode
    variant?: 'default' | 'destructive'
  }>
}> = ({ actions }) => {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className="relative">
      <button
        onClick={e => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="rounded-md p-2 hover:bg-muted"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-8 z-50 min-w-[150px] rounded-md border bg-popover p-1 shadow-lg">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={e => {
                e.stopPropagation()
                action.onClick()
                setIsOpen(false)
              }}
              className={cn(
                'flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent',
                action.variant === 'destructive' && 'text-destructive hover:bg-destructive/10'
              )}
            >
              {action.icon && <span className="mr-2 h-4 w-4">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }
