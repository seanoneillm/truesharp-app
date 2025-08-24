'use client';

import { BetSelection } from '@/lib/types/games';
import { MLBGameOdds, OddsData, PlayerProp, TeamProp, GameProp, formatOddsDisplay } from '@/lib/games/mlb-odds-processor';
import { useState } from 'react';
export type MainTabType = 'main' | 'player-props' | 'team-props' | 'game-props' | 'period-props' | 'alt-lines';

interface MLBOddsDisplayProps {
  gameOdds: MLBGameOdds;
  homeTeam: string;
  awayTeam: string;
  onBetClick: (bet: BetSelection) => void;
}

export default function MLBOddsDisplay({ 
  gameOdds, 
  homeTeam, 
  awayTeam, 
  onBetClick 
}: MLBOddsDisplayProps) {
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('main');
  const [activeSubTab, setActiveSubTab] = useState<string>('');

  // Get available player prop markets for dynamic tabs
  const getAvailablePlayerPropMarkets = () => {
    const hitterMarkets = Object.keys(groupPlayerPropsByMarket(gameOdds.playerProps.hitters));
    const pitcherMarkets = Object.keys(groupPlayerPropsByMarket(gameOdds.playerProps.pitchers));
    return {
      hitters: hitterMarkets,
      pitchers: pitcherMarkets
    };
  };

  const handleOddsClick = (
    marketType: string,
    selection: string,
    odds: number,
    line?: number | string
  ) => {
    onBetClick({
      gameId: gameOdds.gameId,
      marketType,
      selection,
      odds,
      line
    });
  };

  const renderOddsButton = (
    odds: OddsData | undefined,
    label: string,
    marketType: string,
    selection: string,
    variant: 'primary' | 'secondary' = 'primary'
  ) => {
    if (!odds) {
      return (
        <div className="p-3 text-center bg-gray-50 border border-gray-200 rounded text-gray-400">
          <div className="text-xs font-medium">{label}</div>
          <div className="text-sm">--</div>
        </div>
      );
    }

    const baseClasses = "p-3 text-center border rounded transition-colors cursor-pointer";
    const variantClasses = variant === 'primary' 
      ? "bg-white border-blue-200 hover:bg-blue-50 hover:border-blue-300"
      : "bg-gray-50 border-gray-200 hover:bg-gray-100";

    return (
      <button
        onClick={() => handleOddsClick(marketType, selection, odds.odds, odds.line)}
        className={`${baseClasses} ${variantClasses}`}
      >
        <div className="text-xs font-medium text-gray-600">{label}</div>
        {odds.line && (
          <div className="text-xs text-gray-500">
            {typeof odds.line === 'number' && odds.line > 0 ? `+${odds.line}` : odds.line}
          </div>
        )}
        <div className="text-sm font-bold text-blue-600">
          {formatOddsDisplay(odds.odds)}
        </div>
        <div className="text-xs text-gray-400 mt-1">{odds.sportsbook}</div>
      </button>
    );
  };

  const renderPlayerProp = (prop: PlayerProp) => {
    const hasValidOdds = prop.over || prop.under;
    if (!hasValidOdds) return null;

    const line = prop.over?.line || prop.under?.line;
    const displayLine = line ? (typeof line === 'number' && line > 0 ? `+${line}` : line) : '--';

    return (
      <div key={`${prop.playerId}-${prop.market}`} className="bg-white border border-gray-200 rounded-lg p-3">
        {/* Player Name and Line */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-gray-800">
            {prop.playerName}
          </div>
          <div className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
            Line: {displayLine}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {/* Over Button */}
          <button
            onClick={() => prop.over && handleOddsClick(
              'player_prop', 
              `${prop.playerName} ${prop.market} Over ${displayLine}`, 
              prop.over.odds, 
              prop.over.line
            )}
            className={`p-2 text-center border rounded transition-colors ${
              prop.over 
                ? 'bg-green-50 border-green-200 hover:bg-green-100 text-green-800' 
                : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!prop.over}
          >
            <div className="text-xs font-medium text-green-700">
              Over
            </div>
            <div className="text-sm font-bold">
              {prop.over ? formatOddsDisplay(prop.over.odds) : '--'}
            </div>
            {prop.over?.sportsbook && (
              <div className="text-xs text-gray-500 mt-1">
                {prop.over.sportsbook}
              </div>
            )}
          </button>
          
          {/* Under Button */}
          <button
            onClick={() => prop.under && handleOddsClick(
              'player_prop', 
              `${prop.playerName} ${prop.market} Under ${displayLine}`, 
              prop.under.odds, 
              prop.under.line
            )}
            className={`p-2 text-center border rounded transition-colors ${
              prop.under 
                ? 'bg-red-50 border-red-200 hover:bg-red-100 text-red-800' 
                : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!prop.under}
          >
            <div className="text-xs font-medium text-red-700">
              Under
            </div>
            <div className="text-sm font-bold">
              {prop.under ? formatOddsDisplay(prop.under.odds) : '--'}
            </div>
            {prop.under?.sportsbook && (
              <div className="text-xs text-gray-500 mt-1">
                {prop.under.sportsbook}
              </div>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Group player props by market type for better organization
  const groupPlayerPropsByMarket = (props: PlayerProp[]) => {
    const grouped: Record<string, PlayerProp[]> = {};
    props.forEach(prop => {
      if (!grouped[prop.market]) {
        grouped[prop.market] = [];
      }
      grouped[prop.market].push(prop);
    });
    return grouped;
  };

  const renderMainLines = () => (
    <div className="grid grid-cols-3 gap-4">
      {/* Moneyline */}
      <div>
        <div className="text-xs font-medium text-gray-600 text-center mb-2">Moneyline</div>
        <div className="space-y-2">
          {renderOddsButton(
            gameOdds.mainLines.moneyline.away,
            `@ ${awayTeam}`,
            'moneyline',
            awayTeam
          )}
          {renderOddsButton(
            gameOdds.mainLines.moneyline.home,
            homeTeam,
            'moneyline',
            homeTeam
          )}
        </div>
      </div>

      {/* Run Line */}
      <div>
        <div className="text-xs font-medium text-gray-600 text-center mb-2">Run Line</div>
        <div className="space-y-2">
          {renderOddsButton(
            gameOdds.mainLines.runLine.away,
            `@ ${awayTeam}`,
            'spread',
            awayTeam
          )}
          {renderOddsButton(
            gameOdds.mainLines.runLine.home,
            homeTeam,
            'spread',
            homeTeam
          )}
        </div>
      </div>

      {/* Total */}
      <div>
        <div className="text-xs font-medium text-gray-600 text-center mb-2">Total Runs</div>
        <div className="space-y-2">
          {renderOddsButton(
            gameOdds.mainLines.total.over,
            'Over',
            'total',
            'Over'
          )}
          {renderOddsButton(
            gameOdds.mainLines.total.under,
            'Under',
            'total',
            'Under'
          )}
        </div>
      </div>
    </div>
  );

  const renderPlayerPropsContent = () => {
    const availableMarkets = getAvailablePlayerPropMarkets();
    
    // Determine if we're showing hitters or pitchers based on activeSubTab
    const isHitterMarket = availableMarkets.hitters.includes(activeSubTab);
    const isPitcherMarket = availableMarkets.pitchers.includes(activeSubTab);
    
    if (!isHitterMarket && !isPitcherMarket) {
      return (
        <div className="text-center py-8 text-gray-500">
          <div className="text-sm">Please select a market</div>
        </div>
      );
    }

    const propsToShow = isHitterMarket ? gameOdds.playerProps.hitters : gameOdds.playerProps.pitchers;
    const groupedProps = groupPlayerPropsByMarket(propsToShow);
    
    if (!groupedProps[activeSubTab] || groupedProps[activeSubTab].length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <div className="text-sm">No props available for {activeSubTab}</div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">
          {activeSubTab} Over/Under
        </div>
        <div className="grid grid-cols-1 gap-3">
          {groupedProps[activeSubTab].map(renderPlayerProp)}
        </div>
      </div>
    );
  };

  const renderTeamPropsContent = () => {
    const groupedTeamProps = gameOdds.teamProps.reduce((acc, prop) => {
      if (!acc[prop.market]) {
        acc[prop.market] = [];
      }
      acc[prop.market].push(prop);
      return acc;
    }, {} as Record<string, TeamProp[]>);
    
    if (Object.keys(groupedTeamProps).length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <div className="text-sm">No team props available</div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {Object.entries(groupedTeamProps).map(([marketName, props]) => (
          <div key={marketName} className="space-y-3">
            <div className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">
              {marketName} Over/Under
            </div>
            <div className="grid grid-cols-1 gap-3">
              {props.map(prop => renderTeamProp(prop))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderGamePropsContent = () => {
    if (gameOdds.gameProps.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <div className="text-sm">No game props available</div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {gameOdds.gameProps.map(prop => renderGameProp(prop))}
      </div>
    );
  };

  const renderTeamProp = (prop: TeamProp) => {
    const hasValidOdds = prop.over || prop.under;
    if (!hasValidOdds) return null;

    const line = prop.over?.line || prop.under?.line;
    const displayLine = line ? (typeof line === 'number' && line > 0 ? `+${line}` : line) : '--';

    return (
      <div key={`${prop.team}-${prop.market}`} className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-gray-800">
            {prop.team === 'home' ? homeTeam : awayTeam}
          </div>
          <div className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
            Line: {displayLine}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => prop.over && handleOddsClick(
              'team_prop', 
              `${prop.teamName} ${prop.market} Over ${displayLine}`, 
              prop.over.odds, 
              prop.over.line
            )}
            className={`p-2 text-center border rounded transition-colors ${
              prop.over 
                ? 'bg-green-50 border-green-200 hover:bg-green-100 text-green-800' 
                : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!prop.over}
          >
            <div className="text-xs font-medium text-green-700">Over</div>
            <div className="text-sm font-bold">
              {prop.over ? formatOddsDisplay(prop.over.odds) : '--'}
            </div>
            {prop.over?.sportsbook && (
              <div className="text-xs text-gray-500 mt-1">{prop.over.sportsbook}</div>
            )}
          </button>
          
          <button
            onClick={() => prop.under && handleOddsClick(
              'team_prop', 
              `${prop.teamName} ${prop.market} Under ${displayLine}`, 
              prop.under.odds, 
              prop.under.line
            )}
            className={`p-2 text-center border rounded transition-colors ${
              prop.under 
                ? 'bg-red-50 border-red-200 hover:bg-red-100 text-red-800' 
                : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!prop.under}
          >
            <div className="text-xs font-medium text-red-700">Under</div>
            <div className="text-sm font-bold">
              {prop.under ? formatOddsDisplay(prop.under.odds) : '--'}
            </div>
            {prop.under?.sportsbook && (
              <div className="text-xs text-gray-500 mt-1">{prop.under.sportsbook}</div>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderGameProp = (prop: GameProp) => {
    const hasValidOdds = prop.over || prop.under;
    if (!hasValidOdds) return null;

    const line = prop.over?.line || prop.under?.line;
    const displayLine = line ? (typeof line === 'number' && line > 0 ? `+${line}` : line) : '--';

    return (
      <div key={prop.market} className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-gray-800">
            {prop.market}
          </div>
          <div className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
            Line: {displayLine}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => prop.over && handleOddsClick(
              'game_prop', 
              `${prop.market} Over ${displayLine}`, 
              prop.over.odds, 
              prop.over.line
            )}
            className={`p-2 text-center border rounded transition-colors ${
              prop.over 
                ? 'bg-green-50 border-green-200 hover:bg-green-100 text-green-800' 
                : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!prop.over}
          >
            <div className="text-xs font-medium text-green-700">Over</div>
            <div className="text-sm font-bold">
              {prop.over ? formatOddsDisplay(prop.over.odds) : '--'}
            </div>
            {prop.over?.sportsbook && (
              <div className="text-xs text-gray-500 mt-1">{prop.over.sportsbook}</div>
            )}
          </button>
          
          <button
            onClick={() => prop.under && handleOddsClick(
              'game_prop', 
              `${prop.market} Under ${displayLine}`, 
              prop.under.odds, 
              prop.under.line
            )}
            className={`p-2 text-center border rounded transition-colors ${
              prop.under 
                ? 'bg-red-50 border-red-200 hover:bg-red-100 text-red-800' 
                : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!prop.under}
          >
            <div className="text-xs font-medium text-red-700">Under</div>
            <div className="text-sm font-bold">
              {prop.under ? formatOddsDisplay(prop.under.odds) : '--'}
            </div>
            {prop.under?.sportsbook && (
              <div className="text-xs text-gray-500 mt-1">{prop.under.sportsbook}</div>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeMainTab) {
      case 'main':
        return renderMainLines();
      case 'player-props':
        return renderPlayerPropsContent();
      case 'team-props':
        return renderTeamPropsContent();
      case 'game-props':
        return renderGamePropsContent();
      case 'alt-lines':
        return (
          <div className="text-center py-8 text-gray-500">
            <div className="text-sm">Alt lines coming soon</div>
          </div>
        );
      default:
        return renderMainLines();
    }
  };

  const renderCustomTabs = () => {
    const availableMarkets = getAvailablePlayerPropMarkets();
    
    return (
      <div className="bg-slate-50/30 border border-slate-100 rounded-lg">
        <div className="px-3 sm:px-4 py-2">
          {/* Main Tabs */}
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => {setActiveMainTab('main'); setActiveSubTab('');}}
              className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded transition-all duration-200 whitespace-nowrap ${
                activeMainTab === 'main'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <span className="text-xs">🏠</span>
              <span className="hidden xs:inline sm:inline">Main</span>
            </button>
            
            <button
              onClick={() => {setActiveMainTab('player-props'); setActiveSubTab(availableMarkets.hitters[0] || '');}}
              className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded transition-all duration-200 whitespace-nowrap ${
                activeMainTab === 'player-props'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <span className="text-xs">👤</span>
              <span className="hidden xs:inline sm:inline">Players</span>
            </button>
            
            <button
              onClick={() => {setActiveMainTab('team-props'); setActiveSubTab('team-basic');}}
              className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded transition-all duration-200 whitespace-nowrap ${
                activeMainTab === 'team-props'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <span className="text-xs">🏆</span>
              <span className="hidden xs:inline sm:inline">Teams</span>
            </button>
            
            <button
              onClick={() => {setActiveMainTab('game-props'); setActiveSubTab('game-basic');}}
              className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded transition-all duration-200 whitespace-nowrap ${
                activeMainTab === 'game-props'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <span className="text-xs">🎯</span>
              <span className="hidden xs:inline sm:inline">Game</span>
            </button>
          </div>

          {/* Player Props Sub-tabs */}
          {activeMainTab === 'player-props' && (
            <div className="mt-2 space-y-2">
              {/* Position Tabs (Hitters/Pitchers) */}
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveSubTab(availableMarkets.hitters[0] || '')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                    availableMarkets.hitters.some(market => activeSubTab === market)
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  Hitters ({availableMarkets.hitters.length})
                </button>
                <button
                  onClick={() => setActiveSubTab(availableMarkets.pitchers[0] || '')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                    availableMarkets.pitchers.some(market => activeSubTab === market)
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  Pitchers ({availableMarkets.pitchers.length})
                </button>
              </div>
              
              {/* Market Tabs */}
              <div className="pl-2 border-l-2 border-blue-200">
                <div className="flex flex-wrap gap-1">
                  {availableMarkets.hitters.some(market => activeSubTab === market) && 
                    availableMarkets.hitters.map((market) => (
                      <button
                        key={market}
                        onClick={() => setActiveSubTab(market)}
                        className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 whitespace-nowrap ${
                          activeSubTab === market
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                        }`}
                      >
                        {market}
                      </button>
                    ))
                  }
                  {availableMarkets.pitchers.some(market => activeSubTab === market) && 
                    availableMarkets.pitchers.map((market) => (
                      <button
                        key={market}
                        onClick={() => setActiveSubTab(market)}
                        className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 whitespace-nowrap ${
                          activeSubTab === market
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                        }`}
                      >
                        {market}
                      </button>
                    ))
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Custom Tab Navigation */}
      {renderCustomTabs()}

      {/* Tab Content */}
      <div className="mt-4">
        {renderTabContent()}
      </div>
    </div>
  );
}