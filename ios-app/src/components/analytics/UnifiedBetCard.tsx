import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';
import { BetData } from '../../services/supabaseAnalytics';
import { ParlayGroup } from '../../services/parlayGrouping';
import { getTwoLineBetDescription, getStatusColor } from '../../lib/betFormatting';
import EnhancedBetCard from './EnhancedBetCard';
import EnhancedParlayCard from './EnhancedParlayCard';

interface UnifiedBetCardProps {
  bet: BetData | ParlayGroup;
}

export default function UnifiedBetCard({ bet }: UnifiedBetCardProps) {
  // Check if it's a parlay
  if ('legs' in bet) {
    // It's a parlay - use the enhanced parlay card component
    return <EnhancedParlayCard parlay={bet as ParlayGroup} />;
  }

  // It's a single bet - use the enhanced bet card component
  return <EnhancedBetCard bet={bet as BetData} />;
}