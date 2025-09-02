import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Activity, AlertTriangle, TrendingDown, TrendingUp, Zap } from 'lucide-react'
import React, { useState } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface LineMovementData {
  timestamp: string
  spread: number
  total: number
  moneyline: number
  volume: number
  publicPercent: number
  steamMove: boolean
  reverseLineMovement: boolean
}

interface LineMovementChartProps {
  data: LineMovementData[]
  gameInfo: {
    homeTeam: string
    awayTeam: string
    gameTime: string
    sport: string
  }
  userBetTime?: string
  isPro: boolean
}

export const LineMovementChart: React.FC<LineMovementChartProps> = ({
  data,
  gameInfo,
  userBetTime,
  isPro,
}) => {
  const [selectedMarket, setSelectedMarket] = useState<'spread' | 'total' | 'moneyline'>('spread')
  const [showVolume, setShowVolume] = useState(false)
  const [showPublic, setShowPublic] = useState(false)

  if (!isPro) {
    return (
      <Card className="p-6">
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Line Movement Tracking</h3>
          <p className="mb-4 text-muted-foreground">
            Track real-time line movements and identify sharp action with Pro
          </p>
          <Button>Upgrade to Pro</Button>
        </div>
      </Card>
    )
  }

  const markets = [
    { id: 'spread', label: 'Spread', color: '#2563eb' },
    { id: 'total', label: 'Total', color: '#10b981' },
    { id: 'moneyline', label: 'Moneyline', color: '#8b5cf6' },
  ]

  const openingLine = data[0]?.[selectedMarket] || 0
  const closingLine = data[data.length - 1]?.[selectedMarket] || 0
  const lineMovement = closingLine - openingLine
  const userBetLine = userBetTime
    ? data.find(d => new Date(d.timestamp) <= new Date(userBetTime))?.[selectedMarket]
    : null

  const steamMoves = data.filter(d => d.steamMove)
  const reverseMoves = data.filter(d => d.reverseLineMovement)

  const formatMarketValue = (value: number, market: string) => {
    if (market === 'spread') return value > 0 ? `+${value}` : value.toString()
    if (market === 'total') return `O/U ${value}`
    if (market === 'moneyline') return value > 0 ? `+${value}` : value.toString()
    return value.toString()
  }

  const getMovementColor = (movement: number) => {
    return movement > 0 ? 'text-green-600' : movement < 0 ? 'text-red-600' : 'text-gray-600'
  }

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="mb-1 text-lg font-semibold">Line Movement</h3>
          <p className="text-sm text-muted-foreground">
            {gameInfo.awayTeam} @ {gameInfo.homeTeam} •{' '}
            {new Date(gameInfo.gameTime).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {markets.map(market => (
            <Button
              key={market.id}
              variant={selectedMarket === market.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMarket(market.id as any)}
            >
              {market.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Movement Summary */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Opening</p>
          <p className="font-semibold">{formatMarketValue(openingLine, selectedMarket)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Closing</p>
          <p className="font-semibold">{formatMarketValue(closingLine, selectedMarket)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Movement</p>
          <p
            className={`flex items-center justify-center gap-1 font-semibold ${getMovementColor(lineMovement)}`}
          >
            {lineMovement > 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : lineMovement < 0 ? (
              <TrendingDown className="h-4 w-4" />
            ) : null}
            {Math.abs(lineMovement).toFixed(1)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Your Line</p>
          <p className="font-semibold">
            {userBetLine ? formatMarketValue(userBetLine, selectedMarket) : 'N/A'}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {(steamMoves.length > 0 || reverseMoves.length > 0) && (
        <div className="mb-6 space-y-2">
          {steamMoves.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 p-2">
              <Zap className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                {steamMoves.length} Steam Move{steamMoves.length > 1 ? 's' : ''} Detected
              </span>
            </div>
          )}
          {reverseMoves.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                {reverseMoves.length} Reverse Line Movement{reverseMoves.length > 1 ? 's' : ''}{' '}
                Detected
              </span>
            </div>
          )}
        </div>
      )}

      {/* Chart Controls */}
      <div className="mb-4 flex items-center gap-2">
        <Button
          variant={showVolume ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowVolume(!showVolume)}
        >
          Volume
        </Button>
        <Button
          variant={showPublic ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowPublic(!showPublic)}
        >
          Public %
        </Button>
      </div>

      {/* Line Movement Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="timestamp"
              tick={{ fontSize: 12 }}
              tickFormatter={value => new Date(value).toLocaleTimeString()}
            />
            <YAxis
              yAxisId="line"
              tick={{ fontSize: 12 }}
              tickFormatter={value => formatMarketValue(value, selectedMarket)}
            />
            {(showVolume || showPublic) && (
              <YAxis
                yAxisId="secondary"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickFormatter={value => (showPublic ? `${value}%` : value.toString())}
              />
            )}

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0]?.payload
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-lg">
                      <p className="mb-2 font-medium">{new Date(label).toLocaleTimeString()}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                          <span>
                            {selectedMarket.charAt(0).toUpperCase() + selectedMarket.slice(1)}
                          </span>
                          <span className="font-medium">
                            {formatMarketValue(data[selectedMarket], selectedMarket)}
                          </span>
                        </div>
                        {showVolume && (
                          <div className="flex justify-between gap-4">
                            <span>Volume</span>
                            <span className="font-medium">{data.volume}</span>
                          </div>
                        )}
                        {showPublic && (
                          <div className="flex justify-between gap-4">
                            <span>Public %</span>
                            <span className="font-medium">{data.publicPercent}%</span>
                          </div>
                        )}
                        {data.steamMove && (
                          <div className="text-sm font-medium text-orange-600">⚡ Steam Move</div>
                        )}
                        {data.reverseLineMovement && (
                          <div className="text-sm font-medium text-red-600">
                            ⚠ Reverse Movement
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend />

            {/* Opening line reference */}
            <ReferenceLine
              yAxisId="line"
              y={openingLine}
              stroke="#666"
              strokeDasharray="2 2"
              label="Opening"
            />

            {/* User bet time reference */}
            {userBetTime && (
              <ReferenceLine
                x={userBetTime}
                stroke="#3b82f6"
                strokeDasharray="4 4"
                label="Your Bet"
              />
            )}

            {/* Main line */}
            <Line
              yAxisId="line"
              type="monotone"
              dataKey={selectedMarket}
              stroke={markets.find(m => m.id === selectedMarket)?.color}
              strokeWidth={2}
              dot={props => {
                const data = props.payload
                if (data.steamMove) {
                  return <circle {...props} fill="#f59e0b" stroke="#f59e0b" strokeWidth={2} r={4} />
                }
                if (data.reverseLineMovement) {
                  return <circle {...props} fill="#ef4444" stroke="#ef4444" strokeWidth={2} r={4} />
                }
                return <circle {...props} r={2} />
              }}
              activeDot={{ r: 5 }}
            />

            {/* Volume bars */}
            {showVolume && (
              <Area
                yAxisId="secondary"
                type="monotone"
                dataKey="volume"
                fill="#6366f1"
                fillOpacity={0.2}
                stroke="none"
              />
            )}

            {/* Public percentage line */}
            {showPublic && (
              <Line
                yAxisId="secondary"
                type="monotone"
                dataKey="publicPercent"
                stroke="#f59e0b"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Movement Analysis */}
      <div className="mt-6 border-t pt-6">
        <h4 className="mb-3 font-medium">Movement Analysis</h4>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Moves</p>
            <p className="font-semibold">{data.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Steam Moves</p>
            <p className="font-semibold text-orange-600">{steamMoves.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Reverse Moves</p>
            <p className="font-semibold text-red-600">{reverseMoves.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Final Public</p>
            <p className="font-semibold">{data[data.length - 1]?.publicPercent || 0}%</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
