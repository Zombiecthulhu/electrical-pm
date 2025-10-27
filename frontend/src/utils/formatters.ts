/**
 * Formatting Utilities
 * 
 * Pure functions for formatting dates, currency, numbers, and other data types.
 * All functions are pure (no side effects) and reusable.
 */

/**
 * Format a date string or Date object to a readable format
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Format a date to include time
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Invalid Date';
  }
};

/**
 * Format time only (HH:MM AM/PM)
 */
export const formatTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Time';
    }
    
    return dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid Time';
  }
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === '') return 'N/A';
  
  try {
    const numericAmount = typeof amount === 'number' ? amount : Number(amount);
    
    if (isNaN(numericAmount)) {
      return 'Invalid Amount';
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numericAmount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return 'Invalid Amount';
  }
};

/**
 * Format a number with commas
 */
export const formatNumber = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined || num === '') return 'N/A';
  
  try {
    const numericValue = typeof num === 'number' ? num : Number(num);
    
    if (isNaN(numericValue)) {
      return 'Invalid Number';
    }
    
    return new Intl.NumberFormat('en-US').format(numericValue);
  } catch (error) {
    console.error('Error formatting number:', error);
    return 'Invalid Number';
  }
};

/**
 * Format a percentage
 */
export const formatPercentage = (value: number | string | null | undefined, decimals: number = 1): string => {
  if (value === null || value === undefined || value === '') return 'N/A';
  
  try {
    const numericValue = typeof value === 'number' ? value : Number(value);
    
    if (isNaN(numericValue)) {
      return 'Invalid Percentage';
    }
    
    return `${numericValue.toFixed(decimals)}%`;
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return 'Invalid Percentage';
  }
};

/**
 * Format file size in bytes to human readable format
 */
export const formatFileSize = (bytes: number | string | null | undefined): string => {
  if (bytes === null || bytes === undefined || bytes === '') return 'N/A';
  
  try {
    const numericBytes = typeof bytes === 'number' ? bytes : Number(bytes);
    
    if (isNaN(numericBytes) || numericBytes < 0) {
      return 'Invalid Size';
    }
    
    if (numericBytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(numericBytes) / Math.log(k));
    
    return `${parseFloat((numericBytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  } catch (error) {
    console.error('Error formatting file size:', error);
    return 'Invalid Size';
  }
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return 'N/A';
  
  try {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    // Return original if not 10 digits
    return phone;
  } catch (error) {
    console.error('Error formatting phone number:', error);
    return phone || 'N/A';
  }
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
    }
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid Date';
  }
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string | null | undefined, maxLength: number = 50): string => {
  if (!text) return 'N/A';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Capitalize first letter of each word
 */
export const capitalizeWords = (text: string | null | undefined): string => {
  if (!text) return 'N/A';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format initials from name
 */
export const formatInitials = (firstName: string | null | undefined, lastName: string | null | undefined): string => {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}`;
};
