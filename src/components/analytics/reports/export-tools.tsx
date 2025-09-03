import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Clock, Download, FileSpreadsheet, FileText, Image, Mail, Share2 } from 'lucide-react'
import React, { useState } from 'react'

interface ExportToolsProps {
  isPro: boolean
  reportData: any
  onExport: (format: string, options: any) => void
}

export const ExportTools: React.FC<ExportToolsProps> = ({ isPro, reportData: _reportData, onExport }) => {
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf')
  const [exportOptions, setExportOptions] = useState({
    includeCharts: true,
    includeRawData: false,
    includeFilters: true,
    includeTimestamp: true,
    pageOrientation: 'portrait',
    emailRecipients: '',
    scheduleFrequency: 'none',
  })

  const exportFormats = [
    {
      id: 'pdf',
      name: 'PDF Report',
      icon: FileText,
      description: 'Professional PDF with charts and analysis',
      pro: false,
    },
    {
      id: 'excel',
      name: 'Excel Workbook',
      icon: FileSpreadsheet,
      description: 'Spreadsheet with data and charts',
      pro: true,
    },
    {
      id: 'csv',
      name: 'CSV Data',
      icon: FileSpreadsheet,
      description: 'Raw data export for analysis',
      pro: false,
    },
    {
      id: 'png',
      name: 'Image Export',
      icon: Image,
      description: 'High-resolution image of report',
      pro: true,
    },
  ]

  const scheduleOptions = [
    { value: 'none', label: 'One-time export' },
    { value: 'daily', label: 'Daily', pro: true },
    { value: 'weekly', label: 'Weekly', pro: true },
    { value: 'monthly', label: 'Monthly', pro: true },
  ]

  if (!isPro && ['excel', 'png'].includes(selectedFormat)) {
    return (
      <Card className="p-6">
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Download className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Premium Export Features</h3>
          <p className="mb-4 text-muted-foreground">
            Excel and image exports require Pro subscription
          </p>
          <Button>Upgrade to Pro</Button>
        </div>
      </Card>
    )
  }

  const handleExport = () => {
    onExport(selectedFormat, exportOptions)
  }

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Download className="h-6 w-6" />
        <h3 className="text-lg font-semibold">Export & Share</h3>
      </div>

      {/* Export Format Selection */}
      <div className="mb-6 space-y-4">
        <h4 className="font-medium">Export Format</h4>
        <div className="grid grid-cols-2 gap-3">
          {exportFormats.map(format => {
            const Icon = format.icon
            const isDisabled = format.pro && !isPro
            return (
              <div
                key={format.id}
                className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                  selectedFormat === format.id
                    ? 'border-blue-500 bg-blue-50/50'
                    : isDisabled
                      ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
                      : 'hover:bg-muted/50'
                }`}
                onClick={() => !isDisabled && setSelectedFormat(format.id)}
              >
                <div className="mb-1 flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{format.name}</span>
                  {format.pro && !isPro && (
                    <Badge variant="outline" className="text-xs">
                      Pro
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{format.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      <Separator className="my-6" />

      {/* Export Options */}
      <div className="mb-6 space-y-4">
        <h4 className="font-medium">Export Options</h4>

        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exportOptions.includeCharts}
              onChange={e =>
                setExportOptions(prev => ({
                  ...prev,
                  includeCharts: e.target.checked,
                }))
              }
            />
            <span className="text-sm">Include charts and visualizations</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exportOptions.includeRawData}
              onChange={e =>
                setExportOptions(prev => ({
                  ...prev,
                  includeRawData: e.target.checked,
                }))
              }
              disabled={!isPro}
            />
            <span className="text-sm">Include raw data tables</span>
            {!isPro && (
              <Badge variant="outline" className="text-xs">
                Pro
              </Badge>
            )}
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exportOptions.includeFilters}
              onChange={e =>
                setExportOptions(prev => ({
                  ...prev,
                  includeFilters: e.target.checked,
                }))
              }
            />
            <span className="text-sm">Include applied filters</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exportOptions.includeTimestamp}
              onChange={e =>
                setExportOptions(prev => ({
                  ...prev,
                  includeTimestamp: e.target.checked,
                }))
              }
            />
            <span className="text-sm">Include generation timestamp</span>
          </label>
        </div>

        {selectedFormat === 'pdf' && (
          <div>
            <label className="mb-2 block text-sm font-medium">Page Orientation</label>
            <div className="flex gap-2">
              <Button
                variant={exportOptions.pageOrientation === 'portrait' ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setExportOptions(prev => ({
                    ...prev,
                    pageOrientation: 'portrait',
                  }))
                }
              >
                Portrait
              </Button>
              <Button
                variant={exportOptions.pageOrientation === 'landscape' ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setExportOptions(prev => ({
                    ...prev,
                    pageOrientation: 'landscape',
                  }))
                }
              >
                Landscape
              </Button>
            </div>
          </div>
        )}
      </div>

      <Separator className="my-6" />

      {/* Sharing Options */}
      <div className="mb-6 space-y-4">
        <h4 className="flex items-center gap-2 font-medium">
          <Share2 className="h-4 w-4" />
          Sharing Options
        </h4>

        <div>
          <label className="mb-2 block text-sm font-medium">Email Recipients</label>
          <input
            type="email"
            placeholder="Enter email addresses (comma separated)"
            value={exportOptions.emailRecipients}
            onChange={e =>
              setExportOptions(prev => ({
                ...prev,
                emailRecipients: e.target.value,
              }))
            }
            className="w-full rounded border px-3 py-2"
            disabled={!isPro}
          />
          {!isPro && (
            <p className="mt-1 text-xs text-muted-foreground">Email sharing requires Pro</p>
          )}
        </div>
      </div>

      <Separator className="my-6" />

      {/* Scheduling */}
      <div className="mb-6 space-y-4">
        <h4 className="flex items-center gap-2 font-medium">
          <Clock className="h-4 w-4" />
          Schedule Reports
        </h4>

        <div>
          <label className="mb-2 block text-sm font-medium">Frequency</label>
          <select
            value={exportOptions.scheduleFrequency}
            onChange={e =>
              setExportOptions(prev => ({
                ...prev,
                scheduleFrequency: e.target.value,
              }))
            }
            className="w-full rounded border px-3 py-2"
            disabled={!isPro && exportOptions.scheduleFrequency !== 'none'}
          >
            {scheduleOptions.map(option => (
              <option key={option.value} value={option.value} disabled={option.pro && !isPro}>
                {option.label} {option.pro && !isPro ? '(Pro)' : ''}
              </option>
            ))}
          </select>
          {exportOptions.scheduleFrequency !== 'none' && !isPro && (
            <p className="mt-1 text-xs text-muted-foreground">
              Scheduled reports require Pro subscription
            </p>
          )}
        </div>
      </div>

      {/* Export Button */}
      <div className="flex gap-3">
        <Button onClick={handleExport} className="flex-1">
          <Download className="mr-2 h-4 w-4" />
          Export {exportFormats.find(f => f.id === selectedFormat)?.name}
        </Button>

        {exportOptions.emailRecipients && isPro && (
          <Button
            variant="outline"
            onClick={() => onExport(selectedFormat, { ...exportOptions, sendEmail: true })}
          >
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>
        )}
      </div>

      {/* Export History */}
      <div className="mt-6 border-t pt-6">
        <h4 className="mb-3 font-medium">Recent Exports</h4>
        <div className="space-y-2">
          {[1, 2, 3].map(item => (
            <div key={item} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>Performance Report - {new Date().toLocaleDateString()}</span>
                <Badge variant="outline" className="text-xs">
                  PDF
                </Badge>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
