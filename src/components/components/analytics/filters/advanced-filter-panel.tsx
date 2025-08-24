// src/components/analytics/filters/advanced-filter-panel.tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  DollarSign,
  Filter,
  MapPin,
  RotateCcw,
  Save,
  Target,
  TrendingUp,
  Trophy,
  Users,
  X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

export interface FilterState {
  // Sport & League Filters
  sports: string[];
  leagues: string[];
  seasons: string[];
  divisions: string[];
  
  // Temporal Filters
  dateRange: { start: Date | null; end: Date | null };
  daysOfWeek: string[];
  timeOfDay: string[];
  seasonType: string[];
  
  // Team & Matchup Filters
  teams: string[];
  homeAway: string[];
  conferences: string[];
  rivalries: boolean;
  
  // Bet Type Filters
  betTypes: string[];
  spreadRanges: { min: number; max: number };
  totalsRanges: { min: number; max: number };
  moneylineRanges: { min: number; max: number };
  
  // Performance Filters
  odds: { min: number; max: number };
  stakes: { min: number; max: number };
  winRates: { min: number; max: number };
  roiRanges: { min: number; max: number };
  
  // Situational Filters
  weather: string[];
  restDays: string[];
  broadcast: string[];
  injuries: boolean;
  
  // Sportsbook Filters
  sportsbooks: string[];
  lineMovement: string[];
  clvStatus: string[];
}

interface AdvancedFilterPanelProps {
  isPro: boolean;
  onFiltersChange: (filters: FilterState) => void;
  savedFilters: Array<{ id: string; name: string; filters: FilterState }>;
  onSaveFilter: (name: string, filters: FilterState) => void;
  onLoadFilter: (filters: FilterState) => void;
}
// ...existing imports...

// ...existing imports...

// Export FilterState so it can be imported elsewhere

// ...rest of your file remains unchanged...

export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  isPro,
  onFiltersChange,
  savedFilters,
  onSaveFilter,
  onLoadFilter
}) => {
  const [filters, setFilters] = useState<FilterState>({
    sports: [],
    leagues: [],
    seasons: [],
    divisions: [],
    dateRange: { start: null, end: null },
    daysOfWeek: [],
    timeOfDay: [],
    seasonType: [],
    teams: [],
    homeAway: [],
    conferences: [],
    rivalries: false,
    betTypes: [],
    spreadRanges: { min: -50, max: 50 },
    totalsRanges: { min: 30, max: 80 },
    moneylineRanges: { min: -500, max: 500 },
    odds: { min: -500, max: 500 },
    stakes: { min: 0, max: 1000 },
    winRates: { min: 0, max: 100 },
    roiRanges: { min: -100, max: 100 },
    weather: [],
    restDays: [],
    broadcast: [],
    injuries: false,
    sportsbooks: [],
    lineMovement: [],
    clvStatus: []
  });

  const [activeSection, setActiveSection] = useState<string>('sports');
  const [saveFilterName, setSaveFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const sportsOptions = [
    'NFL', 'NBA', 'MLB', 'NHL', 'NCAA Football', 'NCAA Basketball',
    'Soccer', 'Tennis', 'Golf', 'MMA', 'Boxing', 'Formula 1'
  ];

  const betTypeOptions = [
    'Spread', 'Moneyline', 'Total', 'Player Props', 'Game Props',
    'First Half', 'Live Betting', 'Futures', 'Parlays'
  ];

  const daysOfWeekOptions = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
    'Friday', 'Saturday', 'Sunday'
  ];

  const sportsbookOptions = [
    'DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'ESPN BET',
    'BetRivers', 'Fanatics', 'PointsBet'
  ];

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleArrayValue = (key: string, value: string) => {
    setFilters(prev => {
      const arr = prev[key as keyof FilterState];
      if (Array.isArray(arr)) {
        return {
          ...prev,
          [key]: arr.includes(value)
            ? arr.filter((item: string) => item !== value)
            : [...arr, value]
        };
      }
      // If not an array, just return previous state (or handle error as needed)
      return prev;
    });
  };

  const resetFilters = () => {
    setFilters({
      sports: [],
      leagues: [],
      seasons: [],
      divisions: [],
      dateRange: { start: null, end: null },
      daysOfWeek: [],
      timeOfDay: [],
      seasonType: [],
      teams: [],
      homeAway: [],
      conferences: [],
      rivalries: false,
      betTypes: [],
      spreadRanges: { min: -50, max: 50 },
      totalsRanges: { min: 30, max: 80 },
      moneylineRanges: { min: -500, max: 500 },
      odds: { min: -500, max: 500 },
      stakes: { min: 0, max: 1000 },
      winRates: { min: 0, max: 100 },
      roiRanges: { min: -100, max: 100 },
      weather: [],
      restDays: [],
      broadcast: [],
      injuries: false,
      sportsbooks: [],
      lineMovement: [],
      clvStatus: []
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.sports.length > 0) count++;
    if (filters.betTypes.length > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.teams.length > 0) count++;
    if (filters.sportsbooks.length > 0) count++;
    // Add more conditions as needed
    return count;
  };

  const handleSaveFilter = () => {
    if (saveFilterName.trim()) {
      onSaveFilter(saveFilterName.trim(), filters);
      setSaveFilterName('');
      setShowSaveDialog(false);
    }
  };

  if (!isPro) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Advanced Filtering</h3>
          <p className="text-muted-foreground mb-4">
            Unlock unlimited multi-dimensional filtering with Pro
          </p>
          <Button>Upgrade to Pro</Button>
        </div>
      </Card>
    );
  }

  const filterSections = [
    { id: 'sports', label: 'Sports & Leagues', icon: Trophy },
    { id: 'temporal', label: 'Time & Date', icon: Calendar },
    { id: 'teams', label: 'Teams & Matchups', icon: Users },
    { id: 'betting', label: 'Bet Types', icon: Target },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'situational', label: 'Situational', icon: MapPin },
    { id: 'sportsbooks', label: 'Sportsbooks', icon: DollarSign }
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Advanced Filters</h3>
          {getActiveFilterCount() > 0 && (
            <Badge variant="default">{getActiveFilterCount()} active</Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Saved Filters */}
      {savedFilters.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium mb-2">Saved Filters</p>
          <div className="flex flex-wrap gap-2">
            {savedFilters.map((saved) => (
              <Button
                key={saved.id}
                variant="outline"
                size="sm"
                onClick={() => onLoadFilter(saved.filters)}
                className="h-7"
              >
                {saved.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Filter Section Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filterSections.map((section) => {
          const Icon = section.icon;
          return (
            <Button
              key={section.id}
              variant={activeSection === section.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveSection(section.id)}
              className="flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {section.label}
            </Button>
          );
        })}
      </div>

      <Separator className="my-4" />

      {/* Sports & Leagues Section */}
      {activeSection === 'sports' && (
        <div className="space-y-4">
          <div>
            <p className="font-medium mb-2">Sports</p>
            <div className="flex flex-wrap gap-2">
              {sportsOptions.map((sport) => (
                <Button
                  key={sport}
                  variant={filters.sports.includes(sport) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleArrayValue('sports', sport)}
                >
                  {sport}
                  {filters.sports.includes(sport) && <X className="w-3 h-3 ml-2" />}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-medium mb-2">Season Type</p>
            <div className="flex flex-wrap gap-2">
              {['Regular Season', 'Playoffs', 'Preseason', 'Tournament'].map((type) => (
                <Button
                  key={type}
                  variant={filters.seasonType.includes(type) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleArrayValue('seasonType', type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Temporal Section */}
      {activeSection === 'temporal' && (
        <div className="space-y-4">
          <div>
            <p className="font-medium mb-2">Date Range</p>
            <div className="flex gap-2">
              <Input
                type="date"
                value={filters.dateRange.start?.toISOString().split('T')[0] || ''}
                onChange={(e) => updateFilter('dateRange', {
                  ...filters.dateRange,
                  start: e.target.value ? new Date(e.target.value) : null
                })}
                className="flex-1"
              />
              <Input
                type="date"
                value={filters.dateRange.end?.toISOString().split('T')[0] || ''}
                onChange={(e) => updateFilter('dateRange', {
                  ...filters.dateRange,
                  end: e.target.value ? new Date(e.target.value) : null
                })}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <p className="font-medium mb-2">Days of Week</p>
            <div className="flex flex-wrap gap-2">
              {daysOfWeekOptions.map((day) => (
                <Button
                  key={day}
                  variant={filters.daysOfWeek.includes(day) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleArrayValue('daysOfWeek', day)}
                >
                  {day.slice(0, 3)}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-medium mb-2">Time of Day</p>
            <div className="flex flex-wrap gap-2">
              {['Morning (6-12)', 'Afternoon (12-18)', 'Evening (18-24)', 'Late Night (0-6)'].map((time) => (
                <Button
                  key={time}
                  variant={filters.timeOfDay.includes(time) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleArrayValue('timeOfDay', time)}
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Teams & Matchups Section */}
      {activeSection === 'teams' && (
        <div className="space-y-4">
          <div>
            <p className="font-medium mb-2">Home/Away</p>
            <div className="flex gap-2">
              {['Home', 'Away', 'Neutral'].map((location) => (
                <Button
                  key={location}
                  variant={filters.homeAway.includes(location) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleArrayValue('homeAway', location)}
                >
                  {location}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-medium mb-2">Team Search</p>
            <Input
              placeholder="Search teams..."
              className="mb-2"
            />
            <div className="max-h-32 overflow-y-auto">
              {/* Team selection would be populated based on selected sports */}
              <p className="text-sm text-muted-foreground">Select sports first to see teams</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rivalries"
              checked={filters.rivalries}
              onChange={(e) => updateFilter('rivalries', e.target.checked)}
            />
            <label htmlFor="rivalries" className="text-sm font-medium">
              Rivalry Games Only
            </label>
          </div>
        </div>
      )}

      {/* Betting Section */}
      {activeSection === 'betting' && (
        <div className="space-y-4">
          <div>
            <p className="font-medium mb-2">Bet Types</p>
            <div className="flex flex-wrap gap-2">
              {betTypeOptions.map((type) => (
                <Button
                  key={type}
                  variant={filters.betTypes.includes(type) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleArrayValue('betTypes', type)}
                >
                  {type}
                  {filters.betTypes.includes(type) && <X className="w-3 h-3 ml-2" />}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium mb-2">Spread Range</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.spreadRanges.min}
                  onChange={(e) => updateFilter('spreadRanges', {
                    ...filters.spreadRanges,
                    min: Number(e.target.value)
                  })}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.spreadRanges.max}
                  onChange={(e) => updateFilter('spreadRanges', {
                    ...filters.spreadRanges,
                    max: Number(e.target.value)
                  })}
                />
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">Total Range</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.totalsRanges.min}
                  onChange={(e) => updateFilter('totalsRanges', {
                    ...filters.totalsRanges,
                    min: Number(e.target.value)
                  })}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.totalsRanges.max}
                  onChange={(e) => updateFilter('totalsRanges', {
                    ...filters.totalsRanges,
                    max: Number(e.target.value)
                  })}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Section */}
      {activeSection === 'performance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium mb-2">Odds Range</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.odds.min}
                  onChange={(e) => updateFilter('odds', {
                    ...filters.odds,
                    min: Number(e.target.value)
                  })}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.odds.max}
                  onChange={(e) => updateFilter('odds', {
                    ...filters.odds,
                    max: Number(e.target.value)
                  })}
                />
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">Stake Range ($)</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.stakes.min}
                  onChange={(e) => updateFilter('stakes', {
                    ...filters.stakes,
                    min: Number(e.target.value)
                  })}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.stakes.max}
                  onChange={(e) => updateFilter('stakes', {
                    ...filters.stakes,
                    max: Number(e.target.value)
                  })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium mb-2">Win Rate Range (%)</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.winRates.min}
                  onChange={(e) => updateFilter('winRates', {
                    ...filters.winRates,
                    min: Number(e.target.value)
                  })}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.winRates.max}
                  onChange={(e) => updateFilter('winRates', {
                    ...filters.winRates,
                    max: Number(e.target.value)
                  })}
                />
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">ROI Range (%)</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.roiRanges.min}
                  onChange={(e) => updateFilter('roiRanges', {
                    ...filters.roiRanges,
                    min: Number(e.target.value)
                  })}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.roiRanges.max}
                  onChange={(e) => updateFilter('roiRanges', {
                    ...filters.roiRanges,
                    max: Number(e.target.value)
                  })}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Situational Section */}
      {activeSection === 'situational' && (
        <div className="space-y-4">
          <div>
            <p className="font-medium mb-2">Weather Conditions</p>
            <div className="flex flex-wrap gap-2">
              {['Clear', 'Rain', 'Snow', 'Wind', 'Dome/Indoor'].map((weather) => (
                <Button
                  key={weather}
                  variant={filters.weather.includes(weather) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleArrayValue('weather', weather)}
                >
                  {weather}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-medium mb-2">Rest Days</p>
            <div className="flex flex-wrap gap-2">
              {['0 Days', '1 Day', '2-3 Days', '4+ Days', 'Back-to-Back'].map((rest) => (
                <Button
                  key={rest}
                  variant={filters.restDays.includes(rest) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleArrayValue('restDays', rest)}
                >
                  {rest}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-medium mb-2">Broadcast Coverage</p>
            <div className="flex flex-wrap gap-2">
              {['National TV', 'Local TV', 'Streaming', 'No Coverage'].map((broadcast) => (
                <Button
                  key={broadcast}
                  variant={filters.broadcast.includes(broadcast) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleArrayValue('broadcast', broadcast)}
                >
                  {broadcast}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="injuries"
              checked={filters.injuries}
              onChange={(e) => updateFilter('injuries', e.target.checked)}
            />
            <label htmlFor="injuries" className="text-sm font-medium">
              Key Injuries Present
            </label>
          </div>
        </div>
      )}

      {/* Sportsbooks Section */}
      {activeSection === 'sportsbooks' && (
        <div className="space-y-4">
          <div>
            <p className="font-medium mb-2">Sportsbooks</p>
            <div className="flex flex-wrap gap-2">
              {sportsbookOptions.map((book) => (
                <Button
                  key={book}
                  variant={filters.sportsbooks.includes(book) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleArrayValue('sportsbooks', book)}
                >
                  {book}
                  {filters.sportsbooks.includes(book) && <X className="w-3 h-3 ml-2" />}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-medium mb-2">Line Movement</p>
            <div className="flex flex-wrap gap-2">
              {['Moved For', 'Moved Against', 'No Movement', 'Steam Move', 'Reverse Line Movement'].map((movement) => (
                <Button
                  key={movement}
                  variant={filters.lineMovement.includes(movement) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleArrayValue('lineMovement', movement)}
                >
                  {movement}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-medium mb-2">CLV Status</p>
            <div className="flex flex-wrap gap-2">
              {['CLV Positive', 'CLV Negative', 'CLV Neutral'].map((clv) => (
                <Button
                  key={clv}
                  variant={filters.clvStatus.includes(clv) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleArrayValue('clvStatus', clv)}
                >
                  {clv}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Save Filter</h3>
            <Input
              placeholder="Filter name"
              value={saveFilterName}
              onChange={(e) => setSaveFilterName(e.target.value)}
              className="mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveFilter}>
                Save Filter
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
};