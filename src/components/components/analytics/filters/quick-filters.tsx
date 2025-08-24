import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Calendar,
    Clock,
    Target,
    TrendingUp,
    Trophy,
    X
} from 'lucide-react';
import React from 'react';

interface QuickFilter {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  filters: any;
  category: 'time' | 'sport' | 'performance' | 'betting';
}

interface QuickFiltersProps {
  activeFilters: string[];
  onFilterToggle: (filterId: string) => void;
  onFilterApply: (filters: any) => void;
  isPro: boolean;
}

export const QuickFilters: React.FC<QuickFiltersProps> = ({
  activeFilters,
  onFilterToggle,
  onFilterApply,
  isPro
}) => {
  const quickFilters: QuickFilter[] = [
    // Time-based filters
    {
      id: 'last_7_days',
      label: 'Last 7 Days',
      description: 'Recent performance',
      icon: Calendar,
      category: 'time',
      filters: {
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date()
        }
      }
    },
    {
      id: 'last_30_days',
      label: 'Last 30 Days',
      description: 'Monthly performance',
      icon: Calendar,
      category: 'time',
      filters: {
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        }
      }
    },
    {
      id: 'weekends_only',
      label: 'Weekends Only',
      description: 'Saturday & Sunday',
      icon: Clock,
      category: 'time',
      filters: {
        daysOfWeek: ['Saturday', 'Sunday']
      }
    },
    
    // Sport-based filters
    {
      id: 'nfl_only',
      label: 'NFL Only',
      description: 'Football bets',
      icon: Trophy,
      category: 'sport',
      filters: {
        sports: ['NFL']
      }
    },
    {
      id: 'nba_only',
      label: 'NBA Only',
      description: 'Basketball bets',
      icon: Trophy,
      category: 'sport',
      filters: {
        sports: ['NBA']
      }
    },
    {
      id: 'major_sports',
      label: 'Major Sports',
      description: 'NFL, NBA, MLB, NHL',
      icon: Trophy,
      category: 'sport',
      filters: {
        sports: ['NFL', 'NBA', 'MLB', 'NHL']
      }
    },
    
    // Betting type filters
    {
      id: 'spreads_only',
      label: 'Spreads Only',
      description: 'Point spread bets',
      icon: Target,
      category: 'betting',
      filters: {
        betTypes: ['Spread']
      }
    },
    {
      id: 'moneyline_only',
      label: 'Moneyline Only',
      description: 'Straight win bets',
      icon: Target,
      category: 'betting',
      filters: {
        betTypes: ['Moneyline']
      }
    },
    {
      id: 'no_parlays',
      label: 'No Parlays',
      description: 'Single bets only',
      icon: Target,
      category: 'betting',
      filters: {
        betTypes: ['Spread', 'Moneyline', 'Total']
      }
    },
    
    // Performance filters
    {
      id: 'winning_bets',
      label: 'Winning Bets',
      description: 'Successful wagers',
      icon: TrendingUp,
      category: 'performance',
      filters: {
        result: ['won']
      }
    },
    {
      id: 'high_confidence',
      label: 'High Confidence',
      description: '4-5 star picks',
      icon: TrendingUp,
      category: 'performance',
      filters: {
        confidence: [4, 5]
      }
    },
    {
      id: 'large_stakes',
      label: 'Large Stakes',
      description: '$100+ bets',
      icon: TrendingUp,
      category: 'performance',
      filters: {
        stakes: { min: 100, max: 10000 }
      }
    }
  ];

  const categories = [
    { id: 'time', label: 'Time', icon: Calendar },
    { id: 'sport', label: 'Sports', icon: Trophy },
    { id: 'betting', label: 'Bet Types', icon: Target },
    { id: 'performance', label: 'Performance', icon: TrendingUp }
  ];

  const handleFilterClick = (filter: QuickFilter) => {
    if (activeFilters.includes(filter.id)) {
      onFilterToggle(filter.id);
    } else {
      onFilterToggle(filter.id);
      onFilterApply(filter.filters);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Quick Filters</h3>
        {activeFilters.length > 0 && (
          <Badge variant="outline">{activeFilters.length} active</Badge>
        )}
      </div>

      {categories.map((category) => {
        const Icon = category.icon;
        const categoryFilters = quickFilters.filter(f => f.category === category.id);
        
        return (
          <div key={category.id} className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{category.label}</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {categoryFilters.map((filter) => {
                const FilterIcon = filter.icon;
                const isActive = activeFilters.includes(filter.id);
                
                return (
                  <Button
                    key={filter.id}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterClick(filter)}
                    className="flex items-center gap-2 h-8"
                  >
                    <FilterIcon className="w-3 h-3" />
                    {filter.label}
                    {isActive && <X className="w-3 h-3 ml-1" />}
                  </Button>
                );
              })}
            </div>
          </div>
        );
      })}

      {!isPro && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Pro Tip:</strong> Upgrade to Pro for unlimited custom filters and advanced analytics
          </p>
        </div>
      )}
    </Card>
  );
};