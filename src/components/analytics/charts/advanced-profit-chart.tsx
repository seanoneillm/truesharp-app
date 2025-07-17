// src/components/analytics/charts/advanced-profit-chart.tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TrendingDown, TrendingUp } from 'lucide-react';
import React, { useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface ProfitChartProps {
  data: Array<{
    date: string;
    cumulativeProfit: number;
    dailyProfit: number;
    roi: number;
    units: number;
    bets: number;
  }>;
  isPro: boolean;
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

export const AdvancedProfitChart: React.FC<ProfitChartProps> = ({
  data,
  isPro,
  timeframe,
  onTimeframeChange
}) => {
  const [viewType, setViewType] = useState<'cumulative' | 'daily'>('cumulative');
  const [showAnnotations, setShowAnnotations] = useState(true);

  const timeframes = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '3 Months' },
    { value: '1y', label: '1 Year', pro: true },
    { value: 'all', label: 'All Time', pro: true }
  ];

  const formatTooltip = (value: number, name: string) => {
    if (name === 'cumulativeProfit') return [`$${value.toFixed(2)}`, 'Cumulative Profit'];
    if (name === 'dailyProfit') return [`$${value.toFixed(2)}`, 'Daily Profit'];
    if (name === 'roi') return [`${value.toFixed(2)}%`, 'ROI'];
    return [value, name];
  };

  const currentProfit = data[data.length - 1]?.cumulativeProfit || 0;
  const isPositive = currentProfit >= 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Profit Performance</h3>
          <Badge variant={isPositive ? "default" : "destructive"} className="flex items-center gap-1">
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            ${Math.abs(currentProfit).toFixed(2)}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg">
            <Button
              variant={viewType === 'cumulative' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewType('cumulative')}
              className="rounded-r-none"
            >
              Cumulative
            </Button>
            <Button
              variant={viewType === 'daily' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewType('daily')}
              className="rounded-l-none"
            >
              Daily
            </Button>
          </div>
          
          <div className="flex border rounded-lg">
            {timeframes.map((tf) => (
              <Button
                key={tf.value}
                variant={timeframe === tf.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onTimeframeChange(tf.value)}
                disabled={tf.pro && !isPro}
                className={`${tf === timeframes[0] ? 'rounded-r-none' : tf === timeframes[timeframes.length - 1] ? 'rounded-l-none' : 'rounded-none'}`}
              >
                {tf.label}
                {tf.pro && !isPro && <span className="ml-1 text-xs">Pro</span>}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-medium mb-2">{new Date(label).toLocaleDateString()}</p>
                      {payload.map((pld, index) => (
                        <div key={index} className="flex justify-between gap-4">
                          <span style={{ color: pld.color }}>{formatTooltip(pld.value as number, pld.dataKey as string)[1]}</span>
                          <span className="font-medium">{formatTooltip(pld.value as number, pld.dataKey as string)[0]}</span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
            
            {viewType === 'cumulative' ? (
              <Line
                type="monotone"
                dataKey="cumulativeProfit"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
              />
            ) : (
              <Line
                type="monotone"
                dataKey="dailyProfit"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {isPro && (
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Best Day</p>
              <p className="font-semibold text-green-600">
                ${Math.max(...data.map(d => d.dailyProfit)).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Worst Day</p>
              <p className="font-semibold text-red-600">
                ${Math.min(...data.map(d => d.dailyProfit)).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Avg Daily</p>
              <p className="font-semibold">
                ${(data.reduce((sum, d) => sum + d.dailyProfit, 0) / data.length).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Volatility</p>
              <p className="font-semibold">
                ${Math.sqrt(data.reduce((sum, d) => sum + Math.pow(d.dailyProfit, 2), 0) / data.length).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};