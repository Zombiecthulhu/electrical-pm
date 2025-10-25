/**
 * Quote Service
 * 
 * Handles API communication for quote/bid management operations.
 * Provides type-safe methods for all quote-related API calls.
 */

import api, { ApiResponse } from './api';

// Quote interfaces
export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  category?: string;
  notes?: string;
}

export interface Quote {
  id: string;
  quote_number: string;
  client_id: string;
  project_name: string;
  status: QuoteStatus;
  line_items: LineItem[];
  subtotal: number;
  tax?: number;
  total: number;
  notes?: string;
  valid_until?: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  client: {
    id: string;
    name: string;
    type: string;
  };
  creator: {
    id: string;
    first_name: string;
    last_name: string;
  };
  updater: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export enum QuoteStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export interface CreateQuoteData {
  client_id: string;
  project_name: string;
  line_items: LineItem[];
  subtotal: number;
  tax?: number;
  total: number;
  notes?: string;
  valid_until?: string;
  status?: QuoteStatus;
}

export interface UpdateQuoteData {
  project_name?: string;
  line_items?: LineItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
  notes?: string;
  valid_until?: string;
  status?: QuoteStatus;
}

export interface QuoteFilters {
  client_id?: string;
  status?: QuoteStatus;
  created_by?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface QuoteListResponse {
  quotes: Quote[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QuoteStats {
  total_quotes: number;
  draft_quotes: number;
  sent_quotes: number;
  pending_quotes: number;
  accepted_quotes: number;
  rejected_quotes: number;
  total_value: number;
  accepted_value: number;
  average_quote_value: number;
}

export interface QuotePaginationOptions {
  page: number;
  limit: number;
}

class QuoteService {
  /**
   * Create a new quote
   */
  async createQuote(data: CreateQuoteData): Promise<Quote> {
    const response: ApiResponse<Quote> = await api.post('/quotes', data);
    return response.data!;
  }

  /**
   * Get quote by ID
   */
  async getQuoteById(id: string): Promise<Quote> {
    const response: ApiResponse<Quote> = await api.get(`/quotes/${id}`);
    return response.data!;
  }

  /**
   * Get quote by quote number
   */
  async getQuoteByNumber(quoteNumber: string): Promise<Quote> {
    const response: ApiResponse<Quote> = await api.get(`/quotes/number/${quoteNumber}`);
    return response.data!;
  }

  /**
   * List quotes with filtering and pagination
   */
  async listQuotes(
    filters: QuoteFilters = {},
    pagination: QuotePaginationOptions = { page: 1, limit: 20 }
  ): Promise<QuoteListResponse> {
    const params = {
      ...filters,
      page: pagination.page,
      limit: pagination.limit
    };

    const response: ApiResponse<QuoteListResponse> = await api.get('/quotes', { params });
    return response.data!;
  }

  /**
   * Update quote
   */
  async updateQuote(id: string, data: UpdateQuoteData): Promise<Quote> {
    const response: ApiResponse<Quote> = await api.put(`/quotes/${id}`, data);
    return response.data!;
  }

  /**
   * Update quote status
   */
  async updateQuoteStatus(id: string, status: QuoteStatus): Promise<Quote> {
    const response: ApiResponse<Quote> = await api.patch(`/quotes/${id}/status`, { status });
    return response.data!;
  }

  /**
   * Delete quote
   */
  async deleteQuote(id: string): Promise<void> {
    await api.delete(`/quotes/${id}`);
  }

  /**
   * Get quote statistics
   */
  async getQuoteStats(filters: QuoteFilters = {}): Promise<QuoteStats> {
    const response: ApiResponse<QuoteStats> = await api.get('/quotes/stats', { params: filters });
    return response.data!;
  }

  /**
   * Duplicate quote
   */
  async duplicateQuote(id: string, projectName: string): Promise<Quote> {
    const response: ApiResponse<Quote> = await api.post(`/quotes/${id}/duplicate`, {
      project_name: projectName
    });
    return response.data!;
  }

  /**
   * Calculate line item totals
   */
  calculateLineItemTotals(lineItems: LineItem[]): {
    subtotal: number;
    tax: number;
    total: number;
  } {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.08; // 8% tax rate
    const total = subtotal + tax;
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }

  /**
   * Generate a new line item with default values
   */
  generateLineItem(): LineItem {
    return {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      quantity: 1,
      unit: 'ea',
      unit_price: 0,
      total: 0,
      category: '',
      notes: ''
    };
  }

  /**
   * Validate line item
   */
  validateLineItem(item: LineItem): string[] {
    const errors: string[] = [];

    if (!item.description || item.description.trim() === '') {
      errors.push('Description is required');
    }

    if (!item.quantity || item.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }

    if (!item.unit || item.unit.trim() === '') {
      errors.push('Unit is required');
    }

    if (item.unit_price < 0) {
      errors.push('Unit price must be non-negative');
    }

    // Calculate and validate total
    const calculatedTotal = item.quantity * item.unit_price;
    if (Math.abs(item.total - calculatedTotal) > 0.01) {
      errors.push('Total calculation mismatch');
    }

    return errors;
  }

  /**
   * Validate all line items
   */
  validateLineItems(lineItems: LineItem[]): { isValid: boolean; errors: string[] } {
    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return { isValid: false, errors: ['At least one line item is required'] };
    }

    const allErrors: string[] = [];
    
    lineItems.forEach((item, index) => {
      const itemErrors = this.validateLineItem(item);
      if (itemErrors.length > 0) {
        allErrors.push(`Line item ${index + 1}: ${itemErrors.join(', ')}`);
      }
    });

    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    };
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number | string | any): string {
    // Handle edge cases - convert to number if it's not already
    const numericAmount = typeof amount === 'number' ? amount : Number(amount) || 0;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numericAmount);
  }

  /**
   * Get status display text
   */
  getStatusDisplayText(status: QuoteStatus): string {
    const statusMap: Record<QuoteStatus, string> = {
      [QuoteStatus.DRAFT]: 'Draft',
      [QuoteStatus.SENT]: 'Sent',
      [QuoteStatus.PENDING]: 'Pending',
      [QuoteStatus.ACCEPTED]: 'Accepted',
      [QuoteStatus.REJECTED]: 'Rejected'
    };

    return statusMap[status] || status;
  }

  /**
   * Get status color
   */
  getStatusColor(status: QuoteStatus): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
    const colorMap: Record<QuoteStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      [QuoteStatus.DRAFT]: 'default',
      [QuoteStatus.SENT]: 'info',
      [QuoteStatus.PENDING]: 'warning',
      [QuoteStatus.ACCEPTED]: 'success',
      [QuoteStatus.REJECTED]: 'error'
    };

    return colorMap[status] || 'default';
  }
}

export const quoteService = new QuoteService();
export default quoteService;
