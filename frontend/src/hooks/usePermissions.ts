import { useAuthStore } from '../store/auth.store';
import { hasFeatureAccess, Feature } from '../utils/permissions';

/**
 * Custom hook for checking user permissions
 * 
 * @returns Object with canAccess function to check feature access
 * 
 * @example
 * const { canAccess } = usePermissions();
 * if (canAccess('dashboard')) {
 *   // Show dashboard link
 * }
 */
export const usePermissions = () => {
  const user = useAuthStore((state) => state.user);
  
  /**
   * Check if the current user can access a specific feature
   * @param feature - The feature to check access for
   * @returns true if the user has access, false otherwise
   */
  const canAccess = (feature: Feature): boolean => {
    return hasFeatureAccess(user?.role, feature);
  };

  return { canAccess };
};

