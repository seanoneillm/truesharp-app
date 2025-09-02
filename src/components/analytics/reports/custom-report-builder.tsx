// src/components/analytics/reports/custom-report-builder.tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  BarChart3,
  Calendar,
  Eye,
  FileText,
  LineChart,
  PieChart,
  Play,
  Save,
  Settings,
  Table,
} from 'lucide-react'
import React, { useState } from 'react'

interface ReportWidget {
  id: string
  type: 'chart' | 'metric' | 'table' | 'text'
  title: string
  config: any
  position: { x: number; y: number; w: number; h: number }
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  widgets: ReportWidget[]
  filters: any
  dateRange: { start: Date; end: Date }
}

interface CustomReportBuilderProps {
  isPro: boolean
  onReportGenerate: (template: ReportTemplate) => void
  savedTemplates: ReportTemplate[]
  onSaveTemplate: (template: ReportTemplate) => void
}

export const CustomReportBuilder: React.FC<CustomReportBuilderProps> = ({
  isPro,
  onReportGenerate,
  savedTemplates,
  onSaveTemplate,
}) => {
  const [currentTemplate, setCurrentTemplate] = useState<ReportTemplate>({
    id: '',
    name: 'New Report',
    description: '',
    widgets: [],
    filters: {},
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    },
  })

  const [selectedWidget, setSelectedWidget] = useState<ReportWidget | null>(null)
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const widgetTypes = [
    {
      type: 'chart',
      name: 'Profit Chart',
      icon: LineChart,
      description: 'Show profit/loss over time',
      config: {
        chartType: 'line',
        dataSource: 'profits',
        timeframe: '30d',
      },
    },
    {
      type: 'chart',
      name: 'ROI by Sport',
      icon: BarChart3,
      description: 'Compare ROI across sports',
      config: {
        chartType: 'bar',
        dataSource: 'roi_by_sport',
        timeframe: '30d',
      },
    },
    {
      type: 'chart',
      name: 'Bet Distribution',
      icon: PieChart,
      description: 'Distribution of bet types',
      config: {
        chartType: 'pie',
        dataSource: 'bet_types',
        timeframe: '30d',
      },
    },
    {
      type: 'metric',
      name: 'Key Metrics',
      icon: BarChart3,
      description: 'Key performance indicators',
      config: {
        metrics: ['win_rate', 'roi', 'total_bets', 'profit'],
      },
    },
    {
      type: 'table',
      name: 'Recent Bets',
      icon: Table,
      description: 'Table of recent betting activity',
      config: {
        columns: ['date', 'sport', 'bet', 'odds', 'result', 'profit'],
        limit: 20,
      },
    },
    {
      type: 'table',
      name: 'Top Performers',
      icon: Table,
      description: 'Best performing bet categories',
      config: {
        columns: ['category', 'bets', 'win_rate', 'roi', 'profit'],
        sortBy: 'roi',
      },
    },
  ]

  if (!isPro) {
    return (
      <Card className="p-6">
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Custom Report Builder</h3>
          <p className="mb-4 text-muted-foreground">
            Create custom reports with drag-and-drop widgets and advanced analytics
          </p>
          <Button>Upgrade to Pro</Button>
        </div>
      </Card>
    )
  }

  const addWidget = (widgetType: any) => {
    const newWidget: ReportWidget = {
      id: `widget_${Date.now()}`,
      type: widgetType.type,
      title: widgetType.name,
      config: widgetType.config,
      position: {
        x: 0,
        y: currentTemplate.widgets.length * 2,
        w: widgetType.type === 'metric' ? 6 : 12,
        h: widgetType.type === 'metric' ? 2 : 4,
      },
    }

    setCurrentTemplate(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
    }))
    setShowWidgetLibrary(false)
  }

  const removeWidget = (widgetId: string) => {
    setCurrentTemplate(prev => ({
      ...prev,
      widgets: prev.widgets.filter(w => w.id !== widgetId),
    }))
  }

  const updateWidget = (widgetId: string, updates: Partial<ReportWidget>) => {
    setCurrentTemplate(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => (w.id === widgetId ? { ...w, ...updates } : w)),
    }))
  }

  const generateReport = () => {
    onReportGenerate(currentTemplate)
  }

  const saveTemplate = () => {
    const templateToSave = {
      ...currentTemplate,
      id: currentTemplate.id || `template_${Date.now()}`,
    }
    onSaveTemplate(templateToSave)
    setCurrentTemplate(templateToSave)
  }

  const loadTemplate = (template: ReportTemplate) => {
    setCurrentTemplate(template)
    setPreviewMode(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6" />
            <div>
              <Input
                value={currentTemplate.name}
                onChange={e => setCurrentTemplate(prev => ({ ...prev, name: e.target.value }))}
                className="h-auto border-none p-0 text-lg font-semibold"
                placeholder="Report Name"
              />
              <Input
                value={currentTemplate.description}
                onChange={e =>
                  setCurrentTemplate(prev => ({ ...prev, description: e.target.value }))
                }
                className="mt-1 h-auto border-none p-0 text-sm text-muted-foreground"
                placeholder="Report description"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
              <Eye className="mr-1 h-4 w-4" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button variant="outline" size="sm" onClick={saveTemplate}>
              <Save className="mr-1 h-4 w-4" />
              Save Template
            </Button>
            <Button size="sm" onClick={generateReport}>
              <Play className="mr-1 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Date Range:</span>
          </div>
          <Input
            type="date"
            value={currentTemplate.dateRange.start.toISOString().split('T')[0]}
            onChange={e =>
              setCurrentTemplate(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, start: new Date(e.target.value) },
              }))
            }
            className="w-auto"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            value={currentTemplate.dateRange.end.toISOString().split('T')[0]}
            onChange={e =>
              setCurrentTemplate(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, end: new Date(e.target.value) },
              }))
            }
            className="w-auto"
          />
        </div>
      </Card>

      {/* Saved Templates */}
      {savedTemplates.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 font-semibold">Saved Templates</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {savedTemplates.map(template => (
              <div
                key={template.id}
                className="cursor-pointer rounded-lg border p-4 hover:bg-muted/50"
                onClick={() => loadTemplate(template)}
              >
                <h4 className="mb-1 font-medium">{template.name}</h4>
                <p className="mb-2 text-sm text-muted-foreground">{template.description}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{template.widgets.length} widgets</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(template.dateRange.start).toLocaleDateString()} -{' '}
                    {new Date(template.dateRange.end).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Widget Library */}
        {!previewMode && (
          <Card className="col-span-3 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Widget Library</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWidgetLibrary(!showWidgetLibrary)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {widgetTypes.map(widget => {
                const Icon = widget.icon
                return (
                  <div
                    key={widget.name}
                    className="cursor-pointer rounded-lg border p-3 hover:bg-muted/50"
                    onClick={() => addWidget(widget)}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{widget.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{widget.description}</p>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Report Canvas */}
        <Card className={`${previewMode ? 'col-span-12' : 'col-span-9'} p-6`}>
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-semibold">Report Layout</h3>
            {currentTemplate.widgets.length > 0 && (
              <Badge variant="outline">{currentTemplate.widgets.length} widgets</Badge>
            )}
          </div>

          {currentTemplate.widgets.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h4 className="mb-2 font-medium">No widgets added</h4>
              <p className="text-sm text-muted-foreground">
                Add widgets from the library to start building your report
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentTemplate.widgets.map(widget => (
                <WidgetPreview
                  key={widget.id}
                  widget={widget}
                  isSelected={selectedWidget?.id === widget.id}
                  onSelect={() => setSelectedWidget(widget)}
                  onRemove={() => removeWidget(widget.id)}
                  onUpdate={updates => updateWidget(widget.id, updates)}
                  previewMode={previewMode}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Widget Settings */}
        {!previewMode && selectedWidget && (
          <Card className="col-span-12 p-6">
            <WidgetSettings
              widget={selectedWidget}
              onUpdate={updates => updateWidget(selectedWidget.id, updates)}
              onClose={() => setSelectedWidget(null)}
            />
          </Card>
        )}
      </div>
    </div>
  )
}

// Widget Preview Component
interface WidgetPreviewProps {
  widget: ReportWidget
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
  onUpdate: (updates: Partial<ReportWidget>) => void
  previewMode: boolean
}

const WidgetPreview: React.FC<WidgetPreviewProps> = ({
  widget,
  isSelected,
  onSelect,
  onRemove,
  onUpdate,
  previewMode,
}) => {
  const renderWidgetContent = () => {
    switch (widget.type) {
      case 'chart':
        return (
          <div className="flex h-64 items-center justify-center rounded bg-muted/20">
            <div className="text-center">
              <BarChart3 className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{widget.title}</p>
            </div>
          </div>
        )
      case 'metric':
        return (
          <div className="grid grid-cols-2 gap-4">
            {widget.config.metrics.map((metric: string) => (
              <div key={metric} className="text-center">
                <p className="text-2xl font-bold">--</p>
                <p className="text-sm capitalize text-muted-foreground">
                  {metric.replace('_', ' ')}
                </p>
              </div>
            ))}
          </div>
        )
      case 'table':
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-6 gap-2 border-b pb-2 text-sm font-medium">
              {widget.config.columns.slice(0, 6).map((col: string) => (
                <div key={col} className="capitalize">
                  {col}
                </div>
              ))}
            </div>
            {[1, 2, 3].map(row => (
              <div key={row} className="grid grid-cols-6 gap-2 text-sm text-muted-foreground">
                {widget.config.columns.slice(0, 6).map((col: string) => (
                  <div key={col}>--</div>
                ))}
              </div>
            ))}
          </div>
        )
      default:
        return (
          <div className="flex h-32 items-center justify-center rounded bg-muted/20">
            <p className="text-sm text-muted-foreground">Widget Preview</p>
          </div>
        )
    }
  }

  return (
    <div
      className={`cursor-pointer rounded-lg border p-4 transition-colors ${
        isSelected ? 'border-blue-500 bg-blue-50/50' : 'hover:bg-muted/50'
      } ${previewMode ? 'cursor-default' : ''}`}
      onClick={!previewMode ? onSelect : undefined}
    >
      <div className="mb-4 flex items-center justify-between">
        <Input
          value={widget.title}
          onChange={e => onUpdate({ title: e.target.value })}
          className="h-auto border-none p-0 font-medium"
          disabled={previewMode}
        />
        {!previewMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={e => {
              e.stopPropagation()
              onRemove()
            }}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </Button>
        )}
      </div>
      {renderWidgetContent()}
    </div>
  )
}

// Widget Settings Component
interface WidgetSettingsProps {
  widget: ReportWidget
  onUpdate: (updates: Partial<ReportWidget>) => void
  onClose: () => void
}

const WidgetSettings: React.FC<WidgetSettingsProps> = ({ widget, onUpdate, onClose }) => {
  const updateConfig = (key: string, value: any) => {
    onUpdate({
      config: {
        ...widget.config,
        [key]: value,
      },
    })
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Widget Settings: {widget.title}</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </div>

      <div className="space-y-4">
        {widget.type === 'chart' && (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium">Chart Type</label>
              <div className="flex gap-2">
                {['line', 'bar', 'pie', 'area'].map(type => (
                  <Button
                    key={type}
                    variant={widget.config.chartType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateConfig('chartType', type)}
                    className="capitalize"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Data Source</label>
              <select
                value={widget.config.dataSource}
                onChange={e => updateConfig('dataSource', e.target.value)}
                className="w-full rounded border px-3 py-2"
              >
                <option value="profits">Profit/Loss</option>
                <option value="roi_by_sport">ROI by Sport</option>
                <option value="bet_types">Bet Type Distribution</option>
                <option value="win_rate_trend">Win Rate Trend</option>
                <option value="clv_performance">CLV Performance</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Timeframe</label>
              <div className="flex gap-2">
                {['7d', '30d', '90d', '1y', 'all'].map(timeframe => (
                  <Button
                    key={timeframe}
                    variant={widget.config.timeframe === timeframe ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateConfig('timeframe', timeframe)}
                  >
                    {timeframe}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}

        {widget.type === 'metric' && (
          <div>
            <label className="mb-2 block text-sm font-medium">Metrics to Display</label>
            <div className="space-y-2">
              {[
                'win_rate',
                'roi',
                'total_bets',
                'profit',
                'avg_odds',
                'best_sport',
                'current_streak',
                'clv_average',
              ].map(metric => (
                <label key={metric} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={widget.config.metrics.includes(metric)}
                    onChange={e => {
                      if (e.target.checked) {
                        updateConfig('metrics', [...widget.config.metrics, metric])
                      } else {
                        updateConfig(
                          'metrics',
                          widget.config.metrics.filter((m: string) => m !== metric)
                        )
                      }
                    }}
                  />
                  <span className="text-sm capitalize">{metric.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {widget.type === 'table' && (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium">Columns</label>
              <div className="space-y-2">
                {[
                  'date',
                  'sport',
                  'bet',
                  'odds',
                  'stake',
                  'result',
                  'profit',
                  'clv',
                  'sportsbook',
                  'bet_type',
                ].map(column => (
                  <label key={column} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={widget.config.columns.includes(column)}
                      onChange={e => {
                        if (e.target.checked) {
                          updateConfig('columns', [...widget.config.columns, column])
                        } else {
                          updateConfig(
                            'columns',
                            widget.config.columns.filter((c: string) => c !== column)
                          )
                        }
                      }}
                    />
                    <span className="text-sm capitalize">{column.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Row Limit</label>
              <Input
                type="number"
                value={widget.config.limit}
                onChange={e => updateConfig('limit', Number(e.target.value))}
                min="1"
                max="100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Sort By</label>
              <select
                value={widget.config.sortBy}
                onChange={e => updateConfig('sortBy', e.target.value)}
                className="w-full rounded border px-3 py-2"
              >
                {widget.config.columns.map((column: string) => (
                  <option key={column} value={column}>
                    {column.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
