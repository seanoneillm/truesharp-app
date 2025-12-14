import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Modal, FlatList } from 'react-native';
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
  // Default to current month and year
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  // Generate months array
  const months = [
    { value: 0, label: 'January' }, { value: 1, label: 'February' }, { value: 2, label: 'March' },
    { value: 3, label: 'April' }, { value: 4, label: 'May' }, { value: 5, label: 'June' },
    { value: 6, label: 'July' }, { value: 7, label: 'August' }, { value: 8, label: 'September' },
    { value: 9, label: 'October' }, { value: 10, label: 'November' }, { value: 11, label: 'December' }
  ];

  // Generate years array (current year and 4 years back)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => ({
    value: currentYear - i,
    label: (currentYear - i).toString()
  }));

  // Process data based on selected date range - starting from 0 for each period
  const processedData = useMemo(() => {
    if (!chartData || chartData.length === 0) return { labels: [], datasets: [], isEmpty: true, currentProfit: 0 };

    const now = new Date();
    let filteredData = [...chartData];
    let dateFormat: (date: Date) => string;
    let startDate: Date;
    let endDate: Date;

    switch (selectedRange) {
      case 'week':
        // From Monday of current week until now
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Handle Sunday as 6 days from Monday
        startDate = new Date(now.getTime() - daysFromMonday * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0); // Start of Monday
        
        // Use string-based date comparison for consistency
        const weekStartString = startDate.getFullYear() + '-' + 
          String(startDate.getMonth() + 1).padStart(2, '0') + '-' + 
          String(startDate.getDate()).padStart(2, '0');
        
        filteredData = chartData.filter(point => point.date >= weekStartString);
        dateFormat = (date: Date) => {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          return days[date.getDay()];
        };
        break;
      
      case 'month':
        // From 1st of selected month to last day of selected month
        startDate = new Date(selectedYear, selectedMonth, 1);
        endDate = new Date(selectedYear, selectedMonth + 1, 0); // Last day of the month
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        // Use string-based date comparison to avoid timezone issues
        const monthStartString = selectedYear + '-' + 
          String(selectedMonth + 1).padStart(2, '0') + '-01';
        const monthEndString = selectedYear + '-' + 
          String(selectedMonth + 1).padStart(2, '0') + '-' + 
          String(endDate.getDate()).padStart(2, '0');
        
        filteredData = chartData.filter(point => {
          // point.date should already be in YYYY-MM-DD format from processChartData
          return point.date >= monthStartString && point.date <= monthEndString;
        });
        dateFormat = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`;
        break;
      
      case 'year':
        // From January 1st of selected year to December 31st of selected year
        startDate = new Date(selectedYear, 0, 1);
        endDate = new Date(selectedYear, 11, 31); // December 31st of selected year
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        // Use string-based date comparison to avoid timezone issues
        const yearStartString = selectedYear + '-01-01';
        const yearEndString = selectedYear + '-12-31';
        
        filteredData = chartData.filter(point => {
          return point.date >= yearStartString && point.date <= yearEndString;
        });
        
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

    // Generate labels with proper spacing and cleaner logic
    let labels: string[];
    
    if (selectedRange === 'month') {
      // For month view, show dates with better spacing to avoid overlap
      const monthLabels: string[] = [];
      const maxLabels = Math.min(6, processedPoints.length); // Max 6 labels to avoid crowding
      const step = Math.max(1, Math.floor(processedPoints.length / maxLabels));
      
      for (let i = 0; i < processedPoints.length; i++) {
        const pointDate = new Date(processedPoints[i].date);
        
        // Show first, last, and evenly spaced labels in between
        if (i === 0 || i === processedPoints.length - 1 || i % step === 0) {
          monthLabels.push(dateFormat(pointDate));
        } else {
          monthLabels.push('');
        }
      }
      labels = monthLabels;
    } else if (selectedRange === 'week') {
      // For week view, show all 7 days but use shorter format
      labels = processedPoints.map((point, index) => {
        const pointDate = new Date(point.date);
        const shortDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        return shortDays[pointDate.getDay()];
      });
    } else {
      // For year view, show months with better spacing
      const maxLabels = 6; // Max 6 month labels to avoid crowding
      const step = Math.max(1, Math.floor(processedPoints.length / maxLabels));
      
      labels = processedPoints.map((point, index) => {
        if (index === 0 || index === processedPoints.length - 1 || index % step === 0) {
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
          color: (opacity = 1) => `rgba(${currentProfit >= 0 ? '0, 80, 50' : '140, 15, 15'}, ${opacity})`,
          strokeWidth: 2.5, // Slightly thinner for professional stock appearance
        },
        {
          data: roiData,
          color: (opacity = 1) => `rgba(20, 60, 140, ${opacity})`,
          strokeWidth: 2.5, // Consistent professional line weight
        },
      ],
      isEmpty: false,
      currentProfit,
      lineColor,
      currentROI: roiData[roiData.length - 1] || 0
    };
  }, [chartData, selectedRange, selectedMonth, selectedYear]);

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
      r: '0',
      strokeWidth: '0',
    },
    propsForBackgroundLines: {
      strokeDasharray: '5,5',
      stroke: theme.colors.border,
      strokeWidth: 0.8,
    },
    formatYLabel: (value: string) => {
      const num = parseFloat(value);
      if (Math.abs(num) >= 1000) {
        return `$${(num / 1000).toFixed(1)}k`;
      }
      return `$${num.toFixed(0)}`;
    },
    // Better axis spacing for cleaner labels
    yAxisInterval: 1,
    paddingLeft: 15,
    paddingRight: 20,
    paddingTop: 15,
    paddingBottom: 10,
  };

  const renderRangeSelector = () => (
    <View style={styles.rangeSelectorContainer}>
      {/* Week Button */}
      <TouchableOpacity
        style={[
          styles.rangeButton,
          selectedRange === 'week' && styles.activeRangeButton,
        ]}
        onPress={() => setSelectedRange('week')}
        disabled={loading}
      >
        <Text
          style={[
            styles.rangeButtonText,
            selectedRange === 'week' && styles.activeRangeButtonText,
          ]}
        >
          This Week
        </Text>
      </TouchableOpacity>

      {/* Month Dropdown */}
      <TouchableOpacity
        style={[
          styles.rangeButton,
          styles.dropdownButton,
          selectedRange === 'month' && styles.activeRangeButton,
        ]}
        onPress={() => {
          setSelectedRange('month');
          setShowMonthDropdown(true);
        }}
        disabled={loading}
      >
        <Text
          style={[
            styles.rangeButtonText,
            selectedRange === 'month' && styles.activeRangeButtonText,
          ]}
        >
          {months.find(m => m.value === selectedMonth)?.label || 'Month'}
        </Text>
        <Ionicons
          name="chevron-down"
          size={16}
          color={selectedRange === 'month' ? theme.colors.text.inverse : theme.colors.text.secondary}
        />
      </TouchableOpacity>

      {/* Year Dropdown */}
      <TouchableOpacity
        style={[
          styles.rangeButton,
          styles.dropdownButton,
          selectedRange === 'year' && styles.activeRangeButton,
        ]}
        onPress={() => {
          setSelectedRange('year');
          setShowYearDropdown(true);
        }}
        disabled={loading}
      >
        <Text
          style={[
            styles.rangeButtonText,
            selectedRange === 'year' && styles.activeRangeButtonText,
          ]}
        >
          {selectedYear}
        </Text>
        <Ionicons
          name="chevron-down"
          size={16}
          color={selectedRange === 'year' ? theme.colors.text.inverse : theme.colors.text.secondary}
        />
      </TouchableOpacity>
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
          width={screenWidth - 40} // Optimized margins for better label visibility
          height={220} // Slightly reduced height
          chartConfig={chartConfig}
          bezier={true} // Smooth, rounded lines for better visual appeal
          style={styles.chart}
          withHorizontalLabels={true}
          withVerticalLabels={true}
          withInnerLines={true}
          withOuterLines={false}
          withShadow={false}
          withDots={false} // Clean lines without dots
          fromZero={false}
          yAxisLabel=""
          yAxisSuffix=""
          segments={4} // Clean grid lines
        />
      )}

      {/* Month Dropdown Modal */}
      <Modal
        visible={showMonthDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMonthDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMonthDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            <FlatList
              data={months}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    selectedMonth === item.value && styles.selectedDropdownItem
                  ]}
                  onPress={() => {
                    setSelectedMonth(item.value);
                    setShowMonthDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    selectedMonth === item.value && styles.selectedDropdownItemText
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Year Dropdown Modal */}
      <Modal
        visible={showYearDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowYearDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowYearDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            <FlatList
              data={years}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    selectedYear === item.value && styles.selectedDropdownItem
                  ]}
                  onPress={() => {
                    setSelectedYear(item.value);
                    setShowYearDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    selectedYear === item.value && styles.selectedDropdownItemText
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
    marginLeft: -10, // Optimized left margin for better label spacing
    marginBottom: -5, // Optimized bottom margin
    alignSelf: 'center',
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
  // Dropdown styles
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    maxHeight: 300,
    minWidth: 200,
    marginHorizontal: theme.spacing.xl,
    ...theme.shadows.lg,
  },
  dropdownItem: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectedDropdownItem: {
    backgroundColor: theme.colors.primary + '20',
  },
  dropdownItemText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  selectedDropdownItemText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});