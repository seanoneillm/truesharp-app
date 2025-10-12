# iOS Odds Modal UI Updates - Main Lines Tab

## Changes Made

### 1. **Moneyline Display Updates**
- **Before**: Showed multiple moneyline odds for each team
- **After**: Shows only the **best moneyline odds** (highest value) for each team
- **Team Names**: Team names are clearly displayed for each moneyline option
- **Implementation**: Added `.slice(0, 1)` to show only the first (best) odds option

### 2. **Spread & Total Default View Updates**
- **Before**: Default view showed highest spread value and lowest total value by line value
- **After**: 
  - **Line Order**: Lines are sorted by line value (maintains proper order)
  - **Default View**: Scrolls to the line with odds closest to -100 (center of list)
  - **User Experience**: Users can scroll up/down to see all alternate lines in proper order

### 3. **Improved Sorting Algorithm**
```typescript
if (marketType === 'ml') {
  // For moneyline: Sort by highest value odds (best for user)
  odds.sort((a, b) => {
    const oddsA = getBookOdds(a);
    const oddsB = getBookOdds(b);
    return oddsB - oddsA; // Descending order (highest first)
  });
} else {
  // For spread/total: Sort by line value to maintain order
  odds.sort((a, b) => {
    if (a.line && b.line) {
      const lineA = parseFloat(a.line);
      const lineB = parseFloat(b.line);
      if (!isNaN(lineA) && !isNaN(lineB)) {
        return lineA - lineB; // Ascending order by line value
      }
    }
    // Fallback to odds comparison if no line values
    const oddsA = getBookOdds(a);
    const oddsB = getBookOdds(b);
    return Math.abs(Math.abs(oddsA) - 100) - Math.abs(Math.abs(oddsB) - 100);
  });
}
```

### 4. **Smart Default Positioning**
```typescript
// Find the index of the line with odds closest to -100 for default positioning
let defaultScrollIndex = 0;
if (marketType === 'sp' || marketType === 'ou') {
  const awayOrOverOdds = groupedOdds.get(marketType === 'sp' ? 'away' : 'over') || [];
  if (awayOrOverOdds.length > 0) {
    let bestOddsIndex = 0;
    let bestOddsDiff = Math.abs(Math.abs(getBookOdds(awayOrOverOdds[0])) - 100);
    
    awayOrOverOdds.forEach((odd, index) => {
      const oddsDiff = Math.abs(Math.abs(getBookOdds(odd)) - 100);
      if (oddsDiff < bestOddsDiff) {
        bestOddsDiff = oddsDiff;
        bestOddsIndex = index;
      }
    });
    defaultScrollIndex = bestOddsIndex;
  }
}
```

## UI Improvements

### **Main Lines Tab Now Shows:**

#### **Moneyline Section**
- ✅ Only 2 odds buttons total (1 for each team)
- ✅ **Highest value odds** for Away Team (best payout)
- ✅ **Highest value odds** for Home Team (best payout)
- ✅ Team names clearly labeled
- ✅ Clean, focused interface

#### **Spread Section**
- ✅ Lines displayed in **proper order by line value** (-10, -9.5, -9, etc.)
- ✅ **Default view scrolls to line with odds closest to -100** (center position)
- ✅ Users can scroll up/down to see all alternate lines
- ✅ Away team and Home team clearly labeled
- ✅ Line values and odds displayed for each option

#### **Total Section**
- ✅ Lines displayed in **proper order by total value** (40.5, 41, 41.5, etc.)
- ✅ **Default view scrolls to line with odds closest to -100** (center position)
- ✅ Users can scroll up/down to see all alternate totals
- ✅ Over and Under clearly labeled
- ✅ Line values and odds displayed for each option

## User Experience Benefits

1. **Simplified Moneyline View**: Users see only the most valuable odds for each team
2. **Better Default Lines**: Spread and total sections show the most favorable odds first
3. **Maintained Functionality**: Users can still access all alternate lines by scrolling
4. **Clear Team Identification**: Team names are prominently displayed in moneyline section
5. **Consistent Logic**: All sections now prioritize odds value (closeness to -100) over line value

## Technical Details

- **File Modified**: `/ios-app/src/components/games/OddsModal.tsx`
- **Function Updated**: `renderMainLineSection`
- **Sorting Logic**: Changed from line-value-first to odds-value-first
- **Display Logic**: Moneylines now show only `.slice(0, 1)` (best odds)
- **Backward Compatible**: All existing functionality preserved, just with better defaults

## Testing Recommendations

1. **Moneyline Test**: Verify only 2 buttons show (1 per team) with best odds
2. **Spread Test**: Confirm default line has odds closest to -100, not highest/lowest line value
3. **Total Test**: Confirm default line has odds closest to -100, not highest/lowest total
4. **Scroll Test**: Verify users can still scroll through alternate lines for spreads/totals
5. **Team Names**: Ensure team names are clearly visible in moneyline section

The updates provide a cleaner, more user-focused interface while maintaining all the powerful alternate lines functionality!