import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Share,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { globalStyles } from '../../styles/globalStyles';
import { supabase } from '../../lib/supabase';
import { captureRef } from 'react-native-view-shot';
import { useAuth } from '../../contexts/AuthContext';
import { adminService } from '../../services/adminService';
import { LeagueLogo } from '../common/LeagueLogo';
import { TeamLogo } from '../common/TeamLogo';
import { getTeamInfo } from '../../utils/teamMappings';
import { LinearGradient } from 'expo-linear-gradient';

interface Game {
  id: string;
  home_team: string;
  away_team: string;
  home_team_name: string;
  away_team_name: string;
  game_time: string;
  sport: string;
  league?: string;
  status?: string;
}

interface DatabaseOdds {
  id: string;
  oddid?: string;
  line?: string;
  fanduelodds?: number;
  draftkingsodds?: number;
  espnbetodds?: number;
  ceasarsodds?: number;
  mgmodds?: number;
  fanaticsodds?: number;
  bookodds?: number;
  bovadaodds?: number;
  unibetodds?: number;
  pointsbetodds?: number;
  williamhillodds?: number;
  ballybetodds?: number;
  barstoolodds?: number;
  betonlineodds?: number;
  betparxodds?: number;
  betriversodds?: number;
  betusodds?: number;
  betfairexchangeodds?: number;
  betfairsportsbookodds?: number;
  betfredodds?: number;
  fliffodds?: number;
  fourwindsodds?: number;
  hardrockbetodds?: number;
  lowvigodds?: number;
  marathonbetodds?: number;
  primesportsodds?: number;
  prophetexchangeodds?: number;
  skybetodds?: number;
  sleeperodds?: number;
  stakeodds?: number;
  underdogodds?: number;
  wynnbetodds?: number;
  thescorebetodds?: number;
  bet365odds?: number;
  circaodds?: number;
  pinnacleodds?: number;
  prizepicksodds?: number;
}

interface LeagueGamesCardProps {
  league: 'MLB' | 'NBA' | 'NHL' | 'NFL';
  leagueColor: string;
  title: string;
}

export default function LeagueGamesCard({ league, leagueColor, title }: LeagueGamesCardProps) {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [gameOdds, setGameOdds] = useState<Record<string, DatabaseOdds[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  
  const cardRef = useRef<View>(null);

  useEffect(() => {
    validateAccess();
  }, [user]);

  useEffect(() => {
    if (hasAccess) {
      fetchGames();
    }
  }, [hasAccess, league]);

  const validateAccess = async () => {
    try {
      const isValidAdmin = await adminService.validateAdminAccess(user);
      setHasAccess(isValidAdmin);
      
      if (!isValidAdmin) {
        setError('Access denied: Admin privileges required');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error validating admin access:', err);
      setError('Failed to validate admin access');
      setHasAccess(false);
      setLoading(false);
    }
  };

  const fetchGames = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get today's games for the specific league
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

      let query = supabase.from('games').select('*');

      if (league === 'Champions League') {
        query = query.eq('sport', 'UEFA_CHAMPIONS_LEAGUE');
      } else {
        query = query.eq('league', league.toUpperCase());
      }

      const { data: gamesData, error: gamesError } = await query
        .gte('game_time', startOfDay.toISOString())
        .lt('game_time', endOfDay.toISOString())
        .order('game_time', { ascending: true })
        .limit(20); // Limit to 20 games for performance

      if (gamesError) {
        throw new Error(`Failed to fetch ${league} games: ${gamesError.message}`);
      }

      setGames(gamesData || []);

      // Fetch main line odds for each game
      if (gamesData && gamesData.length > 0) {
        const gameIds = gamesData.map(game => game.id);
        await fetchOddsForGames(gameIds);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading games');
      console.error(`Error fetching ${league} games:`, err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOddsForGames = async (gameIds: string[]) => {
    try {
      const oddsByGame: Record<string, DatabaseOdds[]> = {};
      
      // Fetch odds for each game individually, exactly like UniversalGameCard
      for (const gameId of gameIds) {
        const isSoccer = league === 'Champions League' || league === 'MLS';
        
        const mainLineOddIds = isSoccer ? [
          'points-away-reg-ml-away',    // Away ML (soccer 2-way)
          'points-home-reg-ml-home',    // Home ML (soccer 2-way)  
          'points-all-reg-ml3way-draw', // Draw (soccer 3-way)
          'points-away-reg-sp-away',    // Away spread
          'points-home-reg-sp-home',    // Home spread
          'points-all-reg-ou-over',     // Total over
          'points-all-reg-ou-under'     // Total under
        ] : [
          'points-away-game-ml-away',   // Away ML
          'points-home-game-ml-home',   // Home ML
          'points-away-game-sp-away',   // Away spread
          'points-home-game-sp-home',   // Home spread
          'points-all-game-ou-over',    // Total over
          'points-all-game-ou-under'    // Total under
        ];

        // Fetch only the main line odds with a single query - exact copy from UniversalGameCard
        const { data: mainOdds, error: oddsError } = await supabase
          .from('odds')
          .select('*')
          .eq('eventid', gameId)
          .in('oddid', mainLineOddIds)
          .order('created_at', { ascending: false });
        
        if (oddsError) {
          continue;
        }

        if (!mainOdds || mainOdds.length === 0) {
          continue;
        }

        // Use the same deduplication logic as UniversalGameCard
        const deduplicatedOdds = deduplicateOddsForDisplay(mainOdds);
        oddsByGame[gameId] = deduplicatedOdds;
        
      }

      
      // Log sample odds for debugging
      if (Object.keys(oddsByGame).length > 0) {
        const firstGameId = Object.keys(oddsByGame)[0];
        const firstGameOdds = oddsByGame[firstGameId];
      }
      
      setGameOdds(oddsByGame);
    } catch (err) {
      console.error('Error fetching odds:', err);
    }
  };

  const formatOdds = (odds: number): string => {
    if (!odds || !isFinite(odds)) return '-';
    if (odds > 0) return `+${odds}`;
    return odds.toString();
  };

  const getBestOdds = (odd: DatabaseOdds): number => {
    return (
      odd.fanduelodds ||
      odd.draftkingsodds ||
      odd.espnbetodds ||
      odd.ceasarsodds ||
      odd.mgmodds ||
      odd.fanaticsodds ||
      odd.bovadaodds ||
      odd.bet365odds ||
      odd.pinnacleodds ||
      odd.williamhillodds ||
      odd.unibetodds ||
      odd.pointsbetodds ||
      odd.ballybetodds ||
      odd.betriversodds ||
      odd.wynnbetodds ||
      odd.hardrockbetodds ||
      odd.thescorebetodds ||
      odd.circaodds ||
      odd.barstoolodds ||
      odd.betonlineodds ||
      odd.betparxodds ||
      odd.betusodds ||
      odd.betfairexchangeodds ||
      odd.betfairsportsbookodds ||
      odd.betfredodds ||
      odd.fliffodds ||
      odd.fourwindsodds ||
      odd.lowvigodds ||
      odd.marathonbetodds ||
      odd.primesportsodds ||
      odd.prophetexchangeodds ||
      odd.skybetodds ||
      odd.sleeperodds ||
      odd.stakeodds ||
      odd.underdogodds ||
      odd.prizepicksodds ||
      odd.bookodds ||
      0
    );
  };

  // Deduplicate odds for display - same as UniversalGameCard
  const deduplicateOddsForDisplay = (odds: DatabaseOdds[]): DatabaseOdds[] => {
    if (!odds || odds.length === 0) return odds;
    
    const startTime = Date.now();
    const oddsMap = new Map<string, DatabaseOdds>();
    
    // Since odds are already ordered by created_at DESC (newest first),
    // we can take the first occurrence of each key as the most recent
    for (const odd of odds) {
      const key = `${odd.oddid || 'unknown'}|${odd.line || 'null'}`;
      
      if (!oddsMap.has(key)) {
        // First (newest) entry for this key due to DESC ordering
        oddsMap.set(key, odd);
      }
      // Skip subsequent (older) entries for the same key
    }
    
    const deduplicated = Array.from(oddsMap.values());
    return deduplicated;
  };

  // Helper function to find main line (odds closest to ±100) from alternate lines
  const findMainLine = (oddsList: DatabaseOdds[]): DatabaseOdds | undefined => {
    if (oddsList.length === 0) return undefined;
    if (oddsList.length === 1) return oddsList[0];
    
    // Find the line with odds closest to ±100 (even odds)
    let mainLine = oddsList[0];
    let bestDistance = Infinity;
    
    for (const odd of oddsList) {
      const oddsValue = getBestOdds(odd);
      if (oddsValue !== 0) {
        // Calculate distance from even odds (closer to ±100 is main)
        const distance = Math.abs(Math.abs(oddsValue) - 100);
        if (distance < bestDistance) {
          bestDistance = distance;
          mainLine = odd;
        }
      }
    }
    
    return mainLine;
  };

  const getGameOdds = (gameId: string) => {
    const odds = gameOdds[gameId] || [];
    const isSoccer = league === 'Champions League' || league === 'MLS';
    
    if (odds.length === 0) {
      return {
        awayML: undefined,
        homeML: undefined,
        awaySpread: undefined,
        homeSpread: undefined,
        draw: undefined,
        over: undefined,
        under: undefined
      };
    }

    
    // Group odds by oddid to handle alternates (same as UniversalGameCard)
    const oddsByOddId = new Map<string, DatabaseOdds[]>();

    odds.forEach(odd => {
      if (odd.oddid) {
        if (!oddsByOddId.has(odd.oddid)) {
          oddsByOddId.set(odd.oddid, []);
        }
        oddsByOddId.get(odd.oddid)!.push(odd);
      }
    });


    if (isSoccer) {
      // Soccer uses reg patterns
      const awayMLOptions = oddsByOddId.get('points-away-reg-ml-away') || [];
      const homeMLOptions = oddsByOddId.get('points-home-reg-ml-home') || [];
      const drawOptions = oddsByOddId.get('points-all-reg-ml3way-draw') || [];
      // Soccer spreads and totals may use game patterns - check both
      const awaySpreadOptions = oddsByOddId.get('points-away-game-sp-away') || oddsByOddId.get('points-away-reg-sp-away') || [];
      const homeSpreadOptions = oddsByOddId.get('points-home-game-sp-home') || oddsByOddId.get('points-home-reg-sp-home') || [];
      const totalOverOptions = oddsByOddId.get('points-all-game-ou-over') || oddsByOddId.get('points-all-reg-ou-over') || [];
      const totalUnderOptions = oddsByOddId.get('points-all-game-ou-under') || oddsByOddId.get('points-all-reg-ou-under') || [];


      return {
        awayML: findMainLine(awayMLOptions),
        homeML: findMainLine(homeMLOptions),
        draw: findMainLine(drawOptions),
        awaySpread: findMainLine(awaySpreadOptions),
        homeSpread: findMainLine(homeSpreadOptions),
        over: findMainLine(totalOverOptions),
        under: findMainLine(totalUnderOptions)
      };
    } else {
      // Other sports use game patterns
      const awayMLOptions = oddsByOddId.get('points-away-game-ml-away') || [];
      const homeMLOptions = oddsByOddId.get('points-home-game-ml-home') || [];
      const awaySpreadOptions = oddsByOddId.get('points-away-game-sp-away') || [];
      const homeSpreadOptions = oddsByOddId.get('points-home-game-sp-home') || [];
      const totalOverOptions = oddsByOddId.get('points-all-game-ou-over') || [];
      const totalUnderOptions = oddsByOddId.get('points-all-game-ou-under') || [];


      const result = {
        awayML: findMainLine(awayMLOptions),
        homeML: findMainLine(homeMLOptions),
        awaySpread: findMainLine(awaySpreadOptions),
        homeSpread: findMainLine(homeSpreadOptions),
        over: findMainLine(totalOverOptions),
        under: findMainLine(totalUnderOptions)
      };

      // Log odds that have actual values to help debug
      odds.forEach(odd => {
        const oddsValue = getBestOdds(odd);
      });


      return result;
    }
  };

  const formatGameTime = (gameTime: string): string => {
    const date = new Date(gameTime);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format line for spread/total display - same as UniversalGameCard
  const formatLine = (line: string | undefined, oddid: string): string => {
    if (!line) return '';
    
    if (oddid?.includes('-sp-') || oddid?.includes('-rl-')) {
      const numLine = parseFloat(line);
      return numLine > 0 ? `+${numLine}` : numLine.toString();
    }
    
    return line;
  };


  const handleGenerateShareImage = async () => {
    const isValidAdmin = await adminService.validateAdminAccess(user);
    if (!isValidAdmin) {
      Alert.alert('Access Denied', 'Admin privileges required to share games.');
      return;
    }

    if (!cardRef.current) {
      Alert.alert('Error', 'Card not ready. Please try again.');
      return;
    }

    try {
      setIsGeneratingImage(true);

      await new Promise(resolve => setTimeout(resolve, 300));

      const templateWidth = Math.min(400, Dimensions.get('window').width - 40);
      const uri = await captureRef(cardRef.current, {
        format: 'png',
        quality: 0.95,
        width: templateWidth,
        backgroundColor: 'white',
        result: 'tmpfile',
      });

      await Share.share({
        url: uri,
        message: `🏈 ${title} Games Today - ${new Date().toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })}\n\nCheck out today's ${league} games on TrueSharp!`,
      });
    } catch (error) {
      console.error('Error generating share image:', error);
      Alert.alert('Error', 'Failed to generate share image. Please try again.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={leagueColor} />
        <Text style={styles.loadingText}>Loading {league} games...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.status.error} />
        <Text style={styles.errorTitle}>Error Loading Games</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: leagueColor }]} onPress={fetchGames}>
          <Ionicons name="refresh-outline" size={20} color={theme.colors.card} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isSoccer = league === 'Champions League' || league === 'MLS';

  return (
    <View style={styles.section}>
      <View style={styles.cardContainer}>
        <View ref={cardRef} style={styles.card}>
          <LinearGradient
            colors={[theme.colors.primary, '#1e40af', '#0f172a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.titleContainer}
          >
            <View style={styles.titleRow}>
              <LeagueLogo leagueName={league} size={24} style={styles.titleLogo} />
              <Text style={styles.sectionTitle}>{title} Games Today</Text>
            </View>
            <View style={styles.dateRow}>
              <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}</Text>
              <Image 
                source={require('../../assets/truesharp-logo.png')}
                style={styles.truesharpLogo}
                resizeMode="contain"
              />
            </View>
          </LinearGradient>
          
          <View style={styles.cardContent}>
            {games.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={theme.colors.text.secondary} />
                <Text style={styles.emptyStateText}>No {league} games today</Text>
              </View>
            ) : (
              <View style={styles.gamesContainer}>
                {games.map((game, index) => {
                  const odds = getGameOdds(game.id);
                  
                  return (
                    <View key={game.id} style={[styles.gameRow, index === games.length - 1 && styles.lastGameRow]}>
                      <View style={styles.gameInfo}>
                        <View style={styles.timeColumn}>
                          <Text style={styles.gameTime}>{formatGameTime(game.game_time)}</Text>
                        </View>
                        
                        <View style={styles.teamsColumn}>
                          <View style={styles.teamRow}>
                            <TeamLogo teamName={game.away_team} league={league} size={16} />
                            <Text style={styles.teamName} numberOfLines={1}>
                              {getTeamInfo(game.away_team, league)?.abbreviation || game.away_team}
                            </Text>
                          </View>
                          <View style={styles.teamRow}>
                            <TeamLogo teamName={game.home_team} league={league} size={16} />
                            <Text style={styles.teamName} numberOfLines={1}>
                              {getTeamInfo(game.home_team, league)?.abbreviation || game.home_team}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.oddsColumn}>
                          {isSoccer ? (
                            <>
                              <View style={styles.oddsRow}>
                                <View style={styles.oddsCell}>
                                  <Text style={styles.oddsValue}>
                                    {odds.awayML ? formatOdds(getBestOdds(odds.awayML)) : '-'}
                                  </Text>
                                </View>
                                <View style={styles.oddsCell}>
                                  <Text style={styles.oddsValue}>
                                    {odds.draw ? formatOdds(getBestOdds(odds.draw)) : '-'}
                                  </Text>
                                </View>
                                <View style={styles.oddsCell}>
                                  {odds.over?.line && (
                                    <Text style={styles.oddsLine}>O{odds.over.line}</Text>
                                  )}
                                  <Text style={styles.oddsValue}>
                                    {odds.over ? formatOdds(getBestOdds(odds.over)) : '-'}
                                  </Text>
                                </View>
                              </View>
                              <View style={styles.oddsRow}>
                                <View style={styles.oddsCell}>
                                  <Text style={styles.oddsValue}>
                                    {odds.homeML ? formatOdds(getBestOdds(odds.homeML)) : '-'}
                                  </Text>
                                </View>
                                <View style={styles.oddsCell}>
                                  <Text style={styles.oddsValue}>-</Text>
                                </View>
                                <View style={styles.oddsCell}>
                                  {odds.under?.line && (
                                    <Text style={styles.oddsLine}>U{odds.under.line}</Text>
                                  )}
                                  <Text style={styles.oddsValue}>
                                    {odds.under ? formatOdds(getBestOdds(odds.under)) : '-'}
                                  </Text>
                                </View>
                              </View>
                            </>
                          ) : (
                            <>
                              <View style={styles.oddsRow}>
                                <View style={styles.oddsCell}>
                                  <Text style={styles.oddsValue}>
                                    {odds.awayML ? formatOdds(getBestOdds(odds.awayML)) : '-'}
                                  </Text>
                                </View>
                                <View style={styles.oddsCell}>
                                  {odds.awaySpread?.line && (
                                    <Text style={styles.oddsLine}>
                                      {formatLine(odds.awaySpread.line, odds.awaySpread.oddid || '')}
                                    </Text>
                                  )}
                                  <Text style={styles.oddsValue}>
                                    {odds.awaySpread ? formatOdds(getBestOdds(odds.awaySpread)) : '-'}
                                  </Text>
                                </View>
                                <View style={styles.oddsCell}>
                                  {odds.over?.line && (
                                    <Text style={styles.oddsLine}>O{odds.over.line}</Text>
                                  )}
                                  <Text style={styles.oddsValue}>
                                    {odds.over ? formatOdds(getBestOdds(odds.over)) : '-'}
                                  </Text>
                                </View>
                              </View>
                              <View style={styles.oddsRow}>
                                <View style={styles.oddsCell}>
                                  <Text style={styles.oddsValue}>
                                    {odds.homeML ? formatOdds(getBestOdds(odds.homeML)) : '-'}
                                  </Text>
                                </View>
                                <View style={styles.oddsCell}>
                                  {odds.homeSpread?.line && (
                                    <Text style={styles.oddsLine}>
                                      {formatLine(odds.homeSpread.line, odds.homeSpread.oddid || '')}
                                    </Text>
                                  )}
                                  <Text style={styles.oddsValue}>
                                    {odds.homeSpread ? formatOdds(getBestOdds(odds.homeSpread)) : '-'}
                                  </Text>
                                </View>
                                <View style={styles.oddsCell}>
                                  {odds.under?.line && (
                                    <Text style={styles.oddsLine}>U{odds.under.line}</Text>
                                  )}
                                  <Text style={styles.oddsValue}>
                                    {odds.under ? formatOdds(getBestOdds(odds.under)) : '-'}
                                  </Text>
                                </View>
                              </View>
                            </>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
        
        {/* Share Button */}
        <TouchableOpacity
          style={[
            styles.shareButtonContainer,
            isGeneratingImage && styles.shareButtonDisabled
          ]}
          onPress={handleGenerateShareImage}
          disabled={isGeneratingImage || games.length === 0}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.primary, '#1e40af']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shareButton}
          >
            {isGeneratingImage ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="share-outline" size={20} color="white" />
            )}
            <Text style={styles.shareButtonText}>
              {isGeneratingImage ? 'Generating...' : `Share ${league} Games`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xs,
  },
  cardContainer: {
    // Container for the card and share button
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 4, // Sharp corners as requested
    borderWidth: 2,
    borderColor: theme.colors.primary,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  truesharpLogo: {
    width: 20,
    height: 20,
    marginLeft: theme.spacing.xs,
  },
  titleLogo: {
    marginRight: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  cardContent: {
    // No height limit - show all games
  },
  gamesContainer: {
    // Container for all games without height restriction
  },
  gameRow: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: theme.spacing.xs,
  },
  lastGameRow: {
    borderBottomWidth: 0,
  },
  gameInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  timeColumn: {
    width: 50,
    marginRight: theme.spacing.sm,
  },
  gameTime: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  teamsColumn: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 1,
  },
  teamName: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.xs,
  },
  oddsColumn: {
    width: 120,
  },
  oddsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 1,
  },
  oddsCell: {
    width: 35,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 20,
  },
  oddsLine: {
    fontSize: 7,
    fontWeight: '500',
    color: theme.colors.text.light,
    textAlign: 'center',
    lineHeight: 8,
  },
  oddsValue: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 11,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  loadingText: {
    ...globalStyles.body,
    marginTop: theme.spacing.md,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  errorTitle: {
    ...globalStyles.h3,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    color: theme.colors.status.error,
  },
  errorText: {
    ...globalStyles.body,
    textAlign: 'center',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  retryText: {
    ...globalStyles.bodyBold,
    color: theme.colors.card,
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyStateText: {
    ...globalStyles.body,
    marginTop: theme.spacing.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  shareButtonContainer: {
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});