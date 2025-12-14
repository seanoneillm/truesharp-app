import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';

export interface DailyPnL {
  date: string; // YYYY-MM-DD format
  profit: number;
  stake?: number; // Total stake for the day (for current date when no bets settled)
}

export interface DailyBetsData {
  date: string;
  bets: any[]; // Will be typed properly when we get the bet data
  profit: number;
  totalBets: number;
  winRate: number;
  totalStake: number;
}

interface PerformanceCalendarProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  dailyPnL?: DailyPnL[]; // Optional daily P/L data
  onDayPress?: (date: string) => void; // Callback for when a day is pressed
}

type DateRange = 'month' | 'year';

export default function PerformanceCalendar({ 
  selectedMonth, 
  selectedYear, 
  onMonthChange, 
  onYearChange,
  dailyPnL = [],
  onDayPress
}: PerformanceCalendarProps) {
  const [selectedRange, setSelectedRange] = useState<DateRange>('month');
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

  // Helper function to format currency values
  const formatCurrency = (value: number): string => {
    const absValue = Math.abs(value);
    
    if (absValue >= 100000) {
      return `${Math.round(absValue / 1000)}k`;
    } else if (absValue >= 1000) {
      return `${(absValue / 1000).toFixed(1)}k`;
    } else {
      return Math.round(absValue).toString();
    }
  };

  // Helper function to get P/L for a specific date
  const getPnLForDate = (date: Date): DailyPnL | null => {
    // Use timezone-safe date string construction to match dashboard logic
    const dateString = date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0');
    return dailyPnL.find(item => item.date === dateString) || null;
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
    const days = [];
    const current = new Date(startDate);
    
    // Generate 6 weeks (42 days) to ensure full calendar
    for (let i = 0; i < 42; i++) {
      const pnlData = getPnLForDate(current);
      days.push({
        date: new Date(current),
        dayNumber: current.getDate(),
        isCurrentMonth: current.getMonth() === selectedMonth,
        isToday: current.toDateString() === new Date().toDateString(),
        pnl: pnlData?.profit || 0,
        stake: pnlData?.stake || 0,
        hasPnLData: pnlData !== null,
        hasStakeOnly: pnlData !== null && pnlData.profit === 0 && (pnlData.stake || 0) > 0,
      });
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [selectedMonth, selectedYear, dailyPnL]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderRangeSelector = () => (
    <View style={styles.rangeSelectorContainer}>
      {/* Month Dropdown */}
      <TouchableOpacity
        style={[
          styles.rangeButton,
          styles.dropdownButton,
        ]}
        onPress={() => {
          setSelectedRange('month');
          setShowMonthDropdown(true);
        }}
      >
        <Text style={styles.rangeButtonText}>
          {months.find(m => m.value === selectedMonth)?.label || 'Month'}
        </Text>
        <Ionicons
          name="chevron-down"
          size={16}
          color={theme.colors.text.secondary}
        />
      </TouchableOpacity>

      {/* Year Dropdown */}
      <TouchableOpacity
        style={[
          styles.rangeButton,
          styles.dropdownButton,
        ]}
        onPress={() => {
          setSelectedRange('year');
          setShowYearDropdown(true);
        }}
      >
        <Text style={styles.rangeButtonText}>
          {selectedYear}
        </Text>
        <Ionicons
          name="chevron-down"
          size={16}
          color={theme.colors.text.secondary}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderRangeSelector()}
      
      {/* Calendar Header */}
      <View style={styles.calendarHeader}>
        {weekDays.map(day => (
          <Text key={day} style={styles.weekDayText}>{day}</Text>
        ))}
      </View>
      
      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => {
          // Determine cell background color based on P/L
          let cellStyle = styles.dayCell;
          let textStyle = styles.dayText;
          
          if (!day.isCurrentMonth) {
            cellStyle = [styles.dayCell, styles.otherMonthDay];
            textStyle = [styles.dayText, styles.otherMonthText];
          } else if (day.hasPnLData) {
            if (day.pnl > 0) {
              cellStyle = [styles.dayCell, styles.profitCell];
              textStyle = [styles.dayText, styles.profitText];
            } else if (day.pnl < 0) {
              cellStyle = [styles.dayCell, styles.lossCell];
              textStyle = [styles.dayText, styles.lossText];
            } else {
              cellStyle = [styles.dayCell, styles.breakEvenCell];
              textStyle = [styles.dayText, styles.breakEvenText];
            }
          } else if (day.isToday) {
            cellStyle = [styles.dayCell, styles.todayCell];
            textStyle = [styles.dayText, styles.todayText];
          } else if (day.hasStakeOnly) {
            cellStyle = [styles.dayCell, styles.stakeOnlyCell];
            textStyle = [styles.dayText, styles.stakeOnlyText];
          }

          const renderCellContent = () => (
            <>
              <Text style={[textStyle, { fontSize: 10, fontWeight: 'bold' }]}>
                {day.dayNumber}
              </Text>
              {day.hasPnLData && day.isCurrentMonth && day.pnl !== 0 && (
                <Text style={[textStyle, { fontSize: 11, marginTop: 1, fontWeight: 'bold' }]}>
                  {day.pnl >= 0 ? `$${formatCurrency(day.pnl)}` : `-$${formatCurrency(day.pnl)}`}
                </Text>
              )}
              {day.isToday && day.stake > 0 && day.pnl === 0 && day.isCurrentMonth && (
                <Text style={[textStyle, { fontSize: 11, marginTop: 1, fontWeight: 'bold' }]}>
                  ${formatCurrency(day.stake)}
                </Text>
              )}
            </>
          );

          const handleDayPress = () => {
            if (!day.isCurrentMonth) return;
            
            const dateString = day.date.getFullYear() + '-' + 
              String(day.date.getMonth() + 1).padStart(2, '0') + '-' + 
              String(day.date.getDate()).padStart(2, '0');
            
            onDayPress?.(dateString);
          };

          return (
            <TouchableOpacity
              key={index}
              style={[styles.dayCell, !day.isCurrentMonth && styles.otherMonthDay]}
              disabled={!day.isCurrentMonth}
              onPress={handleDayPress}
            >
              {day.hasPnLData && day.isCurrentMonth ? (
                day.pnl > 0 ? (
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.gradientCell}
                  >
                    {renderCellContent()}
                  </LinearGradient>
                ) : day.pnl < 0 ? (
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    style={styles.gradientCell}
                  >
                    {renderCellContent()}
                  </LinearGradient>
                ) : (
                  <LinearGradient
                    colors={['#9CA3AF', '#6B7280']}
                    style={styles.gradientCell}
                  >
                    {renderCellContent()}
                  </LinearGradient>
                )
              ) : day.isToday || day.hasStakeOnly ? (
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primaryDark]}
                  style={styles.gradientCell}
                >
                  {renderCellContent()}
                </LinearGradient>
              ) : (
                renderCellContent()
              )}
            </TouchableOpacity>
          );
        })}
      </View>

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
                    onMonthChange(item.value);
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
                    onYearChange(item.value);
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
    borderRadius: theme.borderRadius.lg,
    padding: 4,
    marginBottom: -4,
  },
  rangeSelectorContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  rangeButton: {
    flex: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  activeButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
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
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 2,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: '13.8%', // Exact calculation for 7 columns with space
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    marginVertical: 1,
    minHeight: 40,
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  todayCell: {
    backgroundColor: theme.colors.primary,
  },
  profitCell: {
    backgroundColor: '#059669', // Green for profit
  },
  lossCell: {
    backgroundColor: '#DC2626', // Red for loss
  },
  breakEvenCell: {
    backgroundColor: '#6B7280', // Gray for break-even
  },
  stakeOnlyCell: {
    backgroundColor: theme.colors.primary, // Blue for stake-only (current date with unsettled bets)
  },
  dayText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  otherMonthText: {
    color: theme.colors.text.light,
  },
  todayText: {
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.bold,
  },
  profitText: {
    color: 'white',
    fontWeight: theme.typography.fontWeight.bold,
  },
  lossText: {
    color: 'white',
    fontWeight: theme.typography.fontWeight.bold,
  },
  breakEvenText: {
    color: 'white',
    fontWeight: theme.typography.fontWeight.bold,
  },
  stakeOnlyText: {
    color: 'white',
    fontWeight: theme.typography.fontWeight.bold,
  },
  gradientCell: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  // Dropdown modal styles
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