'use client'

import { BetSelection } from '@/lib/types/games'
import OddsButton from './odds-button'

interface MainLinesProps {
  sport: string
  homeTeam: string
  awayTeam: string
  gameId: string
  gameTime: string
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

export default function MainLines({
  sport,
  homeTeam,
  awayTeam,
  gameId,
  gameTime,
  moneylineOdds,
  spreadOdds,
  totalOdds,
  onBetClick,
}: MainLinesProps) {
  const getMarketHeaders = () => {
    switch (sport) {
      case 'americanfootball_nfl':
      case 'americanfootball_ncaaf':
        return {
          moneyline: 'Moneyline',
          spread: 'Spread',
          total: 'Total Points',
        }
      case 'basketball_nba':
      case 'basketball_ncaab':
        return {
          moneyline: 'Moneyline',
          spread: 'Spread',
          total: 'Total Points',
        }
      case 'baseball_mlb':
        return {
          moneyline: 'Moneyline',
          spread: 'Run Line',
          total: 'Total Runs',
        }
      case 'icehockey_nhl':
        return {
          moneyline: 'Moneyline',
          spread: 'Puck Line',
          total: 'Total Goals',
        }
      case 'soccer_uefa_champs_league':
      case 'soccer_usa_mls':
        return {
          moneyline: '1X2',
          spread: 'Asian Handicap',
          total: 'Total Goals',
        }
      default:
        return {
          moneyline: 'Moneyline',
          spread: 'Spread',
          total: 'Total',
        }
    }
  }

  const headers = getMarketHeaders()

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Compact Headers - Hidden on very small screens */}
      <div className="xs:grid hidden grid-cols-3 gap-2 sm:gap-3">
        <div className="truncate text-center text-xs font-medium uppercase tracking-wide text-slate-500">
          {headers.moneyline}
        </div>
        <div className="truncate text-center text-xs font-medium uppercase tracking-wide text-slate-500">
          {headers.spread}
        </div>
        <div className="truncate text-center text-xs font-medium uppercase tracking-wide text-slate-500">
          {headers.total}
        </div>
      </div>

      {/* Away Team Odds */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {/* Away Moneyline */}
        <div className="text-center">
          {moneylineOdds?.away ? (
            <OddsButton
              odds={moneylineOdds.away.price}
              onClick={() =>
                onBetClick({
                  gameId,
                  sport,
                  homeTeam,
                  awayTeam,
                  gameTime,
                  marketType: 'moneyline',
                  selection: 'away',
                  odds: moneylineOdds.away.price,
                  sportsbook: moneylineOdds.away.sportsbook,
                  description: `${awayTeam} ML`,
                })
              }
              size="sm"
              variant="primary"
            />
          ) : (
            <div className="py-2 text-xs text-slate-400">N/A</div>
          )}
        </div>

        {/* Away Spread */}
        <div className="text-center">
          {spreadOdds?.away ? (
            <OddsButton
              odds={spreadOdds.away.price}
              line={spreadOdds.away.point}
              onClick={() =>
                onBetClick({
                  gameId,
                  sport,
                  homeTeam,
                  awayTeam,
                  gameTime,
                  marketType: 'spread',
                  selection: 'away',
                  line: spreadOdds.away.point,
                  odds: spreadOdds.away.price,
                  sportsbook: spreadOdds.away.sportsbook,
                  description: `${awayTeam} ${spreadOdds.away.point > 0 ? '+' : ''}${spreadOdds.away.point}`,
                })
              }
              size="sm"
              variant="primary"
            />
          ) : (
            <div className="py-2 text-xs text-slate-400">N/A</div>
          )}
        </div>

        {/* Over */}
        <div className="text-center">
          {totalOdds?.over ? (
            <OddsButton
              odds={totalOdds.over.price}
              line={totalOdds.over.point}
              onClick={() =>
                onBetClick({
                  gameId,
                  sport,
                  homeTeam,
                  awayTeam,
                  gameTime,
                  marketType: 'total',
                  selection: 'over',
                  line: totalOdds.over.point,
                  odds: totalOdds.over.price,
                  sportsbook: totalOdds.over.sportsbook,
                  description: `Over ${totalOdds.over.point}`,
                })
              }
              size="sm"
              variant="success"
            />
          ) : (
            <div className="py-2 text-xs text-slate-400">N/A</div>
          )}
        </div>
      </div>

      {/* Home Team Odds */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {/* Home Moneyline */}
        <div className="text-center">
          {moneylineOdds?.home ? (
            <OddsButton
              odds={moneylineOdds.home.price}
              onClick={() =>
                onBetClick({
                  gameId,
                  sport,
                  homeTeam,
                  awayTeam,
                  gameTime,
                  marketType: 'moneyline',
                  selection: 'home',
                  odds: moneylineOdds.home.price,
                  sportsbook: moneylineOdds.home.sportsbook,
                  description: `${homeTeam} ML`,
                })
              }
              size="sm"
              variant="primary"
            />
          ) : (
            <div className="py-2 text-xs text-slate-400">N/A</div>
          )}
        </div>

        {/* Home Spread */}
        <div className="text-center">
          {spreadOdds?.home ? (
            <OddsButton
              odds={spreadOdds.home.price}
              line={spreadOdds.home.point}
              onClick={() =>
                onBetClick({
                  gameId,
                  sport,
                  homeTeam,
                  awayTeam,
                  gameTime,
                  marketType: 'spread',
                  selection: 'home',
                  line: spreadOdds.home.point,
                  odds: spreadOdds.home.price,
                  sportsbook: spreadOdds.home.sportsbook,
                  description: `${homeTeam} ${spreadOdds.home.point > 0 ? '+' : ''}${spreadOdds.home.point}`,
                })
              }
              size="sm"
              variant="primary"
            />
          ) : (
            <div className="py-2 text-xs text-slate-400">N/A</div>
          )}
        </div>

        {/* Under */}
        <div className="text-center">
          {totalOdds?.under ? (
            <OddsButton
              odds={totalOdds.under.price}
              line={totalOdds.under.point}
              onClick={() =>
                onBetClick({
                  gameId,
                  sport,
                  homeTeam,
                  awayTeam,
                  gameTime,
                  marketType: 'total',
                  selection: 'under',
                  line: totalOdds.under.point,
                  odds: totalOdds.under.price,
                  sportsbook: totalOdds.under.sportsbook,
                  description: `Under ${totalOdds.under.point}`,
                })
              }
              size="sm"
              variant="danger"
            />
          ) : (
            <div className="py-2 text-xs text-slate-400">N/A</div>
          )}
        </div>
      </div>
    </div>
  )
}
