# Enhanced Admin Overview Components

This directory contains the enhanced overview tab components for the TrueSharp admin dashboard.

## Components

### `EnhancedOverviewTab`
The main overview tab component that displays comprehensive business metrics from the profiles table.

**Features:**
- Real-time business metrics dashboard
- Growth trend analysis with period-over-period comparisons
- Business health indicators with visual status
- Automatic refresh every 5 minutes
- Responsive design for mobile and desktop
- Interactive time period selection (7d, 30d, 90d, YTD)

### `MetricCard`
Reusable metric display card with trend indicators.

**Props:**
- `title`: Metric name
- `value`: Current metric value
- `subtitle`: Additional context
- `trend`: Growth trend data with direction
- `icon`: Lucide React icon
- `status`: Visual status indicator

### `GrowthChart`
Responsive area chart for displaying growth data over time.

**Props:**
- `title`: Chart title
- `data`: Time series data
- `dataKey`: 'count' (daily) or 'cumulative'
- `color`: Chart color theme
- `height`: Chart height in pixels

### `BusinessHealthPanel`
Business health indicators with progress bars and status indicators.

**Metrics Tracked:**
- Seller conversion rate (users → sellers)
- Seller verification rate 
- Pro upgrade conversion rate
- Payment integration rate

## API Endpoint

### `/api/admin/overview-enhanced`
Provides all business metrics derived from the profiles table.

**Query Parameters:**
- `timeframe`: '7d' | '30d' | '90d' | 'ytd'

**Response Data:**
```typescript
{
  totalUsers: number
  totalSellers: number  
  verifiedSellers: number
  proUsers: number
  usersWithStripeAccounts: number
  // ... additional metrics
  userGrowthData: Array<{date: string, count: number, cumulative: number}>
  // ... additional growth data
}
```

## Business Metrics Explained

### Core Metrics
- **Total Users**: All registered users in the system
- **Active Sellers**: Users with `is_seller = true`
- **Verified Sellers**: Users with `is_verified_seller = true`
- **Pro Users**: Users with `pro = 'yes'`

### Conversion Rates
- **Seller Conversion**: % of users who become sellers
- **Verification Rate**: % of sellers who get verified
- **Pro Conversion**: % of users who upgrade to Pro
- **Stripe Integration**: % of users with payment setup

### Growth Analysis
- Tracks daily new user signups
- Calculates cumulative growth over time
- Shows period-over-period trends
- Provides growth rate indicators

## Usage

```tsx
import { EnhancedOverviewTab } from '@/components/admin/overview'

function AdminPage() {
  return (
    <TabsContent value="overview">
      <EnhancedOverviewTab />
    </TabsContent>
  )
}
```

## Testing

Test the API endpoint: `/api/test-enhanced-overview`

This will verify the enhanced overview API is working and return sample data.