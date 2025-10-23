# Clean Admin Bets Components

This directory contains the clean, focused betting analytics dashboard for admin users.

## Components

### `CleanBetsTab`
A streamlined betting analytics interface focused on the **critical oddid mapping metrics** that business owners need to monitor.

**Key Features:**
- **Oddid Mapping Status**: Primary focus on tracking bet-to-odds matching percentage
- **Real-time Trends**: Daily mapping percentage trends over time
- **Core Betting Metrics**: Total bets, stakes, profit, win rates
- **Source Analysis**: Mapping rates by bet source (manual vs sharpsports)
- **Sport Performance**: Mapping rates by sport to identify problem areas

## Critical Business Metrics

### **Oddid Mapping** (Primary Focus)
- **Overall Mapping Rate**: Percentage of bets with oddids mapped
- **Bets with Oddids**: Count of successfully mapped bets
- **Bets without Oddids**: Count of unmapped bets (critical for settlement)
- **Recent Performance**: 7-day and 30-day mapping trends

### **Why Oddid Mapping Matters**
- **Bet Settlement**: Only bets with oddids can be automatically settled
- **Revenue Impact**: Unmapped bets require manual intervention
- **Data Quality**: Mapping rate indicates system health
- **User Experience**: Better mapping = faster settlements

## API Endpoint

### `/api/admin/bets-analytics`
Provides comprehensive betting analytics focused on oddid mapping.

**Query Parameters:**
- `timeframe`: '7d' | '30d' | '90d' | 'ytd'

**Key Response Data:**
```typescript
{
  // Oddid mapping (CRITICAL)
  oddidMappingPercentage: number
  betsWithOddids: number
  betsWithoutOddids: number
  last7DaysMappingRate: number
  last30DaysMappingRate: number
  
  // Time series for trends
  betsPerDayData: Array<{
    date: string
    totalBets: number
    mappedBets: number
    mappingPercentage: number
  }>
  
  // Source performance
  betsBySource: Array<{
    source: string
    count: number
    mappedCount: number
    mappingRate: number
  }>
  
  // Sport performance
  betsBySport: Array<{
    sport: string
    count: number
    mappedCount: number
    mappingRate: number
  }>
}
```

## Visual Design

### **Status Indicators**
- **🟢 Excellent**: 90%+ mapping rate
- **🔵 Good**: 75-90% mapping rate  
- **🟡 Warning**: 50-75% mapping rate
- **🔴 Critical**: <50% mapping rate

### **Charts & Visualizations**
- **Mapping Trends**: Combined bar + line chart showing daily bets and mapping percentage
- **Source Performance**: Cards showing mapping rates by bet source
- **Sport Analysis**: Grid showing mapping performance by sport

## Database Schema Used

### `bets` table
- **oddid**: Critical field for tracking mapping status
- **bet_source**: manual vs sharpsports for source analysis
- **sport**: For sport-specific mapping analysis
- **status**: For settlement tracking
- **stake/profit**: For financial metrics

### `sharpsports_bet_matches` table
- **bet_id**: Links to bets table
- **odd_id**: Confirms successful mapping
- Used to validate mapping completeness

## Business Value

1. **Settlement Efficiency**: Track what percentage of bets can be auto-settled
2. **Data Quality Monitoring**: Identify mapping issues before they impact users
3. **Source Performance**: Compare manual vs automated bet mapping success
4. **Sport Analysis**: Identify which sports have mapping challenges
5. **Trend Analysis**: Monitor mapping performance over time

## Usage

```tsx
import { CleanBetsTab } from '@/components/admin/bets'

function AdminPage() {
  return (
    <TabsContent value="bets">
      <CleanBetsTab />
    </TabsContent>
  )
}
```

## Key Improvements from Original

- ✅ **Focused Metrics**: Emphasis on oddid mapping over generic bet stats
- ✅ **Business Context**: Clear indication of mapping impact on operations
- ✅ **Trend Analysis**: Time-based visualization of mapping performance
- ✅ **Actionable Insights**: Source and sport breakdowns to identify issues
- ✅ **Clean Design**: Reduced clutter, better visual hierarchy
- ✅ **Real-time Updates**: Auto-refresh every 5 minutes

The clean bets tab transforms raw betting data into actionable business intelligence focused on the critical oddid mapping process that directly impacts settlement automation and user experience.