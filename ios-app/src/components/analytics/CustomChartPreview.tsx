import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Alert } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { ChartConfig } from './CustomChartCreator';
import TrueSharpShield from '../common/TrueSharpShield';
import { useAuth } from '../../contexts/AuthContext';
import { fetchCustomChartData, ChartDataPoint } from '../../services/customChartAnalytics';

const screenWidth = Dimensions.get('window').width;

interface CustomChartPreviewProps {
  config: ChartConfig;
}

export default function CustomChartPreview({ config }: CustomChartPreviewProps) {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id && config.xAxis && config.yAxis) {
      fetchPreviewData();
    } else {
      generateMockData();
    }
  }, [config, user?.id]);

  const fetchPreviewData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await fetchCustomChartData(user.id, config);
      // Limit to first 3-4 data points for preview
      setChartData(data.slice(0, 4));
    } catch (err) {
      console.error('Error fetching preview data:', err);
      generateMockData(); // Fallback to mock data
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    setLoading(true);
    
    // Generate simple mock data for preview - using the same structure as CustomChartRenderer but smaller
    let mockData: ChartDataPoint[] = [];
    
    switch (config.xAxis) {
      case 'sport':
        mockData = [
          { sport: 'Football', count: 15, wins_count: 9, losses_count: 6, profit: 280, win_rate: 60.0, roi: 18.7, total_staked: 750, average_stake: 50, longshot_hit_rate: 33.3, chalk_hit_rate: 73.3 },
          { sport: 'Basketball', count: 12, wins_count: 6, losses_count: 6, profit: -30, win_rate: 50.0, roi: -5.0, total_staked: 600, average_stake: 50, longshot_hit_rate: 25.0, chalk_hit_rate: 66.7 },
          { sport: 'Baseball', count: 8, wins_count: 6, losses_count: 2, profit: 120, win_rate: 75.0, roi: 30.0, total_staked: 400, average_stake: 50, longshot_hit_rate: 37.5, chalk_hit_rate: 87.5 },
        ];
        break;
      case 'league':
        mockData = [
          { league: 'NFL', count: 12, wins_count: 8, losses_count: 4, profit: 220, win_rate: 66.7, roi: 36.7, total_staked: 600, average_stake: 50, longshot_hit_rate: 33.3, chalk_hit_rate: 83.3 },
          { league: 'NBA', count: 8, wins_count: 4, losses_count: 4, profit: -40, win_rate: 50.0, roi: -10.0, total_staked: 400, average_stake: 50, longshot_hit_rate: 25.0, chalk_hit_rate: 62.5 },
          { league: 'MLB', count: 10, wins_count: 7, losses_count: 3, profit: 180, win_rate: 70.0, roi: 36.0, total_staked: 500, average_stake: 50, longshot_hit_rate: 40.0, chalk_hit_rate: 90.0 },
        ];
        break;
      case 'bet_type':
        mockData = [
          { bet_type: 'Moneyline', count: 8, wins_count: 5, losses_count: 3, profit: 150, win_rate: 62.5, roi: 37.5, total_staked: 400, average_stake: 50, longshot_hit_rate: 37.5, chalk_hit_rate: 87.5 },
          { bet_type: 'Spread', count: 12, wins_count: 6, losses_count: 6, profit: 60, win_rate: 50.0, roi: 10.0, total_staked: 600, average_stake: 50, longshot_hit_rate: 25.0, chalk_hit_rate: 66.7 },
          { bet_type: 'Props', count: 6, wins_count: 3, losses_count: 3, profit: -20, win_rate: 50.0, roi: -6.7, total_staked: 300, average_stake: 50, longshot_hit_rate: 33.3, chalk_hit_rate: 66.7 },
        ];
        break;
      case 'placed_at_day_of_week':
        mockData = [
          { placed_at_day_of_week: 'Sunday', count: 8, wins_count: 6, losses_count: 2, profit: 180, win_rate: 75.0, roi: 45.0, total_staked: 400, average_stake: 50, longshot_hit_rate: 37.5, chalk_hit_rate: 87.5 },
          { placed_at_day_of_week: 'Saturday', count: 10, wins_count: 6, losses_count: 4, profit: 120, win_rate: 60.0, roi: 24.0, total_staked: 500, average_stake: 50, longshot_hit_rate: 30.0, chalk_hit_rate: 80.0 },
          { placed_at_day_of_week: 'Friday', count: 6, wins_count: 3, losses_count: 3, profit: 40, win_rate: 50.0, roi: 13.3, total_staked: 300, average_stake: 50, longshot_hit_rate: 16.7, chalk_hit_rate: 66.7 },
        ];
        break;
      default:
        // For any other axis, use generic data
        mockData = [
          { [config.xAxis]: 'Category 1', count: 10, wins_count: 6, losses_count: 4, profit: 150, win_rate: 60.0, roi: 30.0, total_staked: 500, average_stake: 50, longshot_hit_rate: 30.0, chalk_hit_rate: 80.0 },
          { [config.xAxis]: 'Category 2', count: 8, wins_count: 4, losses_count: 4, profit: 20, win_rate: 50.0, roi: 5.0, total_staked: 400, average_stake: 50, longshot_hit_rate: 25.0, chalk_hit_rate: 62.5 },
          { [config.xAxis]: 'Category 3', count: 12, wins_count: 8, losses_count: 4, profit: 200, win_rate: 66.7, roi: 33.3, total_staked: 600, average_stake: 50, longshot_hit_rate: 33.3, chalk_hit_rate: 83.3 },
        ];
    }

    setChartData(mockData);
    setLoading(false);
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

  const getChartConfig = () => ({
    backgroundColor: theme.colors.card,
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: ['win_rate', 'roi', 'longshot_hit_rate', 'chalk_hit_rate'].includes(config.yAxis) ? 1 : 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    style: {
      borderRadius: theme.borderRadius.lg,
    },
    propsForBackgroundLines: {
      strokeDasharray: '5,5',
      stroke: theme.colors.border,
      strokeWidth: 1,
    },
  });

  const renderChart = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Generating preview...</Text>
        </View>
      );
    }

    if (!chartData || chartData.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="bar-chart-outline" size={48} color={theme.colors.text.light} />
          <Text style={styles.emptyText}>No data available</Text>
          <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
        </View>
      );
    }

    const chartProps = {
      width: screenWidth - 64,
      height: 220,
      chartConfig: getChartConfig(),
      style: styles.chart,
    };

    switch (config.chartType) {
      case 'line':
        const lineData = {
          labels: chartData.map(item => item[config.xAxis]?.toString().substring(0, 6) || ''),
          datasets: [{
            data: chartData.map(item => item[config.yAxis] || 0),
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            strokeWidth: 3,
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
            fromZero={config.yAxis === 'count'}
          />
        );

      case 'bar':
        const barData = {
          labels: chartData.map(item => item[config.xAxis]?.toString().substring(0, 6) || ''),
          datasets: [{
            data: chartData.map(item => item[config.yAxis] || 0),
          }],
        };
        return (
          <BarChart
            data={barData}
            {...chartProps}
            withInnerLines={true}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            yAxisLabel=""
            yAxisSuffix=""
            fromZero={config.yAxis === 'count'}
            showBarTops={false}
          />
        );

      case 'pie':
        const pieData = chartData.map((item, index) => ({
          name: item[config.xAxis]?.toString() || `Item ${index + 1}`,
          population: item[config.yAxis] || 0,
          color: [
            '#3b82f6', // blue
            '#059669', // green
            '#dc2626', // red
            '#7c3aed', // violet
            '#ea580c', // orange
          ][index % 5],
          legendFontColor: theme.colors.text.secondary,
          legendFontSize: 12,
        }));

        return (
          <PieChart
            data={pieData}
            width={screenWidth - 64}
            height={220}
            chartConfig={getChartConfig()}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 0]}
            absolute
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TrueSharpShield size={16} variant="default" style={styles.shieldIcon} />
        <Text style={styles.title}>{config.title || 'Chart Preview'}</Text>
      </View>
      
      <View style={styles.chartContainer}>
        {renderChart()}
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          📊 {config.chartType.charAt(0).toUpperCase() + config.chartType.slice(1)} chart showing {config.yAxis} by {config.xAxis.replace('_', ' ')}
        </Text>
        {chartData.length > 0 && (
          <Text style={styles.dataPoints}>
            {chartData.length} data point{chartData.length !== 1 ? 's' : ''}
          </Text>
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
  },
  chart: {
    borderRadius: theme.borderRadius.lg,
  },
  loadingContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
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
  dataPoints: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
});