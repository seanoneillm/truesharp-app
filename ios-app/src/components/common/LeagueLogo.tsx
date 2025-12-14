import React, { useState } from 'react';
import { Image, View, StyleSheet, ImageSourcePropType, Text } from 'react-native';
import { getLeagueInfo, getLeagueLogoUrl } from '../../utils/leagueMappings';

interface LeagueLogoProps {
  leagueName: string;
  size?: number;
  style?: any;
}

// Fallback emoji icons for each league
const LEAGUE_EMOJI_FALLBACKS: Record<string, string> = {
  'MLB': '⚾',
  'NFL': '🏈',
  'NBA': '🏀',
  'WNBA': '🏀',
  'NHL': '🏒',
  'NCAAF': '🏈',
  'NCAAB': '🏀',
  'Champions League': '⚽',
  'MLS': '⚽',
  'CFL': '🏈',
  'XFL': '🏈',
  'Premier League': '⚽',
  'La Liga': '⚽',
  'Serie A': '⚽',
  'Bundesliga': '⚽',
  'Ligue 1': '⚽',
  'ATP Tour': '🎾',
  'WTA Tour': '🎾',
  'UFC': '🥊',
  'Bellator': '🥊',
  'Boxing': '🥊',
  'Formula 1': '🏎️',
  'NASCAR': '🏎️',
  'PGA Tour': '⛳'
};

export const LeagueLogo: React.FC<LeagueLogoProps> = ({ 
  leagueName, 
  size = 24,
  style 
}) => {
  const [imageError, setImageError] = useState(false);
  
  const logoUrl = getLeagueLogoUrl(leagueName);
  const leagueInfo = getLeagueInfo(leagueName);
  const fallbackEmoji = LEAGUE_EMOJI_FALLBACKS[leagueName];
  
  // If no logo URL or league info, show emoji fallback
  if (!logoUrl || !leagueInfo || imageError) {
    if (fallbackEmoji) {
      return (
        <View style={[styles.container, style]}>
          <Text style={[styles.emoji, { fontSize: size * 0.8 }]}>
            {fallbackEmoji}
          </Text>
        </View>
      );
    }
    return null;
  }

  const logoStyle = [
    styles.logo,
    {
      width: size,
      height: size,
    },
    style
  ];

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: logoUrl } as ImageSourcePropType}
        style={logoStyle}
        onError={() => setImageError(true)}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    borderRadius: 2,
  },
  emoji: {
    textAlign: 'center',
  },
});