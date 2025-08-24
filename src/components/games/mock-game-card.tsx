'use client';

import { Game } from '@/lib/types/games';
import { Clock } from 'lucide-react';

interface MockGameCardProps {
  game?: Game;
  league: string;
}

// Mock tab structure for each sport
const getMockTabs = (league: string) => {
  switch (league) {
    case 'MLB':
      return {
        mainTabs: ['Main Lines', 'Player Props', 'Team Props', 'Game Props'],
        subTabs: {
          'Main Lines': ['Moneyline', 'Run Line', 'Total'],
          'Player Props': ['Hitters', 'Pitchers'],
          'Team Props': ['Team Totals'],
          'Game Props': ['Game Totals']
        },
        subSubTabs: {
          'Hitters': ['Offense', 'Discipline', 'Speed'],
          'Pitchers': ['Strikeouts', 'Hits Allowed', 'Earned Runs']
        }
      };
    case 'NFL':
      return {
        mainTabs: ['Main Lines', 'Player Props', 'Team Props', 'Game Props'],
        subTabs: {
          'Main Lines': ['Spread', 'Moneyline', 'Total'],
          'Player Props': ['QB', 'RB', 'WR/TE', 'Defense/Kicker'],
          'Team Props': ['Team Totals'],
          'Game Props': ['Game Totals']
        },
        subSubTabs: {
          'QB': ['Passing', 'Rushing'],
          'RB': ['Rushing', 'Receiving'],
          'WR/TE': ['Receiving', 'Rushing']
        }
      };
    case 'NBA':
      return {
        mainTabs: ['Main Lines', 'Player Props', 'Team Props', 'Game Props'],
        subTabs: {
          'Main Lines': ['Spread', 'Moneyline', 'Total'],
          'Player Props': ['Scoring', 'Rebounding', 'Playmaking', 'Combo'],
          'Team Props': ['Team Totals'],
          'Game Props': ['Game Totals']
        },
        subSubTabs: {
          'Scoring': ['Points', 'Field Goals', '3-Pointers', 'Free Throws'],
          'Rebounding': ['Total', 'Offensive', 'Defensive'],
          'Playmaking': ['Assists', 'Defense', 'Turnovers']
        }
      };
    case 'NHL':
      return {
        mainTabs: ['Main Lines', 'Player Props', 'Team Props', 'Game Props'],
        subTabs: {
          'Main Lines': ['Moneyline', 'Puck Line', 'Total'],
          'Player Props': ['Skaters', 'Goalies'],
          'Team Props': ['Team Totals'],
          'Game Props': ['Game Totals']
        },
        subSubTabs: {
          'Skaters': ['Goals', 'Assists', 'Shots', 'Hits'],
          'Goalies': ['Saves', 'Goals Against']
        }
      };
    default:
      return {
        mainTabs: ['Main Lines', 'Player Props', 'Team Props', 'Game Props'],
        subTabs: {
          'Main Lines': ['Spread', 'Moneyline', 'Total'],
          'Player Props': ['All Players'],
          'Team Props': ['Team Totals'],
          'Game Props': ['Game Totals']
        },
        subSubTabs: {
          'All Players': ['All Markets']
        }
      };
  }
};

export default function MockGameCard({ game, league }: MockGameCardProps) {
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
    <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 overflow-hidden">
      {/* Game Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {league}
            </div>
            <div className="bg-slate-200 text-slate-600 px-2 py-1 rounded-full text-xs font-medium">
              NO ODDS
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            <span className="font-medium">{gameTime}</span>
          </div>
        </div>
      </div>

      {/* Team Names */}
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="space-y-1 opacity-60">
            <div className="text-sm font-bold text-slate-700">{awayTeam}</div>
            <div className="text-sm font-bold text-slate-700">{homeTeam}</div>
          </div>
          <div className="text-xs text-slate-400">
            vs
          </div>
        </div>
      </div>

      {/* Mock Tab Structure */}
      <div className="px-4 py-3 border-b border-slate-200">
        {/* Level 1: Main Tabs */}
        <div className="flex items-center bg-slate-50 rounded-2xl p-1.5 gap-1 opacity-50">
          {tabs.mainTabs.map((tab, index) => (
            <div
              key={tab}
              className={`
                flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border-2 border-transparent
                ${index === 0 
                  ? 'bg-white text-slate-600 shadow-md border-slate-200' 
                  : 'text-slate-500 bg-slate-100'
                }
              `}
            >
              {tab}
            </div>
          ))}
        </div>
        
        {/* Level 2: Subtabs (show first main tab's subtabs) */}
        <div className="mt-4 pl-3 border-l-3 border-slate-200 opacity-40">
          <div className="flex flex-wrap gap-2">
            {tabs.subTabs[tabs.mainTabs[0]].map((subTab, index) => (
              <div
                key={subTab}
                className={`
                  px-4 py-2 text-xs font-semibold rounded-xl border-2 border-transparent
                  ${index === 0 
                    ? 'bg-slate-100 text-slate-600 border-slate-200 shadow-sm' 
                    : 'text-slate-500 bg-slate-50'
                  }
                `}
              >
                {subTab}
              </div>
            ))}
          </div>
          
          {/* Level 3: Sub-subtabs (show first subtab's options if available) */}
          {tabs.subSubTabs[tabs.subTabs[tabs.mainTabs[0]][0]] && (
            <div className="mt-3 pl-4 border-l-3 border-slate-200 opacity-70">
              <div className="flex flex-wrap gap-1.5">
                {tabs.subSubTabs[tabs.subTabs[tabs.mainTabs[0]][0]].map((subSubTab, index) => (
                  <div
                    key={subSubTab}
                    className={`
                      px-3 py-1.5 text-xs font-semibold rounded-lg border-2 border-transparent
                      ${index === 0 
                        ? 'bg-slate-100 text-slate-600 border-slate-200 shadow-sm' 
                        : 'text-slate-500 bg-slate-50'
                      }
                    `}
                  >
                    {subSubTab}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mock Content Area */}
      <div className="p-4">
        <div className="text-center py-8 opacity-50">
          <div className="space-y-3">
            <div className="text-sm font-medium text-slate-600 mb-4">
              Available betting markets will appear here once odds are loaded
            </div>
            
            {/* Mock betting buttons */}
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="h-10 bg-slate-100 rounded-xl"></div>
                <div className="h-10 bg-slate-100 rounded-xl"></div>
                <div className="h-10 bg-slate-100 rounded-xl"></div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="h-8 bg-slate-50 rounded-lg"></div>
                <div className="h-8 bg-slate-50 rounded-lg"></div>
                <div className="h-8 bg-slate-50 rounded-lg"></div>
                <div className="h-8 bg-slate-50 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}