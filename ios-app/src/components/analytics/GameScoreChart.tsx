import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Dimensions, Image, Text, View } from 'react-native'
import { BarChart } from 'react-native-chart-kit'
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

  const data = {
    labels: paddedLabels,
    datasets: [
      {
        data: adjustedScores, // Use padded scores for display
        colors: paddedScores.map((score, index) => () => getBarColor(score, index)), // Use index to determine if filler bar
      },
    ],
  }

  const maxScore = Math.max(...adjustedScores)
  const minScore = Math.min(...adjustedScores)

  console.log(`📈 Chart data:
    Scores: [${scores.join(', ')}]
    Line: ${lineValue}
    Colors: [${scores.map(s => (s > lineValue ? 'GREEN' : 'RED')).join(', ')}]`)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Image
            source={require('../../assets/truesharp-logo.png')}
            style={styles.titleLogo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Recent Performance</Text>
          <View style={styles.winRateBadge}>
            <Text style={styles.winRateText}>{winRate}%</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          {isOver ? 'Over' : 'Under'} {line} in last {gameScores.length} games
        </Text>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.chartWrapper}>
          <BarChart
            data={data}
            width={screenWidth - 32} // Reduce width to fit container properly
            height={120} // Reduce height to minimize vertical whitespace
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: theme.colors.card,
              backgroundGradientTo: theme.colors.card,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(107, 114, 128, ${opacity * 0.6})`,
              labelColor: (opacity = 0.8) => `rgba(107, 114, 128, ${opacity})`,
              style: {
                borderRadius: 8,
                paddingLeft: 0, // Minimal left padding
                paddingRight: 0, // Minimal right padding
                paddingBottom: 0, // Remove bottom padding
                marginLeft: 0,
                marginRight: 0,
              },
              propsForLabels: {
                fontSize: 10,
                fontWeight: '600',
                fill: theme.colors.text.secondary,
              },
              propsForBackgroundLines: {
                stroke: theme.colors.border + '40',
                strokeWidth: 1,
              },
              fillShadowGradient: 'transparent',
              fillShadowGradientOpacity: 0,
              barPercentage: 0.85, // Increase to make bars wider and reduce spacing
            }}
            style={styles.chart}
            withCustomBarColorFromData={true}
            showBarTops={false}
            fromZero={true}
            withInnerLines={true}
            withVerticalLines={false}
            withOuterLines={true}
            yAxisSuffix=""
            yAxisInterval={1}
            segments={4}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            yLabelsOffset={-999} // Hide y-labels by moving them off-screen
            xLabelsOffset={-999} // Hide x-labels by moving them off-screen
            showValuesOnTopOfBars={false}
            formatYLabel={value => ''} // Return empty string for y-labels
            formatXLabel={value => ''} // Return empty string for x-labels
          />

          {/* Chart border and axis lines */}
          <View style={styles.chartBorderOverlay}>
            {/* Bottom axis line */}
            <View style={styles.bottomAxisLine} />
            {/* Left border line */}
            <View style={styles.leftBorderLine} />
            {/* Right border line */}
            <View style={styles.rightBorderLine} />
            {/* Top border line */}
            <View style={styles.topBorderLine} />
          </View>

          {/* Score labels positioned above each bar */}
          <View style={styles.scoreLabelsContainer}>
            {paddedScores.map((score, index) => (
              <View key={index} style={styles.scoreLabelWrapper}>
                <Text style={styles.scoreLabelText}>
                  {index < scores.length ? score : ''} {/* Only show text for actual data */}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.legendText}>
            {isOver ? 'Over' : 'Under'} {line} ({isOver ? overCount : underCount})
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
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
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.colors.border + '30',
  },
  header: {
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '20',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs / 2,
  },
  titleLogo: {
    width: 20, // Increase logo size
    height: 20,
  },
  title: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#000000',
    letterSpacing: 0.2,
    flex: 1,
  },
  winRateBadge: {
    backgroundColor: theme.colors.text.secondary + '15',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  winRateText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.light,
    fontWeight: theme.typography.fontWeight.normal,
  },
  chartContainer: {
    marginVertical: theme.spacing.xs, // Reduce vertical margin
    width: '100%',
    overflow: 'hidden' as const,
  },
  chartWrapper: {
    position: 'relative' as const,
    width: '100%',
    alignItems: 'flex-start' as const,
    justifyContent: 'flex-start' as const,
    marginLeft: -50, // Move chart further left to reduce left whitespace
  },
  chart: {
    borderRadius: theme.borderRadius.md,
  },
  chartBorderOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none' as const,
  },
  bottomAxisLine: {
    position: 'absolute' as const,
    bottom: 35,
    left: 79,
    right: 0, // Extended to the very edge of the container
    height: 1.5,
    backgroundColor: theme.colors.text.secondary + '60',
  },
  leftBorderLine: {
    position: 'absolute' as const,
    top: 10,
    bottom: 35,
    left: 79,
    width: 1,
    backgroundColor: theme.colors.border + '40',
  },
  rightBorderLine: {
    position: 'absolute' as const,
    top: 10,
    bottom: 35,
    right: -15, // Moved further right to align with rightmost bar
    width: 1,
    backgroundColor: theme.colors.border + '40',
  },
  topBorderLine: {
    position: 'absolute' as const,
    top: 10,
    left: 79,
    right: 0, // Extended to the very edge
    height: 1,
    backgroundColor: theme.colors.border + '40',
  },
  scoreLabelsContainer: {
    position: 'absolute',
    bottom: 15, // Move labels closer to bars to reduce bottom whitespace
    left: 79, // Move labels slightly to the right
    right: 35,
    height: 20,
    flexDirection: 'row',
    justifyContent: 'flex-start', // Start from the left and space evenly
    alignItems: 'center',
    zIndex: 10,
  },
  scoreLabelWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 23.8, // Fixed width to align with bars
    marginRight: 6.8, // Much smaller spacing between labels
  },
  scoreLabelText: {
    color: '#000000',
    fontSize: 10, // Slightly smaller than xs (which is 12)
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'center' as const,
    // Removed background styling for clean look
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border + '20',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  noDataContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.lg,
  },
  noDataText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium,
    marginTop: theme.spacing.sm,
  },
  noDataSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.light,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
}
