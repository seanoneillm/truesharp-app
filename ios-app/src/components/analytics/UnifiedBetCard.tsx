import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';
import { BetData } from '../../services/supabaseAnalytics';
import { ParlayGroup } from '../../services/parlayGrouping';
import { getTwoLineBetDescription, getStatusColor } from '../../lib/betFormatting';
import EnhancedBetCard from './EnhancedBetCard';
import EnhancedParlayCard from './EnhancedParlayCard';
import { UnitDisplayOptions } from '../../utils/unitCalculations';

interface UnifiedBetCardProps {
  bet: BetData | ParlayGroup;
  onPress?: (betId: string, parlayGroup?: ParlayGroup) => void;
  unitOptions?: UnitDisplayOptions;
}

export default function UnifiedBetCard({ bet, onPress, unitOptions }: UnifiedBetCardProps) {
  // Check if it's a parlay
  if ('legs' in bet) {
    // It's a parlay - pass the parlay group along with the id
    const parlayGroup = bet as ParlayGroup;
    const handleParlayPress = (parlayId: string) => {
      onPress?.(parlayId, parlayGroup);
    };
    return <EnhancedParlayCard parlay={parlayGroup} onPress={handleParlayPress} unitOptions={unitOptions} />;
  }

  // It's a single bet - just pass the bet id
  const singleBet = bet as BetData;
  const handleBetPress = (betId: string) => {
    onPress?.(betId);
  };
  return <EnhancedBetCard bet={singleBet} onPress={handleBetPress} unitOptions={unitOptions} />;
}