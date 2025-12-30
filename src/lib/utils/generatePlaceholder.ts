/**
 * Generate a data URL for a placeholder image
 */
export function generatePlaceholder(width: number = 375, height: number = 812, text: string = 'Screenshot Coming Soon'): string {
  // Create a simple SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <rect x="20" y="40" width="${width - 40}" height="${height - 80}" rx="25" fill="rgba(0,0,0,0.1)"/>
      <rect x="30" y="50" width="${width - 60}" height="${height - 100}" rx="20" fill="white"/>
      <text x="50%" y="40%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="18" font-weight="600" fill="#374151">
        ${text}
      </text>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="14" fill="#6b7280">
        Add your app screenshot
      </text>
      <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="14" fill="#6b7280">
        to see it here
      </text>
      <rect x="40%" y="65%" width="20%" height="8%" rx="15" fill="#3b82f6"/>
      <text x="50%" y="69%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="12" font-weight="600" fill="white">
        TrueSharp
      </text>
    </svg>
  `
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

/**
 * Predefined placeholder images for different features
 */
export const placeholders = {
  analytics: generatePlaceholder(375, 812, 'Analytics Dashboard'),
  calendar: generatePlaceholder(375, 812, 'Calendar Analytics'),
  games: generatePlaceholder(375, 812, 'Games & Research'),
  marketplace: generatePlaceholder(375, 812, 'Strategy Marketplace'),
  seller: generatePlaceholder(375, 812, 'Seller Dashboard'),
  sync: generatePlaceholder(375, 812, 'Sportsbook Sync'),
  betslip: generatePlaceholder(375, 812, 'Mock Betslip'),
  research: generatePlaceholder(375, 812, 'Odds Research')
}