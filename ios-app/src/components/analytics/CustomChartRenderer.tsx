import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Alert, ScrollView } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { ChartConfig } from './CustomChartCreator';
import TrueSharpShield from '../common/TrueSharpShield';
import { useAuth } from '../../contexts/AuthContext';
import { fetchCustomChartData, ChartDataPoint } from '../../services/customChartAnalytics';

const screenWidth = Dimensions.get('window').width;

interface CustomChartRendererProps {
  config: ChartConfig;
}

export default function CustomChartRenderer({ config }: CustomChartRendererProps) {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchChartData();
    }
  }, [config, user?.id]);

  const fetchChartData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const data = await fetchCustomChartData(user.id, config);
      setChartData(data);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: number) => {
    switch (config.yAxis) {
      case 'profit':
      case 'total_staked':
      case 'average_stake':
      case 'max_win':
      case 'max_loss':
      case 'stake':
        return `$${value}`;
      case 'win_rate':
      case 'roi':
      case 'longshot_hit_rate':
      case 'chalk_hit_rate':
        return `${value}%`;
      case 'average_odds':
      case 'median_odds':
        return value > 0 ? `+${value}` : value.toString();
      case 'count':
      case 'wins_count':
      case 'losses_count':
      case 'void_count':
      default:
        return value.toString();
    }
  };

  const getChartColor = () => {
    // Determine color based on Y-axis type and data
    if (['profit', 'roi'].includes(config.yAxis)) {
      const totalValue = chartData.reduce((sum, item) => sum + (Number(item[config.yAxis]) || 0), 0);
      return totalValue >= 0 ? '#059669' : '#dc2626'; // Green for profit, red for loss
    }
    
    if (['win_rate'].includes(config.yAxis)) {
      const avgWinRate = chartData.reduce((sum, item) => sum + (Number(item[config.yAxis]) || 0), 0) / (chartData.length || 1);
      if (avgWinRate >= 60) return '#059669'; // Green for good win rate
      if (avgWinRate <= 40) return '#dc2626'; // Red for poor win rate
      return '#f59e0b'; // Amber for average
    }

    return '#3b82f6'; // Default blue
  };

  // Get color for individual data points with expanded palette
  const getDataPointColor = (value: number, index: number = 0) => {
    if (['profit', 'roi'].includes(config.yAxis)) {
      return value >= 0 ? '#059669' : '#dc2626'; // Green for positive, red for negative
    }
    
    if (['win_rate'].includes(config.yAxis)) {
      if (value >= 60) return '#059669'; // Green for good win rate
      if (value <= 40) return '#dc2626'; // Red for poor win rate
      return '#f59e0b'; // Amber for average
    }

    // Expanded color palette for better distinction
    const colors = [
      '#3b82f6', // Blue
      '#059669', // Green  
      '#f59e0b', // Amber
      '#7c3aed', // Purple
      '#dc2626', // Red
      '#06b6d4', // Cyan
      '#84cc16', // Lime
      '#f97316', // Orange
      '#ec4899', // Pink
      '#64748b', // Slate
      '#14b8a6', // Teal
      '#8b5cf6', // Violet
      '#ef4444', // Rose
      '#22c55e', // Emerald
      '#a855f7', // Indigo
      '#6366f1'  // Indigo-500
    ];
    return colors[index % colors.length];
  };

  const getChartConfig = () => ({
    backgroundColor: theme.colors.card,
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: ['win_rate', 'roi', 'longshot_hit_rate', 'chalk_hit_rate'].includes(config.yAxis) ? 1 : 0,
    color: (opacity = 1) => {
      const baseColor = getChartColor();
      const rgb = hexToRgb(baseColor);
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    },
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    style: {
      borderRadius: theme.borderRadius.lg,
      paddingRight: 0, // Remove right padding to maximize chart width
    },
    propsForBackgroundLines: {
      strokeDasharray: '5,5',
      stroke: theme.colors.border,
      strokeWidth: 1,
    },
    formatYLabel: (value: string) => formatYAxisLabel(value),
    propsForVerticalLabels: {
      rotation: 45, // Restore 45-degree rotation
      fontSize: 10,
      textAnchor: 'start' as const,
      fill: theme.colors.text.secondary,
    },
    propsForHorizontalLabels: {
      fontSize: 11,
      fill: theme.colors.text.secondary,
    },
    // Add padding to prevent label cutoff
    paddingTop: 20,
    paddingBottom: 60, // Increased for angled labels
    paddingLeft: 50,
  });

  const formatYAxisLabel = (value: string) => {
    const numValue = Number(value);
    if (isNaN(numValue)) return value;

    switch (config.yAxis) {
      case 'profit':
      case 'total_staked':
      case 'average_stake':
      case 'max_win':
      case 'max_loss':
      case 'stake':
        if (Math.abs(numValue) >= 1000) {
          return `$${(numValue / 1000).toFixed(1)}k`;
        }
        return `$${numValue.toFixed(0)}`;
      
      case 'win_rate':
      case 'roi':
      case 'longshot_hit_rate':
      case 'chalk_hit_rate':
        return `${numValue.toFixed(0)}%`;
      
      case 'average_odds':
      case 'median_odds':
        return numValue > 0 ? `+${numValue.toFixed(0)}` : numValue.toFixed(0);
      
      default:
        return numValue.toFixed(0);
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 }; // Default blue
  };

  const getXAxisLabel = () => {
    const labels: Record<string, string> = {
      'placed_at': 'Date Placed',
      'league': 'League',
      'bet_type': 'Bet Type',
      'sportsbook': 'Sportsbook',
      'sport': 'Sport',
      'side': 'Side',
      'prop_type': 'Prop Type',
      'player_name': 'Player',
      'home_team': 'Home Team',
      'away_team': 'Away Team',
      'game_date': 'Game Date',
      'placed_at_day_of_week': 'Day of Week',
      'placed_at_time_of_day': 'Time of Day',
      'stake_size_bucket': 'Stake Size',
      'odds_range_bucket': 'Odds Range',
      'bet_source': 'Bet Source',
      'parlay_vs_straight': 'Bet Style',
    };
    return labels[config.xAxis] || config.xAxis.replace('_', ' ');
  };

  const getYAxisLabel = () => {
    const labels: Record<string, string> = {
      'count': 'Total Bets',
      'wins_count': 'Wins',
      'losses_count': 'Losses',
      'win_rate': 'Win Rate',
      'profit': 'Profit',
      'roi': 'ROI',
      'total_staked': 'Total Staked',
      'average_stake': 'Average Stake',
      'average_odds': 'Average Odds',
      'median_odds': 'Median Odds',
      'void_count': 'Voids',
      'longshot_hit_rate': 'Longshot Hit Rate',
      'chalk_hit_rate': 'Chalk Hit Rate',
      'max_win': 'Biggest Win',
      'max_loss': 'Biggest Loss',
      'profit_variance': 'Volatility',
      'stake': 'Total Stake',
    };
    return labels[config.yAxis] || config.yAxis.replace('_', ' ');
  };

  const formatTotalValue = () => {
    const total = chartData.reduce((sum, item) => sum + (Number(item[config.yAxis]) || 0), 0);
    
    if (config.yAxis === 'profit') {
      return `Total: ${formatValue(total)}`;
    } else if (config.yAxis === 'roi') {
      const avgROI = total / (chartData.length || 1);
      return `Avg: ${avgROI.toFixed(1)}%`;
    }
    
    return '';
  };

  // Smart label formatting to prevent truncation while maintaining readability
  const formatLabel = (label: string, maxLength: number = 12) => {
    if (!label) return '';
    
    // For dates, use better formatting
    if (config.xAxis === 'placed_at' || config.xAxis === 'game_date') {
      const date = new Date(label);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        });
      }
    }
    
    // For other fields, use smart truncation
    if (label.length <= maxLength) return label;
    
    // Try to find a good breaking point
    const words = label.split(' ');
    if (words.length > 1 && words[0].length <= maxLength) {
      return words[0];
    }
    
    // Fallback to truncation with ellipsis
    return label.substring(0, maxLength - 1) + '…';
  };

  // Helper function to reduce data points for better label spacing
  const getReducedDataForDates = (data: ChartDataPoint[]) => {
    if (!['placed_at', 'game_date'].includes(config.xAxis) || data.length <= 8) {
      return data; // Return all data if not date-based or small dataset
    }

    // For date-based charts with many points, show every nth point
    const maxPoints = 8;
    const step = Math.ceil(data.length / maxPoints);
    return data.filter((_, index) => index % step === 0);
  };

  const renderChart = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Ionicons name="analytics" size={32} color={theme.colors.primary} />
          <Text style={styles.loadingText}>Analyzing your bets...</Text>
          <Text style={styles.loadingSubtext}>This may take a moment</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.status.error} />
          <Text style={styles.emptyText}>Error loading chart</Text>
          <Text style={styles.emptySubtext}>{error}</Text>
        </View>
      );
    }

    if (!chartData || chartData.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="bar-chart-outline" size={48} color={theme.colors.text.light} />
          <Text style={styles.emptyText}>No betting data found</Text>
          <Text style={styles.emptySubtext}>Start placing bets to see analytics</Text>
        </View>
      );
    }

    const chartProps = {
      width: screenWidth - 48, // Increase chart width for better visibility
      height: 320, // Increase height for angled labels
      chartConfig: getChartConfig(),
      style: styles.chart,
    };

    switch (config.chartType) {
      case 'line':
        const reducedLineData = getReducedDataForDates(chartData);
        const lineData = {
          labels: reducedLineData.map(item => {
            const label = item[config.xAxis]?.toString() || '';
            return formatLabel(label, 10); // Use smart formatting with 10 char limit
          }),
          datasets: [{
            data: reducedLineData.map(item => Number(item[config.yAxis]) || 0),
            color: (opacity = 1) => {
              const baseColor = getChartColor();
              const rgb = hexToRgb(baseColor);
              return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
            },
            strokeWidth: 3,
            // Color dots based on individual values for profit/ROI charts
            propsForDots: ['profit', 'roi'].includes(config.yAxis) ? {
              getColor: (dataPoint: number, dataPointIndex: number) => {
                return getDataPointColor(dataPoint, dataPointIndex);
              },
              strokeWidth: 2,
              r: 4,
            } : {
              strokeWidth: 2,
              r: 4,
            },
          }],
        };
        return (
          <LineChart
            data={lineData}
            {...chartProps}
            bezier
            withDots={true}
            withShadow={false}
            withInnerLines={true}
            withOuterLines={false}
            yAxisLabel=""
            yAxisSuffix=""
            fromZero={['count', 'wins_count', 'losses_count', 'void_count'].includes(config.yAxis)}
          />
        );

      case 'bar':
        // Limit data points for bar charts to prevent overcrowding
        const maxBarPoints = 10;
        const reducedBarData = chartData.length > maxBarPoints 
          ? chartData.filter((_, index) => index % Math.ceil(chartData.length / maxBarPoints) === 0)
          : chartData;

        const barData = {
          labels: reducedBarData.map(item => {
            const label = item[config.xAxis]?.toString() || '';
            return formatLabel(label, 8); // Use smart formatting with shorter limit for bars
          }),
          datasets: [{
            data: reducedBarData.map(item => Number(item[config.yAxis]) || 0),
            colors: reducedBarData.map((item, index) => {
              const value = Number(item[config.yAxis]) || 0;
              const color = getDataPointColor(value, index);
              const rgb = hexToRgb(color);
              return () => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`;
            }),
          }],
        };

        // Calculate dynamic width for many bars with better spacing
        const minBarWidth = 50; // Minimum width per bar for readability
        const calculatedWidth = Math.max(screenWidth - 48, reducedBarData.length * minBarWidth);
        const needsScroll = calculatedWidth > screenWidth - 48;

        const barChartElement = (
          <BarChart
            data={barData}
            width={calculatedWidth}
            height={320}
            chartConfig={{
              ...getChartConfig(),
              barPercentage: 0.7, // Make bars slightly thicker for better visibility
            }}
            style={styles.chart}
            withInnerLines={true}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            yAxisLabel=""
            yAxisSuffix=""
            fromZero={['count', 'wins_count', 'losses_count', 'void_count'].includes(config.yAxis)}
            showBarTops={false}
          />
        );

        return needsScroll ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            style={styles.barChartScroll}
            contentContainerStyle={styles.barChartContent}
          >
            {barChartElement}
          </ScrollView>
        ) : barChartElement;

      case 'pie':
        // Calculate total for percentage calculation
        const totalValue = chartData.reduce((sum, item) => sum + Math.abs(Number(item[config.yAxis]) || 0), 0);
        
        const pieData = chartData.map((item, index) => {
          const value = Number(item[config.yAxis]) || 0;
          const absValue = Math.abs(value);
          let name = item[config.xAxis]?.toString() || `Item ${index + 1}`;
          
          // Better name formatting for pie chart
          name = formatLabel(name, 10);

          // Calculate percentage
          const percentage = totalValue > 0 ? (absValue / totalValue) * 100 : 0;

          // Use improved color coding
          const color = getDataPointColor(value, index);

          return {
            name,
            population: absValue, // Use absolute value for pie charts
            percentage: percentage,
            originalValue: value,
            color,
            legendFontColor: theme.colors.text.primary,
            legendFontSize: 12,
          };
        }).filter(item => item.population > 0); // Filter out zero values

        return (
          <View style={styles.pieChartContainer}>
            {/* Centered Pie Chart */}
            <View style={styles.pieChartWrapper}>
              <PieChart
                data={pieData}
                width={screenWidth - 48}
                height={260}
                chartConfig={{
                  backgroundColor: theme.colors.card,
                  backgroundGradientFrom: theme.colors.card,
                  backgroundGradientTo: theme.colors.card,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                  style: {
                    borderRadius: theme.borderRadius.lg,
                    paddingRight: 0,
                  },
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="0"
                center={[(screenWidth - 48) / 4, 0]}
                absolute={false}
                hasLegend={false} // Disable built-in legend to use custom one
              />
            </View>
            
            {/* Legend positioned below chart, aligned left */}
            <View style={styles.pieChartLegend}>
              {pieData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>
                    {item.name}
                  </Text>
                  <Text style={styles.legendValue}>
                    {item.percentage.toFixed(1)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TrueSharpShield size={16} variant="default" style={styles.shieldIcon} />
        <Text style={styles.title}>{config.title}</Text>
      </View>
      
      <View style={styles.chartContainer}>
        {renderChart()}
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          📊 {config.chartType.charAt(0).toUpperCase() + config.chartType.slice(1)} chart showing {getYAxisLabel()} by {getXAxisLabel()}
        </Text>
        {chartData.length > 0 && (
          <View style={styles.infoRow}>
            <Text style={styles.dataPoints}>
              {chartData.length} data point{chartData.length !== 1 ? 's' : ''}
            </Text>
            {['profit', 'roi'].includes(config.yAxis) && (
              <Text style={[styles.totalValue, { color: getChartColor() }]}>
                {formatTotalValue()}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  shieldIcon: {
    opacity: 0.8,
  },
  title: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.lg, // Add padding to prevent cutoff
  },
  chart: {
    borderRadius: theme.borderRadius.lg,
  },
  barChartScroll: {
    maxWidth: screenWidth - 48,
  },
  barChartContent: {
    paddingRight: theme.spacing.md,
  },
  pieChartContainer: {
    alignItems: 'center',
    width: '100%',
  },
  pieChartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  pieChartLegend: {
    width: '100%',
    alignItems: 'flex-start',
    paddingLeft: 0,
    paddingTop: 0,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  legendText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
    flex: 1,
  },
  legendValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  loadingContainer: {
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  loadingSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.light,
  },
  emptyContainer: {
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.light,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  info: {
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'center',
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  dataPoints: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  totalValue: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});