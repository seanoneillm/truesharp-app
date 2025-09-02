# TrueSharp 🎯

> The only verified sports betting platform with 100% authentic data tracking

## 🚀 Overview

TrueSharp is a comprehensive sports betting platform that automatically syncs with users' sportsbook
accounts to track real betting performance. Users cannot manually enter bets, ensuring 100%
authenticity. The platform enables profitable bettors to monetize their expertise by selling picks
to subscribers, while providing transparent performance tracking and analytics.

## ✨ Key Features

### For All Users (Free Tier)

- **100% Verified Data**: No manual entry = no fake records
- **Basic Analytics**: Essential performance tracking and insights
- **Transparency**: All statistics are verifiable and honest
- **Automatic Sync**: Set-and-forget bet tracking from sportsbooks

### For TrueSharp Pro Subscribers ($19.99/month)

- **Advanced Analytics Engine**: Most comprehensive betting analysis tool available
- **Unlimited Custom Filters**: Analyze performance by any variable imaginable
- **Professional Reports**: Export data, generate insights, track complex patterns
- **Predictive Tools**: Identify trends, optimize bet sizing, manage risk

### For Pick Sellers

- **Monetization**: Turn betting expertise into recurring income
- **Credibility**: Verified track records build trust with buyers
- **Automated System**: Set prices and let the platform handle everything
- **Pro Analytics**: Use advanced tools to improve and showcase performance

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with TypeScript and App Router
- **Styling**: Tailwind CSS with custom design system
- **Database**: PostgreSQL with Supabase
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Analytics**: Recharts for data visualization
- **Testing**: Jest + React Testing Library
- **Deployment**: Vercel

## 🏗️ Project Structure

```
truesharp/
├── src/
│   ├── app/                 # App Router pages
│   │   ├── (auth)/         # Authentication pages
│   │   ├── dashboard/      # Main dashboard
│   │   ├── analytics/      # Analytics pages
│   │   ├── marketplace/    # Pick marketplace
│   │   └── ...
│   ├── components/         # Reusable components
│   │   ├── ui/            # Base UI components
│   │   ├── layout/        # Layout components
│   │   └── features/      # Feature-specific components
│   └── lib/               # Utilities and helpers
│       ├── types.ts       # TypeScript definitions
│       ├── utils.ts       # Utility functions
│       ├── constants.ts   # App constants
│       └── hooks/         # Custom React hooks
├── public/                # Static assets
└── docs/                  # Documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 8+ or yarn
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/truesharp.git
   cd truesharp
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

### Environment Setup

Create a `.env.local` file with the following variables:

```bash
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (Supabase)
DATABASE_URL=your_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Payments (Stripe)
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key

# See .env.example for complete list
```

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## 🧪 Testing

The project uses Jest and React Testing Library for testing:

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📦 Building for Production

1. **Build the application**

   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm run start
   ```

## 🚢 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on every push to main branch

### Manual Deployment

1. Build the application: `npm run build`
2. Deploy the `.next` folder to your hosting provider

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow the existing ESLint and Prettier configuration
- Write tests for new features
- Use conventional commit messages

## 📋 Development Roadmap

### Phase 1: MVP (Weeks 1-3) ✅

- [x] Core UI components and pages
- [x] Mock data integration
- [x] Responsive design
- [x] Basic navigation

### Phase 2: Backend Foundation (Weeks 4-5)

- [ ] Supabase integration
- [ ] User authentication
- [ ] Real data persistence
- [ ] API endpoints

### Phase 3: Core Features (Weeks 6-9)

- [ ] Payment processing
- [ ] Subscription management
- [ ] Seller dashboard
- [ ] Advanced analytics

### Phase 4: Advanced Features (Weeks 10-13)

- [ ] Real-time features
- [ ] Sportsbook integration
- [ ] Admin dashboard
- [ ] Live odds

### Phase 5: Mobile & Scale (Weeks 14-17)

- [ ] React Native mobile app
- [ ] Performance optimization
- [ ] Testing suite
- [ ] Documentation

### Phase 6: Production (Weeks 18-20)

- [ ] Legal compliance
- [ ] Support system
- [ ] Infrastructure deployment
- [ ] Business operations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@truesharp.com
- 📱 Discord: [TrueSharp Community](https://discord.gg/truesharp)
- 📖 Documentation: [docs.truesharp.com](https://docs.truesharp.com)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Supabase for the backend infrastructure
- All the amazing open-source contributors

---

Built with ❤️ by the TrueSharp team
