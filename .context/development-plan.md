TrueSharp Complete Software Development Specification Project File Structure Overview truesharp/ ├──
src/ │ ├── app/ # Next.js 14 App Router │ ├── components/ # Reusable React components │ ├── lib/ #
Utilities, hooks, and business logic │ ├── styles/ # Global styles and Tailwind config │ └──
types/ # TypeScript type definitions ├── public/ # Static assets ├── database/ # Database migrations
and functions └── docs/ # Documentation

Table of Contents Authentication System Core Layout & Navigation Dashboard Analytics System Games &
Odds Marketplace & Pick Selling Subscriptions Management Social Feed Seller Dashboard Settings &
Profile Management Sportsbook Integration X Post Image Generator Technical Architecture

Authentication System Sign-Up Page Files: src/app/(auth)/signup/page.tsx - Main signup page
component src/components/auth/signup-form.tsx - Registration form component
src/components/auth/legal-modals.tsx - Privacy/Terms popup modals src/lib/auth/validation.ts - Form
validation logic src/lib/auth/supabase-auth.ts - Supabase authentication functions Visual Elements:
TrueSharp logo CTA statement Professional registration form layout Registration Fields: Email
Address Validates email format Checks for existing accounts Sends verification email via Supabase
Verification link navigates to dashboard Updates authenticated status from "no" to "yes" Error
handling: "Email already exists" message Username 3-20 characters, alphanumeric only Real-time
availability checking Error handling: "Username taken" message Password & Confirm Password Password
strength requirements Confirmation field validation Secure storage via Supabase Auth Legal
Compliance: Privacy Policy & Terms Checkbox Required before registration Clickable links open popup
modals Displays full legal documents Age Verification Checkbox Must confirm 21+ years old Required
for registration completion Registration Process: Form validation and submission UUID generation and
profile creation Session establishment Automatic navigation to dashboard Welcome email sequence
initiation Login Page Files: src/app/(auth)/login/page.tsx - Main login page component
src/components/auth/login-form.tsx - Login form component src/components/auth/password-reset.tsx -
Password reset functionality src/lib/auth/session.ts - Session management utilities Visual Elements:
TrueSharp logo Welcome statement Clean login form Login Process: Email and password verification via
Supabase Session creation and management Automatic dashboard navigation Password reset functionality
"Remember me" option

Core Layout & Navigation Sidebar Navigation Files: src/components/layout/sidebar.tsx - Main sidebar
component src/components/layout/navigation-items.tsx - Navigation menu items
src/components/layout/pro-cta.tsx - Pro subscription call-to-action
src/components/ui/collapsible.tsx - Collapsible behavior component src/lib/navigation/routes.ts -
Route definitions and navigation logic Layout & Behavior: Fixed left-side positioning Collapsible
with toggle button TrueSharp logo and branding at top Persistent across all main pages Navigation
Items: Dashboard - Main user overview Analytics - Performance tracking and insights Games - Live
odds and betting interface Marketplace - Strategy discovery and subscription Monetize - Seller
dashboard and tools Subscriptions - Subscription management Feed - Social community features Pro
Subscription CTA: Bottom sidebar placement $20/month subscription offer Stripe integration for
payments Status update to pro member Navigation to dashboard post-purchase Top Bar Files:
src/components/layout/top-bar.tsx - Main top bar component src/components/layout/search-bar.tsx -
Search functionality src/components/layout/user-profile-menu.tsx - Profile dropdown menu
src/lib/search/seller-search.ts - Seller profile search logic src/components/ui/dropdown.tsx -
Reusable dropdown component Search Functionality: Full-width search bar (between sidebar and
profile) Seller profile search with dropdown results Real-time search suggestions (5 results max)
Profile picture and username display Click-to-navigate functionality User Profile Menu: Profile
picture and username display Dropdown menu with two options: Settings - Account management Help -
Support and documentation Toggle behavior (click to expand/collapse)

Dashboard Files: src/app/dashboard/page.tsx - Main dashboard page src/app/dashboard/loading.tsx -
Dashboard loading state src/components/dashboard/welcome-section.tsx - Welcome card component
src/components/dashboard/todays-bets.tsx - Today's bets display
src/components/dashboard/analytics-preview.tsx - Analytics preview card
src/components/dashboard/seller-preview.tsx - Seller preview card
src/components/dashboard/subscriptions-preview.tsx - Subscriptions preview
src/components/dashboard/marketplace-preview.tsx - Marketplace preview
src/components/dashboard/pro-prompt.tsx - Pro subscription prompt src/lib/dashboard/stats.ts -
Dashboard statistics calculations src/lib/dashboard/revenue-calc.ts - Revenue calculation utilities
Welcome Section Personalized greeting: "Welcome to your user dashboard, [username]" Username pulled
from profiles table Empty state handling for new users Today's Bets Display Logic: Shows all bets
placed today (EST timezone) Real-time status indicators: Pending: Gray background, shows bet amount
Won: Green background, shows profit amount Lost: Red background, shows loss amount Empty state: "No
bets placed today" with Games page link Analytics Preview Card Profit Chart Display: Interactive
profit over time visualization Time period toggles: "This Week | This Month | This Year" Default
view: This Month Color coding: Green line (profitable), Red line (negative) Total profit display
above chart Empty state: "$0.00" for periods with no bets Seller Preview Card Revenue Overview
(Always Visible): Monthly revenue calculation: Query active subscriptions by seller_id Sum pricing
across all frequencies Handle conversions: Weekly × 4.33, Yearly ÷ 12 Total subscriber count across
all strategies Total monetized strategies count Dynamic button text: "Start Selling" (no strategies)
"Seller Dashboard" (has strategies) Subscriptions Preview Card Active Subscriptions Display: Lists
all user's active strategy subscriptions Shows seller username, strategy name, price, frequency
Links to individual strategy performance Empty state: "No active subscriptions" with Marketplace
link Marketplace Preview Card Top 5 performing sellers from leaderboard Performance-based ranking
display Quick access to subscription options Pro Subscription Prompt Conditional display (hidden for
Pro users) Upgrade call-to-action with benefits Direct Stripe integration

Analytics System Files: src/app/analytics/page.tsx - Main analytics page
src/app/analytics/loading.tsx - Analytics loading state
src/components/analytics/analytics-header.tsx - Page header with welcome banner
src/components/analytics/filter-system.tsx - Universal filter component
src/components/analytics/tab-navigation.tsx - Four-tab navigation system
src/components/analytics/overview-tab.tsx - Overview tab content
src/components/analytics/bets-tab.tsx - Bets history tab
src/components/analytics/analytics-tab.tsx - Analytics visualizations tab
src/components/analytics/strategies-tab.tsx - Strategies management tab
src/components/analytics/pro-upgrade-prompt.tsx - Pro tier upgrade prompts
src/lib/analytics/calculations.ts - Analytics calculation functions src/lib/analytics/filters.ts -
Filter logic and validation src/lib/analytics/charts.ts - Chart data processing
src/lib/analytics/strategies.ts - Strategy management logic src/lib/analytics/free-tier-limits.ts -
Free tier restrictions src/lib/analytics/pro-tier-features.ts - Pro tier advanced features
Navigation & Layout Page Structure: Welcome banner with personalized messaging Universal filter
system (persistent across tabs) Four-tab navigation: Overview, Bets, Analytics, Strategies Universal
Filter System Free Tier Filters: Sport Selection: 8 major sports (NFL, NBA, MLB, NHL, Soccer,
Tennis, Golf, MMA) Bet Type: Straight Bets vs Parlays (basic breakdown only) Status Filter: All,
Pending, Won, Lost, Void Time Periods: Preset options only (7 days, 30 days, 3 months, this year,
all time) Sportsbook Filter: Basic connected book filtering Pro Tier Advanced Filters: Unlimited
Sport Categories: 20+ sports including niche markets

Granular Bet Type Analysis:

Point spread ranges (custom ranges) Moneyline by underdog/favorite ranges Totals by score ranges
Player props by stat type and player Game props (quarters, halves, periods) Futures and season-long
bets Live vs pre-game performance Parlay leg analysis Team-Specific Deep Analysis:

Individual team performance tracking Home vs Away splits with contextual data Head-to-head
historical matchups Performance trends and streaks Coaching and personnel impact analysis Temporal
Advanced Filtering:

Custom date ranges (unlimited) Day of week performance patterns Time of day analysis Seasonal trends
and patterns Holiday and special event correlation Line Movement & Value Analysis:

Opening vs closing line performance Line movement direction tracking Steam move identification
Closing Line Value (CLV) analysis Best odds capture vs market average Tab 1: Overview Recent Bets
Section: 10 most recent bets with filter respect Comprehensive bet information display Status
indicators with color coding Empty state handling Enhanced Profit Visualization: Larger version of
dashboard chart Interactive time period selection Filter integration for customized views Trend
analysis with annotations Tab 2: Bets Complete Bet History: All user bets with filter application
Default display: 20 bets with pagination Comprehensive bet details per entry Sort options: Date,
Profit, Amount "Show More" progressive loading Tab 3: Analytics (Pro vs Free) Free Tier Analytics:
Basic performance metrics (Total bets, Win rate, ROI, Net profit) Limited visualizations (6 months
max) Standard chart types only Basic sport breakdowns Pro Tier Advanced Analytics: Key Metrics with
Confidence Intervals:

ROI with statistical significance Expected value vs actual results Closing Line Value comprehensive
tracking Sharp ratio (CLV positive percentage) Variance and volatility analysis Predictive Analytics
Engine:

Performance trend forecasting Seasonal pattern predictions Optimal bet sizing recommendations Kelly
Criterion automated calculations Market inefficiency identification Professional Visualizations:

Interactive line movement charts CLV tracking over time Heat maps for performance analysis
Correlation matrices Multi-variable scatter plots Custom dashboard creation Tab 4: Strategies
Strategy Creation Interface: "Create New Strategy" functionality Filter-based strategy definition
Strategy naming and description Performance tracking integration Existing Strategies Management: All
user strategies display Performance metrics per strategy Filter application and analysis Strategy
modification tools

Games & Odds Files: src/app/games/page.tsx - Main games page src/app/games/loading.tsx - Games
loading state src/components/games/date-selector.tsx - Date selection interface
src/components/games/league-tabs.tsx - League navigation tabs src/components/games/game-card.tsx -
Individual game display src/components/games/odds-display.tsx - Odds buttons and pricing
src/components/games/player-props-tabs.tsx - Player props organization
src/components/games/line-movement-charts.tsx - Line movement visualizations
src/components/games/bet-slip.tsx - Betting slip component src/components/games/parlay-builder.tsx -
Parlay functionality src/lib/games/odds-api.ts - The Odds API integration
src/lib/games/line-movement.ts - Line movement calculations src/lib/games/bet-validation.ts - Bet
placement validation src/lib/games/market-definitions.ts - Sports market definitions
src/lib/games/odds-processing.ts - Odds data processing src/types/games.ts - Games and odds type
definitions Page Navigation Date Selection System: Default: Today's games Calendar picker for any
date selection Quick navigation: "Today", "Tomorrow", "Yesterday" League Organization: Dynamic tabs
based on scheduled games Supported leagues: NFL, NBA, MLB, NHL, College Football, College
Basketball, Champions League, MLS Empty state handling for dates without games Market Structure by
League NFL Markets: Main Lines: Spread, Total, Moneyline Game Props: Quarter/Half betting, Team
totals Player Props Organized by Position: QB Tab: Passing yards, TDs, interceptions, completions RB
Tab: Rushing yards, TDs, attempts, receptions WR Tab: Receiving yards, receptions, TDs, longest
reception K/Defense Tab: Kicking points, field goals, sacks, tackles NBA Markets: Main Lines:
Spread, Total, Moneyline Game Props: Quarter/Half betting, Team total points Player Props by
Category: Scoring Tab: Points, field goals, three-pointers, free throws Rebounding Tab: Total,
offensive, defensive rebounds Playmaking Tab: Assists, turnovers, steals, blocks MLB Markets: Main
Lines: Moneyline, Run Line, Total Runs Game Props: Inning betting, total home runs, team totals
Player Props by Role: Hitters Tab: Hits, home runs, RBIs, runs scored Pitchers Tab: Strikeouts,
walks allowed, innings pitched NHL Markets: Main Lines: Moneyline, Puck Line, Total Goals Game
Props: Period betting, team goal totals Player Props by Position: Skaters Tab: Goals, assists,
points, shots on goal Goalies Tab: Saves, goals against, save percentage Odds Display &
Functionality Game Card Interface: Team names and logos with game information Game time, date, and
status indicators Main lines with best available odds "Player Props" tab expansion Pro vs Free
feature differentiation Line Movement Charts: Three mini-charts per game (Spread, Total, Moneyline)
Free users: Blurred with "Pro Feature" overlay Pro users: Clear historical movement data Real-time
updates and trend indicators Betting Interface Odds Button Functionality: All odds displays as
clickable buttons Click adds bet to slip with complete details Button states: Default, Hover,
Selected Game and market information capture Bet Slip System: Single Bet Display: Team, line, odds,
wager input, payout calculation Parlay Functionality: Multiple games only (same-game restriction)
Odds multiplication and payout display Individual bet removal options "Clear All" functionality Bet
Placement Logic: User wager amount input Bet creation and storage Manual bet source identification
Success confirmation and slip clearing Odds Management System Automatic Data Fetching: Morning fetch
(4:00 AM EST): Opening odds storage Afternoon fetch (12:00 PM EST): Current odds updates Real-time
processing and validation Historical data preservation Line Movement Calculation: Opening vs current
odds comparison Movement indicators (+/- point displays) Color coding for favorable/unfavorable
movement Chart data point creation

Marketplace & Pick Selling Files: src/app/marketplace/page.tsx - Main marketplace page
src/app/marketplace/loading.tsx - Marketplace loading state
src/app/marketplace/[username]/page.tsx - Individual seller profile pages
src/components/marketplace/search-filters.tsx - Search and filter interface
src/components/marketplace/seller-grid.tsx - Seller display grid
src/components/marketplace/seller-card.tsx - Individual seller preview cards
src/components/marketplace/seller-profile.tsx - Complete seller profile display
src/components/marketplace/subscription-modal.tsx - Subscription purchase modal
src/components/marketplace/leaderboard.tsx - Performance leaderboard
src/components/marketplace/verification-badges.tsx - Seller verification display
src/lib/marketplace/leaderboard-algorithm.ts - Ranking calculation logic
src/lib/marketplace/search.ts - Search and filtering functions
src/lib/marketplace/subscription-flow.ts - Subscription purchase logic
src/lib/marketplace/seller-verification.ts - Verification system logic
src/lib/payments/stripe-integration.ts - Stripe payment processing src/types/marketplace.ts -
Marketplace type definitions Marketplace Discovery Search & Filter Interface: Username search
functionality League-specific filtering Performance-based categorization Results counter and
pagination Seller Display System: Grid layout with seller preview cards Performance metrics and
verification status Subscription pricing and options Quick subscription access Leaderboard Algorithm
Ranking Factors (Weighted Scoring): ROI Performance (40% weight): Normalized scoring with outlier
caps Win Rate Consistency (25% weight): Sustainable performance tracking Volume Reliability (20%
weight): Minimum bet requirements (100+ for full points) Strategy Maturity (10% weight): Time-based
credibility (90+ days for full points) Recent Activity (5% weight): Active engagement rewards
Composite Scoring: Combined factor calculation Top 50 strategy display Dynamic ranking updates
Performance-based verification Subscription Flow Purchase Process: Subscription button interaction
Existing subscription verification Strategy details and pricing modal Stripe payment integration
Subscription activation and confirmation Payment Integration: Stripe Checkout implementation
Multiple billing frequency options Automatic subscription management Success/failure handling Seller
Verification System Two-Tier Structure: Unverified Sellers: Immediate access, building track record
Verified Sellers: 30+ days consistent tracking, leaderboard eligible Verification Benefits: Enhanced
marketplace visibility Premium pricing capabilities ($150/month max vs $25/month) Leaderboard
participation Trust badge display

Subscriptions Management Files: src/app/subscriptions/page.tsx - Main subscriptions page
src/app/subscriptions/loading.tsx - Subscriptions loading state
src/app/subscriptions/billing/page.tsx - Billing management page
src/components/subscriptions/monthly-summary.tsx - Summary cards component
src/components/subscriptions/active-subscriptions.tsx - Active subscriptions list
src/components/subscriptions/subscription-card.tsx - Individual subscription display
src/components/subscriptions/pick-feed.tsx - Subscriber pick feed
src/components/subscriptions/copy-bet-button.tsx - Copy bet functionality
src/components/subscriptions/performance-tracking.tsx - ROI and performance metrics
src/components/subscriptions/billing-history.tsx - Payment history display
src/lib/subscriptions/copy-bet-detection.ts - Copy bet matching algorithm
src/lib/subscriptions/performance-calc.ts - Subscription performance calculations
src/lib/subscriptions/billing.ts - Billing and payment management
src/lib/subscriptions/roi-analysis.ts - ROI calculation and analysis src/types/subscriptions.ts -
Subscription type definitions Subscription Overview Monthly Summary Cards: Total monthly cost
calculation across all subscriptions Subscribed bets count for current month Return on investment
analysis (profit vs cost) Color-coded performance indicators Active Subscriptions Interface
Subscription Management: Individual subscription cards with complete details Strategy performance
metrics and ROI tracking Billing information and next payment dates Cancellation and modification
options Copy Bet Detection System Matching Algorithm: Same sport, game, and bet type verification
Line/odds variance tolerance (±0.5 points, ±10 odds) Timestamp verification (user bet after seller)
Automatic copy bet flagging and tracking Performance Tracking: Copy bet exclusion from personal
monetization Individual strategy ROI calculation Subscription value analysis Win rate tracking on
copied vs original bets Billing Management Payment history access Receipt downloads Payment method
updates Stripe customer portal integration

Social Feed Files: src/app/feed/page.tsx - Main social feed page src/app/feed/loading.tsx - Feed
loading state src/components/feed/feed-header.tsx - Feed header with creation button
src/components/feed/post-creation-modal.tsx - Post creation interface
src/components/feed/feed-tabs.tsx - Public/Subscriptions tab navigation
src/components/feed/post-card.tsx - Individual post display
src/components/feed/infinite-scroll.tsx - Infinite scroll loading
src/components/feed/image-upload.tsx - Photo upload functionality src/lib/feed/post-creation.ts -
Post creation and validation logic src/lib/feed/image-processing.ts - Image upload and processing
src/lib/feed/feed-algorithm.ts - Feed sorting and filtering src/lib/feed/content-moderation.ts -
Content validation and moderation src/types/feed.ts - Social feed type definitions Feed Interface
Header & Creation: "Community Feed" title with creation button Post creation modal with character
limits (500 max) Photo upload support (JPG, PNG, GIF, 5MB max) User profile integration Feed
Filtering System Tab Navigation: Public Tab: All user posts in chronological order Subscriptions
Tab: Posts from subscribed sellers only Real-time feed updates and infinite scroll loading Post
Display & Interaction Post Card Design: User profile integration (picture, username, timestamp)
Content display (text and/or image) Clean, minimal design with post separation Engagement
placeholders for future features Content Management: Post creation and validation Image processing
and storage Real-time feed updates Error handling and retry logic

Seller Dashboard Files: src/app/sell/page.tsx - Main seller dashboard page
src/app/sell/loading.tsx - Seller dashboard loading state src/app/sell/setup/page.tsx - Seller
onboarding flow src/components/sell/revenue-overview.tsx - Revenue analytics cards
src/components/sell/revenue-charts.tsx - Revenue and subscriber visualization
src/components/sell/strategy-management.tsx - Strategy cards and management
src/components/sell/strategy-card.tsx - Individual strategy display
src/components/sell/pricing-modal.tsx - Strategy pricing editor
src/components/sell/open-bets-section.tsx - Pending bets display
src/components/sell/add-to-strategy-modal.tsx - Strategy assignment interface
src/components/sell/bulk-assignment.tsx - Bulk bet assignment
src/components/sell/pick-distribution.tsx - Subscriber pick distribution
src/components/sell/seller-analytics.tsx - Seller performance analytics
src/lib/sell/revenue-calculations.ts - Revenue calculation logic
src/lib/sell/strategy-validation.ts - Strategy filter validation src/lib/sell/pick-management.ts -
Pick posting and distribution src/lib/sell/subscriber-management.ts - Subscriber relationship
management src/lib/payments/stripe-connect.ts - Stripe Connect integration src/types/seller.ts -
Seller dashboard type definitions Revenue Analytics Overview Cards: Total monthly revenue across all
strategies Subscriber count aggregation Monetized strategies count All-time earnings tracking
(post-TrueSharp fees) Revenue Visualization: Combined revenue and subscriber charts Dual-axis
display (revenue $ and subscriber count) Time period filtering (30 days, 3 months, 6 months, all
time) Strategy-specific breakdowns Strategy Management Strategy Cards: Individual strategy
performance display Subscriber count and monthly revenue per strategy Monetization toggle (On/Off)
Mini growth charts (last 30 days) Pricing editor access Pricing Management Modal: Strategy details
header Monetization enable/disable toggle Multiple billing frequency options (weekly, monthly,
yearly) Revenue projection calculator TrueSharp fee transparency (18% total: 15% platform + 3%
Stripe) Seller Tools & Analytics Performance Tracking: Individual strategy analytics Subscriber
acquisition and retention Revenue per subscriber analysis Growth insights and recommendations
Content Management: Pick posting interface Subscriber communication tools Performance highlights
sharing Social media integration Pick Management System Open Bets Interface: Display all pending
bets "Add to Strategy" functionality per bet Strategy selection modal with validation Bulk bet
assignment options Strategy Assignment Process: User selects "Add to Strategy" on pending bet Modal
displays all monetized strategies Strategy filter validation against bet parameters Successful
assignment or error messaging Bet distribution to subscribers Validation Logic: Sport matching
verification Team filter compliance (if applicable) Bet type compatibility checking Odds range
validation Bet amount range verification Subscriber Distribution Pick Feed System: Automatic pick
distribution to strategy subscribers Real-time pick status updates Performance tracking per strategy
Subscriber engagement metrics Copy Bet Functionality: "Copy Bet" buttons on subscriber picks
Pre-filled bet slip integration Copy bet flagging for analytics Performance tracking separation

Settings & Profile Management Files: src/app/settings/page.tsx - Main settings page
src/app/settings/layout.tsx - Settings layout wrapper src/app/settings/profile/page.tsx - Profile
information settings src/app/settings/account/page.tsx - Account security settings
src/app/settings/billing/page.tsx - Billing and subscription settings
src/app/settings/seller/page.tsx - Seller-specific settings src/app/settings/privacy/page.tsx -
Privacy and data settings src/components/settings/settings-navigation.tsx - Settings page navigation
src/components/settings/profile-form.tsx - Profile editing form
src/components/settings/password-change-modal.tsx - Password change interface
src/components/settings/image-upload.tsx - Profile picture upload
src/components/settings/billing-portal.tsx - Stripe billing portal integration
src/components/settings/seller-settings.tsx - Seller configuration options
src/components/settings/public-profile-settings.tsx - Public profile management
src/components/settings/privacy-controls.tsx - Privacy and data controls
src/components/settings/danger-zone.tsx - Account deletion interface
src/lib/settings/profile-validation.ts - Profile form validation
src/lib/settings/image-processing.ts - Profile image processing src/lib/settings/data-export.ts -
User data export functionality src/types/settings.ts - Settings type definitions Profile Information
Section Basic Information Management: Profile picture upload and management (JPG/PNG, 5MB max)
Username editing with availability checking (3-20 characters, alphanumeric) Display name
customization Bio/description editing (500 character limit) Email display (read-only for security)
Save Functionality: Individual section saving (not one large form) Real-time validation feedback
Success/error notification system Unsaved changes warning Account Security Password Management:
"Change Password" modal interface Current password verification New password strength requirements
Secure Supabase Auth integration Security Features: Two-factor authentication setup (future feature)
Active sessions management "Sign out all devices" functionality Security audit logging Subscription
Management TrueSharp Pro Status: Current subscription status display (Free/Pro) Billing date and
cancellation options (Pro users) Upgrade interface with benefits (Free users) Stripe customer portal
integration Billing Information: "Manage Billing" Stripe portal access Payment method on file
display Billing history and receipt access Subscription modification options Seller Settings Seller
Status Management: Seller enablement status display "Become a Seller" onboarding (non-sellers)
"Seller Dashboard" quick access (sellers) Seller verification status Public Profile Settings
(Sellers Only): "Make profile public" toggle Public URL display: truesharp.io/subscribe/[username]
"Copy Link" functionality Social media sharing integration Payout Information: Connected bank
account status Stripe Connect portal access Tax information management Payout frequency settings
Privacy & Preferences Data Controls: "Download my data" export functionality "Request account
deletion" with confirmation Data retention policy explanation Privacy settings management
Notification Preferences: Subscription update toggles New follower notifications Weekly performance
summary options Marketing email preferences Display Preferences: Theme selection (Light/Dark mode)
Timezone configuration Currency preference (USD default) Interface customization options Connected
Accounts (Future Feature) Sportsbook Connections: Connected sportsbook list and status "Add
Sportsbook" and removal options Connection health monitoring Sync frequency preferences Danger Zone
Account Deletion: "Delete Account" button with warning styling Confirmation modal with consequences
explanation Password confirmation requirement Data retention policy disclosure

Sportsbook Integration Files: src/components/analytics/sync-bets-button.tsx - Sync button on
analytics page src/components/sportsbook/connection-modal.tsx - Sportsbook selection modal
src/components/sportsbook/connection-status.tsx - Connected accounts display
src/components/sportsbook/sync-progress.tsx - Sync progress indicators
src/components/sportsbook/bankroll-tracking.tsx - Bankroll overview display
src/lib/sportsbook/sharpsports-api.ts - SharpSports API integration src/lib/sportsbook/bet-sync.ts -
Bet synchronization logic src/lib/sportsbook/data-validation.ts - Bet data validation and processing
src/lib/sportsbook/duplicate-detection.ts - Duplicate bet handling
src/lib/sportsbook/error-handling.ts - Sync error management src/lib/sportsbook/bankroll-calc.ts -
Bankroll calculation utilities src/types/sportsbook.ts - Sportsbook integration type definitions
Sync Bets Feature Interface Location: "Sync Bets" button on Analytics page (bottom right) Sync icon
with loading state support Success/error notifications Last sync timestamp display Connection Flow
Sportsbook Selection: Modal with available sportsbooks (DraftKings, FanDuel, BetMGM, Caesars, ESPN
BET, BetRivers, Fanatics) Connection status indicators "Connected" or "Connect" button states
SharpSports API integration Authentication Process: Redirect to SharpSports secure interface User
credential entry through SharpSports Authentication token and data return TrueSharp account linking
Data Synchronization Bet Processing: Historical bet fetching via SharpSports API Data validation and
duplicate detection Bet information mapping and storage Progress indication during sync Sync Types:
Initial Sync: Complete historical data import Incremental Sync: New bets since last sync Manual
Sync: User-triggered refresh Scheduled Sync: Automatic daily sync (user preference) Connected
Accounts Display Analytics Page Integration: "Connected Accounts" section Sportsbook logos and
connection status Last sync timestamps Manual sync buttons per sportsbook Disconnect functionality
Bankroll Tracking: Combined balance across all sportsbooks Available vs pending bet balances Recent
deposits/withdrawals tracking Bankroll change visualization Error Handling & Security Error
Management: Authentication failure messaging API timeout handling Network error recovery Partial
sync failure reporting Security Measures: No credential storage in TrueSharp SharpSports handles all
sensitive authentication Encrypted API communication User-controlled disconnection

X Post Image Generator Files: src/components/sell/post-to-x-button.tsx - "Post to X" button on
strategy cards src/components/x-post/image-generation-modal.tsx - Main modal component
src/components/x-post/bet-selection-interface.tsx - Bet selection with checkboxes
src/components/x-post/preview-toggle.tsx - Preview mode toggle switch
src/components/x-post/live-preview.tsx - Real-time image preview
src/components/x-post/image-canvas.tsx - HTML canvas image generation
src/components/x-post/template-selector.tsx - Design template options
src/lib/x-post/image-generation.ts - Core image generation logic src/lib/x-post/canvas-drawing.ts -
Canvas drawing and styling functions src/lib/x-post/bet-formatting.ts - Bet data formatting for
display src/lib/x-post/template-configs.ts - Template design configurations
src/lib/x-post/validation.ts - Selection and generation validation src/types/x-post.ts - X post
image type definitions Strategy Card Integration "Post to X" Button: Added to each strategy card in
seller dashboard Visible only for strategies with posted picks Twitter blue styling with X logo icon
Opens "Create X Post Image" modal Image Creation Modal Modal Structure: Header: Strategy name,
subscriber count, performance summary Bet Selection: Last 30 days picks with checkbox selection
(max 10) Preview Toggle: "Preview Mode" to hide/show bet details Live Preview: Real-time image
preview (1200x675px Twitter optimal) Creation Controls: Generate and download functionality Bet
Selection Interface Available Picks Display: All strategy bets from last 30 days Checkbox selection
with 10-bet maximum Bet information: description, odds, date, status, results "Select All" checkbox
with limit enforcement Selection counter: "X of 10 bets selected" Preview Mode System Full Details
Mode (Default): Complete bet information display Team matchups, lines, odds, units Result indicators
with profit/loss Professional strategy presentation Preview Mode (Toggle On): Bet details
hidden/blurred Units-only display "🔒 Premium Pick" placeholders Teaser format to encourage
subscriptions Image Generation Design Specifications: Layout: TrueSharp logo, strategy header, bet
list, call-to-action footer Styling: Brand colors (blue/white), professional typography Dimensions:
1200x675px (Twitter optimal) Visual Elements: Status indicators, alternating row colors, blur
effects Generation Process: HTML Canvas creation with specifications Text, color, and layout
rendering Blur effect application (preview mode) PNG conversion and download trigger Filename:
${strategyName}_${currentDate}\_picks.png Success & Error Handling Success Feedback: "Image created
and downloaded!" message "Create Another" button for different selections "Copy Image" clipboard
functionality "Close" modal option Error Management: No bets selected: "Please select at least 1
bet" Too many bets: "Maximum 10 bets allowed" No recent picks: "No picks available for this
strategy" Generation failure: "Failed to create image. Please try again." Additional Features
Template Options: Professional template (default) Minimal template (clean, simple) Bold template
(eye-catching colors) Template selector in modal header Customization Options: Unit size setting
adjustment Time period filter (7, 30 days, custom range) Performance callout highlights Social media
optimization

Technical Architecture Files: src/lib/config/supabase.ts - Supabase client configuration
src/lib/config/stripe.ts - Stripe configuration and keys src/lib/config/env.ts - Environment
variables management src/middleware.ts - Next.js middleware for auth and routing
src/lib/auth/middleware.ts - Authentication middleware src/lib/api/client.ts - API client
configuration src/lib/hooks/use-auth.ts - Authentication React hook
src/lib/hooks/use-subscription.ts - Subscription management hook src/lib/hooks/use-analytics.ts -
Analytics data hook src/lib/utils/calculations.ts - Common calculation utilities
src/lib/utils/formatters.ts - Data formatting utilities src/lib/utils/validators.ts - Validation
helper functions src/lib/utils/constants.ts - Application constants src/types/index.ts - Main type
definitions export src/types/api.ts - API response type definitions src/types/database.ts - Database
entity type definitions tailwind.config.js - Tailwind CSS configuration next.config.js - Next.js
configuration package.json - Dependencies and scripts tsconfig.json - TypeScript configuration
.env.local - Environment variables .env.example - Environment variables template Technology Stack
Frontend Framework: Next.js 14 with TypeScript Tailwind CSS for styling Lucide React for icons
Recharts for data visualization Backend Services: Supabase for database and authentication Stripe
for payment processing SharpSports API for sportsbook integration The Odds API for live odds data
Deployment & Infrastructure: Vercel for hosting and deployment CDN integration for performance
Real-time data synchronization Scalable architecture design Data Management User Data: Profile
management and authentication Subscription tracking and billing Performance analytics and history
Social interaction data Betting Data: Manual bet entry and tracking Sportsbook synchronization Odds
data and line movement Strategy performance metrics Financial Data: Subscription revenue tracking
Seller payout management Commission calculation (18% total) Tax document generation Security &
Compliance Data Protection: End-to-end encryption for sensitive data SOC 2 Type II compliance
preparation PCI DSS compliance for payments GDPR compliance for EU users Legal Framework: Terms of
Service and Privacy Policy Age verification (21+) Responsible gambling measures State-by-state
compliance monitoring
