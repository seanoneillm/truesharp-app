# Betting System Backend Functions

This directory contains all the backend TypeScript functions for handling bet submissions in the
TrueSharp application.

## Overview

The betting system supports both single bets and multi-leg parlays, with automatic odds
calculations, database insertions, and status tracking.

## Files Structure

```
src/lib/services/betting/
├── types.ts              # TypeScript interfaces and types
├── odds-utils.ts          # Odds calculation utilities
├── bet-mapping.ts         # Maps bet slip data to database format
├── betting-functions.ts   # Main betting functions
├── index.ts              # Exports all functions
└── README.md             # This file

src/lib/api/
└── betting.ts            # Client-side API service

src/app/api/bets/
├── submit/route.ts       # API endpoint for bet submission
└── parlay/[parlayId]/status/route.ts  # API endpoint for parlay status
```

## Main Functions

### `submitBet(userId: string, bets: Bet[], stake: number)`

- Main function that determines if it's a single bet or parlay
- Handles validation and routes to appropriate function
- Returns `BetSubmissionResult`

### `insertSingleBet(userId: string, bet: Bet, stake: number)`

- Inserts a single straight bet into the database
- Calculates payout automatically
- Returns bet ID on success

### `insertParlayBet(userId: string, bets: Bet[], stake: number)`

- Inserts multiple rows for parlay legs
- First leg contains the stake, others have stake = 0
- All legs share the same `parlay_id`
- Calculates parlay odds and total payout

### `calculateParlayPayoutForUI(bets: Bet[], stake: number)`

- Calculates potential payout for display in UI
- Handles both single bets and parlays
- Used for real-time payout calculations

### `checkParlayStatus(parlayId: string)`

- Reads all legs of a parlay from database
- Determines overall status:
  - `lost`: Any leg is lost
  - `won`: All legs are won
  - `void`: All legs are won or void
  - `pending`: Has pending legs
- Returns detailed status breakdown

## API Integration

### Submit Bet

```typescript
import { submitBets } from '@/lib/api/betting'

const result = await submitBets(betSlipBets, wagerAmount)
if (result.success) {
  console.log('Bet submitted:', result.betId || result.parlayId)
} else {
  console.error('Error:', result.error)
}
```

### Check Parlay Status

```typescript
import { checkParlayStatus } from '@/lib/api/betting'

const status = await checkParlayStatus(parlayId)
console.log('Parlay status:', status.status)
```

## Integration with Bet Slip

To integrate with the bet slip component, replace the mock API call in `BetSlip.tsx`:

```typescript
// Replace this in handlePlaceBet function:
// await new Promise(resolve => setTimeout(resolve, 1500));

// With this:
import { submitBets } from '@/lib/api/betting'

const result = await submitBets(bets, wagerAmount)
if (result.success) {
  showSuccess(result.message || 'Bet placed successfully!')
  // Clear bet slip
  clearAllBets()
  setWagerAmount(10)
} else {
  showError(result.error || 'Failed to place bet')
}
```

## Database Schema Mapping

The system automatically maps bet slip data to the database schema:

- `marketType` → `oddid` (primary identifier)
- Extracts `player_name` from oddid pattern
- Determines `bet_type` (moneyline, spread, total, player_prop, etc.)
- Calculates `side` (over, under, home, away)
- Maps `sport` to `league`
- Sets appropriate `prop_type` for player props

## Error Handling

All functions include comprehensive error handling:

- Input validation (stake limits, bet count limits)
- Database error handling
- Authentication checks in API routes
- Graceful fallbacks and user-friendly error messages

## Security Features

- User authentication required for all bet submissions
- Input validation and sanitization
- SQL injection protection via Supabase client
- Rate limiting capabilities (can be added to API routes)

## Testing

The functions can be tested independently:

```typescript
import { submitBet } from '@/lib/services/betting'

// Test single bet
const singleBetResult = await submitBet(userId, [testBet], 25)

// Test parlay
const parlayResult = await submitBet(userId, [bet1, bet2, bet3], 50)
```

## Production Considerations

1. **Rate Limiting**: Add rate limiting to API routes
2. **Monitoring**: Add logging for bet submissions
3. **Backup**: Ensure database backups are configured
4. **Validation**: Add additional business rule validation
5. **Testing**: Implement comprehensive test suite

## Next Steps

1. Replace the mock bet submission in `BetSlip.tsx`
2. Add error handling UI for failed submissions
3. Implement bet history display
4. Add parlay status tracking in user dashboard
5. Consider adding bet cancellation functionality (if required)
