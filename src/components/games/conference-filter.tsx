'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

export type ConferenceFilterType = 
  | 'All Games'
  | 'All FBS'
  | 'All FCS'
  | 'SEC'
  | 'Big Ten'
  | 'Big 12'
  | 'ACC'
  | 'Pac-12'
  | 'AAC'
  | 'Mountain West'
  | 'Sun Belt'
  | 'MAC'
  | 'Conference USA'
  | 'Independents'
  | 'Big East'
  | 'Atlantic 10'
  | 'America East'
  | 'American'
  | 'ASUN'
  | 'Big Sky'
  | 'Big South'
  | 'Big West'
  | 'CAA'
  | 'Horizon'
  | 'Ivy League'
  | 'MAAC'
  | 'MEAC'
  | 'Missouri Valley'
  | 'NEC'
  | 'Ohio Valley'
  | 'Patriot'
  | 'Southern'
  | 'Southland'
  | 'Summit'
  | 'SWAC'
  | 'WAC'
  | 'West Coast'
  | 'Big South-OVC'
  | 'Pioneer'
  | 'SoCon'
  | 'UAC'

interface ConferenceFilterProps {
  sport: 'NCAAF' | 'NCAAB'
  selectedFilter: ConferenceFilterType
  onFilterChange: (filter: ConferenceFilterType) => void
}

const NCAAF_FILTERS: ConferenceFilterType[] = [
  'All Games',
  'All FBS',
  'All FCS',
  'SEC',
  'Big Ten',
  'Big 12',
  'ACC',
  'Pac-12',
  'AAC',
  'Mountain West',
  'Sun Belt',
  'MAC',
  'Conference USA',
  'Independents',
  'Big Sky',
  'Big South-OVC',
  'CAA',
  'Ivy League',
  'MEAC',
  'Missouri Valley',
  'NEC',
  'Patriot',
  'Pioneer',
  'SoCon',
  'Southland',
  'SWAC',
  'UAC',
]

const NCAAB_FILTERS: ConferenceFilterType[] = [
  'All Games',
  'America East',
  'American',
  'ASUN',
  'Atlantic 10',
  'ACC',
  'Big 12',
  'Big East',
  'Big Sky',
  'Big South',
  'Big Ten',
  'Big West',
  'CAA',
  'Conference USA',
  'Horizon',
  'Ivy League',
  'MAAC',
  'MAC',
  'MEAC',
  'Missouri Valley',
  'Mountain West',
  'NEC',
  'Ohio Valley',
  'Pac-12',
  'Patriot',
  'SEC',
  'Southern',
  'Southland',
  'Summit',
  'Sun Belt',
  'SWAC',
  'WAC',
  'West Coast',
]

export default function ConferenceFilter({ 
  sport, 
  selectedFilter, 
  onFilterChange 
}: ConferenceFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const filters = sport === 'NCAAF' ? NCAAF_FILTERS : NCAAB_FILTERS

  const handleFilterSelect = (filter: ConferenceFilterType) => {
    onFilterChange(filter)
    setIsOpen(false)
  }

  const getFilterDisplayName = (filter: ConferenceFilterType): string => {
    if (filter === 'All Games') return 'All Games'
    if (filter === 'All FBS') return 'All FBS'
    if (filter === 'All FCS') return 'All FCS'
    return filter
  }

  const renderFilterOption = (filter: ConferenceFilterType) => {
    return (
      <button
        key={filter}
        onClick={() => handleFilterSelect(filter)}
        className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
          selectedFilter === filter ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'
        }`}
      >
        {getFilterDisplayName(filter)}
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-700">Conference:</span>
          <span className="text-sm text-slate-900">{getFilterDisplayName(selectedFilter)}</span>
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
            {filters.map(filter => renderFilterOption(filter))}
          </div>
        </>
      )}
    </div>
  )
}