'use client';

import { gamesDataService } from '@/lib/services/games-data';
import { DatabaseOdds } from '@/lib/types/database';
import { BetSelection, Game } from '@/lib/types/games';
import { getAvailableTabs, organizeOddsByHierarchy } from '@/lib/utils/odds-hierarchy';
import { CircleDot, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import DatabaseMarketContentFull from './markets/database-market-content-full';
import { MainTabType } from './tabs/hierarchical-tabs';

interface EnhancedUniversalGameCardProps {
  game: Game;
  league: string;
  onOddsClick?: (bet: BetSelection) => void;
  selectedBets?: BetSelection[];
}

export default function EnhancedUniversalGameCard({
  game,
  league,
  onOddsClick = () => {}
}: EnhancedUniversalGameCardProps) {
  const [activeTab, setActiveTab] = useState<MainTabType>('main');
  const [activeSubTab, setActiveSubTab] = useState<string>('');
  const [activeSubSubTab, setActiveSubSubTab] = useState<string>('');
  const [databaseOdds, setDatabaseOdds] = useState<DatabaseOdds[]>([]);
  const [isLoadingOdds, setIsLoadingOdds] = useState(true);

  // Fetch odds to determine available tabs
  useEffect(() => {
    const fetchOdds = async () => {
      try {
        setIsLoadingOdds(true);
        const gameWithOdds = await gamesDataService.getMLBGameWithOdds(game.id);
        
        if (gameWithOdds && gameWithOdds.odds && gameWithOdds.odds.length > 0) {
          setDatabaseOdds(gameWithOdds.odds);
        } else {
          setDatabaseOdds([]);
        }
      } catch (error) {
        console.error('Error fetching odds for tabs:', error);
        setDatabaseOdds([]);
      } finally {
        setIsLoadingOdds(false);
      }
    };

    if (game.id) {
      fetchOdds();
    }
  }, [game.id]);

  // Organize odds and get available tabs
  const organizedOdds = organizeOddsByHierarchy(databaseOdds, game.sport_key);
  const availableTabs = getAvailableTabs(organizedOdds);

  // Format team names for display
  const formatTeamForDisplay = (teamName: string): string => {
    return teamName
      .replace(/^(Los Angeles|San Francisco|New York|Kansas City|Tampa Bay)/, '$1')
      .replace(/\s+(Angels|Dodgers|Giants|Yankees|Mets|Royals|Rays)/, ' $1')
      .trim();
  };

  // Determine game status
  const gameStartTime = new Date(game.commence_time);
  const now = new Date();
  const timeDiffHours = (now.getTime() - gameStartTime.getTime()) / (1000 * 60 * 60);
  
  const isLive = timeDiffHours >= 0 && timeDiffHours <= 4;
  const isFinal = timeDiffHours > 4;
  const isUpcoming = timeDiffHours < 0;

  // Format game time
  const formatGameTime = (timeString: string): string => {
    const date = new Date(timeString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  // Get game status badge
  const getStatusBadge = () => {
    if (isLive) {
      return (
        <div className="flex items-center space-x-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
          <CircleDot className="w-3 h-3" />
          <span>LIVE</span>
        </div>
      );
    }
    
    if (isFinal) {
      return (
        <div className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs font-medium">
          FINAL
        </div>
      );
    }
    
    return null;
  };

  // Tab change handlers
  const handleTabChange = (tab: MainTabType) => {
    setActiveTab(tab);
    setActiveSubTab('');
    setActiveSubSubTab('');
  };

  const handleSubTabChange = (subTab: string) => {
    setActiveSubTab(subTab);
    setActiveSubSubTab('');
  };

  const handleSubSubTabChange = (subSubTab: string) => {
    setActiveSubSubTab(subSubTab);
  };

  // Get display names for tabs
  const getTabDisplayName = (tab: MainTabType): string => {
    switch (tab) {
      case 'main': return 'Main Lines';
      case 'player-props': return 'Player Props';
      case 'team-props': return 'Team Props';
      case 'game-props': return 'Game Props';
      default: return tab;
    }
  };

  const getSubTabDisplayName = (subTab: string): string => {
    const displayNames: Record<string, string> = {
      'hitters': 'Hitters',
      'pitchers': 'Pitchers',
      'quarterback': 'Quarterback',
      'running-back': 'Running Back',
      'receiver': 'Wide Receiver',
      'defense-kicker': 'Defense/Kicker',
      'scoring': 'Scoring',
      'rebounding': 'Rebounding',
      'playmaking': 'Playmaking',
      'combo-props': 'Combo Props',
      'skaters': 'Skaters',
      'goalies': 'Goalies',
      'forwards': 'Forwards',
      'midfielders': 'Midfielders',
      'defenders': 'Defenders',
      'goalkeepers': 'Goalkeepers',
      'team-totals': 'Team Totals',
      'game-totals': 'Game Totals',
      'all': 'All'
    };
    return displayNames[subTab] || subTab;
  };

  const getSubSubTabDisplayName = (subSubTab: string): string => {
    const displayNames: Record<string, string> = {
      'offense': 'Offense',
      'discipline': 'Discipline', 
      'speed': 'Speed',
      'passing': 'Passing',
      'rushing': 'Rushing',
      'receiving': 'Receiving',
      'points': 'Points',
      'field-goals': 'Field Goals',
      'three-pointers': '3-Pointers',
      'free-throws': 'Free Throws',
      'total': 'Total',
      'offensive': 'Offensive',
      'defensive': 'Defensive',
      'assists': 'Assists',
      'defense': 'Defense',
      'turnovers': 'Turnovers',
      'all': 'All'
    };
    return displayNames[subSubTab] || subSubTab;
  };

  const homeTeam = formatTeamForDisplay(game.home_team);
  const awayTeam = formatTeamForDisplay(game.away_team);

  // Get current subtabs and subsubtabs
  const currentSubTabs = availableTabs.getSubTabs(activeTab);
  const currentSubSubTabs = availableTabs.getSubSubTabs(activeTab, activeSubTab);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      {/* Game Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {league}
            </div>
            {getStatusBadge()}
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <Clock className="w-4 h-4" />
            <span className="font-medium">
              {isUpcoming ? formatGameTime(game.commence_time) : 'In Progress'}
            </span>
          </div>
        </div>
      </div>

      {/* Team Names */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-bold text-slate-900">{awayTeam}</div>
            <div className="text-sm font-bold text-slate-900">{homeTeam}</div>
          </div>
          <div className="text-xs text-slate-500">
            vs
          </div>
        </div>
      </div>

      {/* 3-Level Hierarchical Tab Controls */}
      <div className="px-4 py-3 border-b border-slate-100">
        {/* Level 1: Main Tabs */}
        <div className="flex items-center bg-slate-100 rounded-xl p-1">
          {availableTabs.mainTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`
                flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                ${activeTab === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }
              `}
            >
              {getTabDisplayName(tab)}
            </button>
          ))}
        </div>
        
        {/* Level 2: Subtabs */}
        {currentSubTabs.length > 0 && (
          <div className="mt-3 pl-2 border-l-2 border-blue-200">
            <div className="flex flex-wrap gap-1">
              {currentSubTabs.map((subTab) => (
                <button
                  key={subTab}
                  onClick={() => handleSubTabChange(subTab)}
                  className={`
                    px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap
                    ${activeSubTab === subTab
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                    }
                  `}
                >
                  {getSubTabDisplayName(subTab)}
                </button>
              ))}
            </div>
            
            {/* Level 3: Sub-subtabs */}
            {currentSubSubTabs.length > 0 && (
              <div className="mt-2 pl-4 border-l-2 border-green-200">
                <div className="flex flex-wrap gap-1">
                  {currentSubSubTabs.map((subSubTab) => (
                    <button
                      key={subSubTab}
                      onClick={() => handleSubSubTabChange(subSubTab)}
                      className={`
                        px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap
                        ${activeSubSubTab === subSubTab
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-transparent'
                        }
                      `}
                    >
                      {getSubSubTabDisplayName(subSubTab)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading indicator for tabs */}
        {isLoadingOdds && (
          <div className="mt-3 text-center">
            <div className="inline-flex items-center space-x-2 text-slate-500 text-sm">
              <div className="w-3 h-3 border border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
              <span>Loading tabs...</span>
            </div>
          </div>
        )}
      </div>

      {/* Market Content */}
      <div className="p-4">
        <DatabaseMarketContentFull
          game={game}
          activeMainTab={activeTab}
          activeSubTab={activeSubTab}
          activeSubSubTab={activeSubSubTab}
          onBetClick={onOddsClick}
        />
      </div>
    </div>
  );
}
