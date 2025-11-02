import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions, Alert } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { AnalyticsData } from '../../services/supabaseAnalytics';
import { useAuth } from '../../contexts/AuthContext';
import TrueSharpShield from '../common/TrueSharpShield';
import ProfitOverTimeChart from './ProfitOverTimeChart';
import CustomChartCreator, { ChartConfig } from './CustomChartCreator';
import UpgradeToProModal from '../upgrade/UpgradeToProModal';

interface AnalyticsTabProps {
  analyticsData: AnalyticsData;
  loading: boolean;
  onRefresh: () => Promise<void>;
  filters?: any; // Optional filters for compatibility
}

interface ProChartWrapperProps {
  title: string;
  children: React.ReactNode;
  isPro: boolean;
  onUpgradePress: () => void;
}

const screenWidth = Dimensions.get('window').width;

// Pro Chart Wrapper Component
const ProChartWrapper: React.FC<ProChartWrapperProps> = ({ title, children, isPro, onUpgradePress }) => {
  if (isPro) {
    return <>{children}</>;
  }

  return (
    <View style={styles.proChartContainer}>
      <View style={styles.chartHeader}>
        <TrueSharpShield size={20} variant="default" style={styles.shieldIcon} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.proChartBlurred}>
        <View style={styles.proChartOverlay}>
          <Ionicons name="lock-closed" size={32} color={theme.colors.status.warning} />
          <Text style={styles.proUpgradeText}>Upgrade to Pro to unlock this chart</Text>
          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgradePress}>
            <Text style={styles.upgradeButtonText}>Learn More</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function AnalyticsTab({ analyticsData, loading, onRefresh, filters = {} }: AnalyticsTabProps) {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChart, setSelectedChart] = useState<'sport' | 'betType' | 'side'>('sport');
  const [customCharts, setCustomCharts] = useState<ChartConfig[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Determine if user is Pro
  const isPro = user?.profile?.pro === 'yes';

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const handleCreateCustomChart = (config: ChartConfig) => {
    setCustomCharts(prev => [...prev, config]);
  };

  const handleDeleteCustomChart = (chartId: string) => {
    Alert.alert(
      'Delete Chart',
      'Are you sure you want to delete this custom chart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setCustomCharts(prev => prev.filter(chart => chart.id !== chartId));
          },
        },
      ]
    );
  };

  // Helper function to get icons for each category
  const getCategoryIcon = (text: string, type: 'sport' | 'betType' | 'side'): string => {
    if (type === 'sport') {
      const sportIcons: { [key: string]: string } = {
        'BASEBALL': 'baseball',
        'FOOTBALL': 'american-football',
        'BASKETBALL': 'basketball',
        'HOCKEY': 'disc',
        'SOCCER': 'football',
        'MMA': 'fitness',
        'TENNIS': 'tennis',
        'GOLF': 'golf',
        'BOXING': 'fitness-outline'
      };
      return sportIcons[text.toUpperCase()] || 'trophy';
    }
    
    if (type === 'betType') {
      const betTypeIcons: { [key: string]: string } = {
        'MONEYLINE': 'trending-up',
        'SPREAD': 'swap-horizontal',
        'TOTAL': 'calculator',
        'OVER': 'arrow-up',
        'UNDER': 'arrow-down',
        'PLAYER PROP': 'person',
        'TEAM PROP': 'people',
        'PARLAY': 'git-branch',
        'FUTURES': 'time',
        'LIVE': 'radio'
      };
      return betTypeIcons[text.toUpperCase()] || 'stats-chart';
    }
    
    if (type === 'side') {
      const sideIcons: { [key: string]: string } = {
        'HOME': 'home',
        'AWAY': 'airplane',
        'OVER': 'arrow-up',
        'UNDER': 'arrow-down',
        'YES': 'checkmark-circle',
        'NO': 'close-circle',
        'FAVORITE': 'star',
        'UNDERDOG': 'star-outline'
      };
      return sideIcons[text.toUpperCase()] || 'help-circle';
    }
    
    return 'help-circle';
  };

  // Helper function to map leagues to sports and format text
  const formatDisplayText = (text: string, type: 'sport' | 'betType' | 'side'): string => {
    if (!text) return 'UNKNOWN';
    
    let formatted = text;
    
    // Map leagues to sports for sport type
    if (type === 'sport') {
      const leagueToSportMap: { [key: string]: string } = {
        'mlb': 'BASEBALL',
        'nfl': 'FOOTBALL',
        'nba': 'BASKETBALL',
        'nhl': 'HOCKEY',
        'ncaab': 'BASKETBALL',
        'ncaaf': 'FOOTBALL',
        'mls': 'SOCCER',
        'ufc': 'MMA',
        'tennis': 'TENNIS',
        'golf': 'GOLF',
        'boxing': 'BOXING',
        'baseball': 'BASEBALL',
        'football': 'FOOTBALL',
        'basketball': 'BASKETBALL',
        'hockey': 'HOCKEY',
        'soccer': 'SOCCER',
        'mma': 'MMA'
      };
      
      const lowerText = formatted.toLowerCase();
      if (leagueToSportMap[lowerText]) {
        formatted = leagueToSportMap[lowerText];
      }
    }
    
    // Format bet types
    if (type === 'betType') {
      formatted = formatted.replace(/_/g, ' ');
    }
    
    // Convert to uppercase
    return formatted.toUpperCase();
  };

  const renderProfitBreakdownCard = () => {
    // Manual breakdown calculation as fallback - properly handle parlays
    const calculateManualBreakdown = (type: 'sport' | 'betType' | 'side') => {
      if (!analyticsData.recentBets || analyticsData.recentBets.length === 0) {
        return [];
      }

      // First group parlays and singles using the parlay grouping logic
      const parlayGroups = new Map<string, any[]>();
      const singles: any[] = [];

      analyticsData.recentBets.forEach(bet => {
        if (bet.parlay_id && bet.is_parlay) {
          if (!parlayGroups.has(bet.parlay_id)) {
            parlayGroups.set(bet.parlay_id, []);
          }
          parlayGroups.get(bet.parlay_id)!.push(bet);
        } else {
          singles.push(bet);
        }
      });

      const breakdownData: { [key: string]: { bets: number; profit: number; wins: number } } = {};
      
      // Process single bets normally
      singles.forEach(bet => {
        let key: string;
        switch (type) {
          case 'sport':
            key = formatDisplayText(bet.sport || bet.league || 'Unknown', 'sport');
            break;
          case 'betType':
            key = formatDisplayText(bet.bet_type || 'Unknown', 'betType');
            break;
          case 'side':
            key = formatDisplayText(bet.side || 'Unknown', 'side');
            break;
          default:
            key = 'UNKNOWN';
        }

        if (!breakdownData[key]) {
          breakdownData[key] = { bets: 0, profit: 0, wins: 0 };
        }
        
        breakdownData[key].bets += 1;
        
        // Use database profit field if available
        if (bet.profit !== null && bet.profit !== undefined) {
          breakdownData[key].profit += bet.profit;
          if (bet.profit > 0) breakdownData[key].wins += 1;
        } else {
          // Fall back to calculation
          if (bet.status === 'won' && bet.potential_payout) {
            const calculatedProfit = (bet.potential_payout || 0) - (bet.stake || 0);
            breakdownData[key].profit += calculatedProfit;
            breakdownData[key].wins += 1;
          } else if (bet.status === 'lost' && bet.stake) {
            breakdownData[key].profit -= bet.stake;
          }
        }
      });

      // Process parlays as single bets
      parlayGroups.forEach((parlayLegs, parlayId) => {
        const firstLeg = parlayLegs[0];
        
        // For breakdown categorization, we need to decide how to categorize parlays
        let key: string;
        switch (type) {
          case 'sport':
            // For parlays spanning multiple sports, use 'MULTI-SPORT'
            const sports = new Set(parlayLegs.map(leg => formatDisplayText(leg.sport || leg.league || 'Unknown', 'sport')));
            key = sports.size > 1 ? 'MULTI-SPORT' : Array.from(sports)[0];
            break;
          case 'betType':
            // For parlays, always use 'PARLAY' as the bet type
            key = 'PARLAY';
            break;
          case 'side':
            // For parlays spanning multiple sides, use 'MULTI-SIDE'
            const sides = new Set(parlayLegs.map(leg => formatDisplayText(leg.side || 'Unknown', 'side')));
            key = sides.size > 1 ? 'MULTI-SIDE' : Array.from(sides)[0];
            break;
          default:
            key = 'UNKNOWN';
        }

        if (!breakdownData[key]) {
          breakdownData[key] = { bets: 0, profit: 0, wins: 0 };
        }
        
        // Count the parlay as 1 bet (not per leg)
        breakdownData[key].bets += 1;
        
        // Use profit from first leg (all legs should have same profit for parlays)
        if (firstLeg.profit !== null && firstLeg.profit !== undefined) {
          breakdownData[key].profit += firstLeg.profit;
          if (firstLeg.profit > 0) breakdownData[key].wins += 1;
        } else {
          // Fall back to parlay calculation based on leg statuses
          const lostLegs = parlayLegs.filter(leg => leg.status === 'lost');
          const wonLegs = parlayLegs.filter(leg => leg.status === 'won');
          const settledLegs = parlayLegs.filter(leg => 
            leg.status === 'won' || leg.status === 'lost' || leg.status === 'void' || leg.status === 'push'
          );
          
          if (settledLegs.length === parlayLegs.length) {
            if (lostLegs.length > 0) {
              // Parlay lost
              breakdownData[key].profit -= (firstLeg.stake || 0);
            } else if (wonLegs.length === parlayLegs.length) {
              // Parlay won
              const parlayProfit = (firstLeg.potential_payout || 0) - (firstLeg.stake || 0);
              breakdownData[key].profit += parlayProfit;
              breakdownData[key].wins += 1;
            }
            // Void/push cases result in no profit/loss
          }
        }
      });

      return Object.entries(breakdownData)
        .map(([name, data]) => ({
          name,
          profit: data.profit,
          bets: data.bets,
          winRate: data.bets > 0 ? (data.wins / data.bets) * 100 : 0,
        }))
        .sort((a, b) => b.profit - a.profit);
    };

    // Get breakdown data based on selected chart type
    const getBreakdownData = () => {
      switch (selectedChart) {
        case 'sport':
          // Use service data if available, otherwise calculate manually
          if (analyticsData.sportBreakdown && analyticsData.sportBreakdown.length > 0) {
            const formattedData = analyticsData.sportBreakdown
              .filter(item => item && typeof item.profit === 'number' && !isNaN(item.profit) && isFinite(item.profit))
              .map(item => ({
                name: formatDisplayText(item.sport || 'Unknown', 'sport'),
                profit: Number(item.profit) || 0,
                bets: item.bets || 0
              }));
            
            // Combine entries with the same formatted name (e.g., NFL + NCAAF -> FOOTBALL)
            const combinedData: { [key: string]: { name: string; profit: number; bets: number } } = {};
            formattedData.forEach(item => {
              if (!combinedData[item.name]) {
                combinedData[item.name] = { name: item.name, profit: 0, bets: 0 };
              }
              combinedData[item.name].profit += item.profit;
              combinedData[item.name].bets += item.bets;
            });
            
            return Object.values(combinedData).sort((a, b) => b.profit - a.profit);
          } else {
            return calculateManualBreakdown('sport');
          }
            
        case 'betType':
          if (analyticsData.betTypeBreakdown && analyticsData.betTypeBreakdown.length > 0) {
            const formattedData = analyticsData.betTypeBreakdown
              .filter(item => item && item.betType && typeof item.profit === 'number' && !isNaN(item.profit) && isFinite(item.profit))
              .map(item => ({
                name: formatDisplayText(item.betType || 'Unknown', 'betType'),
                profit: Number(item.profit) || 0,
                bets: item.bets || 0
              }));
            
            // Combine entries with the same formatted name
            const combinedData: { [key: string]: { name: string; profit: number; bets: number } } = {};
            formattedData.forEach(item => {
              if (!combinedData[item.name]) {
                combinedData[item.name] = { name: item.name, profit: 0, bets: 0 };
              }
              combinedData[item.name].profit += item.profit;
              combinedData[item.name].bets += item.bets;
            });
            
            return Object.values(combinedData).sort((a, b) => b.profit - a.profit);
          } else {
            return calculateManualBreakdown('betType');
          }
            
        case 'side':
          if (analyticsData.sideBreakdown && analyticsData.sideBreakdown.length > 0) {
            const formattedData = analyticsData.sideBreakdown
              .filter(item => item && item.side && typeof item.profit === 'number' && !isNaN(item.profit) && isFinite(item.profit))
              .map(item => ({
                name: formatDisplayText(item.side || 'Unknown', 'side'),
                profit: Number(item.profit) || 0,
                bets: item.bets || 0
              }));
            
            // Combine entries with the same formatted name
            const combinedData: { [key: string]: { name: string; profit: number; bets: number } } = {};
            formattedData.forEach(item => {
              if (!combinedData[item.name]) {
                combinedData[item.name] = { name: item.name, profit: 0, bets: 0 };
              }
              combinedData[item.name].profit += item.profit;
              combinedData[item.name].bets += item.bets;
            });
            
            return Object.values(combinedData).sort((a, b) => b.profit - a.profit);
          } else {
            return calculateManualBreakdown('side');
          }
            
        default:
          return [];
      }
    };

    const breakdownData = getBreakdownData();
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    return (
      <View style={styles.profitBreakdownContainer}>
        <View style={styles.chartHeader}>
          <TrueSharpShield size={20} variant="default" style={styles.shieldIcon} />
          <Text style={styles.sectionTitle}>Profit Breakdown</Text>
        </View>
        
        {/* Chart Type Selector */}
        <View style={styles.chartSelector}>
          {[
            { key: 'sport', label: 'By Sport', icon: 'basketball' },
            { key: 'betType', label: 'By Bet Type', icon: 'stats-chart' },
            { key: 'side', label: 'By Side', icon: 'swap-horizontal' },
          ].map((chart) => (
            <TouchableOpacity
              key={chart.key}
              style={[
                styles.chartSelectorButton,
                selectedChart === chart.key && styles.activeChartSelector,
              ]}
              onPress={() => setSelectedChart(chart.key as any)}
            >
              <Ionicons
                name={chart.icon as any}
                size={16}
                color={selectedChart === chart.key ? theme.colors.primary : theme.colors.text.secondary}
              />
              <Text
                style={[
                  styles.chartSelectorText,
                  selectedChart === chart.key && styles.activeChartSelectorText,
                ]}
              >
                {chart.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Scrollable List */}
        <View style={styles.breakdownListContainer}>
          {breakdownData && breakdownData.length > 0 ? (
            <ScrollView style={styles.breakdownList} showsVerticalScrollIndicator={false}>
              {breakdownData.map((item, index) => (
                <View key={`${selectedChart}-${index}-${item.name}`} style={styles.breakdownItem}>
                  <View style={styles.breakdownItemLeft}>
                    <View style={styles.breakdownItemNameRow}>
                      <Ionicons 
                        name={getCategoryIcon(item.name, selectedChart) as any} 
                        size={16} 
                        color={theme.colors.text.secondary} 
                        style={styles.breakdownItemIcon} 
                      />
                      <Text style={styles.breakdownItemName}>{item.name}</Text>
                    </View>
                    <Text style={styles.breakdownItemBets}>{item.bets} bets</Text>
                  </View>
                  <Text
                    style={[
                      styles.breakdownItemProfit,
                      {
                        color: item.profit >= 0 ? theme.colors.betting.won : theme.colors.betting.lost,
                      },
                    ]}
                  >
                    {item.profit >= 0 ? '+' : ''}{formatCurrency(item.profit)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyBreakdown}>
              <Ionicons name="bar-chart-outline" size={32} color={theme.colors.text.light} />
              <Text style={styles.emptyBreakdownText}>
                {analyticsData.recentBets?.length > 0 ? 'No data for this breakdown' : 'No bets data available'}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderPerformanceOverTimeChart = () => {
    // Use the dedicated ProfitOverTimeChart component with integrated ROI
    return (
      <ProfitOverTimeChart 
        chartData={analyticsData.dailyProfitData || []}
        filters={{} as any} // We'll pass empty filters for now
        loading={loading}
      />
    );
  };

  const renderBettingActivityChart = () => {
    // Calculate betting activity data
    const totalBets = analyticsData.metrics.totalBets;
    const straightBets = analyticsData.metrics.straightBetsCount;
    const parlayBets = analyticsData.metrics.parlayBetsCount;
    const avgStake = analyticsData.metrics.avgStake;

    const activityData = [
      { name: 'Straight Bets', value: straightBets, percentage: totalBets > 0 ? (straightBets / totalBets * 100) : 0 },
      { name: 'Parlay Bets', value: parlayBets, percentage: totalBets > 0 ? (parlayBets / totalBets * 100) : 0 },
    ];

    return (
      <View style={styles.proChartContainer}>
        <View style={styles.chartHeader}>
          <TrueSharpShield size={20} variant="default" style={styles.shieldIcon} />
          <Text style={styles.sectionTitle}>Betting Activity</Text>
        </View>
        
        <View style={styles.activityContainer}>
          {activityData.map((item, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityItemHeader}>
                <Text style={styles.activityItemName}>{item.name}</Text>
                <Text style={styles.activityItemValue}>{item.value}</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar,
                    { 
                      width: `${item.percentage}%`,
                      backgroundColor: index === 0 ? theme.colors.primary : theme.colors.status.warning 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.activityItemPercentage}>{item.percentage.toFixed(1)}%</Text>
            </View>
          ))}
          
          <View style={styles.activitySummary}>
            <Text style={styles.activitySummaryText}>
              Average Stake: ${avgStake.toFixed(0)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Utility functions for odds conversion
  const oddsToWinPercentage = (odds: number): number => {
    if (odds > 0) {
      // Positive odds: win% = 100 / (odds + 100)
      return (100 / (odds + 100)) * 100;
    } else {
      // Negative odds: win% = |odds| / (|odds| + 100)
      return (Math.abs(odds) / (Math.abs(odds) + 100)) * 100;
    }
  };

  const getOddsBucket = (odds: number): number => {
    const winPercentage = oddsToWinPercentage(odds);
    // Create 10 buckets: 0-10%, 10-20%, ..., 90-100%
    return Math.min(Math.floor(winPercentage / 10), 9);
  };

  const getBucketLabel = (bucket: number): string => {
    const start = bucket * 10;
    const end = (bucket + 1) * 10;
    return `${start}-${end}%`;
  };

  const renderOddsCalibrationChart = () => {
    // Create odds calibration data from user's bets
    const createCalibrationData = () => {
      if (!analyticsData.recentBets || analyticsData.recentBets.length === 0) {
        return [];
      }

      // Initialize 10 buckets
      const buckets: { [key: number]: { wins: number; total: number; bets: any[] } } = {};
      for (let i = 0; i < 10; i++) {
        buckets[i] = { wins: 0, total: 0, bets: [] };
      }

      // Process all settled bets
      analyticsData.recentBets
        .filter(bet => bet.odds && ['won', 'lost'].includes(bet.status))
        .forEach(bet => {
          const bucket = getOddsBucket(Number(bet.odds));
          buckets[bucket].total += 1;
          buckets[bucket].bets.push(bet);
          if (bet.status === 'won') {
            buckets[bucket].wins += 1;
          }
        });

      // Convert to chart data
      return Object.entries(buckets)
        .map(([bucketIndex, data]) => {
          const bucket = parseInt(bucketIndex);
          const expectedWinRate = (bucket * 10) + 5; // Middle of bucket range
          const actualWinRate = data.total > 0 ? (data.wins / data.total) * 100 : 0;
          
          return {
            bucket,
            range: getBucketLabel(bucket),
            expected: expectedWinRate,
            actual: actualWinRate,
            bets: data.total,
            betsList: data.bets
          };
        })
        .filter(item => item.bets > 0); // Only show buckets with bets
    };

    const calibrationData = createCalibrationData();
    
    // Analysis for best/worst odds ranges
    const getOddsAnalysis = () => {
      if (calibrationData.length === 0) return null;
      
      const analysisData = calibrationData.map(item => ({
        ...item,
        performance: item.actual - item.expected // How much better/worse than expected
      }));
      
      const bestRange = analysisData.reduce((best, current) => 
        current.performance > best.performance ? current : best
      );
      
      const worstRange = analysisData.reduce((worst, current) => 
        current.performance < worst.performance ? current : worst
      );
      
      return { bestRange, worstRange };
    };

    const analysis = getOddsAnalysis();
    
    const chartConfig = {
      backgroundColor: theme.colors.card,
      backgroundGradientFrom: theme.colors.card,
      backgroundGradientTo: theme.colors.card,
      decimalPlaces: 1,
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
      propsForVerticalLabels: {
        rotation: 45, // Rotate x-axis labels 45 degrees
        fontSize: 10,
        textAnchor: 'start' as const,
      },
      propsForHorizontalLabels: {
        fontSize: 10,
      },
    };

    return (
      <View style={styles.proChartContainer}>
        <View style={styles.chartHeader}>
          <TrueSharpShield size={20} variant="default" style={styles.shieldIcon} />
          <Text style={styles.sectionTitle}>Odds Calibration Analysis</Text>
        </View>
        
        {calibrationData.length > 0 ? (
          <View style={styles.calibrationChartContainer}>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: theme.colors.status.warning }]} />
                <Text style={styles.legendText}>Expected Win Rate</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: theme.colors.betting.won }]} />
                <Text style={styles.legendText}>Your Actual Win Rate</Text>
              </View>
            </View>
            
            <LineChart
              data={{
                labels: calibrationData.map(d => d.range),
                datasets: [
                  {
                    // Expected win rate (diagonal line from 0,0 to 100,100)
                    data: calibrationData.map(d => d.expected),
                    color: (opacity = 1) => `rgba(217, 119, 6, ${opacity})`, // Orange for expected
                    strokeWidth: 3,
                  },
                  {
                    // Actual win rate (user's performance)
                    data: calibrationData.map(d => d.actual),
                    color: (opacity = 1) => `rgba(5, 150, 105, ${opacity})`, // Green for actual
                    strokeWidth: 3,
                  },
                ],
              }}
              width={screenWidth - 64} // Reduced width to prevent cutoff
              height={280} // Increased height for rotated labels
              chartConfig={{
                ...chartConfig,
                formatYLabel: (value: string) => `${parseFloat(value).toFixed(0)}%`,
              }}
              bezier={false}
              style={styles.chart}
              withHorizontalLabels={true}
              withVerticalLabels={true}
              withInnerLines={true}
              withOuterLines={false}
              withShadow={false}
              withDots={true}
              fromZero={true}
              yAxisLabel=""
              yAxisSuffix=""
              segments={4}
              onDataPointClick={(data) => {
                const pointIndex = data.index;
                const point = calibrationData[pointIndex];
                if (point) {
                  Alert.alert(
                    'Odds Range Details',
                    `Win Rate Range: ${point.range}\nExpected: ${point.expected.toFixed(1)}%\nActual: ${point.actual.toFixed(1)}%\nTotal Bets: ${point.bets}\nPerformance: ${point.actual > point.expected ? 'Above' : 'Below'} expected`,
                    [{ text: 'OK' }]
                  );
                }
              }}
            />
            
            {analysis && (
              <View style={styles.oddsAnalysisContainer}>
                <View style={styles.oddsAnalysisItem}>
                  <View style={[styles.analysisIcon, { backgroundColor: `${theme.colors.betting.won}20` }]}>
                    <Ionicons name="trending-up" size={16} color={theme.colors.betting.won} />
                  </View>
                  <View style={styles.analysisContent}>
                    <Text style={styles.analysisTitle}>Best Odds Range</Text>
                    <Text style={styles.analysisRange}>{analysis.bestRange.range}</Text>
                    <Text style={styles.analysisDescription}>
                      You're {analysis.bestRange.performance > 0 ? 
                        `${analysis.bestRange.performance.toFixed(1)}% above expected` : 
                        'performing as expected'} in this range
                    </Text>
                  </View>
                </View>
                
                <View style={styles.oddsAnalysisItem}>
                  <View style={[styles.analysisIcon, { backgroundColor: `${theme.colors.betting.lost}20` }]}>
                    <Ionicons name="trending-down" size={16} color={theme.colors.betting.lost} />
                  </View>
                  <View style={styles.analysisContent}>
                    <Text style={styles.analysisTitle}>Challenging Odds Range</Text>
                    <Text style={styles.analysisRange}>{analysis.worstRange.range}</Text>
                    <Text style={styles.analysisDescription}>
                      You're {analysis.worstRange.performance < 0 ? 
                        `${Math.abs(analysis.worstRange.performance).toFixed(1)}% below expected` : 
                        'performing above expected'} in this range
                    </Text>
                  </View>
                </View>
              </View>
            )}
            
            <View style={styles.calibrationSummary}>
              <Text style={styles.calibrationSummaryText}>
                Green line above orange = outperforming market expectations
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyChart}>
            <Ionicons name="analytics-outline" size={48} color={theme.colors.text.light} />
            <Text style={styles.emptyChartText}>Place more bets to see calibration analysis</Text>
          </View>
        )}
      </View>
    );
  };

  const renderCustomChartCreator = () => (
    <CustomChartCreator
      onChartCreate={handleCreateCustomChart}
      savedCharts={customCharts}
      onDeleteChart={handleDeleteCustomChart}
      onUpgradePress={() => setShowUpgradeModal(true)}
    />
  );

  const renderAnalyticsAI = () => (
    <View style={styles.aiContainer}>
      {/* Header Section */}
      <View style={styles.aiHeader}>
        <View style={styles.aiHeaderLeft}>
          <TrueSharpShield size={20} variant="default" style={styles.aiShieldIcon} />
          <View style={styles.aiTitleContainer}>
            <Text style={styles.aiTitle}>AI Betting Assistant</Text>
            <Text style={styles.aiSubtitle}>Powered by AI</Text>
          </View>
        </View>
        <View style={styles.comingSoonBadge}>
          <Ionicons name="time" size={12} color={theme.colors.status.warning} />
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.aiContent}>
        <View style={styles.aiHeroSection}>
          <View style={styles.aiIconContainer}>
            <Ionicons name="sparkles" size={24} color={theme.colors.primary} />
          </View>
          
          <Text style={styles.aiMainText}>
            AI-powered insights to improve your betting strategy and maximize profitability
          </Text>
        </View>

        {/* Features Grid */}
        <View style={styles.aiFeatures}>
          <View style={styles.aiFeature}>
            <View style={[styles.aiFeatureIcon, { backgroundColor: `${theme.colors.betting.won}15` }]}>
              <Ionicons name="trending-up" size={16} color={theme.colors.betting.won} />
            </View>
            <Text style={styles.aiFeatureTitle} numberOfLines={2}>Performance{'\n'}Analysis</Text>
          </View>
          
          <View style={styles.aiFeature}>
            <View style={[styles.aiFeatureIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
              <Ionicons name="bulb" size={16} color={theme.colors.primary} />
            </View>
            <Text style={styles.aiFeatureTitle} numberOfLines={2}>Smart{'\n'}Recommendations</Text>
          </View>
          
          <View style={styles.aiFeature}>
            <View style={[styles.aiFeatureIcon, { backgroundColor: `${theme.colors.secondary}15` }]}>
              <Ionicons name="analytics" size={16} color={theme.colors.secondary} />
            </View>
            <Text style={styles.aiFeatureTitle} numberOfLines={2}>Pattern{'\n'}Recognition</Text>
          </View>
          
          <View style={styles.aiFeature}>
            <View style={[styles.aiFeatureIcon, { backgroundColor: `${theme.colors.accent}15` }]}>
              <Ionicons name="settings" size={16} color={theme.colors.accent} />
            </View>
            <Text style={styles.aiFeatureTitle} numberOfLines={2}>Bet{'\n'}Optimization</Text>
          </View>
        </View>

        {/* Pro Member Section */}
        <View style={styles.aiProSection}>
          <View style={styles.aiProHeader}>
            <Ionicons name="star" size={14} color={theme.colors.status.warning} />
            <Text style={styles.aiProText}>Exclusive to Pro Members</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPerformanceMetrics = () => {
    const { metrics } = analyticsData;
    
    // Safely format numbers to prevent NaN display
    const safeNumber = (num: number, fallback: number = 0): number => {
      return (typeof num === 'number' && !isNaN(num) && isFinite(num)) ? num : fallback;
    };
    
    // Enhanced metrics with improved formatting and colors
    const metricsData = [
      { 
        label: 'Total Bets', 
        value: safeNumber(metrics.totalBets).toString(), 
        icon: 'stats-chart',
        color: theme.colors.primary,
        bgColor: `${theme.colors.primary}15`
      },
      { 
        label: 'Win Rate', 
        value: `${safeNumber(metrics.winRate).toFixed(1)}%`, 
        icon: 'trophy',
        color: theme.colors.betting.won,
        bgColor: `${theme.colors.betting.won}15`
      },
      { 
        label: 'ROI', 
        value: `${safeNumber(metrics.roi) >= 0 ? '+' : ''}${safeNumber(metrics.roi).toFixed(1)}%`, 
        icon: 'trending-up',
        color: safeNumber(metrics.roi) >= 0 ? theme.colors.betting.won : theme.colors.betting.lost,
        bgColor: safeNumber(metrics.roi) >= 0 ? `${theme.colors.betting.won}15` : `${theme.colors.betting.lost}15`
      },
      { 
        label: 'Total Profit', 
        value: `${safeNumber(metrics.totalProfit) >= 0 ? '+' : ''}$${Math.abs(safeNumber(metrics.totalProfit)).toFixed(0)}`, 
        icon: 'cash',
        color: safeNumber(metrics.totalProfit) >= 0 ? theme.colors.betting.won : theme.colors.betting.lost,
        bgColor: safeNumber(metrics.totalProfit) >= 0 ? `${theme.colors.betting.won}15` : `${theme.colors.betting.lost}15`
      },
      { 
        label: 'Avg Stake', 
        value: `$${safeNumber(metrics.avgStake).toFixed(0)}`, 
        icon: 'wallet',
        color: theme.colors.secondary,
        bgColor: `${theme.colors.secondary}15`
      },
      { 
        label: 'Current Streak', 
        value: `${safeNumber(metrics.currentStreak)} ${(metrics.streakType || 'win').charAt(0).toUpperCase()}`, 
        icon: 'flash',
        color: (metrics.streakType === 'win') ? theme.colors.betting.won : theme.colors.betting.lost,
        bgColor: (metrics.streakType === 'win') ? `${theme.colors.betting.won}15` : `${theme.colors.betting.lost}15`
      },
      { 
        label: 'Straight Bets', 
        value: safeNumber(metrics.straightBetsCount).toString(), 
        icon: 'remove',
        color: theme.colors.accent,
        bgColor: `${theme.colors.accent}15`
      },
      { 
        label: 'Parlay Bets', 
        value: safeNumber(metrics.parlayBetsCount).toString(), 
        icon: 'git-branch',
        color: theme.colors.status.warning,
        bgColor: `${theme.colors.status.warning}15`
      },
    ];

    return (
      <View style={styles.metricsContainer}>
        <View style={styles.metricsHeader}>
          <TrueSharpShield size={20} variant="default" style={styles.shieldIcon} />
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
        </View>
        <View style={styles.metricsGrid}>
          {metricsData.map((metric, index) => (
            <View key={index} style={[styles.metricCard, { backgroundColor: metric.bgColor }]}>
              <View style={[styles.metricIconContainer, { backgroundColor: metric.color }]}>
                <Ionicons name={metric.icon as any} size={16} color="white" />
              </View>
              <Text style={[styles.metricValue, { color: metric.color }]} numberOfLines={1} adjustsFontSizeToFit>
                {metric.value}
              </Text>
              <Text style={styles.metricLabel} numberOfLines={2} adjustsFontSizeToFit>
                {metric.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {renderPerformanceMetrics()}
      {renderProfitBreakdownCard()}
      
      {/* Pro Charts */}
      <ProChartWrapper title="Performance Over Time" isPro={isPro} onUpgradePress={() => setShowUpgradeModal(true)}>
        {renderPerformanceOverTimeChart()}
      </ProChartWrapper>

      <ProChartWrapper title="Betting Activity" isPro={isPro} onUpgradePress={() => setShowUpgradeModal(true)}>
        {renderBettingActivityChart()}
      </ProChartWrapper>

      <ProChartWrapper title="Odds Calibration Analysis" isPro={isPro} onUpgradePress={() => setShowUpgradeModal(true)}>
        {renderOddsCalibrationChart()}
      </ProChartWrapper>

      {renderCustomChartCreator()}
      {renderAnalyticsAI()}
      
      {/* Upgrade to Pro Modal */}
      <UpgradeToProModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSelectPlan={(planType, productId, price) => {
          // Handle the upgrade logic here - integrate with payment processing
          setShowUpgradeModal(false);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  metricsContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  metricsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  shieldIcon: {
    opacity: 0.8,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  profitBreakdownContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  breakdownListContainer: {
    minHeight: 150,
    maxHeight: 200,
    backgroundColor: theme.colors.surface,
  },
  breakdownList: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.xs,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    marginBottom: 1,
  },
  breakdownItemLeft: {
    flex: 1,
  },
  breakdownItemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  breakdownItemIcon: {
    marginRight: theme.spacing.xs,
  },
  breakdownItemName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    flex: 1,
  },
  breakdownItemBets: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  breakdownItemProfit: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
  },
  emptyBreakdown: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyBreakdownText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  // Pro Chart Wrapper Styles
  proChartContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  proChartBlurred: {
    height: 200,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.6,
  },
  proChartOverlay: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  proUpgradeText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  upgradeButton: {
    backgroundColor: theme.colors.status.warning,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  upgradeButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'white',
    fontWeight: theme.typography.fontWeight.semibold,
  },
  // Betting Activity Chart Styles
  activityContainer: {
    gap: theme.spacing.md,
  },
  activityItem: {
    gap: theme.spacing.xs,
  },
  activityItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityItemName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  activityItemValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  activityItemPercentage: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'right',
  },
  activitySummary: {
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'center',
  },
  activitySummaryText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  // Odds Calibration Chart Styles
  calibrationContainer: {
    gap: theme.spacing.sm,
  },
  calibrationChartContainer: {
    paddingBottom: theme.spacing.lg, // Extra space for rotated labels
    paddingHorizontal: theme.spacing.sm, // Horizontal padding for rotated labels
    alignItems: 'center', // Center the chart
  },
  calibrationHeader: {
    flexDirection: 'row',
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.border,
  },
  calibrationHeaderText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  calibrationItem: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  calibrationRange: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  calibrationValue: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'center',
  },
  calibrationBets: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  calibrationFooter: {
    paddingTop: theme.spacing.sm,
    alignItems: 'center',
  },
  calibrationFooterText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Performance Chart Styles
  performanceChartContainer: {
    gap: theme.spacing.sm,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  // Calibration Chart Styles - merged with existing definition above
  calibrationSummary: {
    paddingTop: theme.spacing.sm,
    alignItems: 'center',
  },
  calibrationSummaryText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Performance Over Time Chart Styles
  performanceOverTimeContainer: {
    gap: theme.spacing.sm,
  },
  roiChartContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  roiChartContent: {
    gap: theme.spacing.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '23%', // 4 cards per row with small gaps
    aspectRatio: 1, // Square cards
    backgroundColor: theme.colors.card,
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  metricIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  metricValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 9,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 11,
  },
  proChartsContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  helpButton: {
    padding: theme.spacing.xs,
  },
  chartSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chartSelectorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  activeChartSelector: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  chartSelectorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  activeChartSelectorText: {
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  chartContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  chartTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  chart: {
    borderRadius: theme.borderRadius.lg,
  },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyChartText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  aiContainer: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: `${theme.colors.primary}08`,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  aiHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiShieldIcon: {
    opacity: 0.9,
    marginRight: theme.spacing.sm,
  },
  aiTitleContainer: {
    flex: 1,
  },
  aiTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 1,
  },
  aiSubtitle: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  aiContent: {
    padding: theme.spacing.md,
  },
  aiHeroSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  aiIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
    borderWidth: 1.5,
    borderColor: `${theme.colors.primary}30`,
  },
  aiMainText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: theme.spacing.sm,
  },
  aiFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  aiFeature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    width: '48%',
    minHeight: 50,
  },
  aiFeatureIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.xs,
    marginTop: 2,
  },
  aiFeatureTitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
    flex: 1,
    lineHeight: 14,
  },
  aiProSection: {
    backgroundColor: `${theme.colors.status.warning}10`,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: `${theme.colors.status.warning}30`,
  },
  aiProHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiProText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.status.warning,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing.xs,
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.status.warning}20`,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: `${theme.colors.status.warning}40`,
  },
  comingSoonText: {
    fontSize: 10,
    color: theme.colors.status.warning,
    fontWeight: theme.typography.fontWeight.bold,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  // Odds Analysis Styles
  oddsAnalysisContainer: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  oddsAnalysisItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  analysisIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisContent: {
    flex: 1,
  },
  analysisTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  analysisRange: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  analysisDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
});