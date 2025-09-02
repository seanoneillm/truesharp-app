'use client'

import { BetSelection } from '@/lib/types/games'
import { getMarketConfigForSport } from '@/lib/types/sports-markets'
import MainLines from '../odds/main-lines'
import { MainTabType } from '../tabs/hierarchical-tabs'

interface MarketContentProps {
  sportKey: string
  activeMainTab: MainTabType
  activeSubTab?: string
  gameId: string
  homeTeam: string
  awayTeam: string
  gameTime: string
  // These would come from real odds data
  moneylineOdds?: {
    home?: { price: number; sportsbook: string }
    away?: { price: number; sportsbook: string }
  }
  spreadOdds?: {
    home?: { price: number; point: number; sportsbook: string }
    away?: { price: number; point: number; sportsbook: string }
  }
  totalOdds?: {
    over?: { price: number; point: number; sportsbook: string }
    under?: { price: number; point: number; sportsbook: string }
  }
  onBetClick: (bet: BetSelection) => void
}

export default function MarketContent({
  sportKey,
  activeMainTab,
  activeSubTab,
  gameId,
  homeTeam,
  awayTeam,
  gameTime,
  moneylineOdds,
  spreadOdds,
  totalOdds,
  onBetClick,
}: MarketContentProps) {
  const marketConfig = getMarketConfigForSport(sportKey)

  if (!marketConfig) {
    return (
      <div className="p-4 text-center text-slate-500">
        Market configuration not found for {sportKey}
      </div>
    )
  }

  const renderMainLines = () => {
    const mainLinesProps = {
      sport: sportKey,
      homeTeam,
      awayTeam,
      gameId,
      gameTime,
      onBetClick,
      ...(moneylineOdds && { moneylineOdds }),
      ...(spreadOdds && { spreadOdds }),
      ...(totalOdds && { totalOdds }),
    }

    return <MainLines {...mainLinesProps} />
  }

  const renderPlayerProps = () => {
    if (!activeSubTab) {
      return (
        <div className="p-4 text-center text-slate-500">Select a player category to view props</div>
      )
    }

    const subcategory = marketConfig.playerProps.find(sub => sub.id === activeSubTab)
    if (!subcategory) {
      return <div className="p-4 text-center text-slate-500">Subcategory not found</div>
    }

    return (
      <div className="space-y-3">
        <div className="px-2 text-sm font-medium text-slate-700">{subcategory.label} Props</div>
        <div className="grid gap-2">
          {subcategory.markets.slice(0, 6).map((market, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded border border-slate-100 bg-slate-50/50 p-2"
            >
              <span className="flex-1 text-xs text-slate-600">{market}</span>
              <div className="flex space-x-1">
                <button className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100">
                  +150
                </button>
                <button className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-100">
                  -180
                </button>
              </div>
            </div>
          ))}
          {subcategory.markets.length > 6 && (
            <div className="pt-2 text-center">
              <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
                View {subcategory.markets.length - 6} more props
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderTeamProps = () => {
    if (!activeSubTab) {
      return (
        <div className="p-4 text-center text-slate-500">Select a team category to view props</div>
      )
    }

    // Define different team prop markets based on sub-tab
    const getTeamPropMarkets = (subTab: string) => {
      switch (subTab) {
        case 'team-basic':
          return [
            'Team Total Runs',
            'Team to Score First',
            'Team Hits Over/Under',
            'Team RBIs Over/Under',
            'Team Strikeouts Over/Under',
            'Team Errors Over/Under',
          ]
        case 'team-advanced':
          return [
            'Team Batting Average',
            'Team On-Base Percentage',
            'Team Left on Base',
            'Team Double Plays',
            'Team Stolen Bases',
            'Team Pitching Changes',
          ]
        case 'team-special':
          return [
            'Team to Hit Home Run',
            'Team Grand Slam',
            'Team Perfect Inning',
            'Team Rally (3+ Runs)',
            'Team Shutout Inning',
            'Team Walk-Off Win',
          ]
        default:
          return marketConfig.teamProps.markets
      }
    }

    const markets = getTeamPropMarkets(activeSubTab)
    const subTabLabel =
      {
        'team-basic': 'Basic Team Stats',
        'team-advanced': 'Advanced Team Stats',
        'team-special': 'Special Team Props',
      }[activeSubTab] || 'Team Props'

    return (
      <div className="space-y-3">
        <div className="px-2 text-sm font-medium text-slate-700">{subTabLabel}</div>
        <div className="grid gap-2">
          {markets.slice(0, 6).map((market, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded border border-slate-100 bg-slate-50/50 p-2"
            >
              <span className="flex-1 text-xs text-slate-600">{market}</span>
              <div className="flex space-x-1">
                <button className="rounded border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-100">
                  +120
                </button>
                <button className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-100">
                  -140
                </button>
              </div>
            </div>
          ))}
          {markets.length > 6 && (
            <div className="pt-2 text-center">
              <button className="text-xs font-medium text-green-600 hover:text-green-700">
                View {markets.length - 6} more props
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderGameProps = () => {
    if (!activeSubTab) {
      return (
        <div className="p-4 text-center text-slate-500">Select a game category to view props</div>
      )
    }

    // Define different game prop markets based on sub-tab
    const getGamePropMarkets = (subTab: string) => {
      switch (subTab) {
        case 'game-basic':
          return [
            'Total Runs Over/Under',
            'Total Hits Over/Under',
            'Total Strikeouts',
            'Total Home Runs',
            'Total Errors',
            'Total Innings',
          ]
        case 'game-timing':
          return [
            'Game Duration Over/Under',
            'First Pitch Time',
            'Last Play Time',
            'Longest Half-Inning',
            'Total Pitching Changes',
            'Total Mound Visits',
          ]
        case 'game-special':
          return [
            'Extra Innings',
            'Perfect Game',
            'No-Hitter',
            'Cycle Hit',
            'Grand Slam Scored',
            'Walk-Off Finish',
          ]
        default:
          return marketConfig.gameProps.markets
      }
    }

    const markets = getGamePropMarkets(activeSubTab)
    const subTabLabel =
      {
        'game-basic': 'Game Flow Props',
        'game-timing': 'Timing Props',
        'game-special': 'Special Event Props',
      }[activeSubTab] || 'Game Props'

    return (
      <div className="space-y-3">
        <div className="px-2 text-sm font-medium text-slate-700">{subTabLabel}</div>
        <div className="grid gap-2">
          {markets.slice(0, 6).map((market, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded border border-slate-100 bg-slate-50/50 p-2"
            >
              <span className="flex-1 text-xs text-slate-600">{market}</span>
              <div className="flex space-x-1">
                <button className="rounded border border-purple-200 bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-100">
                  +110
                </button>
                <button className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-100">
                  -130
                </button>
              </div>
            </div>
          ))}
          {markets.length > 6 && (
            <div className="pt-2 text-center">
              <button className="text-xs font-medium text-purple-600 hover:text-purple-700">
                View {markets.length - 6} more props
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  switch (activeMainTab) {
    case 'main':
      return renderMainLines()
    case 'player-props':
      return renderPlayerProps()
    case 'team-props':
      return renderTeamProps()
    case 'game-props':
      return renderGameProps()
    default:
      return <div className="p-4 text-center text-slate-500">Select a tab to view markets</div>
  }
}
