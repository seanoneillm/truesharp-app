import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';
import { AnalyticsFilters } from '../../services/supabaseAnalytics';
import { useAuth } from '../../contexts/AuthContext';
import Dropdown from '../common/Dropdown';
import {
  FILTER_CONFIG,
  FILTER_GROUPS,
  DEFAULT_FILTERS,
  PRO_FILTER_IDS,
  TIME_RANGE_OPTIONS,
  BET_TYPE_OPTIONS,
  LEAGUE_OPTIONS,
  STATUS_OPTIONS,
  PARLAY_OPTIONS,
  SIDE_OPTIONS,
  ODDS_TYPE_OPTIONS,
  SPORTSBOOK_OPTIONS,
} from '../../config/filterConfig';

interface SmartFiltersProps {
  filters: AnalyticsFilters;
  onFiltersChange: (filters: AnalyticsFilters) => void;
  onClose?: () => void;
  onClearAll?: () => void;
  isProUser?: boolean;
}

export interface SmartFiltersRef {
  applyFilters: () => void;
}

interface UserProfile {
  pro?: string;
  is_pro?: boolean;
  isPro?: boolean;
}

const SmartFilters = forwardRef<SmartFiltersRef, SmartFiltersProps>(({ filters, onFiltersChange, onClose, onClearAll, isProUser = false }, ref) => {
  const { user } = useAuth();
  const [localFilters, setLocalFilters] = useState(filters);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'start' | 'end' | 'basicStart'>('start');
  
  // Track display text for range inputs separately from filter values
  const [displayTexts, setDisplayTexts] = useState<{[key: string]: string}>({});
  const [selectedStartDate, setSelectedStartDate] = useState<Date>(() => {
    if (filters.startDate) {
      return new Date(filters.startDate);
    }
    if (filters.dateRange?.start) {
      return new Date(filters.dateRange.start);
    }
    return new Date();
  });
  const [selectedEndDate, setSelectedEndDate] = useState<Date>(() => {
    if (filters.endDate) {
      return new Date(filters.endDate);
    }
    if (filters.dateRange?.end) {
      return new Date(filters.dateRange.end);
    }
    return new Date();
  });
  const [selectedBasicStartDate, setSelectedBasicStartDate] = useState<Date>(() => {
    if (filters.basicStartDate) {
      return new Date(filters.basicStartDate);
    }
    return new Date();
  });

  // Use the passed pro status from SubscriptionContext
  const isPro = isProUser;
  
  // Debug Pro status
  useEffect(() => {
    console.log('🔍 SmartFilters Pro Status Debug:', {
      isProUser,
      isPro,
      userId: user?.id,
      timestamp: new Date().toISOString()
    });
    setLocalFilters(filters);
    // Clear display texts when filters change externally
    setDisplayTexts({});
  }, [filters, isProUser, isPro, user?.id]);

  const handleFilterUpdate = (key: keyof AnalyticsFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  // Validation functions for different range types - allow partial input during typing
  const validateOddsInput = (text: string): { isValid: boolean; value: number | null; displayText: string } => {
    if (!text || text.trim() === '') return { isValid: true, value: null, displayText: '' };
    
    // Allow partial input like "-", "1.", "-1.", etc.
    const partialRegex = /^-?\.?\d*\.?\d*$/;
    if (!partialRegex.test(text)) return { isValid: false, value: null, displayText: text };
    
    // Check if it's a complete valid number
    const completeRegex = /^-?\d*\.?\d+$|^-?\d+\.?\d*$/;
    if (completeRegex.test(text)) {
      const numValue = parseFloat(text);
      if (!isNaN(numValue)) {
        return { isValid: true, value: numValue, displayText: text };
      }
    }
    
    // Allow partial input but don't set a value yet
    return { isValid: true, value: null, displayText: text };
  };

  const validateStakeInput = (text: string): { isValid: boolean; value: number | null; displayText: string } => {
    if (!text || text.trim() === '') return { isValid: true, value: null, displayText: '' };
    
    // Allow partial input but no negatives
    const partialRegex = /^\.?\d*\.?\d{0,2}$/;
    if (!partialRegex.test(text)) return { isValid: false, value: null, displayText: text };
    
    // Check if it's a complete valid number
    const completeRegex = /^\d*\.?\d{1,2}$|^\d+\.?\d*$/;
    if (completeRegex.test(text)) {
      const numValue = parseFloat(text);
      if (!isNaN(numValue) && numValue >= 0) {
        return { isValid: true, value: numValue, displayText: text };
      }
    }
    
    // Allow partial input but don't set a value yet
    return { isValid: true, value: null, displayText: text };
  };

  const validateSpreadInput = (text: string): { isValid: boolean; value: number | null; displayText: string } => {
    if (!text || text.trim() === '') return { isValid: true, value: null, displayText: '' };
    
    // Allow partial input like "-", "1.", "-1.", but restrict decimals to .5
    const partialRegex = /^-?\.?\d*(?:\.5?)?$/;
    if (!partialRegex.test(text)) return { isValid: false, value: null, displayText: text };
    
    // Don't allow decimals other than .5
    if (text.includes('.') && !text.endsWith('.5') && !text.endsWith('.')) {
      return { isValid: false, value: null, displayText: text };
    }
    
    // Check if it's a complete valid number
    const completeRegex = /^-?\d+$|^-?\d+\.5$/;
    if (completeRegex.test(text)) {
      const numValue = parseFloat(text);
      if (!isNaN(numValue)) {
        return { isValid: true, value: numValue, displayText: text };
      }
    }
    
    // Allow partial input but don't set a value yet
    return { isValid: true, value: null, displayText: text };
  };

  const validateTotalInput = (text: string): { isValid: boolean; value: number | null; displayText: string } => {
    if (!text || text.trim() === '') return { isValid: true, value: null, displayText: '' };
    
    // Allow partial input but no negatives, restrict decimals to .5
    const partialRegex = /^\.?\d*(?:\.5?)?$/;
    if (!partialRegex.test(text)) return { isValid: false, value: null, displayText: text };
    
    // Don't allow decimals other than .5
    if (text.includes('.') && !text.endsWith('.5') && !text.endsWith('.')) {
      return { isValid: false, value: null, displayText: text };
    }
    
    // Check if it's a complete valid number
    const completeRegex = /^\d+$|^\d+\.5$/;
    if (completeRegex.test(text)) {
      const numValue = parseFloat(text);
      if (!isNaN(numValue) && numValue >= 0) {
        return { isValid: true, value: numValue, displayText: text };
      }
    }
    
    // Allow partial input but don't set a value yet
    return { isValid: true, value: null, displayText: text };
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    if (onClose) onClose();
  };

  useImperativeHandle(ref, () => ({
    applyFilters: handleApplyFilters,
  }));

  const handleClearFilters = () => {
    const clearedFilters: AnalyticsFilters = { ...DEFAULT_FILTERS };
    setLocalFilters(clearedFilters);
    setDisplayTexts({});
    onFiltersChange(clearedFilters);
  };

  const handleProFilterTap = () => {
    Alert.alert(
      'Pro Feature',
      'This filter is only available for Pro users. Upgrade to Pro to unlock advanced analytics features.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade to Pro', onPress: () => {
          // Navigate to pro upgrade screen
        }},
      ]
    );
  };

  const renderRangeFilter = (
    label: string,
    minKey: string,
    maxKey: string,
    placeholder: string,
    icon: string,
    isProFilter: boolean = false
  ) => {
    const isLocked = isProFilter && !isPro;

    // Get the appropriate validation function based on the label
    const getValidationFunction = () => {
      if (label.includes('Odds')) return validateOddsInput;
      if (label.includes('Stake')) return validateStakeInput;
      if (label.includes('Spread')) return validateSpreadInput;
      if (label.includes('Total')) return validateTotalInput;
      return validateOddsInput; // default fallback
    };

    const validateInput = getValidationFunction();

    return (
      <View style={styles.filterSection}>
        <View style={styles.labelContainer}>
          <Text style={styles.filterTitle}>{label}</Text>
          {isProFilter && !isPro && (
            <View style={[styles.proBadge, { backgroundColor: `${theme.colors.filters.pro}20` }]}>
              <Ionicons name="lock-closed" size={12} color={theme.colors.filters.pro} />
              <Text style={[styles.proText, { color: theme.colors.filters.pro }]}>PRO</Text>
            </View>
          )}
        </View>
        <View style={styles.rangeInputContainer}>
          <View style={[styles.rangeInput, isLocked && styles.lockedInput]}>
            <Ionicons
              name={icon as any}
              size={16}
              color={isLocked ? theme.colors.text.light : theme.colors.text.secondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.rangeInputText, isLocked && styles.lockedText]}
              placeholder="Min"
              placeholderTextColor={theme.colors.text.light}
              value={displayTexts[minKey] !== undefined ? displayTexts[minKey] : (localFilters[minKey as keyof AnalyticsFilters]?.toString() || '')}
              onChangeText={(text) => {
                const result = validateInput(text);
                if (result.isValid) {
                  setDisplayTexts(prev => ({ ...prev, [minKey]: result.displayText }));
                  if (result.value !== null) {
                    handleFilterUpdate(minKey as keyof AnalyticsFilters, result.value);
                  }
                }
              }}
              keyboardType={label.includes('Odds') || label.includes('Spread') ? 'numbers-and-punctuation' : 'numeric'}
              editable={!isLocked}
              onFocus={() => isLocked && handleProFilterTap()}
            />
          </View>
          <Text style={styles.rangeSeparator}>-</Text>
          <View style={[styles.rangeInput, isLocked && styles.lockedInput]}>
            <TextInput
              style={[styles.rangeInputText, isLocked && styles.lockedText]}
              placeholder="Max"
              placeholderTextColor={theme.colors.text.light}
              value={displayTexts[maxKey] !== undefined ? displayTexts[maxKey] : (localFilters[maxKey as keyof AnalyticsFilters]?.toString() || '')}
              onChangeText={(text) => {
                const result = validateInput(text);
                if (result.isValid) {
                  setDisplayTexts(prev => ({ ...prev, [maxKey]: result.displayText }));
                  if (result.value !== null) {
                    handleFilterUpdate(maxKey as keyof AnalyticsFilters, result.value);
                  }
                }
              }}
              keyboardType={label.includes('Odds') || label.includes('Spread') ? 'numbers-and-punctuation' : 'numeric'}
              editable={!isLocked}
              onFocus={() => isLocked && handleProFilterTap()}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderFilterGroup = (groupKey: string) => {
    const group = FILTER_GROUPS[groupKey as keyof typeof FILTER_GROUPS];
    if (!group) {
      return null;
    }

    const getGroupColor = () => {
      switch (groupKey) {
        case 'BASIC': return theme.colors.filters.basic;
        case 'ADVANCED': return theme.colors.filters.advanced;
        case 'PRO': return theme.colors.filters.pro;
        default: return theme.colors.primary;
      }
    };

    const groupColor = getGroupColor();

    return (
      <View key={groupKey} style={[styles.filterGroup, { borderLeftColor: groupColor }]}>
        <View style={[styles.groupHeader, { backgroundColor: `${groupColor}15` }]}>
          <View style={[styles.groupColorIndicator, { backgroundColor: groupColor }]} />
          <Text style={[styles.groupTitle, { color: groupColor }]}>{group.title}</Text>
          {groupKey === 'PRO' && (
            <View style={[styles.proBadge, { backgroundColor: `${theme.colors.filters.pro}20` }]}>
              <Ionicons name="star" size={12} color={theme.colors.filters.pro} />
              <Text style={[styles.proText, { color: theme.colors.filters.pro }]}>PRO</Text>
            </View>
          )}
        </View>
        
        {group.filters.map(filterId => {
          const config = FILTER_CONFIG.find(f => f.id === filterId);
          if (!config) {
            return null;
          }

          const isProFilter = config.isPro || false;
          const showProBadge = isProFilter && !isPro;

          switch (config.id) {
            case 'timeRange':
              return (
                <View key={config.id}>
                  <Dropdown
                    label={config.label}
                    options={TIME_RANGE_OPTIONS}
                    selectedValue={localFilters.timeframe}
                    onSelectionChange={(value) => {
                      handleFilterUpdate('timeframe', value);
                      if (value === 'custom') {
                        setShowDatePicker(true);
                        setDatePickerType('start');
                      }
                    }}
                    icon={config.icon}
                    isPro={isProFilter}
                    showProBadge={showProBadge}
                  />
                  
                  {/* Custom Date Range Display */}
                  {localFilters.timeframe === 'custom' && (
                    <View style={styles.customDateContainer}>
                      <TouchableOpacity 
                        style={styles.dateButton}
                        onPress={() => {
                          setDatePickerType('start');
                          setShowDatePicker(true);
                        }}
                      >
                        <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
                        <Text style={styles.dateButtonText}>
                          Start: {localFilters.dateRange?.start ? 
                            new Date(localFilters.dateRange.start).toLocaleDateString() : 
                            'Select Date'
                          }
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.dateButton}
                        onPress={() => {
                          setDatePickerType('end');
                          setShowDatePicker(true);
                        }}
                      >
                        <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
                        <Text style={styles.dateButtonText}>
                          End: {localFilters.dateRange?.end ? 
                            new Date(localFilters.dateRange.end).toLocaleDateString() : 
                            'Select Date'
                          }
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            
            case 'leagues':
              return (
                <Dropdown
                  key={config.id}
                  label={config.label}
                  options={LEAGUE_OPTIONS}
                  selectedValues={localFilters.leagues}
                  onSelectionChange={(values) => handleFilterUpdate('leagues', values)}
                  multiSelect
                  icon={config.icon}
                  isPro={isProFilter}
                  showProBadge={showProBadge}
                  isLeagueDropdown={true}
                />
              );
            
            case 'betTypes':
              return (
                <Dropdown
                  key={config.id}
                  label={config.label}
                  options={BET_TYPE_OPTIONS}
                  selectedValues={localFilters.betTypes}
                  onSelectionChange={(values) => handleFilterUpdate('betTypes', values)}
                  multiSelect
                  icon={config.icon}
                  isPro={isProFilter}
                  showProBadge={showProBadge}
                />
              );
            
            case 'results':
              return (
                <Dropdown
                  key={config.id}
                  label={config.label}
                  options={STATUS_OPTIONS}
                  selectedValues={localFilters.results}
                  onSelectionChange={(values) => handleFilterUpdate('results', values)}
                  multiSelect
                  icon={config.icon}
                  isPro={isProFilter}
                  showProBadge={showProBadge}
                />
              );
            
            case 'isParlay':
              return (
                <Dropdown
                  key={config.id}
                  label={config.label}
                  options={PARLAY_OPTIONS}
                  selectedValue={localFilters.isParlay?.toString() || ''}
                  onSelectionChange={(value) => handleFilterUpdate('isParlay', value === 'true')}
                  icon={config.icon}
                  isPro={isProFilter}
                  showProBadge={showProBadge}
                />
              );
            
            case 'sides':
              return (
                <Dropdown
                  key={config.id}
                  label={config.label}
                  options={SIDE_OPTIONS}
                  selectedValue={localFilters.side || ''}
                  onSelectionChange={(value) => handleFilterUpdate('side', value)}
                  icon={config.icon}
                  isPro={isProFilter}
                  showProBadge={showProBadge}
                />
              );
            
            case 'oddsType':
              return (
                <Dropdown
                  key={config.id}
                  label={config.label}
                  options={ODDS_TYPE_OPTIONS}
                  selectedValue={localFilters.oddsType || ''}
                  onSelectionChange={(value) => handleFilterUpdate('oddsType', value)}
                  icon={config.icon}
                  isPro={isProFilter}
                  showProBadge={showProBadge}
                />
              );
            
            case 'sportsbooks':
              return (
                <Dropdown
                  key={config.id}
                  label={config.label}
                  options={SPORTSBOOK_OPTIONS}
                  selectedValues={localFilters.sportsbooks}
                  onSelectionChange={(values) => handleFilterUpdate('sportsbooks', values)}
                  multiSelect
                  icon={config.icon}
                  isPro={isProFilter}
                  showProBadge={showProBadge}
                />
              );
            
            case 'oddsRange':
              return (
                <View key={config.id}>
                  {renderRangeFilter(
                    'Odds Range',
                    'minOdds',
                    'maxOdds',
                    'Min - Max odds',
                    'calculator-outline',
                    isProFilter
                  )}
                </View>
              );
            
            case 'stakeRange':
              return (
                <View key={config.id}>
                  {renderRangeFilter(
                    'Stake Range',
                    'minStake',
                    'maxStake',
                    '$Min - $Max stake',
                    'cash-outline',
                    isProFilter
                  )}
                </View>
              );
            
            case 'spreadRange':
              return (
                <View key={config.id}>
                  {renderRangeFilter(
                    'Spread Range',
                    'minSpread',
                    'maxSpread',
                    'Min - Max spread',
                    'trending-up-outline',
                    isProFilter
                  )}
                </View>
              );
            
            case 'totalRange':
              return (
                <View key={config.id}>
                  {renderRangeFilter(
                    'Total Range',
                    'minTotal',
                    'maxTotal',
                    'Min - Max total',
                    'calculator-outline',
                    isProFilter
                  )}
                </View>
              );
            
            case 'basicStartDate':
              return (
                <View key={config.id}>
                  <View style={styles.filterSection}>
                    <View style={styles.labelContainer}>
                      <Text style={styles.filterTitle}>Start Date</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.dateButton}
                      onPress={() => {
                        setDatePickerType('basicStart');
                        setShowDatePicker(true);
                      }}
                    >
                      <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
                      <Text style={styles.dateButtonText}>
                        {localFilters.basicStartDate ? 
                          new Date(localFilters.basicStartDate).toLocaleDateString() : 
                          'Select Start Date'
                        }
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            
            case 'startDate':
              return (
                <View key={config.id}>
                  <View style={styles.filterSection}>
                    <View style={styles.labelContainer}>
                      <Text style={styles.filterTitle}>Pro Start Date</Text>
                      {isProFilter && !isPro && (
                        <View style={[styles.proBadge, { backgroundColor: `${theme.colors.filters.pro}20` }]}>
                          <Ionicons name="lock-closed" size={12} color={theme.colors.filters.pro} />
                          <Text style={[styles.proText, { color: theme.colors.filters.pro }]}>PRO</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity 
                      style={[styles.dateButton, isProFilter && !isPro && styles.lockedInput]}
                      onPress={() => {
                        if (isProFilter && !isPro) {
                          handleProFilterTap();
                          return;
                        }
                        setDatePickerType('start');
                        setShowDatePicker(true);
                      }}
                    >
                      <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
                      <Text style={styles.dateButtonText}>
                        {localFilters.startDate ? 
                          new Date(localFilters.startDate).toLocaleDateString() : 
                          'Select Pro Start Date'
                        }
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            
            case 'endDate':
              return (
                <View key={config.id}>
                  <View style={styles.filterSection}>
                    <View style={styles.labelContainer}>
                      <Text style={styles.filterTitle}>End Date</Text>
                      {isProFilter && !isPro && (
                        <View style={[styles.proBadge, { backgroundColor: `${theme.colors.filters.pro}20` }]}>
                          <Ionicons name="lock-closed" size={12} color={theme.colors.filters.pro} />
                          <Text style={[styles.proText, { color: theme.colors.filters.pro }]}>PRO</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity 
                      style={[styles.dateButton, isProFilter && !isPro && styles.lockedInput]}
                      onPress={() => {
                        if (isProFilter && !isPro) {
                          handleProFilterTap();
                          return;
                        }
                        setDatePickerType('end');
                        setShowDatePicker(true);
                      }}
                    >
                      <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
                      <Text style={styles.dateButtonText}>
                        {localFilters.endDate ? 
                          new Date(localFilters.endDate).toLocaleDateString() : 
                          'Select End Date'
                        }
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            
            default:
              return null;
          }
        })}
      </View>
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      // Use timezone-safe date string construction to avoid UTC conversion issues
      const dateString = selectedDate.getFullYear() + '-' + 
        String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(selectedDate.getDate()).padStart(2, '0');
      
      if (datePickerType === 'basicStart') {
        setSelectedBasicStartDate(selectedDate);
        handleFilterUpdate('basicStartDate', dateString);
      } else if (datePickerType === 'start') {
        setSelectedStartDate(selectedDate);
        // Check if we're setting a custom range date or individual Pro dates
        if (localFilters.timeframe === 'custom') {
          const newDateRange = {
            start: dateString,
            end: localFilters.dateRange?.end || null
          };
          handleFilterUpdate('dateRange', newDateRange);
        } else {
          // Individual Pro start date
          handleFilterUpdate('startDate', dateString);
        }
      } else {
        setSelectedEndDate(selectedDate);
        // Check if we're setting a custom range date or individual Pro dates
        if (localFilters.timeframe === 'custom') {
          const newDateRange = {
            start: localFilters.dateRange?.start || null,
            end: dateString
          };
          handleFilterUpdate('dateRange', newDateRange);
        } else {
          // Individual Pro end date
          handleFilterUpdate('endDate', dateString);
        }
      }
    }
    setShowDatePicker(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderFilterGroup('BASIC')}
        {renderFilterGroup('ADVANCED')}
        {renderFilterGroup('PRO')}
      </ScrollView>
      
      {/* Filter Actions Footer */}
      <View style={styles.filterFooter}>
        <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
          <Ionicons name="refresh-outline" size={18} color={theme.colors.text.secondary} />
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.applyButtonContainer} 
          onPress={handleApplyFilters}
        >
          <LinearGradient
            colors={['#007AFF', '#00B4FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.applyButton}
          >
            <Ionicons name="checkmark" size={18} color="white" />
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      {/* Enhanced Date Picker Modal */}
      {showDatePicker && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.enhancedModalContent}>
              {/* Modal Header with Gradient */}
              <LinearGradient
                colors={['#007AFF', '#00B4FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalHeaderGradient}
              >
                <View style={styles.modalHeaderContent}>
                  <View style={styles.modalTitleContainer}>
                    <Ionicons 
                      name="calendar" 
                      size={20} 
                      color="white" 
                      style={styles.modalTitleIcon}
                    />
                    <Text style={styles.enhancedModalTitle}>
                      Select {datePickerType === 'basicStart' ? 'Start' : datePickerType === 'start' ? 'Pro Start' : 'End'} Date
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    style={styles.enhancedCloseButton}
                  >
                    <Ionicons name="close" size={22} color="white" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
              
              {/* Date Display Section */}
              <View style={styles.dateDisplaySection}>
                <Text style={styles.dateDisplayLabel}>Selected Date</Text>
                <View style={styles.dateDisplayCard}>
                  <Ionicons 
                    name="calendar-outline" 
                    size={24} 
                    color={theme.colors.primary} 
                    style={styles.dateDisplayIcon}
                  />
                  <Text style={styles.dateDisplayText}>
                    {(datePickerType === 'basicStart' ? selectedBasicStartDate : datePickerType === 'start' ? selectedStartDate : selectedEndDate)
                      .toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    }
                  </Text>
                </View>
              </View>
              
              {/* Date Picker Container */}
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={datePickerType === 'basicStart' ? selectedBasicStartDate : datePickerType === 'start' ? selectedStartDate : selectedEndDate}
                  mode="date"
                  display="compact"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      if (datePickerType === 'basicStart') {
                        setSelectedBasicStartDate(selectedDate);
                      } else if (datePickerType === 'start') {
                        setSelectedStartDate(selectedDate);
                      } else {
                        setSelectedEndDate(selectedDate);
                      }
                    }
                  }}
                  style={styles.enhancedDatePicker}
                  maximumDate={new Date()}
                  minimumDate={new Date(2020, 0, 1)}
                  themeVariant="light"
                />
              </View>
              
              {/* Enhanced Modal Footer */}
              <View style={styles.enhancedModalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.selectButtonContainer}
                  onPress={() => {
                    const dateToUse = datePickerType === 'basicStart' ? selectedBasicStartDate : datePickerType === 'start' ? selectedStartDate : selectedEndDate;
                    handleDateChange({}, dateToUse);
                  }}
                >
                  <LinearGradient
                    colors={['#007AFF', '#00B4FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.selectButton}
                  >
                    <Ionicons name="checkmark" size={18} color="white" />
                    <Text style={styles.selectButtonText}>Select Date</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
});

SmartFilters.displayName = 'SmartFilters';

export default SmartFilters;

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    marginHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.lg,
    zIndex: 1000,
    elevation: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
    maxHeight: 450,
  },
  filterGroup: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.xs,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  groupColorIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  groupTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  filterTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    flex: 1,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    gap: 2,
  },
  proText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  rangeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  rangeInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 48,
  },
  lockedInput: {
    backgroundColor: theme.colors.surface,
    opacity: 0.5,
    borderStyle: 'dashed',
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  rangeInputText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  lockedText: {
    color: theme.colors.text.light,
  },
  rangeSeparator: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  clearButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  optionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  activeOption: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  optionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  activeOptionText: {
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  customDateContainer: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  dateButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedModalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    margin: theme.spacing.lg,
    minWidth: 340,
    maxWidth: '92%',
    ...theme.shadows.xl,
    elevation: 20,
    overflow: 'hidden',
  },
  modalHeaderGradient: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitleIcon: {
    marginRight: theme.spacing.sm,
  },
  enhancedModalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
    flex: 1,
  },
  enhancedCloseButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dateDisplaySection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  dateDisplayLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateDisplayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  dateDisplayIcon: {
    marginRight: theme.spacing.md,
  },
  dateDisplayText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  datePickerContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  enhancedDatePicker: {
    height: 180,
    width: '100%',
    alignSelf: 'center',
  },
  enhancedModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  selectButtonContainer: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  selectButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: 'white',
    fontWeight: theme.typography.fontWeight.bold,
  },
  
  // Filter Footer Styles
  filterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  clearButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  applyButtonContainer: {
    flex: 1,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  applyButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: 'white',
    fontWeight: theme.typography.fontWeight.bold,
  },
});