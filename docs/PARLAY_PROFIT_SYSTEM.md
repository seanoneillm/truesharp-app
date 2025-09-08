# Parlay Profit Calculation System

This document explains the parlay-aware profit calculation system implemented to fix profit calculations for parlay bets.

## 🎯 Problem Solved

**Before:** Each leg of a parlay was treated as an independent bet with its own profit calculation. This led to incorrect analytics where:
- Winning legs of losing parlays were counted as profitable
- Parlay profits were counted multiple times (once per leg)
- Overall ROI and profit calculations were inflated

**After:** Parlays are treated as single betting units with all-or-nothing profit logic.

## 🧮 Profit Calculation Rules

### Single Bets (no `parlay_id`)
- **Win:** `profit = potential_payout - stake`
- **Loss:** `profit = -stake`
- **Void/Push:** `profit = 0`
- **Pending:** `profit = null`

### Parlay Bets (same `parlay_id`)

#### All Legs Win
- Calculate combined decimal odds: `product of all leg decimal odds`
- Calculate total payout: `stake × combined_decimal_odds`
- Calculate profit: `total_payout - stake`
- **Only the first leg** records the profit, others get `0`

#### Any Leg Loses
- Entire parlay loses: `profit = -stake`
- **Only the first leg** records the loss, others get `0`

#### Any Leg Void/Push (but none lost)
- Entire parlay pushes: `profit = 0`
- **Only the first leg** records the push, others get `0`

#### Any Leg Pending
- All legs show: `profit = null`

## 📁 Files Created

### Core Logic
- `src/lib/utils/parlay-profit-calculator.ts` - Main calculation logic
- `src/lib/utils/recalculate-parlay-profits.ts` - Database update utilities

### API Endpoints
- `src/app/api/admin/recalculate-parlay-profits/route.ts` - Admin API for recalculation

### Testing
- `scripts/test-parlay-profits.ts` - Test script to validate calculations
- `docs/PARLAY_PROFIT_SYSTEM.md` - This documentation

## 🚀 Usage

### For New Bets
The system automatically calculates correct profits when bets are synced from SharpSports using the updated `calculateProfitLegacy()` function.

### For Existing Data
Use the admin API to recalculate profits for existing parlays:

```bash
# Recalculate all bets
curl -X POST http://localhost:3000/api/admin/recalculate-parlay-profits \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "recalculate_all"}'

# Recalculate specific user
curl -X POST http://localhost:3000/api/admin/recalculate-parlay-profits \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "recalculate_user", "userId": "user-uuid"}'

# Validate calculations
curl -X POST http://localhost:3000/api/admin/recalculate-parlay-profits \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "validate"}'
```

### Programmatic Usage

```typescript
import { calculateBetProfits } from '@/lib/utils/parlay-profit-calculator'

// Prepare bet data
const bets: BetData[] = [
  {
    id: "bet-1",
    parlay_id: "parlay-123",
    status: "won",
    outcome: "win", 
    stake: 100,
    odds: -110,
    is_parlay: true
  },
  {
    id: "bet-2", 
    parlay_id: "parlay-123",
    status: "won",
    outcome: "win",
    stake: 0, // Only first leg has stake
    odds: 150,
    is_parlay: true
  }
]

// Calculate profits
const profits = calculateBetProfits(bets)
console.log(profits) // { "bet-1": 264.49, "bet-2": 0 }
```

## 🧪 Testing

Run the test script to validate calculations:

```bash
cd truesharp
npx ts-node scripts/test-parlay-profits.ts
```

This will run through various parlay scenarios and show expected vs actual results.

## 🔄 Migration Process

1. **Backup your database** before running any recalculation
2. **Test on staging** environment first
3. **Run validation** to check current state
4. **Run recalculation** to fix existing data
5. **Validate again** to confirm fixes

## 📊 Impact on Analytics

With correct parlay profit calculations:
- **ROI calculations** will be more accurate
- **Win/Loss ratios** will reflect actual betting performance  
- **Profit/Loss tracking** will show true financial results
- **Strategy analysis** will be based on real outcomes

## 🎯 Database Schema Requirements

The system expects these columns in the `bets` table:
- `parlay_id` (nullable string) - Groups parlay legs
- `is_parlay` (boolean) - Indicates if bet is part of a parlay
- `status` (string) - Bet status (won, lost, pending, void, etc.)
- `outcome` (string) - Bet outcome (win, loss, void, etc.) 
- `stake` (number) - Amount wagered
- `odds` (number) - American odds format
- `profit` (nullable number) - Calculated profit/loss

## ⚠️ Important Notes

1. **Stake Distribution:** Only the first leg of a parlay should have the full stake amount. Other legs should have stake = 0.

2. **Profit Distribution:** Only the first leg records the actual profit/loss. Other legs get 0 to prevent double-counting.

3. **American Odds:** The system expects American odds format (e.g., -110, +150). Decimal odds are calculated internally.

4. **Order Matters:** The "first leg" is determined by the order bets appear in the input array. Ensure consistent ordering.

5. **Legacy Compatibility:** The `calculateProfitLegacy()` function provides backward compatibility but logs warnings for parlay legs that need full context calculation.

## 🛠️ Future Improvements

- [ ] Add support for decimal odds input
- [ ] Implement tiebreaker rules for complex parlay scenarios
- [ ] Add support for round-robin and teaser bet types
- [ ] Create automated tests for edge cases
- [ ] Add performance monitoring for large recalculations