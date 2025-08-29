# Open Bets Implementation

## Overview

This implementation adds open bets functionality to TrueSharp strategy cards for both sellers and subscribers. Open bets are defined as bets that are:
- Status: `pending` 
- Game hasn't started yet: `game_date > NOW()`

## Key Features

1. **Consistent Data**: Both seller and subscriber views use shared query logic to ensure consistency
2. **Real-time Display**: Shows current open bets for each strategy
3. **Smart UI**: Compact display for subscriber cards, detailed display for seller cards
4. **Fallback Handling**: Graceful degradation if open bets data fails to load

## Files Created/Modified

### New Files
- `src/lib/queries/open-bets.ts` - Shared query logic and types
- `src/components/shared/open-bets-display.tsx` - Reusable open bets display component
- `src/app/api/test-open-bets/route.ts` - Test API for validation

### Modified Files
- `src/components/seller/professional-strategy-card.tsx` - Added open bets display
- `src/components/subscriptions/subscription-card.tsx` - Added open bets display
- `src/components/seller/strategies-tab.tsx` - Enhanced to fetch open bets
- `src/app/subscriptions/page.tsx` - Enhanced subscription fetching
- `src/types/subscriptions.ts` - Added OpenBet type support

## Database Integration

The implementation works with the existing schema using:
- **Primary method**: `strategy_picks` table linking bets to strategies
- **Fallback method**: Direct `bets.strategy_id` column

### Key Tables Used
- `bets` - Individual betting records
- `strategies` - User betting strategies  
- `subscriptions` - User subscriptions to strategies
- `strategy_picks` - Links bets to strategies for subscribers

## Query Logic

### For Sellers (`getSellerStrategiesWithOpenBets`)
```sql
-- Gets strategies owned by seller with their open bets
SELECT strategies.*, bets.*
FROM strategies 
LEFT JOIN bets ON bets.strategy_id = strategies.id
WHERE strategies.user_id = ? 
  AND bets.status = 'pending' 
  AND bets.game_date > NOW()
```

### For Subscribers (`getSubscriberStrategiesWithOpenBets`)  
```sql
-- Gets strategies user is subscribed to with open bets
SELECT strategies.*, bets.*
FROM subscriptions
JOIN strategies ON strategies.id = subscriptions.strategy_id
JOIN strategy_picks ON strategy_picks.strategy_id = strategies.id
JOIN bets ON bets.id = strategy_picks.bet_id
WHERE subscriptions.subscriber_id = ?
  AND subscriptions.status = 'active'
  AND bets.status = 'pending'
  AND bets.game_date > NOW()
```

## UI Components

### OpenBetsDisplay Component
Reusable component with modes:
- **Full mode**: Shows detailed bet cards with game info, odds, potential profit
- **Compact mode**: Shows condensed bet info suitable for subscription cards

### Integration Points
- **Seller Dashboard**: Shows in professional strategy cards under performance metrics
- **Subscription Page**: Shows in subscription cards after strategy performance

## Testing

Use the test API to validate functionality:

```bash
# Test seller view
GET /api/test-open-bets?userId=USER_ID&type=seller

# Test subscriber view  
GET /api/test-open-bets?userId=USER_ID&type=subscriber

# Create sample data
POST /api/test-open-bets
{
  "userId": "USER_ID"
}
```

## Key Benefits

1. **Consistency**: Same query logic ensures both seller and subscriber see identical open bets
2. **Performance**: Efficient queries with proper indexing on status and game_date
3. **User Experience**: Clear visibility into current betting activity
4. **Scalability**: Shared components and utilities for easy maintenance

## Implementation Notes

### Error Handling
- Graceful fallback to regular strategy/subscription data if open bets fail
- Console warnings for debugging but no user-facing errors
- Maintains existing functionality even if new features fail

### Performance Considerations
- Indexed queries on `bets(status, game_date)`
- Minimal data fetching (only essential bet fields)
- Client-side caching through React state management

### Future Enhancements
- Real-time updates via WebSocket/polling
- Bet result notifications when games start
- Historical open bets tracking
- Advanced filtering options

## Verification Steps

1. Create a strategy with monetization enabled
2. Add bets with `status = 'pending'` and future `game_date` 
3. Link bets to strategy via `strategy_picks` table
4. Visit sell page - should see open bets in strategy card
5. Subscribe to the strategy from another account
6. Visit subscriptions page - should see same open bets in subscription card

The implementation ensures both views show identical data using shared query logic.