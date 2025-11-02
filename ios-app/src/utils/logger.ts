/**
 * Production-safe logging utility for TrueSharp iOS app
 * Debug/info logs only run in development, errors always log
 */

export const logger = {
  /**
   * Debug logging - only in development
   */
  debug: (message: string, ...args: any[]) => {
    // Debug logging removed for production
  },

  /**
   * Info logging - only in development
   */
  info: (message: string, ...args: any[]) => {
    // Info logging removed for production
  },

  /**
   * Warning logging - only in development
   */
  warn: (message: string, ...args: any[]) => {
    // Warning logging removed for production
  },

  /**
   * Error logging - ALWAYS active in production
   */
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
  }
};

export default logger;