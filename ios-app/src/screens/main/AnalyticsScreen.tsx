import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
// import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler' // Removed due to iOS pod conflicts
import { SafeAreaView } from 'react-native-safe-area-context'
import TrueSharpShield from '../../components/common/TrueSharpShield'
import { Environment } from '../../config/environment'
import { useAuth } from '../../contexts/AuthContext'
import SportsbookLinker from '../../components/SportsbookLinker'
import {
  AnalyticsData,
  AnalyticsFilters,
  fetchAnalyticsData,
} from '../../services/supabaseAnalytics'
import { ParlayGroup } from '../../services/parlayGrouping'
import { globalStyles } from '../../styles/globalStyles'
import { theme } from '../../styles/theme'

// Import tab components (will create these next)
import AnalyticsTab from '../../components/analytics/AnalyticsTab'
import BetsTab from '../../components/analytics/BetsTab'
import OverviewTab from '../../components/analytics/OverviewTab'
import SmartFilters, { SmartFiltersRef } from '../../components/analytics/SmartFilters'
import StrategiesTab from '../../components/analytics/StrategiesTab'
import BetDetailsModal from '../../components/analytics/BetDetailsModal'
import { DEFAULT_FILTERS } from '../../config/filterConfig'
import { UnitDisplayOptions } from '../../utils/unitCalculations'
import { fetchAnalyticsSettings } from '../../services/analyticsSettingsService'
import { AnalyticsSettings } from '../../components/analytics/AnalyticsSettingsModal'
import { filterAnalyticsData } from '../../utils/betFiltering'
import { useProAccess } from '../../contexts/SubscriptionContext'

type AnalyticsTabType = 'overview' | 'bets' | 'analytics' | 'strategies'

const defaultFilters: AnalyticsFilters = DEFAULT_FILTERS

export default function AnalyticsScreen({ route }: { route?: any }) {
  const { user } = useAuth()
  const { isProUser, isLoading: proLoading } = useProAccess()
  const smartFiltersRef = useRef<SmartFiltersRef>(null)
  const [activeTab, setActiveTab] = useState<AnalyticsTabType>(
    route?.params?.initialTab || 'overview'
  )
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [filters, setFilters] = useState<AnalyticsFilters>(defaultFilters)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showUnits, setShowUnits] = useState(false)
  const [analyticsSettings, setAnalyticsSettings] = useState<AnalyticsSettings | null>(null)

  // SharpSports integration state
  const [showSharpSportsModal, setShowSharpSportsModal] = useState(false)
  const [sharpSportsLoading, setSharpSportsLoading] = useState(false)

  // New state variables for comprehensive refresh functionality
  const [isRefreshingBets, setIsRefreshingBets] = useState(false)

  // Bet details modal state
  const [selectedBetId, setSelectedBetId] = useState<string | null>(null)
  const [selectedParlayGroup, setSelectedParlayGroup] = useState<ParlayGroup | null>(null)
  const [showBetDetailsModal, setShowBetDetailsModal] = useState(false)
  
  // Animation for spinning refresh icon
  const spinValue = useRef(new Animated.Value(0)).current
  
  // Create spinning animation
  const startSpin = () => {
    spinValue.setValue(0)
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start()
  }
  
  const stopSpin = () => {
    spinValue.stopAnimation()
    spinValue.setValue(0)
  }

  // Fetch analytics data
  const loadAnalyticsData = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const data = await fetchAnalyticsData(user.id, filters)
      setAnalyticsData(data)
    } catch (error) {
      console.error('Error loading analytics data:', error)
      Alert.alert('Error', 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }, [user?.id, filters])

  // Load analytics settings
  const loadAnalyticsSettings = useCallback(async () => {
    if (!user?.id) return

    try {
      const settings = await fetchAnalyticsSettings(user.id)
      setAnalyticsSettings(settings)
    } catch (error) {
      console.error('Error loading analytics settings:', error)
    }
  }, [user?.id])

  // Debug pro status
  useEffect(() => {
  }, [isProUser, proLoading, user?.id])

  // Initial load
  useEffect(() => {
    loadAnalyticsData()
    loadAnalyticsSettings()
  }, [loadAnalyticsData, loadAnalyticsSettings])

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true)
    await loadAnalyticsData()
    setRefreshing(false)
  }

  // Handle filter changes
  const handleFiltersChange = async (newFilters: AnalyticsFilters) => {
    setFilters(newFilters)
    // Reload analytics data with new filters
    if (user?.id) {
      try {
        setLoading(true)
        const data = await fetchAnalyticsData(user.id, newFilters)
        setAnalyticsData(data)
      } catch (error) {
        console.error('Error applying filters:', error)
        Alert.alert('Error', 'Failed to apply filters')
      } finally {
        setLoading(false)
      }
    }
  }

  // Function to handle extension update prompts (mobile adaptation)
  const handleExtensionUpdateRequired = (downloadUrl: string) => {
    Alert.alert(
      '🔄 Extension Update Required',
      'Your SharpSports browser extension needs to be updated to continue syncing certain sportsbooks.\n\nWould you like to open the download page?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => {
            if (downloadUrl) {
              // On iOS, we can open the URL but user will need to handle it in browser
              Alert.alert('Update Available', 'Please update your browser extension when using the web version.')
            }
          },
        },
      ]
    )
  }

  // Handle refresh bets - Comprehensive implementation from web app
  const handleRefreshBets = async () => {
    if (!user?.id) {
      return
    }

    setIsRefreshingBets(true)
    startSpin()

    try {

              // Get extension auth token for refresh calls
              let extensionAuthToken = null
              let extensionVersion = null

              try {
                const authTokenResponse = await fetch(`${Environment.API_BASE_URL}/api/sharpsports/extension-auth`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userId: user.id,
                  }),
                })

                if (authTokenResponse.ok) {
                  const authResult = await authTokenResponse.json()
                  extensionAuthToken = authResult.extensionAuthToken
                }

                // Get extension version from AsyncStorage (mobile equivalent of sessionStorage)
                // Note: This would need to be implemented with AsyncStorage for mobile
                // extensionVersion = await AsyncStorage.getItem('sharpSportsExtensionVersion')
                
              } catch (error) {
              }

              const refreshPayload: any = {
                userId: user.id,
              }

              // Add extension data to refresh calls (Step 4 of SDK implementation)
              if (extensionAuthToken) {
                refreshPayload.extensionAuthToken = extensionAuthToken
              }
              if (extensionVersion) {
                refreshPayload.extensionVersion = extensionVersion
              }

              const response = await fetch(`${Environment.API_BASE_URL}/api/sharpsports/refresh-all-bets`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(refreshPayload),
              })

              const result = await response.json()

              if (result.success) {

                // Check for extension update requirements in any step
                let extensionUpdateRequired = false
                let extensionDownloadUrl = null

                if (result.results) {
                  const { step1, step2, step3, step4 } = result.results
                  
                  // Check each step for extension update requirements
                  const steps = [step1, step2, step3, step4]
                  for (const step of steps) {
                    if (step?.extensionUpdateRequired) {
                      extensionUpdateRequired = true
                      extensionDownloadUrl = step.extensionDownloadUrl
                      break
                    }
                  }

                  const details = []
                  if (step1?.success) details.push(`✅ Fetched ${step1.stats?.totalBettors || 0} bettors`)
                  if (step2?.success)
                    details.push(`✅ Matched ${step2.stats?.matchedProfiles || 0} profiles`)
                  if (step3?.success) details.push(`✅ Synced ${step3.stats?.newBets || 0} new bets`)

                  if (details.length > 0) {
                  }
                }

                // Handle extension update if required
                if (extensionUpdateRequired && extensionDownloadUrl) {
                  handleExtensionUpdateRequired(extensionDownloadUrl)
                }

                // Reload analytics data
                await loadAnalyticsData()

              } else {
                console.error('❌ Combined refresh failed:', result.error)
              }
    } catch (error) {
      console.error('❌ Error during combined refresh:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    } finally {
      stopSpin()
      setIsRefreshingBets(false)
    }
  }

  // Handle manage sportsbooks with new SDK
  const handleManageSportsbooks = () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated')
      return
    }

    setShowSharpSportsModal(true)
  }

  // Handle linking completion
  const handleLinkingComplete = () => {
    setShowSharpSportsModal(false)
    // Reload analytics data after sportsbook linking
    loadAnalyticsData()
  }

  // Handle bet click
  const handleBetPress = (betId: string, parlayGroup?: ParlayGroup) => {
    setSelectedBetId(betId)
    setSelectedParlayGroup(parlayGroup || null)
    setShowBetDetailsModal(true)
  }

  // Handle units toggle
  const handleToggleUnits = () => {
    setShowUnits(!showUnits)
  }

  // Handle analytics settings update
  const handleAnalyticsSettingsUpdate = (newSettings: AnalyticsSettings) => {
    setAnalyticsSettings(newSettings)
  }

  // Handle bet details modal close
  const handleBetDetailsClose = () => {
    setShowBetDetailsModal(false)
    setSelectedBetId(null)
    setSelectedParlayGroup(null)
  }

  const tabs = [
    { key: 'overview', label: 'Overview', icon: 'stats-chart' },
    { key: 'bets', label: 'Bets', icon: 'list' },
    { key: 'analytics', label: 'Analytics', icon: 'analytics' },
    { key: 'strategies', label: 'Strategies', icon: 'bulb' },
  ] as const

  // Swipe gestures removed due to gesture handler conflicts

  // Create unit display options using user's actual unit size from settings
  const unitOptions: UnitDisplayOptions = {
    showUnits,
    unitSize: analyticsSettings?.unit_size || 1000, // Use user's unit size or default $10
  }

  const renderTabContent = () => {
    if (!analyticsData) return null

    // Apply TrueSharp filtering based on analytics settings
    const filteredAnalyticsData = filterAnalyticsData(analyticsData, analyticsSettings)

    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            analyticsData={filteredAnalyticsData}
            loading={loading}
            onRefresh={onRefresh}
            filters={filters}
            onBetPress={handleBetPress}
            userId={user?.id}
            showUnits={showUnits}
            onToggleUnits={handleToggleUnits}
            onAnalyticsSettingsUpdate={handleAnalyticsSettingsUpdate}
          />
        )
      case 'bets':
        return <BetsTab bets={filteredAnalyticsData.recentBets} loading={loading} onRefresh={onRefresh} onBetPress={handleBetPress} unitOptions={unitOptions} />
      case 'analytics':
        return (
          <AnalyticsTab
            analyticsData={filteredAnalyticsData}
            loading={loading}
            onRefresh={onRefresh}
            filters={filters}
            unitOptions={unitOptions}
            isProUser={isProUser}
          />
        )
      case 'strategies':
        return <StrategiesTab onRefresh={onRefresh} filters={filters} />
      default:
        return null
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={globalStyles.safeArea} edges={['left', 'right']}>
        <View style={styles.container}>
          {/* Tab Navigation */}
          <View style={styles.tabNavigation}>
            <View style={styles.tabContainer}>
              {tabs.map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                  onPress={() => setActiveTab(tab.key as AnalyticsTabType)}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={16}
                    color={
                      activeTab === tab.key
                        ? theme.colors.text.inverse
                        : theme.colors.text.secondary
                    }
                  />
                  <Text style={[styles.tabLabel, activeTab === tab.key && styles.activeTabLabel]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Smart Filters Banner */}
          <TouchableOpacity
            style={styles.filtersBar}
            onPress={() => setShowFilters(!showFilters)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#007AFF', '#00B4FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.filtersBarGradient}
            >
              <View style={styles.filtersBarContent}>
                <View style={styles.filtersBarLeft}>
                  <TrueSharpShield size={20} variant="light" style={styles.filtersShield} />
                  <Text style={styles.filtersBarLabel}>Smart Filters</Text>
                  {(filters.timeframe !== 'all' ||
                    filters.leagues.length > 0 ||
                    filters.betTypes.length > 0 ||
                    filters.sportsbooks.length > 0 ||
                    filters.results.length !== 5 || // Default has 5 statuses
                    filters.isParlay !== null ||
                    filters.side !== null ||
                    filters.oddsType !== null ||
                    filters.minOdds !== null ||
                    filters.maxOdds !== null ||
                    filters.minStake !== null ||
                    filters.maxStake !== null ||
                    filters.minSpread !== null ||
                    filters.maxSpread !== null ||
                    filters.minTotal !== null ||
                    filters.maxTotal !== null ||
                    filters.startDate !== null ||
                    filters.endDate !== null) && (
                    <View style={styles.activeFiltersBadge}>
                      <Text style={styles.activeFiltersText}>Active</Text>
                    </View>
                  )}
                </View>
                <View style={styles.filtersBarRight}>
                  <Ionicons
                    name={showFilters ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="white"
                  />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Smart Filters Panel */}
          {showFilters && (
            <SmartFilters
              ref={smartFiltersRef}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClose={() => setShowFilters(false)}
              onClearAll={() => {
                const clearedFilters = { ...DEFAULT_FILTERS }
                setFilters(clearedFilters)
                handleFiltersChange(clearedFilters)
              }}
              isProUser={isProUser}
            />
          )}

          {/* Tab Content */}
          <View style={styles.tabContent}>
            <View style={{ flex: 1, paddingBottom: 80 }}>{renderTabContent()}</View>
          </View>

          {/* Floating Action Buttons */}
          <View style={styles.floatingButtons}>
            <TouchableOpacity
              style={[
                styles.floatingButtonOval,
                styles.manageSportsbooksButton,
                !user?.id && styles.buttonNotReady,
              ]}
              onPress={handleManageSportsbooks}
              disabled={sharpSportsLoading || !user?.id}
            >
              {sharpSportsLoading ? (
                <Ionicons name="refresh-outline" size={20} color={theme.colors.text.inverse} />
              ) : (
                <View style={styles.manageSportsbooksContent}>
                  <Ionicons name="link-outline" size={20} color={theme.colors.text.inverse} />
                  <Text style={styles.manageSportsbooksText}>Link Sportsbooks</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.floatingButtonRound]}
              onPress={handleRefreshBets}
              disabled={isRefreshingBets}
            >
              {isRefreshingBets ? (
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: spinValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                    ],
                  }}
                >
                  <Ionicons name="refresh-outline" size={20} color={theme.colors.text.inverse} />
                </Animated.View>
              ) : (
                <Ionicons name="refresh-outline" size={20} color={theme.colors.text.inverse} />
              )}
            </TouchableOpacity>
          </View>

          {/* SharpSports Sportsbook Linker Modal */}
          <Modal
            visible={showSharpSportsModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleLinkingComplete}
          >
            <SafeAreaView style={styles.modalContainer}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={handleLinkingComplete}
                >
                  <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Manage Sportsbooks</Text>
                <View style={styles.modalHeaderSpacer} />
              </View>

              {/* SportsbookLinker Component */}
              {user?.id && (
                <SportsbookLinker
                  internalId={user.id}
                  onLinkingComplete={handleLinkingComplete}
                />
              )}
            </SafeAreaView>
          </Modal>

          {/* Bet Details Modal */}
          <BetDetailsModal
            visible={showBetDetailsModal}
            onClose={handleBetDetailsClose}
            betId={selectedBetId}
            parlayGroup={selectedParlayGroup}
          />
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  filtersBar: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.md,
    elevation: 8,
  },
  filtersBarGradient: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  filtersBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filtersBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  filtersBarRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersShield: {
    opacity: 0.9,
  },
  filtersBarLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
    flex: 1,
  },
  activeFiltersBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeFiltersText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  tabNavigation: {
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    marginHorizontal: 2,
    borderRadius: theme.borderRadius.md,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  tabLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  activeTabLabel: {
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  tabContent: {
    flex: 1,
  },
  floatingButtons: {
    position: 'absolute',
    bottom: 10,
    left: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    zIndex: 10, // Lower than Smart Filters
  },
  floatingButtonRound: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
    elevation: 8,
  },
  floatingButtonOval: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
    elevation: 8,
  },
  manageSportsbooksButton: {
    backgroundColor: theme.colors.primaryDark, // Darker blue for manage sportsbooks
  },
  manageSportsbooksContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  manageSportsbooksText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
  buttonNotReady: {
    backgroundColor: theme.colors.border, // Grayed out when SDK not ready
    opacity: 0.6,
  },
  // SharpSports Modal Styles (used as fallback)
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    ...theme.shadows.sm,
  },
  modalCloseButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  modalHeaderSpacer: {
    width: 32, // Same width as close button for centering
  },
  webview: {
    flex: 1,
  },
})
