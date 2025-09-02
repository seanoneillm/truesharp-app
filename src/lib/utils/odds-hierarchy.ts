'use client'

import { DatabaseOdds } from '@/lib/types/database'

// Types for the 3-level hierarchy
export interface MarketHierarchy {
  mainTab: 'main' | 'player-props' | 'team-props' | 'game-props'
  subTab: string
  subSubTab: string
  marketName: string
  displayName: string
}

// Type for organized hierarchical odds
export type HierarchicalOdds = {
  [mainTab: string]: {
    [subTab: string]: {
      [subSubTab: string]: DatabaseOdds[]
    }
  }
}

// Parse oddID to extract market information
export function parseOddID(oddID: string): {
  category: string
  target: string
  period: string
  betType: string
  side: string
} | null {
  if (!oddID) return null

  // Pattern: category-target-period-betType-side
  // Examples:
  // points-home-game-ml-home
  // batting_hits-12345-game-ou-over
  // points-all-game-ou-over

  const parts = oddID.split('-')
  if (parts.length < 5) return null

  return {
    category: parts[0] || '',
    target: parts[1] || '',
    period: parts[2] || '',
    betType: parts[3] || '',
    side: parts[4] || '',
  }
}

// Classify odds into the main tabs
export function classifyMainTab(
  oddID: string
): 'main' | 'player-props' | 'team-props' | 'game-props' {
  const parsed = parseOddID(oddID)
  if (!parsed) return 'main'

  const { category, target } = parsed

  // Debug logging
  console.log('🔍 Classifying oddID:', oddID, { category, target, parsed })

  // Main lines (spread, moneyline, totals)
  if (
    category === 'points' &&
    (target === 'home' || target === 'away') &&
    (oddID.includes('-ml-') || oddID.includes('-sp-'))
  ) {
    console.log('→ Classified as main (points home/away ml/sp)')
    return 'main'
  }

  if (category === 'points' && target === 'all' && oddID.includes('-ou-')) {
    console.log('→ Classified as main (points all ou)')
    return 'main'
  }

  // Player props (target is a player ID - typically numeric)
  if (target && /^\d+$/.test(target)) {
    console.log('→ Classified as player-props (numeric target)')
    return 'player-props'
  }

  // Team props (target is home/away but not main lines)
  if (
    (target === 'home' || target === 'away') &&
    !oddID.includes('-ml-') &&
    !oddID.includes('-sp-')
  ) {
    console.log('→ Classified as team-props')
    return 'team-props'
  }

  // Game props (target is 'all' but not main totals)
  if (target === 'all' && !oddID.includes('points-all-game-ou-')) {
    console.log('→ Classified as game-props')
    return 'game-props'
  }

  console.log('→ Defaulting to main')
  return 'main'
}

// Get sub tab based on sport and category
export function getSubTab(oddID: string, sport: string): string {
  const parsed = parseOddID(oddID)
  if (!parsed) return 'other'

  const { category } = parsed
  const mainTab = classifyMainTab(oddID)

  switch (sport) {
    case 'baseball_mlb':
      return getMLBSubTab(category, mainTab)
    case 'americanfootball_nfl':
    case 'americanfootball_ncaaf':
      return getNFLSubTab(category, mainTab)
    case 'basketball_nba':
    case 'basketball_ncaab':
      return getNBASubTab(category, mainTab)
    case 'icehockey_nhl':
      return getNHLSubTab(category, mainTab)
    case 'soccer_uefa_champs_league':
    case 'soccer_usa_mls':
      return getSoccerSubTab(category, mainTab)
    default:
      return 'other'
  }
}

// Get sub-sub tab (3rd level)
export function getSubSubTab(oddID: string, sport: string): string {
  const parsed = parseOddID(oddID)
  if (!parsed) return 'all'

  const { category } = parsed
  const mainTab = classifyMainTab(oddID)
  const subTab = getSubTab(oddID, sport)

  switch (sport) {
    case 'baseball_mlb':
      return getMLBSubSubTab(category, mainTab, subTab)
    case 'americanfootball_nfl':
    case 'americanfootball_ncaaf':
      return getNFLSubSubTab(category, mainTab, subTab)
    case 'basketball_nba':
    case 'basketball_ncaab':
      return getNBASubSubTab(category, mainTab, subTab)
    default:
      return 'all'
  }
}

// MLB specific classification
function getMLBSubTab(category: string, mainTab: string): string {
  if (mainTab === 'Player Props') {
    if (
      category.startsWith('batting_') ||
      category === 'points' ||
      category === 'fantasyScore' ||
      category === 'firstToScore' ||
      category === 'lastToScore'
    ) {
      return 'Hitters'
    }
    if (category.startsWith('pitching_')) {
      return 'Pitchers'
    }
  }

  if (mainTab === 'Team Props') {
    return 'Team Totals'
  }

  if (mainTab === 'Game Props') {
    return 'Game Totals'
  }

  return 'all'
}

function getMLBSubSubTab(category: string, mainTab: string, subTab: string): string {
  if (mainTab === 'Player Props' && subTab === 'Hitters') {
    if (
      category === 'batting_hits' ||
      category === 'batting_homeRuns' ||
      category === 'batting_RBI' ||
      category === 'batting_totalBases' ||
      category === 'batting_singles' ||
      category === 'batting_doubles' ||
      category === 'batting_triples'
    ) {
      return 'offense'
    }
    if (category === 'batting_strikeouts' || category === 'batting_basesOnBalls') {
      return 'discipline'
    }
    if (category === 'batting_stolenBases') {
      return 'speed'
    }
  }

  return 'all'
}

// NFL specific classification
function getNFLSubTab(category: string, mainTab: string): string {
  if (mainTab === 'Player Props') {
    if (category.startsWith('passing_') || category === 'defense_interceptions') {
      return 'Quarterback'
    }
    if (category.startsWith('rushing_')) {
      return 'Running Back'
    }
    if (category.startsWith('receiving_')) {
      return 'Wide Receiver/Tight End'
    }
    if (
      category.startsWith('kicking_') ||
      category.startsWith('fieldGoals_') ||
      category.startsWith('extraPoints_') ||
      category.startsWith('defense_')
    ) {
      return 'Kicker/Defense'
    }
  }

  if (mainTab === 'Team Props') {
    return 'Team Totals'
  }

  if (mainTab === 'Game Props') {
    return 'Game Totals'
  }

  return 'all'
}

function getNFLSubSubTab(category: string, mainTab: string, subTab: string): string {
  if (mainTab === 'Player Props') {
    if (subTab === 'Quarterback') {
      if (category.startsWith('passing_')) {
        return 'passing'
      }
      if (category.startsWith('rushing_')) {
        return 'rushing'
      }
    }
    if (subTab === 'Running Back') {
      if (category.startsWith('rushing_')) {
        return 'rushing'
      }
      if (category.startsWith('receiving_')) {
        return 'receiving'
      }
    }
  }

  return 'all'
}

// NBA specific classification
function getNBASubTab(category: string, mainTab: string): string {
  if (mainTab === 'Player Props') {
    if (
      category === 'points' ||
      category.startsWith('fieldGoals_') ||
      category.startsWith('threePointers_') ||
      category.startsWith('freeThrows_')
    ) {
      return 'Scoring'
    }
    if (category.startsWith('rebounds')) {
      return 'Rebounding'
    }
    if (
      category === 'assists' ||
      category === 'turnovers' ||
      category === 'steals' ||
      category === 'blocks'
    ) {
      return 'Playmaking'
    }
    if (
      category.includes('+') ||
      category === 'doubleDouble' ||
      category === 'tripleDouble' ||
      category === 'fantasyScore'
    ) {
      return 'Combo Props'
    }
  }

  if (mainTab === 'Team Props') {
    return 'Team Totals'
  }

  if (mainTab === 'Game Props') {
    return 'Game Totals'
  }

  return 'all'
}

function getNBASubSubTab(category: string, mainTab: string, subTab: string): string {
  if (mainTab === 'Player Props') {
    if (subTab === 'Scoring') {
      if (category === 'points') {
        return 'points'
      }
      if (category.startsWith('fieldGoals_')) {
        return 'field-goals'
      }
      if (category.startsWith('threePointers_')) {
        return 'three-pointers'
      }
      if (category.startsWith('freeThrows_')) {
        return 'free-throws'
      }
    }
    if (subTab === 'Rebounding') {
      if (category === 'rebounds') {
        return 'total'
      }
      if (category === 'rebounds_offensive') {
        return 'offensive'
      }
      if (category === 'rebounds_defensive') {
        return 'defensive'
      }
    }
    if (subTab === 'Playmaking') {
      if (category === 'assists') {
        return 'assists'
      }
      if (category === 'steals' || category === 'blocks') {
        return 'defense'
      }
      if (category === 'turnovers') {
        return 'turnovers'
      }
    }
  }

  return 'all'
}

// NHL specific classification
function getNHLSubTab(category: string, mainTab: string): string {
  if (mainTab === 'Player Props') {
    if (
      category === 'goals' ||
      category === 'assists' ||
      category === 'points' ||
      category === 'shots_onGoal' ||
      category === 'hits' ||
      category === 'blockedShots'
    ) {
      return 'Skaters'
    }
    if (
      category === 'saves' ||
      category === 'goalsAgainst' ||
      category === 'savePercentage' ||
      category === 'shutout'
    ) {
      return 'Goalies'
    }
  }

  if (mainTab === 'Team Props') {
    return 'Team Totals'
  }

  if (mainTab === 'Game Props') {
    return 'Game Totals'
  }

  return 'all'
}

// Soccer specific classification
function getSoccerSubTab(category: string, mainTab: string): string {
  if (mainTab === 'Player Props') {
    if (
      category === 'goals' ||
      category === 'shots' ||
      category === 'shots_onTarget' ||
      category === 'assists'
    ) {
      return 'Forwards'
    }
    if (
      category === 'passesCompleted' ||
      category === 'passCompletionPercentage' ||
      category === 'tackles'
    ) {
      return 'Midfielders'
    }
    if (category === 'clearances' || category === 'blocks' || category === 'interceptions') {
      return 'Defenders'
    }
    if (category === 'saves' || category === 'goalsConceded' || category === 'cleanSheet') {
      return 'Goalkeepers'
    }
  }

  if (mainTab === 'Team Props') {
    return 'Team Totals'
  }

  if (mainTab === 'Game Props') {
    return 'Game Totals'
  }

  return 'all'
}

// Generate display name for market
export function generateMarketDisplayName(oddID: string): string {
  const parsed = parseOddID(oddID)
  if (!parsed) return oddID

  const { category, betType, side } = parsed

  // Clean up category name
  let baseName = category
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()

  // Capitalize first letter of each word
  baseName = baseName.replace(/\b\w/g, l => l.toUpperCase())

  // Add side information for over/under markets
  if (betType === 'ou') {
    baseName += ` ${side.charAt(0).toUpperCase() + side.slice(1)}`
  }

  // Add yes/no for yes/no markets
  if (betType === 'yn') {
    baseName += ` ${side.charAt(0).toUpperCase() + side.slice(1)}`
  }

  return baseName
}

// Main function to organize odds by 3-level hierarchy (ENHANCED for ALL markets)
export function organizeOddsByHierarchy(odds: DatabaseOdds[], sport: string): HierarchicalOdds {
  const organized: HierarchicalOdds = {}

  console.log('🏗️ Organizing odds by hierarchy. Total odds:', odds.length, 'Sport:', sport)

  // Filter to valid odds (must have oddid and exclude yes/no markets as requested)
  const validOdds = odds.filter(odd => {
    if (!odd.oddid) return false
    // Exclude yes/no markets as specified in requirements
    if (odd.oddid.includes('-yn-')) return false
    return true
  })

  console.log(
    `📊 Filtered to ${validOdds.length} valid odds from ${odds.length} total odds (excluded yn markets)`
  )

  // Ensure ALL main tabs exist (even empty ones) - using standard naming convention
  const allMainTabs = ['main', 'player-props', 'team-props', 'game-props']
  allMainTabs.forEach(tab => {
    organized[tab] = {}
  })

  validOdds.forEach(odd => {
    if (!odd.oddid) return // Skip odds without oddid

    // Enhanced classification using existing functions
    const mainTab = classifyMainTab(odd.oddid)
    const subTab = getSubTab(odd.oddid, sport)
    const subSubTab = getSubSubTab(odd.oddid, sport)

    console.log('📊 Processing odd:', {
      oddID: odd.oddid,
      mainTab,
      subTab,
      subSubTab,
    })

    if (!organized[mainTab]) {
      organized[mainTab] = {}
    }

    if (!organized[mainTab][subTab]) {
      organized[mainTab][subTab] = {}
    }

    if (!organized[mainTab][subTab][subSubTab]) {
      organized[mainTab][subTab][subSubTab] = []
    }

    organized[mainTab][subTab][subSubTab].push(odd)
  })

  // Ensure ALL tabs have at least empty structure
  for (const mainTab of allMainTabs) {
    if (!organized[mainTab] || Object.keys(organized[mainTab]).length === 0) {
      organized[mainTab] = { all: { all: [] } }
    }
  }

  console.log('📋 Final organized structure with complete tabs:', organized)
  console.log('🔢 Main tabs found:', Object.keys(organized))

  return organized
}

// Get available tabs for a sport and organized odds (ENHANCED to ensure complete structure)
export function getAvailableTabs(
  organizedOdds: Record<string, Record<string, Record<string, DatabaseOdds[]>>>,
  sport?: string
) {
  // Always return the complete tab structure, even if empty
  const allMainTabs = ['main', 'player-props', 'team-props', 'game-props']

  // Get sport-specific sub-tabs based on the sport
  const getDefaultSubTabs = (mainTab: string, sport?: string): string[] => {
    if (!sport) return ['all']

    switch (sport.toLowerCase()) {
      case 'baseball_mlb':
        if (mainTab === 'player-props') return ['Hitters', 'Pitchers']
        if (mainTab === 'team-props') return ['Team Totals']
        if (mainTab === 'game-props') return ['Game Totals']
        return ['Totals']
      case 'americanfootball_nfl':
      case 'americanfootball_ncaaf':
        if (mainTab === 'player-props')
          return ['Quarterback', 'Running Back', 'Wide Receiver/Tight End', 'Kicker/Defense']
        if (mainTab === 'team-props') return ['Team Totals']
        if (mainTab === 'game-props') return ['Game Totals']
        return ['Totals']
      case 'basketball_nba':
      case 'basketball_ncaab':
        if (mainTab === 'player-props')
          return ['Scoring', 'Rebounding', 'Playmaking', 'Combo Props']
        if (mainTab === 'team-props') return ['Team Totals']
        if (mainTab === 'game-props') return ['Game Totals']
        return ['Totals']
      case 'icehockey_nhl':
        if (mainTab === 'player-props') return ['Skaters', 'Goalies']
        if (mainTab === 'team-props') return ['Team Totals']
        if (mainTab === 'game-props') return ['Game Totals']
        return ['Totals']
      case 'soccer_uefa_champs_league':
      case 'soccer_usa_mls':
        if (mainTab === 'player-props')
          return ['Forwards', 'Midfielders', 'Defenders', 'Goalkeepers']
        if (mainTab === 'team-props') return ['Team Totals']
        if (mainTab === 'game-props') return ['Game Totals']
        return ['Totals']
      default:
        return ['all']
    }
  }

  return {
    // Always return all main tabs
    mainTabs: allMainTabs,

    // Return sub-tabs with fallback to defaults
    getSubTabs: (mainTab: string) => {
      const actualSubTabs = organizedOdds[mainTab] ? Object.keys(organizedOdds[mainTab]) : []
      const defaultSubTabs = getDefaultSubTabs(mainTab, sport)

      // Return actual tabs if they exist, otherwise return defaults
      return actualSubTabs.length > 0 ? actualSubTabs : defaultSubTabs
    },

    // Return sub-sub-tabs with fallback to 'all'
    getSubSubTabs: (mainTab: string, subTab: string) => {
      const actualSubSubTabs = organizedOdds[mainTab]?.[subTab]
        ? Object.keys(organizedOdds[mainTab][subTab])
        : []
      return actualSubSubTabs.length > 0 ? actualSubSubTabs : ['all']
    },

    // Check if a specific tab path has odds
    hasOdds: (mainTab: string, subTab?: string, subSubTab?: string) => {
      if (!subTab) {
        // Check if main tab has any odds
        const mainTabData = organizedOdds[mainTab]
        if (!mainTabData) return false
        return Object.keys(mainTabData).some(st => {
          const subTabData = mainTabData[st]
          if (!subTabData) return false
          return Object.keys(subTabData).some(sst => {
            const subSubTabData = subTabData[sst]
            return subSubTabData ? subSubTabData.length > 0 : false
          })
        })
      }
      if (!subSubTab) {
        // Check if sub tab has any odds
        const subTabData = organizedOdds[mainTab]?.[subTab]
        if (!subTabData) return false
        return Object.keys(subTabData).some(sst => {
          const subSubTabData = subTabData[sst]
          return subSubTabData ? subSubTabData.length > 0 : false
        })
      }
      // Check if specific sub-sub tab has odds
      return (organizedOdds[mainTab]?.[subTab]?.[subSubTab]?.length || 0) > 0
    },
  }
}
