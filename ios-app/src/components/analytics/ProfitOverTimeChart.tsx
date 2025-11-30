import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { ChartDataPoint, AnalyticsFilters } from '../../services/supabaseAnalytics';
import TrueSharpShield from '../common/TrueSharpShield';
import { UnitDisplayOptions, formatChartValue } from '../../utils/unitCalculations';

interface ProfitOverTimeChartProps {
  chartData: ChartDataPoint[];
  filters: AnalyticsFilters;
  loading?: boolean;
  unitOptions?: UnitDisplayOptions;
}

type DateRange = 'week' | 'month' | 'year';

const screenWidth = Dimensions.get('window').width;

export default function ProfitOverTimeChart({ chartData, filters, loading, unitOptions }: ProfitOverTimeChartProps) {
  const [selectedRange, setSelectedRange] = useState<DateRange>('month');

  // Process data based on selected date range - starting from 0 for each period
  const processedData = useMemo(() => {
    if (!chartData || chartData.length === 0) return { labels: [], datasets: [], isEmpty: true, currentProfit: 0 };

    const now = new Date();
    let filteredData = [...chartData];
    let dateFormat: (date: Date) => string;
    let startDate: Date;

    switch (selectedRange) {
      case 'week':
        // From Monday of current week until now
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Handle Sunday as 6 days from Monday
        startDate = new Date(now.getTime() - daysFromMonday * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0); // Start of Monday
        filteredData = chartData.filter(point => new Date(point.date) >= startDate);
        dateFormat = (date: Date) => {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          return days[date.getDay()];
        };
        break;
      
      case 'month':
        // From 1st of current month until now
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0); // Start of first day
        filteredData = chartData.filter(point => new Date(point.date) >= startDate);
        dateFormat = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`;
        break;
      
      case 'year':
        // From January 1st of current year until now
        startDate = new Date(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0); // Start of January 1st
        filteredData = chartData.filter(point => new Date(point.date) >= startDate);
        
        // Group by month and aggregate daily profits
        const monthlyData = new Map<string, { profit: number; lastDate: string }>();
        
        filteredData.forEach(point => {
          const date = new Date(point.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, { profit: 0, lastDate: point.date });
          }
          monthlyData.get(monthKey)!.profit += point.profit;
          monthlyData.get(monthKey)!.lastDate = point.date;
        });
        
        filteredData = Array.from(monthlyData.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([monthKey, data]) => ({
            date: data.lastDate,
            profit: data.profit,
            cumulativeProfit: 0, // Will recalculate below
            bets: 0
          }));
        
        dateFormat = (date: Date) => {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return months[date.getMonth()];
        };
        break;
      
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFormat = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`;
    }

    if (filteredData.length === 0) return { labels: [], datasets: [], isEmpty: true, currentProfit: 0 };

    // Sort data by date
    filteredData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Recalculate cumulative profit starting from 0 for the selected period
    let cumulativeProfit = 0;
    const processedPoints = filteredData.map(point => {
      cumulativeProfit += point.profit;
      return {
        ...point,
        cumulativeProfit
      };
    });

    // Add starting point at 0 for the beginning of the selected period
    processedPoints.unshift({
      date: startDate.toISOString(),
      profit: 0,
      cumulativeProfit: 0,
      bets: 0
    });

    // Generate labels with proper spacing
    let labels: string[];
    
    if (selectedRange === 'month') {
      // For month view, show dates every 7 days starting from the 1st
      const firstOfMonth = new Date(startDate);
      const monthLabels: string[] = [];
      
      for (let i = 0; i < processedPoints.length; i++) {
        const pointDate = new Date(processedPoints[i].date);
        const dayOfMonth = pointDate.getDate();
        
        // Show labels on 1st, 8th, 15th, 22nd, 29th of month
        if (dayOfMonth === 1 || dayOfMonth % 7 === 1 || i === processedPoints.length - 1) {
          monthLabels.push(dateFormat(pointDate));
        } else {
          monthLabels.push('');
        }
      }
      labels = monthLabels;
    } else {
      // For week and year, use existing logic
      const maxLabels = selectedRange === 'week' ? 7 : 12;
      const step = Math.max(1, Math.floor(processedPoints.length / maxLabels));
      
      labels = processedPoints.map((point, index) => {
        if (index % step === 0 || index === processedPoints.length - 1) {
          return dateFormat(new Date(point.date));
        }
        return '';
      });
    }

    const profits = processedPoints.map(point => point.cumulativeProfit);
    const currentProfit = profits[profits.length - 1] || 0;
    
    // Dynamic color based on final profit
    const lineColor = currentProfit >= 0 ? theme.colors.status.success : theme.colors.status.error;

    // Calculate ROI data for dual-line chart
    let cumulativeStake = 0;
    const roiData = processedPoints.map(point => {
      // Estimate stake from profit (assuming reasonable bet sizes)
      const dailyStake = Math.abs(point.profit || 0) * 1.8; // More realistic multiplier
      cumulativeStake += dailyStake;
      
      return cumulativeStake > 0 ? (point.cumulativeProfit / cumulativeStake) * 100 : 0;
    });

    return {
      labels,
      datasets: [
        {
          data: profits,
          color: (opacity = 1) => `rgba(${currentProfit >= 0 ? '5, 150, 105' : '220, 38, 38'}, ${opacity})`,
          strokeWidth: 3,
        },
        {
          data: roiData,
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Blue for ROI
          strokeWidth: 3,
        },
      ],
      isEmpty: false,
      currentProfit,
      lineColor,
      currentROI: roiData[roiData.length - 1] || 0
    };
  }, [chartData, selectedRange]);

  const chartConfig = {
    backgroundColor: theme.colors.card,
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => processedData.isEmpty ? 
      `rgba(100, 116, 139, ${opacity})` : 
      processedData.datasets[0].color(opacity),
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    style: {
      borderRadius: theme.borderRadius.lg,
    },
    propsForDots: {
      r: '0', // No dots for cleaner look
      strokeWidth: '0',
    },
    propsForBackgroundLines: {
      strokeDasharray: '5,5',
      stroke: theme.colors.border,
      strokeWidth: 1,
    },
    formatYLabel: (value: string) => {
      const num = parseFloat(value);
      if (Math.abs(num) >= 1000) {
        return `$${(num / 1000).toFixed(1)}k`;
      }
      return `$${num.toFixed(0)}`;
    },
    // Clean up axis spacing
    yAxisInterval: 1,
    paddingLeft: 20,
    paddingRight: 20,
  };

  const renderRangeSelector = () => (
    <View style={styles.rangeSelectorContainer}>
      {(['week', 'month', 'year'] as DateRange[]).map((range) => (
        <TouchableOpacity
          key={range}
          style={[
            styles.rangeButton,
            selectedRange === range && styles.activeRangeButton,
          ]}
          onPress={() => setSelectedRange(range)}
          disabled={loading}
        >
          <Text
            style={[
              styles.rangeButtonText,
              selectedRange === range && styles.activeRangeButtonText,
            ]}
          >
            {range === 'week' ? 'This Week' : 
             range === 'month' ? 'This Month' : 
             'This Year'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyChart}>
      <Ionicons name="trending-up-outline" size={64} color={theme.colors.text.light} />
      <Text style={styles.emptyChartText}>No profit data available</Text>
      <Text style={styles.emptyChartSubtext}>
        Place some bets to see your profit over time
      </Text>
    </View>
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPeriodLabel = () => {
    switch (selectedRange) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      default: return 'This Month';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <TrueSharpShield size={20} variant="default" style={styles.shieldIcon} />
          <Text style={styles.title}>Performance Over Time</Text>
        </View>
        
        {!processedData.isEmpty && processedData.currentProfit !== undefined && (
          <View style={styles.metricsContainer}>
            <View style={styles.profitIndicator}>
              <Ionicons 
                name={processedData.currentProfit >= 0 ? "trending-up" : "trending-down"} 
                size={12} 
                color={processedData.lineColor} 
              />
              <Text style={[styles.profitText, { color: processedData.lineColor }]}>
                {formatCurrency(processedData.currentProfit)}
              </Text>
            </View>
            {processedData.currentROI !== undefined && (
              <View style={styles.roiIndicator}>
                <Ionicons 
                  name={processedData.currentROI >= 0 ? "trending-up" : "trending-down"} 
                  size={12} 
                  color={processedData.currentROI >= 0 ? theme.colors.status.success : theme.colors.status.error} 
                />
                <Text style={[styles.roiText, { 
                  color: processedData.currentROI >= 0 ? theme.colors.status.success : theme.colors.status.error 
                }]}>
                  {processedData.currentROI.toFixed(1)}%
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {renderRangeSelector()}

      <View style={styles.chartSubheader}>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.betting.won }]} />
            <Text style={styles.legendText}>Profit ($)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
            <Text style={styles.legendText}>ROI (%)</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading chart data...</Text>
        </View>
      ) : processedData.isEmpty ? (
        renderEmptyState()
      ) : (
        <LineChart
          data={{
            labels: processedData.labels,
            datasets: processedData.datasets,
          }}
          width={screenWidth - 64} // Account for card padding + margins
          height={240}
          chartConfig={chartConfig}
          bezier={true} // Smooth line
          style={styles.chart}
          withHorizontalLabels={true}
          withVerticalLabels={true}
          withInnerLines={true}
          withOuterLines={false}
          withShadow={false}
          withDots={false} // Remove dots for smoother appearance
          fromZero={false}
          yAxisLabel=""
          yAxisSuffix=""
          segments={4} // Control number of horizontal lines
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    margin: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  shieldIcon: {
    opacity: 0.8,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  metricsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 2,
  },
  profitIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  profitText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  roiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  roiText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  legendContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  rangeSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 2,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rangeButton: {
    flex: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  activeRangeButton: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  rangeButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  activeRangeButtonText: {
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  chartSubheader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  periodLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  axisLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  chart: {
    borderRadius: theme.borderRadius.lg,
    marginLeft: -5, // Slight left adjustment for better centering
    alignSelf: 'center', // Center the chart horizontally
  },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyChartText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  emptyChartSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.light,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
});