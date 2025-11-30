/**
 * Production-safe logging utility for TrueSharp iOS app
 * Debug/info logs only run in development, errors always log
 */

export const logger = {
  /**
   * Debug logging - disabled in production
   */
  debug: (message: string, ...args: any[]) => {
    // No logging in production
  },

  /**
   * Info logging - disabled in production
   */
  info: (message: string, ...args: any[]) => {
    // No logging in production
  },

  /**
   * Warning logging - disabled in production
   */
  warn: (message: string, ...args: any[]) => {
    // No logging in production
  },

  /**
   * Error logging - disabled in production
   */
  error: (message: string, error?: any) => {
    // No logging in production
  }
};

export default logger;