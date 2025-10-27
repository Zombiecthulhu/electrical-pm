/**
 * Token Utility Functions
 * 
 * Helper functions for JWT token management, validation, and expiration checks
 */

interface DecodedToken {
  userId: string;
  role: string;
  email?: string;
  iat: number; // Issued at (timestamp)
  exp: number; // Expiration (timestamp)
}

/**
 * Decode a JWT token without verification
 * Note: This only decodes, it doesn't verify the signature
 */
export const decodeToken = (token: string): DecodedToken | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

/**
 * Check if a token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  
  // exp is in seconds, Date.now() is in milliseconds
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

/**
 * Get time remaining until token expires (in seconds)
 */
export const getTokenTimeRemaining = (token: string): number => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return 0;
  }
  
  const currentTime = Date.now() / 1000;
  const remaining = decoded.exp - currentTime;
  return Math.max(0, remaining);
};

/**
 * Check if token will expire soon (within 5 minutes)
 */
export const isTokenExpiringSoon = (token: string, minutesThreshold: number = 5): boolean => {
  const timeRemaining = getTokenTimeRemaining(token);
  return timeRemaining > 0 && timeRemaining < (minutesThreshold * 60);
};

/**
 * Format time remaining as human-readable string
 */
export const formatTimeRemaining = (seconds: number): string => {
  if (seconds <= 0) return 'Expired';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (minutes === 0) {
    return `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  }
  
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''}`;
};

/**
 * Get token expiration date
 */
export const getTokenExpirationDate = (token: string): Date | null => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return null;
  }
  
  return new Date(decoded.exp * 1000);
};

/**
 * Check if stored token is valid
 */
export const isStoredTokenValid = (): boolean => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return false;
  }
  
  return !isTokenExpired(token);
};

/**
 * Clear all authentication tokens
 */
export const clearAuthTokens = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

