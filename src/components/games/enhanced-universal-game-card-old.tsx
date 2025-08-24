'use client';

import { BetSelection, Game } from '@/lib/types/games';
import { getMarketConfigForSport } from '@/lib/types/sports-markets';
import { CircleDot, Clock } from 'lucide-react';
import { useState } from 'react';
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

  // Get sport key from the game
  const sportKey = game.sport_key;
  const marketConfig = getMarketConfigForSport(sportKey);

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
  
  const isLive = timeDiffHours >= 0 && timeDiffHours <= 4; // Assume 4-hour max game duration
  const isFinal = timeDiffHours > 4;
  const isUpcoming = timeDiffHours < 0;

  // Get game status badge
  const getStatusBadge = () => {
    if (isLive) {
      return (
        <div className="flex items-center space-x-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
          <CircleDot className="w-3 h-3 animate-pulse" />
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

  // Format game time
  const formatGameTime = (dateTime: string): string => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get available tabs based on game data
  const getAvailableTabs = (): MainTabType[] => {
    const baseTabs: MainTabType[] = ['main'];
    
    // Add other tabs - in a real implementation, you'd check if the game has these markets
    baseTabs.push('player-props', 'team-props', 'game-props');
    
    return baseTabs;
  };

  const availableTabs = getAvailableTabs();

  const handleTabChange = (tab: MainTabType) => {
    setActiveTab(tab);
    
    // Set default subtab when changing main tabs
    if (tab === 'player-props' && marketConfig?.playerProps && marketConfig.playerProps.length > 0) {
      setActiveSubTab(marketConfig.playerProps[0]?.id || '');
    } else if (tab === 'team-props') {
      if (marketConfig?.teamProps?.subcategories && marketConfig.teamProps.subcategories.length > 0) {
        setActiveSubTab(marketConfig.teamProps.subcategories[0]?.id || '');
      } else {
        setActiveSubTab('team-basic');
      }
    } else if (tab === 'game-props') {
      if (marketConfig?.gameProps?.subcategories && marketConfig.gameProps.subcategories.length > 0) {
        setActiveSubTab(marketConfig.gameProps.subcategories[0]?.id || '');
      } else {
        setActiveSubTab('game-basic');
      }
    } else {
      setActiveSubTab('');
    }
    
    // Reset subsubtab when main tab changes
    setActiveSubSubTab('');
  };

  const handleSubTabChange = (subTab: string) => {
    setActiveSubTab(subTab);
    
    // Set default subsubtab for player props when switching subtabs
    const currentSubTab = marketConfig?.playerProps?.find(prop => prop.id === subTab);
    if (currentSubTab?.subcategories && currentSubTab.subcategories.length > 0) {
      setActiveSubSubTab(currentSubTab.subcategories[0]?.id || '');
    } else {
      setActiveSubSubTab('');
    }
  };

  const handleSubSubTabChange = (subSubTab: string) => {
    setActiveSubSubTab(subSubTab);
  };

  // Get subtabs for the current active tab
  const getSubTabs = () => {
    if (!marketConfig) return [];
    
    switch (activeTab) {
      case 'player-props':
        return marketConfig.playerProps || [];
      case 'team-props':
        return marketConfig.teamProps?.subcategories || [
          { id: 'team-basic', label: 'Basic Stats', markets: [] },
          { id: 'team-advanced', label: 'Advanced', markets: [] },
          { id: 'team-special', label: 'Special', markets: [] }
        ];
      case 'game-props':
        return marketConfig.gameProps?.subcategories || [
          { id: 'game-basic', label: 'Game Flow', markets: [] },
          { id: 'game-timing', label: 'Timing', markets: [] },
          { id: 'game-special', label: 'Special Events', markets: [] }
        ];
      default:
        return [];
    }
  };

  // Get subsubtabs for the current active subtab (only for player props)
  const getSubSubTabs = () => {
    if (activeTab !== 'player-props' || !marketConfig?.playerProps) return [];
    
    const currentSubTab = marketConfig.playerProps.find(prop => prop.id === activeSubTab);
    return currentSubTab?.subcategories || [];
  };

  const subTabs = getSubTabs();
  const subSubTabs = getSubSubTabs();

  // Map tab types to display names
  const getTabDisplayName = (tab: MainTabType): string => {
    switch (tab) {
      case 'main': return 'Main Lines';
      case 'player-props': return 'Player Props';
      case 'team-props': return 'Team Props';
      case 'game-props': return 'Game Props';
      case 'period-props': return 'Period Props';
      case 'alt-lines': return 'Alt Lines';
      default: return tab;
    }
  };

  const homeTeam = formatTeamForDisplay(game.home_team);
  const awayTeam = formatTeamForDisplay(game.away_team);

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

      {/* Segmented Pill Tab Controls */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center bg-slate-100 rounded-xl p-1">
          {availableTabs.map((tab) => (
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
        
        {/* Subtabs */}
        {subTabs.length > 0 && (
          <div className="mt-3 pl-2 border-l-2 border-blue-200">
            <div className="flex flex-wrap gap-1">
              {subTabs.map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => handleSubTabChange(subTab.id)}
                  className={`
                    px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap
                    ${activeSubTab === subTab.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                    }
                  `}
                >
                  {subTab.label}
                </button>
              ))}
            </div>
            
            {/* SubSubtabs (3rd level for player props) */}
            {subSubTabs.length > 0 && (
              <div className="mt-2 pl-4 border-l-2 border-green-200">
                <div className="flex flex-wrap gap-1">
                  {subSubTabs.map((subSubTab) => (
                    <button
                      key={subSubTab.id}
                      onClick={() => handleSubSubTabChange(subSubTab.id)}
                      className={`
                        px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap
                        ${activeSubSubTab === subSubTab.id
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-transparent'
                        }
                      `}
                    >
                      {subSubTab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
