'use client';

import { Game } from '@/lib/types/games';
import { Calendar, Clock } from 'lucide-react';

interface ProfessionalMockGameCardProps {
  game?: Game;
  league: string;
}

// Mock tab structure for each sport
const getMockTabs = (league: string) => {
  switch (league) {
    case 'MLB':
      return {
        mainTabs: ['Main Lines', 'Player Props', 'Team Props', 'Game Props'],
        subTabs: ['Batters', 'Pitchers'],
        subSubTabs: ['Offense', 'Discipline', 'Speed']
      };
    case 'NFL':
      return {
        mainTabs: ['Main Lines', 'Player Props', 'Team Props', 'Game Props'],
        subTabs: ['QB', 'RB', 'WR/TE', 'Defense/K'],
        subSubTabs: ['Passing', 'Rushing', 'Receiving']
      };
    case 'NBA':
      return {
        mainTabs: ['Main Lines', 'Player Props', 'Team Props', 'Game Props'],
        subTabs: ['Points', 'Rebounds', 'Assists', 'Combos'],
        subSubTabs: ['Points', 'Field Goals', '3PT', 'FT']
      };
    case 'NHL':
      return {
        mainTabs: ['Main Lines', 'Player Props', 'Team Props', 'Game Props'],
        subTabs: ['Skaters', 'Goalies'],
        subSubTabs: ['Goals', 'Assists', 'Shots']
      };
    default:
      return {
        mainTabs: ['Main Lines', 'Player Props', 'Team Props', 'Game Props'],
        subTabs: ['All Players'],
        subSubTabs: ['All Markets']
      };
  }
};

export default function ProfessionalMockGameCard({ game, league }: ProfessionalMockGameCardProps) {
  const tabs = getMockTabs(league);
  
  // Format team names for display
  const formatTeamForDisplay = (teamName: string): string => {
    return teamName
      .replace(/^(Los Angeles|San Francisco|New York|Kansas City|Tampa Bay)/, '$1')
      .replace(/\s+(Angels|Dodgers|Giants|Yankees|Mets|Royals|Rays)/, ' $1')
      .trim();
  };

  const homeTeam = game ? formatTeamForDisplay(game.home_team) : 'Home Team';
  const awayTeam = game ? formatTeamForDisplay(game.away_team) : 'Away Team';
  const gameTime = game ? new Date(game.commence_time).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  }) : 'TBD';

  return (
    <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-slate-300 overflow-hidden opacity-75">
      {/* Header Section */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          {/* Left side - Teams and info */}
          <div className="flex items-center space-x-4">
            <div>
              <div className="text-lg font-bold text-slate-700 mb-1">
                {awayTeam} @ {homeTeam}
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <span className="text-slate-500 font-medium">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {gameTime}
                </span>
                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs font-semibold">
                  {league}
                </span>
                <div className="bg-slate-200 text-slate-600 px-2 py-1 rounded-full text-xs font-medium">
                  NO ODDS
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Secondary button */}
          <button className="flex items-center space-x-1 px-3 py-2 text-slate-400 hover:text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">Add to Calendar</span>
          </button>
        </div>
      </div>

      {/* Mock Three-Row Tab System */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 space-y-3">
        {/* Row 1: Main Categories (always visible) */}
        <div className="flex items-center space-x-2">
          {tabs.mainTabs.map((tab, index) => (
            <div
              key={tab}
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                index === 0
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {tab}
            </div>
          ))}
        </div>
        
        {/* Row 2: Subcategories */}
        <div className="flex items-center space-x-2 pl-4">
          {tabs.subTabs.map((subTab, index) => (
            <div
              key={subTab}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                index === 0
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {subTab}
            </div>
          ))}
        </div>
        
        {/* Row 3: Markets */}
        <div className="flex items-center space-x-2 pl-8">
          {tabs.subSubTabs.map((subSubTab, index) => (
            <div
              key={subSubTab}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                index === 0
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'bg-white text-slate-500 border border-slate-200'
              }`}
            >
              {subSubTab}
            </div>
          ))}
        </div>
      </div>

      {/* Mock Content Area */}
      <div className="p-6">
        <div className="text-center py-12">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8">
            <div className="text-slate-500">
              <div className="text-lg font-semibold mb-2">No odds available for this game</div>
              <div className="text-sm mb-4">Odds will appear here when available from sportsbooks</div>
              
              {/* Mock main lines layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Spread</div>
                  <div className="h-16 bg-slate-100 rounded-lg"></div>
                  <div className="h-16 bg-slate-100 rounded-lg"></div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Total</div>
                  <div className="h-16 bg-slate-100 rounded-lg"></div>
                  <div className="h-16 bg-slate-100 rounded-lg"></div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Moneyline</div>
                  <div className="h-16 bg-slate-100 rounded-lg"></div>
                  <div className="h-16 bg-slate-100 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}