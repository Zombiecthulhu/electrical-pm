/**
 * Authentication Service
 * 
 * Handles password hashing, comparison, JWT token generation and verification.
 * Uses bcrypt for password hashing and jsonwebtoken for JWT operations.
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

// Constants
const BCRYPT_SALT_ROUNDS = 12;

// Types
export interface TokenPayload {
  userId: string;
  role: string;
  email?: string;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Hash a plain text password using bcrypt
 * 
 * @param password - Plain text password to hash
 * @returns Promise resolving to hashed password
 * @throws Error if hashing fails
 * 
 * @example
 * const hash = await hashPassword('mySecurePassword123');
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    
    logger.info('Password hashed successfully');
    
    return hash;
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Compare a plain text password with a bcrypt hash
 * 
 * @param password - Plain text password to verify
 * @param hash - Bcrypt hash to compare against
 * @returns Promise resolving to true if password matches, false otherwise
 * 
 * @example
 * const isValid = await comparePassword('myPassword', hashedPassword);
 * if (isValid) {
 *   // Password is correct
 * }
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    if (!password || !hash) {
      return false;
    }

    const isMatch = await bcrypt.compare(password, hash);
    
    if (isMatch) {
      logger.info('Password comparison successful');
    } else {
      logger.warn('Password comparison failed - invalid credentials');
    }
    
    return isMatch;
  } catch (error) {
    logger.error('Error comparing password:', error);
    return false;
  }
}

/**
 * Generate a JWT access token
 * 
 * @param userId - User's unique ID
 * @param role - User's role (SUPER_ADMIN, PROJECT_MANAGER, etc.)
 * @param email - Optional user email to include in token
 * @returns JWT token string
 * @throws Error if token generation fails
 * 
 * @example
 * const token = generateToken('user-uuid', 'PROJECT_MANAGER', 'user@example.com');
 */
export function generateToken(
  userId: string,
  role: string,
  email?: string
): string {
  try {
    if (!userId || !role) {
      throw new Error('userId and role are required');
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30m';
    
    logger.info('JWT_SECRET value:', { JWT_SECRET: JWT_SECRET, length: JWT_SECRET?.length });
    if (!JWT_SECRET || JWT_SECRET === 'your-secret-key-change-in-production') {
      logger.error('JWT_SECRET is not configured properly');
      throw new Error('JWT configuration error');
    }

    const payload: TokenPayload = {
      userId,
      role,
      ...(email && { email }),
    };

    const token = jwt.sign(payload, JWT_SECRET as string, {
      expiresIn: JWT_EXPIRES_IN as string,
      issuer: 'electrical-pm-system',
      audience: 'electrical-pm-client',
    } as jwt.SignOptions);

    logger.info('Access token generated successfully', { userId, role });

    return token;
  } catch (error) {
    logger.error('Error generating token:', error);
    throw new Error('Failed to generate token');
  }
}

/**
 * Generate a JWT refresh token
 * 
 * @param userId - User's unique ID
 * @param role - User's role
 * @returns JWT refresh token string
 * @throws Error if token generation fails
 * 
 * @example
 * const refreshToken = generateRefreshToken('user-uuid', 'PROJECT_MANAGER');
 */
export function generateRefreshToken(userId: string, role: string): string {
  try {
    if (!userId || !role) {
      throw new Error('userId and role are required');
    }

    const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-change-in-production';
    const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

    if (!REFRESH_TOKEN_SECRET || REFRESH_TOKEN_SECRET === 'your-refresh-secret-change-in-production') {
      logger.error('REFRESH_TOKEN_SECRET is not configured properly');
      throw new Error('JWT configuration error');
    }

    const payload: TokenPayload = {
      userId,
      role,
    };

    const token = jwt.sign(payload, REFRESH_TOKEN_SECRET as string, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN as string,
      issuer: 'electrical-pm-system',
      audience: 'electrical-pm-client',
    } as jwt.SignOptions);

    logger.info('Refresh token generated successfully', { userId });

    return token;
  } catch (error) {
    logger.error('Error generating refresh token:', error);
    throw new Error('Failed to generate refresh token');
  }
}

/**
 * Generate both access and refresh tokens
 * 
 * @param userId - User's unique ID
 * @param role - User's role
 * @param email - Optional user email
 * @returns Object containing both tokens
 * 
 * @example
 * const { accessToken, refreshToken } = generateTokenPair('user-uuid', 'SUPER_ADMIN', 'admin@example.com');
 */
export function generateTokenPair(
  userId: string,
  role: string,
  email?: string
): TokenPair {
  return {
    accessToken: generateToken(userId, role, email),
    refreshToken: generateRefreshToken(userId, role),
  };
}

/**
 * Verify and decode a JWT access token
 * 
 * @param token - JWT token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 * 
 * @example
 * try {
 *   const decoded = verifyToken(token);
 *   console.log(decoded.userId, decoded.role);
 * } catch (error) {
 *   // Token is invalid or expired
 * }
 */
export function verifyToken(token: string): DecodedToken {
  try {
    if (!token) {
      throw new Error('Token is required');
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

    if (!JWT_SECRET || JWT_SECRET === 'your-secret-key-change-in-production') {
      logger.error('JWT_SECRET is not configured properly');
      throw new Error('JWT configuration error');
    }

    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'electrical-pm-system',
      audience: 'electrical-pm-client',
    }) as DecodedToken;

    logger.info('Token verified successfully', { userId: decoded.userId });

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Token expired', { expiredAt: error.expiredAt });
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid token', { message: error.message });
      throw new Error('Invalid token');
    } else {
      logger.error('Error verifying token:', error);
      throw new Error('Token verification failed');
    }
  }
}

/**
 * Verify and decode a JWT refresh token
 * 
 * @param token - JWT refresh token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 * 
 * @example
 * const decoded = verifyRefreshToken(refreshToken);
 */
export function verifyRefreshToken(token: string): DecodedToken {
  try {
    if (!token) {
      throw new Error('Token is required');
    }

    const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-change-in-production';

    if (!REFRESH_TOKEN_SECRET || REFRESH_TOKEN_SECRET === 'your-refresh-secret-change-in-production') {
      logger.error('REFRESH_TOKEN_SECRET is not configured properly');
      throw new Error('JWT configuration error');
    }

    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET, {
      issuer: 'electrical-pm-system',
      audience: 'electrical-pm-client',
    }) as DecodedToken;

    logger.info('Refresh token verified successfully', { userId: decoded.userId });

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Refresh token expired', { expiredAt: error.expiredAt });
      throw new Error('Refresh token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid refresh token', { message: error.message });
      throw new Error('Invalid refresh token');
    } else {
      logger.error('Error verifying refresh token:', error);
      throw new Error('Refresh token verification failed');
    }
  }
}

/**
 * Extract token from Authorization header
 * 
 * @param authHeader - Authorization header string (e.g., "Bearer token123")
 * @returns Extracted token or null
 * 
 * @example
 * const token = extractTokenFromHeader(req.headers.authorization);
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    logger.warn('Invalid authorization header format');
    return null;
  }

  return parts[1] || null;
}

/**
 * Check if a token is about to expire (within 5 minutes)
 * 
 * @param token - JWT token to check
 * @returns True if token expires within 5 minutes
 * 
 * @example
 * if (isTokenExpiringSoon(token)) {
 *   // Refresh the token
 * }
 */
export function isTokenExpiringSoon(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as DecodedToken;
    
    if (!decoded || !decoded.exp) {
      return true;
    }

    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    return (expirationTime - currentTime) < fiveMinutes;
  } catch (error) {
    logger.error('Error checking token expiration:', error);
    return true;
  }
}

/**
 * Validate password strength
 * 
 * @param password - Password to validate
 * @returns Object with isValid flag and error messages
 * 
 * @example
 * const validation = validatePasswordStrength(password);
 * if (!validation.isValid) {
 *   console.log(validation.errors);
 * }
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Export auth service as default
export default {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  generateTokenPair,
  verifyToken,
  verifyRefreshToken,
  extractTokenFromHeader,
  isTokenExpiringSoon,
  validatePasswordStrength,
};

