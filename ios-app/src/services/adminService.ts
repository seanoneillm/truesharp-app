import { AuthUser } from '../lib/auth';

// Hardcoded admin user IDs for security - matches web app exactly
const ADMIN_USER_IDS = [
  '28991397-dae7-42e8-a822-0dffc6ff49b7',
  '0e16e4f5-f206-4e62-8282-4188ff8af48a',
  'dfd44121-8e88-4c83-ad95-9fb8a4224908',
];

/**
 * Admin service for secure admin access validation
 * This service provides functionality to check if a user has admin permissions
 * and should be used consistently across the app for admin-related features.
 */
export const adminService = {
  /**
   * Check if a user has admin access
   * @param user - The authenticated user object
   * @returns boolean indicating if user is an admin
   */
  isAdmin(user: AuthUser | null): boolean {
    if (!user?.id) {
      return false;
    }
    
    return ADMIN_USER_IDS.includes(user.id);
  },

  /**
   * Get admin user IDs (for reference only - should not be used for validation)
   * @returns Array of admin user IDs
   */
  getAdminUserIds(): string[] {
    return [...ADMIN_USER_IDS]; // Return a copy to prevent modification
  },

  /**
   * Validate admin access with additional security checks
   * This can be extended with additional validation like session checks, etc.
   * @param user - The authenticated user object
   * @returns Promise<boolean> indicating if user has valid admin access
   */
  async validateAdminAccess(user: AuthUser | null): Promise<boolean> {
    if (!user?.id) {
      return false;
    }

    // Primary check - user ID must be in admin list
    if (!this.isAdmin(user)) {
      return false;
    }

    // Additional security checks can be added here:
    // - Verify user session is still valid
    // - Check for account status
    // - Verify email is confirmed
    // - Check for any admin-specific flags

    return true;
  },
};