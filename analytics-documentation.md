# TrueSharp Enhanced Analytics Documentation

This document outlines the enhanced analytics system implemented for TrueSharp, including SQL
functions, materialized views, and frontend integration.

## Overview

The enhanced analytics system provides four main charts powered by PostgreSQL/Supabase functions:

1. **ROI Over Time** - Daily ROI performance tracking
2. **Performance by League** - League-specific performance metrics (min 10 bets)
3. **Win Rate vs Expected** - Actual vs implied probability analysis
4. **Monthly Performance** - Monthly trend analysis (last 12 months)

## SQL Functions

### Core Helper Functions

#### `analytics.american_to_prob(odds integer)`

Converts American odds to implied probability (0-1 range).

```sql
SELECT analytics.american_to_prob(-110); -- Returns ~0.524
SELECT analytics.american_to_prob(150);  -- Returns ~0.400
```

#### `analytics.net_profit_for_row(b bets)`

Calculates normalized net profit for a bet row using profit column or fallback calculation.

### Main RPC Functions

#### `analytics.roi_over_time(p_user uuid, p_filters jsonb, p_tz text, p_from timestamptz, p_to timestamptz)`

Returns daily ROI performance over time.

**Parameters:**

- `p_user`: User UUID
- `p_filters`: JSON filters object (leagues, bet_types, sportsbooks, etc.)
- `p_tz`: Timezone string (default: 'UTC')
- `p_from`: Start date (optional)
- `p_to`: End date (optional)

**Returns:** Table with columns: day, net_profit, stake, roi_pct, bets

**Example:**

```typescript
const { data } = await supabase.rpc('analytics.roi_over_time', {
  p_user: userId,
  p_filters: JSON.stringify({ leagues: ['NFL', 'NBA'] }),
  p_tz: 'America/New_York',
})
```

#### `analytics.performance_by_league(p_user uuid, p_filters jsonb, p_tz text, p_from timestamptz, p_to timestamptz)`

Returns performance breakdown by league (only leagues with ≥10 bets).

**Returns:** Table with columns: league, bets, stake, net_profit, roi_pct

#### `analytics.winrate_vs_expected(p_user uuid, p_filters jsonb, p_bins int, p_min_bets int)`

Returns actual vs expected win rate by odds buckets.

**Parameters:**

- `p_bins`: Number of probability buckets (default: 10)
- `p_min_bets`: Minimum bets per bucket to include (default: 5)

**Returns:** Table with columns: bucket_label, bucket_start_pct, bucket_end_pct, bets, expected_pct,
actual_pct

#### `analytics.monthly_performance(p_user uuid, p_filters jsonb, p_tz text, p_to timestamptz)`

Returns monthly performance for the last 12 months.

**Returns:** Table with columns: month, bets, stake, net_profit, roi_pct

#### `analytics.fetch_series(p_user uuid, p_filters jsonb, p_x_dim text, p_y_metric text, p_bucket jsonb, p_opts jsonb)`

Generic RPC for chart builder functionality.

**Parameters:**

- `p_x_dim`: 'date:day', 'date:week', 'date:month', 'league', 'bet_type', etc.
- `p_y_metric`: 'roi', 'net_profit', 'win_rate', 'total_stake', 'count', 'avg_stake'

## Filters Object Structure

All RPC functions accept a `p_filters` JSON object with optional keys:

```typescript
interface AnalyticsFilters {
  leagues?: string[] // e.g., ['NFL', 'NBA', 'MLB']
  bet_types?: string[] // e.g., ['spread', 'moneyline', 'total']
  sportsbooks?: string[] // e.g., ['DraftKings', 'FanDuel']
  player_names?: string[] // For player props
  odds_min?: number // Minimum odds filter
  odds_max?: number // Maximum odds filter
  stake_min?: number // Minimum stake filter
  stake_max?: number // Maximum stake filter
  date_from?: string // ISO date string
  date_to?: string // ISO date string
  is_parlay?: boolean // Filter parlays/singles
  prop_type?: string // Specific prop type
  side?: string // 'over', 'under', 'home', 'away'
}
```

## Materialized Views

### `analytics.mv_daily_user_perf`

Daily aggregated performance by user.

- Refreshed via `analytics.refresh_daily_performance()`

### `analytics.mv_monthly_user_perf`

Monthly aggregated performance by user.

- Refreshed via `analytics.refresh_monthly_performance()`

### `analytics.mv_league_user_perf`

League performance aggregated by user.

- Refreshed via `analytics.refresh_league_performance()`

### Refresh All Views

```sql
SELECT analytics.refresh_all_views();
```

## Frontend Integration

### TypeScript Helper Functions

```typescript
import {
  fetchROIOverTime,
  fetchPerformanceByLeague,
  fetchWinRateVsExpected,
  fetchMonthlyPerformance,
  fetchEnhancedAnalytics,
} from '@/lib/analytics/enhanced-analytics'

// Fetch all enhanced analytics at once
const analyticsData = await fetchEnhancedAnalytics(
  userId,
  { leagues: ['NFL'], date_from: '2024-01-01' },
  'America/New_York'
)
```

### Analytics Hook Enhancement

The `useAnalytics` hook has been enhanced to include the new data:

```typescript
const { analyticsData, isLoading, error } = useAnalytics(user, isPro)

// Access enhanced data
const roiOverTime = analyticsData.roiOverTime
const leagueBreakdown = analyticsData.leagueBreakdown
const winRateVsExpected = analyticsData.winRateVsExpected
const monthlyPerformance = analyticsData.monthlyPerformance
```

### React Component Usage

The enhanced analytics tab automatically displays the four new charts:

```typescript
import { AnalyticsTab } from '@/components/analytics/analytics-tab'

<AnalyticsTab data={analyticsData} isPro={isPro} />
```

## Chart Behaviors

### ROI Over Time

- Shows daily ROI percentage
- Hover for net profit details
- Date range filtering supported
- Moving averages computed client-side

### Performance by League

- Only shows leagues with ≥10 bets
- Color coding: Green (ROI >5%), Red (ROI <-5%), Gray (neutral)
- Sorted by ROI descending

### Win Rate vs Expected

- Scatter plot with expected vs actual win rates
- Diagonal line shows perfect calibration
- Points above line indicate outperformance
- Minimum 5 bets per bucket (configurable)

### Monthly Performance

- Last 12 months by default
- Dual-axis: Net profit (bars) and ROI (line)
- Supports date range customization

## Performance Optimization

### Indexes

The system includes optimized indexes:

```sql
CREATE INDEX idx_bets_league ON public.bets (league);
CREATE INDEX idx_bets_user_placed_at ON public.bets (user_id, placed_at);
CREATE INDEX idx_bets_user_status ON public.bets (user_id, status);
CREATE INDEX idx_bets_user_league ON public.bets (user_id, league);
```

### Caching

- Client-side caching with cache keys: `{userId}_{filtersHash}_{rpcName}_{argsHash}`
- Recommended cache duration: 5-15 minutes
- Materialized views for hot paths

### Large Account Optimization

For accounts with >10k bets:

1. Prefer materialized views over live scans
2. Limit returned points to 1000
3. Auto-bucket to weekly/monthly if needed
4. Flag UI as "auto-bucketed"

## Installation

1. Run the SQL script:

```bash
psql -f analytics-enhancement.sql your_database
```

2. Install the frontend helpers:

```bash
# Files are already created in the codebase
# src/lib/analytics/enhanced-analytics.ts
# Updated src/lib/hooks/use-analytics.ts
# Updated src/components/analytics/analytics-tab.tsx
```

3. Set up refresh schedule (optional):

```sql
-- Example: Refresh daily at midnight
SELECT cron.schedule('refresh-analytics', '0 0 * * *', 'SELECT analytics.refresh_all_views();');
```

## Security Considerations

- Functions use `SECURITY DEFINER` - ensure proper user validation
- Consider implementing RLS on public.bets table
- Validate that `p_user = auth.uid()` in production
- All dynamic SQL uses safe parameterization

## Troubleshooting

### Common Issues

1. **No data returned**: Check that bets table has league column populated
2. **Performance issues**: Ensure indexes are created and materialized views are refreshed
3. **Permission errors**: Verify user has access to analytics schema
4. **Date filtering**: Ensure dates are in correct timezone and format

### Debug Queries

```sql
-- Check data availability
SELECT COUNT(*) FROM bets WHERE user_id = 'your-uuid' AND league IS NOT NULL;

-- Test odds conversion
SELECT odds, analytics.american_to_prob(odds) FROM bets LIMIT 10;

-- Verify materialized view data
SELECT * FROM analytics.mv_league_user_perf WHERE user_id = 'your-uuid';
```

## Future Enhancements

Planned improvements:

1. Real-time materialized view refresh triggers
2. Additional chart types (heat maps, correlation matrices)
3. Custom dashboard builder integration
4. Export functionality for all chart data
5. Advanced variance analysis
6. CLV (Closing Line Value) integration

## API Examples

### cURL Examples

```bash
# Supabase RPC call
curl -X POST 'https://your-project.supabase.co/rest/v1/rpc/analytics.roi_over_time' \
  -H 'apikey: your-anon-key' \
  -H 'Authorization: Bearer your-jwt' \
  -H 'Content-Type: application/json' \
  -d '{
    "p_user": "user-uuid",
    "p_filters": "{\"leagues\": [\"NFL\"]}",
    "p_tz": "UTC"
  }'
```

This completes the enhanced analytics implementation for TrueSharp, providing powerful, performant
analytics backed by PostgreSQL with a modern React frontend.
