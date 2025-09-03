'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Plus,
  X,
  BarChart3,
  LineChart,
  PieChart as PieChartIcon,
  Calendar as CalendarIcon,
  Settings,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { ChartConfig } from '@/lib/types/custom-charts'

interface CustomChartBuilderProps {
  onSaveChart: (config: ChartConfig) => void
  availableLeagues: string[]
  availableBetTypes: string[]
  availableSportsbooks: string[]
}

const X_AXIS_OPTIONS = [
  { value: 'placed_at', label: 'Time (Date Placed)', icon: CalendarIcon },
  { value: 'league', label: 'League', icon: Settings },
  { value: 'bet_type', label: 'Bet Type', icon: Settings },
  { value: 'sportsbook', label: 'Sportsbook', icon: Settings },
]

const Y_AXIS_OPTIONS = [
  { value: 'count', label: 'Count of Bets' },
  { value: 'profit', label: 'Total Profit' },
  { value: 'stake', label: 'Total Stake' },
  { value: 'win_rate', label: 'Win Rate (%)' },
  { value: 'roi', label: 'ROI (%)' },
]

const CHART_TYPE_OPTIONS = [
  { value: 'line', label: 'Line Chart', icon: LineChart },
  { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { value: 'pie', label: 'Pie Chart', icon: PieChartIcon },
]

const STATUS_OPTIONS = [
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'pending', label: 'Pending' },
  { value: 'void', label: 'Void' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function CustomChartBuilder({
  onSaveChart,
  availableLeagues,
  availableBetTypes,
  availableSportsbooks,
}: CustomChartBuilderProps) {
  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState<Partial<ChartConfig>>({
    chartType: 'bar',
    xAxis: 'league',
    yAxis: 'count',
    filters: {},
  })

  const generateChartTitle = () => {
    const yAxisLabel = Y_AXIS_OPTIONS.find(opt => opt.value === config.yAxis)?.label || 'Data'
    const xAxisLabel = X_AXIS_OPTIONS.find(opt => opt.value === config.xAxis)?.label || 'Category'
    return `${yAxisLabel} by ${xAxisLabel}`
  }

  const handleSave = () => {
    if (!config.chartType || !config.xAxis || !config.yAxis) return

    const chartConfig: ChartConfig = {
      id: `custom-${Date.now()}`,
      title: config.title || generateChartTitle(),
      chartType: config.chartType,
      xAxis: config.xAxis,
      yAxis: config.yAxis,
      filters: config.filters || {},
    }

    onSaveChart(chartConfig)
    setOpen(false)
    setConfig({
      chartType: 'bar',
      xAxis: 'league',
      yAxis: 'count',
      filters: {},
    })
  }

  const updateFilter = (filterKey: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [filterKey]: value,
      },
    }))
  }

  const removeFilter = (filterKey: string, value: string) => {
    setConfig(prev => {
      const currentFilter = prev.filters?.[filterKey as keyof typeof prev.filters] as string[]
      if (!currentFilter) return prev

      return {
        ...prev,
        filters: {
          ...prev.filters,
          [filterKey]: currentFilter.filter(item => item !== value),
        },
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
          <Plus className="mr-2 h-4 w-4" />
          Create Custom Chart
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Create Custom Chart</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Chart Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Chart Title (optional)</Label>
            <Input
              id="title"
              placeholder={generateChartTitle()}
              value={config.title || ''}
              onChange={e => setConfig(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          {/* Chart Type */}
          <div className="space-y-2">
            <Label>Chart Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {CHART_TYPE_OPTIONS.map(option => {
                const Icon = option.icon
                return (
                  <Button
                    key={option.value}
                    variant={config.chartType === option.value ? 'default' : 'outline'}
                    className="flex h-16 flex-col text-xs"
                    onClick={() => setConfig(prev => ({ ...prev, chartType: option.value as any }))}
                  >
                    <Icon className="mb-1 h-4 w-4" />
                    {option.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* X-Axis */}
          <div className="space-y-2">
            <Label>X-Axis (Categories)</Label>
            <Select
              value={config.xAxis ?? ''}
              onValueChange={value => setConfig(prev => ({ ...prev, xAxis: value as any }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select X-axis" />
              </SelectTrigger>
              <SelectContent>
                {X_AXIS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center space-x-2">
                      <option.icon className="h-4 w-4" />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Y-Axis */}
          <div className="space-y-2">
            <Label>Y-Axis (Values)</Label>
            <Select
              value={config.yAxis ?? ''}
              onValueChange={value => setConfig(prev => ({ ...prev, yAxis: value as any }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Y-axis" />
              </SelectTrigger>
              <SelectContent>
                {Y_AXIS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filters Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Label className="text-base font-semibold">Filters</Label>
              <Badge variant="secondary" className="text-xs">
                Optional
              </Badge>
            </div>

            {/* League Filter */}
            <div className="space-y-2">
              <Label className="text-sm">Leagues</Label>
              <Select
                onValueChange={value => {
                  const currentLeagues = config.filters?.leagues || []
                  if (!currentLeagues.includes(value)) {
                    updateFilter('leagues', [...currentLeagues, value])
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Add league filter..." />
                </SelectTrigger>
                <SelectContent>
                  {availableLeagues
                    .filter(league => !(config.filters?.leagues || []).includes(league))
                    .map(league => (
                      <SelectItem key={league} value={league}>
                        {league}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-1">
                {(config.filters?.leagues || []).map(league => (
                  <Badge key={league} variant="secondary" className="text-xs">
                    {league}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer"
                      onClick={() => removeFilter('leagues', league)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-sm">Bet Status</Label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map(status => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={status.value}
                      checked={(config.filters?.status || []).includes(status.value as any)}
                      onCheckedChange={checked => {
                        const currentStatus = config.filters?.status || []
                        if (checked) {
                          updateFilter('status', [...currentStatus, status.value])
                        } else {
                          updateFilter(
                            'status',
                            currentStatus.filter(s => s !== status.value)
                          )
                        }
                      }}
                    />
                    <Label htmlFor={status.value} className="cursor-pointer text-sm">
                      {status.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Bet Type Filter */}
            <div className="space-y-2">
              <Label className="text-sm">Bet Types</Label>
              <Select
                onValueChange={value => {
                  const currentBetTypes = config.filters?.bet_types || []
                  if (!currentBetTypes.includes(value)) {
                    updateFilter('bet_types', [...currentBetTypes, value])
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Add bet type filter..." />
                </SelectTrigger>
                <SelectContent>
                  {availableBetTypes
                    .filter(betType => !(config.filters?.bet_types || []).includes(betType))
                    .map(betType => (
                      <SelectItem key={betType} value={betType}>
                        {betType}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-1">
                {(config.filters?.bet_types || []).map(betType => (
                  <Badge key={betType} variant="secondary" className="text-xs">
                    {betType}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer"
                      onClick={() => removeFilter('bet_types', betType)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Sportsbook Filter */}
            <div className="space-y-2">
              <Label className="text-sm">Sportsbooks</Label>
              <Select
                onValueChange={value => {
                  const currentSportsbooks = config.filters?.sportsbooks || []
                  if (!currentSportsbooks.includes(value)) {
                    updateFilter('sportsbooks', [...currentSportsbooks, value])
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Add sportsbook filter..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSportsbooks
                    .filter(sportsbook => !(config.filters?.sportsbooks || []).includes(sportsbook))
                    .map(sportsbook => (
                      <SelectItem key={sportsbook} value={sportsbook}>
                        {sportsbook}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-1">
                {(config.filters?.sportsbooks || []).map(sportsbook => (
                  <Badge key={sportsbook} variant="secondary" className="text-xs">
                    {sportsbook}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer"
                      onClick={() => removeFilter('sportsbooks', sportsbook)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label className="text-sm">Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'justify-start text-left font-normal',
                        !config.filters?.date_range?.start && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {config.filters?.date_range?.start ? (
                        format(config.filters.date_range.start, 'PPP')
                      ) : (
                        <span>Start date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={config.filters?.date_range?.start || undefined}
                      onSelect={date =>
                        updateFilter('date_range', {
                          ...config.filters?.date_range,
                          start: date || null,
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'justify-start text-left font-normal',
                        !config.filters?.date_range?.end && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {config.filters?.date_range?.end ? (
                        format(config.filters.date_range.end, 'PPP')
                      ) : (
                        <span>End date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={config.filters?.date_range?.end || undefined}
                      onSelect={date =>
                        updateFilter('date_range', {
                          ...config.filters?.date_range,
                          end: date || null,
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 border-t pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!config.chartType || !config.xAxis || !config.yAxis}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Create Chart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
