import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BarChart3, Info } from 'lucide-react';
import React, { useState } from 'react';

interface CorrelationData {
  metric1: string;
  metric2: string;
  correlation: number;
  significance: number;
  sampleSize: number;
}

interface CorrelationMatrixProps {
  data: CorrelationData[];
  isPro: boolean;
  selectedMetrics: string[];
  onMetricsChange: (metrics: string[]) => void;
}

export const CorrelationMatrix: React.FC<CorrelationMatrixProps> = ({
  data,
  isPro,
  selectedMetrics,
  onMetricsChange
}) => {
  const [selectedCell, setSelectedCell] = useState<CorrelationData | null>(null);
  const [showSignificance, setShowSignificance] = useState(false);

  if (!isPro) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Correlation Analysis</h3>
          <p className="text-muted-foreground mb-4">
            Discover relationships between betting variables with Pro
          </p>
          <Button>Upgrade to Pro</Button>
        </div>
      </Card>
    );
  }

  const availableMetrics = [
    'Odds', 'Stake Size', 'Win Rate', 'ROI', 'CLV', 'Line Movement',
    'Days of Week', 'Time of Day', 'Weather', 'Rest Days', 'Public %'
  ];

  const getCorrelation = (metric1: string, metric2: string) => {
    const correlation = data.find(d => 
      (d.metric1 === metric1 && d.metric2 === metric2) ||
      (d.metric1 === metric2 && d.metric2 === metric1)
    );
    return correlation?.correlation || 0;
  };

  const getSignificance = (metric1: string, metric2: string) => {
    const correlation = data.find(d => 
      (d.metric1 === metric1 && d.metric2 === metric2) ||
      (d.metric1 === metric2 && d.metric2 === metric1)
    );
    return correlation?.significance || 0;
  };

  const getColorForCorrelation = (correlation: number) => {
    const intensity = Math.abs(correlation);
    if (correlation > 0) {
      return `rgba(34, 197, 94, ${intensity})`; // Green for positive
    } else if (correlation < 0) {
      return `rgba(239, 68, 68, ${intensity})`; // Red for negative
    } else {
      return 'rgba(156, 163, 175, 0.2)'; // Gray for no correlation
    }
  };

  const handleCellClick = (metric1: string, metric2: string) => {
    if (metric1 === metric2) return;
    
    const correlationData = data.find(d => 
      (d.metric1 === metric1 && d.metric2 === metric2) ||
      (d.metric1 === metric2 && d.metric2 === metric1)
    );
    setSelectedCell(correlationData || null);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Correlation Matrix</h3>
          <Badge variant="outline" className="flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            {selectedMetrics.length} metrics
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={showSignificance ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowSignificance(!showSignificance)}
          >
            <Info className="w-4 h-4 mr-1" />
            Significance
          </Button>
        </div>
      </div>

      {/* Metric Selection */}
      <div className="mb-6">
        <p className="font-medium mb-2">Select Metrics to Analyze</p>
        <div className="flex flex-wrap gap-2">
          {availableMetrics.map((metric) => (
            <Button
              key={metric}
              variant={selectedMetrics.includes(metric) ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                if (selectedMetrics.includes(metric)) {
                  onMetricsChange(selectedMetrics.filter(m => m !== metric));
                } else if (selectedMetrics.length < 8) {
                  onMetricsChange([...selectedMetrics, metric]);
                }
              }}
              disabled={!selectedMetrics.includes(metric) && selectedMetrics.length >= 8}
            >
              {metric}
            </Button>
          ))}
        </div>
        {selectedMetrics.length >= 8 && (
          <p className="text-xs text-muted-foreground mt-2">
            Maximum 8 metrics can be selected for analysis
          </p>
        )}
      </div>

      {/* Correlation Matrix */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="grid gap-1" style={{ gridTemplateColumns: `120px repeat(${selectedMetrics.length}, 80px)` }}>
            {/* Header row */}
            <div></div>
            {selectedMetrics.map(metric => (
              <div key={metric} className="text-xs text-center p-2 font-medium">
                <div className="transform -rotate-45 origin-center">{metric}</div>
              </div>
            ))}
            
            {/* Matrix rows */}
            {selectedMetrics.map(rowMetric => (
              <React.Fragment key={rowMetric}>
                <div className="text-xs text-right p-2 font-medium flex items-center justify-end">
                  {rowMetric}
                </div>
                {selectedMetrics.map(colMetric => {
                  const correlation = getCorrelation(rowMetric, colMetric);
                  const significance = getSignificance(rowMetric, colMetric);
                  const isDiagonal = rowMetric === colMetric;
                  
                  return (
                    <div
                      key={`${rowMetric}-${colMetric}`}
                      className={`aspect-square border border-gray-200 cursor-pointer hover:border-gray-400 transition-colors rounded-sm flex items-center justify-center ${
                        isDiagonal ? 'bg-gray-100' : ''
                      }`}
                      style={{
                        backgroundColor: isDiagonal ? undefined : getColorForCorrelation(correlation)
                      }}
                      onClick={() => handleCellClick(rowMetric, colMetric)}
                      title={isDiagonal ? '1.00' : `${correlation.toFixed(2)} (p=${significance.toFixed(3)})`}
                    >
                      <div className="text-xs font-medium text-center">
                        {isDiagonal ? '1.00' : (
                          <div>
                            <div className="text-white mix-blend-difference">
                              {correlation.toFixed(2)}
                            </div>
                            {showSignificance && (
                              <div className="text-xs text-white mix-blend-difference">
                                p={significance.toFixed(3)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-6 mb-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Strong Negative</span>
          <div className="flex gap-1">
            {[-1, -0.5, 0, 0.5, 1].map((value) => (
              <div
                key={value}
                className="w-6 h-6 border border-gray-200 flex items-center justify-center text-xs"
                style={{ backgroundColor: getColorForCorrelation(value) }}
              >
                {value}
              </div>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">Strong Positive</span>
        </div>
      </div>

      {/* Selected correlation details */}
      {selectedCell && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">
            {selectedCell.metric1} ↔ {selectedCell.metric2}
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Correlation</p>
              <p className={`font-semibold text-lg ${
                selectedCell.correlation > 0.5 ? 'text-green-600' :
                selectedCell.correlation < -0.5 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {selectedCell.correlation.toFixed(3)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">P-Value</p>
              <p className={`font-semibold ${
                selectedCell.significance < 0.05 ? 'text-green-600' : 'text-gray-600'
              }`}>
                {selectedCell.significance.toFixed(4)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Sample Size</p>
              <p className="font-semibold">{selectedCell.sampleSize}</p>
            </div>
          </div>
          
          <div className="mt-3 p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Interpretation:</strong> {
                Math.abs(selectedCell.correlation) > 0.7 ? 'Strong' :
                Math.abs(selectedCell.correlation) > 0.3 ? 'Moderate' : 'Weak'
              } {selectedCell.correlation > 0 ? 'positive' : 'negative'} correlation.
              {selectedCell.significance < 0.05 ? ' Statistically significant.' : ' Not statistically significant.'}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
