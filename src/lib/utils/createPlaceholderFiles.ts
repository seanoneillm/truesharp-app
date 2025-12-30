import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const createPlaceholderSVG = (width: number, height: number, title: string, subtitle: string) => `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)"/>
  <rect x="20" y="50" width="${width - 40}" height="${height - 100}" rx="25" fill="rgba(0,0,0,0.1)"/>
  <rect x="30" y="60" width="${width - 60}" height="${height - 120}" rx="20" fill="white"/>
  
  <!-- Header -->
  <rect x="40" y="70" width="50" height="30" rx="5" fill="#3b82f6"/>
  <text x="65" y="88" text-anchor="middle" font-family="system-ui" font-size="12" font-weight="600" fill="white">TS</text>
  
  <!-- Title -->
  <text x="50%" y="140" text-anchor="middle" font-family="system-ui" font-size="16" font-weight="700" fill="#374151">${title}</text>
  <text x="50%" y="160" text-anchor="middle" font-family="system-ui" font-size="12" fill="#6b7280">${subtitle}</text>
  
  <!-- Mock UI Elements -->
  <rect x="50" y="180" width="${width - 100}" height="8" rx="4" fill="#e5e7eb"/>
  <rect x="50" y="180" width="${(width - 100) * 0.7}" height="8" rx="4" fill="#3b82f6"/>
  
  <rect x="50" y="200" width="${(width - 100) * 0.3}" height="60" rx="8" fill="#f3f4f6"/>
  <rect x="${50 + (width - 100) * 0.35}" y="200" width="${(width - 100) * 0.3}" height="60" rx="8" fill="#f3f4f6"/>
  <rect x="${50 + (width - 100) * 0.7}" y="200" width="${(width - 100) * 0.3}" height="60" rx="8" fill="#f3f4f6"/>
  
  <!-- Chart mock -->
  <rect x="50" y="280" width="${width - 100}" height="120" rx="8" fill="#f9fafb" stroke="#e5e7eb" stroke-width="1"/>
  <polyline points="60,350 80,330 100,340 120,320 140,310 160,300" fill="none" stroke="#3b82f6" stroke-width="2"/>
  
  <!-- Footer -->
  <text x="50%" y="${height - 40}" text-anchor="middle" font-family="system-ui" font-size="10" fill="#9ca3af">Add your app screenshot</text>
</svg>
`

const placeholders = [
  { name: 'analytics-dashboard.svg', title: 'Analytics', subtitle: 'Performance Dashboard' },
  { name: 'calendar-analytics.svg', title: 'Calendar', subtitle: 'Betting History' },
  { name: 'games-screen.svg', title: 'Games', subtitle: 'Odds & Research' },
  { name: 'marketplace.svg', title: 'Marketplace', subtitle: 'Top Strategies' },
  { name: 'seller-dashboard.svg', title: 'Seller', subtitle: 'Monetize Picks' }
]

const featurePlaceholders = [
  { name: 'analytics-preview.svg', title: 'Analytics', subtitle: 'Detailed Metrics' },
  { name: 'sharpsports-sync.svg', title: 'SharpSports', subtitle: 'Sync Integration' },
  { name: 'strategy-details.svg', title: 'Strategy', subtitle: 'Performance Details' },
  { name: 'mock-betslip.svg', title: 'Mock Betting', subtitle: 'Risk-Free Testing' },
  { name: 'odds-research.svg', title: 'Odds Research', subtitle: 'Line Movement' }
]

// Create app screenshots
const appDir = join(process.cwd(), 'public/images/app-screenshots')
try {
  mkdirSync(appDir, { recursive: true })
} catch (e) {}

placeholders.forEach(placeholder => {
  const svg = createPlaceholderSVG(375, 812, placeholder.title, placeholder.subtitle)
  writeFileSync(join(appDir, placeholder.name), svg)
})

// Create feature screenshots  
const featureDir = join(process.cwd(), 'public/images/feature-screenshots')
try {
  mkdirSync(featureDir, { recursive: true })
} catch (e) {}

featurePlaceholders.forEach(placeholder => {
  const svg = createPlaceholderSVG(375, 812, placeholder.title, placeholder.subtitle)
  writeFileSync(join(featureDir, placeholder.name), svg)
})

console.log('Placeholder images created successfully!')