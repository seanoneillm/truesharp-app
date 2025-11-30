// Unit calculation utilities for analytics display

export interface UnitDisplayOptions {
  showUnits: boolean;
  unitSize: number; // in cents
}

/**
 * Convert dollar amount to units
 * @param dollarAmount Amount in cents (database format)
 * @param unitSize Unit size in cents
 * @returns Number of units
 */
export const convertToUnits = (dollarAmount: number, unitSize: number): number => {
  if (unitSize <= 0) return 0;
  return dollarAmount / unitSize;
};

/**
 * Format currency or units based on display preference
 * @param amount Amount in cents
 * @param options Display options with showUnits and unitSize
 * @returns Formatted string
 */
export const formatCurrencyOrUnits = (amount: number, options: UnitDisplayOptions): string => {
  if (options.showUnits) {
    const units = convertToUnits(amount, options.unitSize);
    const sign = amount >= 0 ? '+' : '';
    return `${sign}${units.toFixed(1)}u`;
  } else {
    // Convert cents to dollars for display
    const dollars = amount / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(dollars);
  }
};

/**
 * Format profit/loss with appropriate sign
 * @param amount Amount in cents
 * @param options Display options
 * @returns Formatted string with + for positive amounts
 */
export const formatProfitLoss = (amount: number, options: UnitDisplayOptions): string => {
  if (options.showUnits) {
    const units = convertToUnits(amount, options.unitSize);
    const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
    return `${sign}${Math.abs(units).toFixed(1)}u`;
  } else {
    const dollars = amount / 100;
    const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(dollars));
    return `${sign}${formatted}`;
  }
};

/**
 * Format stake amounts (always positive)
 * @param amount Amount in cents
 * @param options Display options
 * @returns Formatted string without sign
 */
export const formatStakeAmount = (amount: number, options: UnitDisplayOptions): string => {
  if (options.showUnits) {
    const units = convertToUnits(amount, options.unitSize);
    return `${units.toFixed(1)}u`;
  } else {
    const dollars = amount / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(dollars);
  }
};

/**
 * Format chart data for profit over time
 * @param chartData Array of daily profit data
 * @param options Display options
 * @returns Array with formatted values for charts
 */
export const formatChartData = (chartData: any[], options: UnitDisplayOptions) => {
  return chartData.map(item => ({
    ...item,
    profit: options.showUnits ? convertToUnits(item.profit, options.unitSize) : item.profit / 100,
    cumulativeProfit: options.showUnits 
      ? convertToUnits(item.cumulativeProfit, options.unitSize) 
      : item.cumulativeProfit / 100
  }));
};

/**
 * Get the appropriate label for amounts based on display mode
 * @param options Display options
 * @returns String label for charts/axes
 */
export const getAmountLabel = (options: UnitDisplayOptions): string => {
  return options.showUnits ? 'Units' : 'Dollars ($)';
};

/**
 * Format amount for chart tooltips and labels
 * @param amount Amount in cents or already converted value
 * @param options Display options
 * @param alreadyConverted Whether the amount is already in the correct format
 * @returns Formatted string for display
 */
export const formatChartValue = (
  amount: number, 
  options: UnitDisplayOptions, 
  alreadyConverted = false
): string => {
  if (options.showUnits) {
    if (alreadyConverted) {
      return `${amount.toFixed(1)}u`;
    } else {
      const units = convertToUnits(amount, options.unitSize);
      return `${units.toFixed(1)}u`;
    }
  } else {
    if (alreadyConverted) {
      return `$${amount.toFixed(0)}`;
    } else {
      const dollars = amount / 100;
      return `$${dollars.toFixed(0)}`;
    }
  }
};

/**
 * Convert metrics object for display
 * @param metrics Original metrics with values in cents
 * @param options Display options
 * @returns Metrics object with formatted values
 */
export const convertMetricsForDisplay = (metrics: any, options: UnitDisplayOptions) => {
  if (!options.showUnits) {
    return {
      ...metrics,
      totalProfit: metrics.totalProfit / 100,
      avgStake: metrics.avgStake / 100,
    };
  }
  
  return {
    ...metrics,
    totalProfit: convertToUnits(metrics.totalProfit, options.unitSize),
    avgStake: convertToUnits(metrics.avgStake, options.unitSize),
  };
};