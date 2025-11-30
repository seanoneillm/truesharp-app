/**
 * Utility functions for calculating bankroll from bettor accounts
 */

export interface BettorAccount {
  id: string;
  bettor_id: string;
  sharpsports_account_id: string;
  book_id: string;
  book_name: string;
  book_abbr?: string;
  region_name?: string;
  region_abbr?: string;
  verified?: boolean;
  access?: boolean;
  paused?: boolean;
  balance?: number | null;
  latest_refresh_status?: number;
  latest_refresh_time?: string;
  created_at?: string;
  user_id?: string;
}

/**
 * Calculate total bankroll from bettor accounts
 * Sums all account balances, but for accounts with the same book_name,
 * only counts the highest balance to avoid duplicates from multiple states
 * @param accounts Array of bettor account data
 * @returns Total bankroll in dollars
 */
export function calculateBankroll(accounts: BettorAccount[]): number {
  if (!accounts || accounts.length === 0) {
    return 0;
  }

  // Group accounts by book_name and find the highest balance for each book
  const bookBalances = new Map<string, number>();

  accounts.forEach(account => {
    const balance = account.balance || 0;
    const bookName = account.book_name;

    if (!bookName) return;

    // If we haven't seen this book before, or this balance is higher, update it
    const currentHighest = bookBalances.get(bookName) || 0;
    if (balance > currentHighest) {
      bookBalances.set(bookName, balance);
    }
  });

  // Sum all the highest balances and convert from cents to dollars
  const totalCents = Array.from(bookBalances.values()).reduce((sum, balance) => sum + balance, 0);
  
  return totalCents / 100; // Convert from cents to dollars
}

/**
 * Format bankroll amount for display
 * @param bankroll Bankroll amount in dollars
 * @returns Formatted bankroll string (e.g., "$1,234.56")
 */
export function formatBankroll(bankroll: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(bankroll);
}

/**
 * Get bankroll summary information
 * @param accounts Array of bettor account data
 * @returns Object with bankroll amount, account count, and book count
 */
export function getBankrollSummary(accounts: BettorAccount[]): {
  totalBankroll: number;
  formattedBankroll: string;
  accountCount: number;
  bookCount: number;
  bookBreakdown: { bookName: string; balance: number; formattedBalance: string; accountCount: number }[];
} {
  if (!accounts || accounts.length === 0) {
    return {
      totalBankroll: 0,
      formattedBankroll: formatBankroll(0),
      accountCount: 0,
      bookCount: 0,
      bookBreakdown: [],
    };
  }

  // Group accounts by book_name to get breakdown and counts
  const bookGroups = new Map<string, BettorAccount[]>();
  
  accounts.forEach(account => {
    const bookName = account.book_name;
    if (!bookName) return;
    
    if (!bookGroups.has(bookName)) {
      bookGroups.set(bookName, []);
    }
    bookGroups.get(bookName)!.push(account);
  });

  // Calculate breakdown for each book
  const bookBreakdown = Array.from(bookGroups.entries()).map(([bookName, bookAccounts]) => {
    const balances = bookAccounts.map(acc => acc.balance || 0);
    const highestBalance = Math.max(...balances);
    
    return {
      bookName,
      balance: highestBalance / 100, // Convert to dollars
      formattedBalance: formatBankroll(highestBalance / 100),
      accountCount: bookAccounts.length,
    };
  });

  const totalBankroll = calculateBankroll(accounts);

  return {
    totalBankroll,
    formattedBankroll: formatBankroll(totalBankroll),
    accountCount: accounts.length,
    bookCount: bookGroups.size,
    bookBreakdown: bookBreakdown.sort((a, b) => b.balance - a.balance), // Sort by balance descending
  };
}