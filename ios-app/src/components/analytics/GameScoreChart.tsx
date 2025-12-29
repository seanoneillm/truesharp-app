import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Dimensions, Image, Text, View } from 'react-native'
import { theme } from '../../styles/theme'

interface GameScoreData {
  score: number
  gameLabel: string
  date: string
  eventId?: string
}

interface GameScoreChartProps {
  line: string
  isOver: boolean
  gameScores: GameScoreData[]
  loading?: boolean
}

export const GameScoreChart: React.FC<GameScoreChartProps> = ({
  line,
  isOver,
  gameScores,
  loading = false,
}) => {
  const screenWidth = Dimensions.get('window').width
  const lineValue = parseFloat(line)

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="refresh" size={20} color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading game history...</Text>
        </View>
      </View>
    )
  }

  if (gameScores.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.noDataContainer}>
          <Ionicons name="bar-chart-outline" size={24} color={theme.colors.text.light} />
          <Text style={styles.noDataText}>No historical data available</Text>
          <Text style={styles.noDataSubtext}>Chart will appear when game history is found</Text>
        </View>
      </View>
    )
  }

  const scores = gameScores.map(game => game.score)
  
  // Pad data to always have 10 bars for consistent positioning
  const paddedScores = [...scores]
  const paddedLabels = []
  
  // Add real labels for existing data
  for (let i = 0; i < scores.length; i++) {
    paddedLabels.push(`G${i + 1}`)
  }
  
  // Add invisible filler bars if we have fewer than 10 data points
  while (paddedScores.length < 10) {
    paddedScores.push(0) // Add invisible bars with 0 height
    paddedLabels.push('') // Empty label
  }

  // Use padded scores for bar heights
  const adjustedScores = paddedScores

  // Determine bar colors based on over/under and original scores vs line value
  const getBarColor = (originalScore: number, index: number) => {
    // Make filler bars (beyond actual data) transparent/invisible
    if (index >= scores.length) {
      return 'transparent'
    }
    
    if (isOver) {
      return originalScore > lineValue ? '#22c55e' : '#ef4444'
    } else {
      return originalScore < lineValue ? '#22c55e' : '#ef4444'
    }
  }

  // Calculate statistics using original scores
  const overCount = scores.filter(score => score > lineValue).length
  const underCount = scores.filter(score => score <= lineValue).length
  const winningCount = isOver ? overCount : underCount
  const winRate = Math.round((winningCount / scores.length) * 100)

  // Calculate chart scale - use 0 as baseline for accurate proportions
  const maxDataScore = Math.max(...adjustedScores)
  const maxScore = Math.max(maxDataScore, lineValue + 5) // Ensure line is always visible
  const minScore = 0 // Always start from 0 for accurate proportions

  // Calculate optimal dimensions based on screen size and container
  const containerPadding = theme.spacing.md * 2 // Left and right padding
  const chartWidth = screenWidth - containerPadding - 16 // Account for outer margins
  const chartHeight = 150 // Optimal height for readability
  const barWidth = Math.max((chartWidth - 80) / paddedScores.length, 20) // Dynamic bar width
  
  // Available height for bars (excluding padding for labels)
  const availableBarHeight = chartHeight - 60
  
  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleContainer}>
            <Image
              source={require('../../assets/truesharp-logo.png')}
              style={styles.titleLogo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Recent Performance</Text>
          </View>
          <View style={styles.winRateBadge}>
            <Text style={styles.winRateText}>{winRate}%</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          {isOver ? 'Over' : 'Under'} {line} in last {gameScores.length} games
        </Text>
      </View>

      {/* Custom Bar Chart */}
      <View style={styles.chartContainer}>
        <View style={styles.chartArea}>
          {/* Y-axis scale indicators */}
          <View style={styles.yAxisContainer}>
            {[...Array(3)].map((_, index) => {
              const value = Math.ceil(maxScore * (2 - index) / 2)
              const showLabel = value > 0
              return (
                <View key={index} style={styles.yAxisTick}>
                  <Text style={styles.yAxisLabel}>{showLabel ? value : ''}</Text>
                  <View style={styles.gridLine} />
                </View>
              )
            })}
          </View>

          {/* Bars Container */}
          <View style={styles.barsContainer}>
            {paddedScores.map((score, index) => {
              const isVisible = index < scores.length
              const barHeight = isVisible ? Math.max((score / maxScore) * availableBarHeight, 8) : 0
              const barColor = getBarColor(scores[index] || 0, index)
              
              return (
                <View key={index} style={styles.barColumn}>
                  {/* Bar */}
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: barColor,
                          width: barWidth,
                        }
                      ]}
                    />
                  </View>
                  
                  {/* Value label at base of bar */}
                  <View style={styles.valueContainer}>
                    {isVisible && (
                      <Text style={styles.valueLabel}>
                        {score}
                      </Text>
                    )}
                  </View>
                  
                  {/* Game label below value */}
                  <View style={styles.labelContainer}>
                    {isVisible && (
                      <Text style={styles.gameLabel}>G{index + 1}</Text>
                    )}
                  </View>
                </View>
              )
            })}
          </View>
        </View>

        {/* Line indicator for the betting line */}
        <View style={[
          styles.lineIndicator,
          { bottom: 52 + ((lineValue / maxScore) * availableBarHeight) }
        ]}>
          <View style={styles.lineDash} />
          <Text style={styles.lineLabel}>{line}</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.legendText}>
            {isOver ? 'Over' : 'Under'} {line} ({isOver ? overCount : underCount})
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>
            {isOver ? 'Under' : 'Over'} {line} ({isOver ? underCount : overCount})
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = {
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.border + '20',
  },
  
  // Header Section
  header: {
    marginBottom: theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: theme.spacing.xs,
  },
  titleContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.sm,
    flex: 1,
  },
  titleLogo: {
    width: 22,
    height: 22,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    letterSpacing: 0.3,
  },
  winRateBadge: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  winRateText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },

  // Chart Section
  chartContainer: {
    position: 'relative' as const,
    marginVertical: theme.spacing.sm,
    backgroundColor: '#fafafa',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border + '40',
  },
  chartArea: {
    flexDirection: 'row' as const,
    height: 150,
  },
  yAxisContainer: {
    width: 30,
    justifyContent: 'space-between' as const,
    paddingVertical: theme.spacing.xs,
    paddingBottom: 30, // Account for space at bottom
  },
  yAxisTick: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    height: 30, // Increased height for better spacing with 3 labels
  },
  yAxisLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
    width: 25,
    textAlign: 'right' as const,
  },
  gridLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border + '20',
    marginLeft: theme.spacing.xs,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    justifyContent: 'space-evenly' as const,
    paddingHorizontal: theme.spacing.xs,
    paddingBottom: 20, // Reduced from 30 to minimize space under labels
  },
  barColumn: {
    alignItems: 'center' as const,
    flex: 1,
    minHeight: 40, // Reduced from 50
  },
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end' as const,
    alignItems: 'center' as const,
    minHeight: 8,
  },
  bar: {
    borderRadius: theme.borderRadius.sm,
    minHeight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  valueContainer: {
    height: 16, // Reduced height
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: theme.spacing.xs / 2,
  },
  valueLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center' as const,
    color: '#000000', // Black text as requested
  },
  labelContainer: {
    height: 16, // Reduced height
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: 2, // Minimal margin
  },
  gameLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    textAlign: 'center' as const,
  },

  // Line Indicator
  lineIndicator: {
    position: 'absolute' as const,
    left: 30,
    right: 0,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    zIndex: 5,
  },
  lineDash: {
    flex: 1,
    height: 2,
    backgroundColor: theme.colors.primary,
    borderRadius: 1,
    opacity: 0.8,
  },
  lineLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },

  // Legend Section
  legend: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: theme.spacing.lg,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border + '20',
  },
  legendItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },

  // Loading and Error States
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  noDataContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed' as const,
    borderRadius: theme.borderRadius.lg,
  },
  noDataText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center' as const,
    fontWeight: theme.typography.fontWeight.medium,
    marginTop: theme.spacing.sm,
  },
  noDataSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.light,
    textAlign: 'center' as const,
    marginTop: theme.spacing.xs,
  },
}
