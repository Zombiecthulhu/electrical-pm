/**
 * Quote Service
 * 
 * Handles quote/bid management operations including CRUD operations,
 * status management, line item calculations, and quote generation.
 */

import { PrismaClient, Quote, QuoteStatus, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/response';

const prisma = new PrismaClient();

// Quote with relations
export type QuoteWithRelations = Quote & {
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
};

// Line item interface
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

// Quote creation data
export interface CreateQuoteData {
  client_id: string;
  project_name: string;
  line_items: LineItem[];
  subtotal: number;
  tax?: number;
  total: number;
  notes?: string;
  valid_until?: Date;
  status?: QuoteStatus;
}

// Quote update data
export interface UpdateQuoteData {
  project_name?: string;
  line_items?: LineItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
  notes?: string;
  valid_until?: Date;
  status?: QuoteStatus;
}

// Quote list filters
export interface QuoteFilters {
  client_id?: string;
  status?: QuoteStatus;
  created_by?: string;
  search?: string;
  date_from?: Date;
  date_to?: Date;
}

// Quote list response
export interface QuoteListResponse {
  quotes: QuoteWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Quote statistics
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

/**
 * Generate unique quote number
 */
export async function generateQuoteNumber(): Promise<string> {
  try {
    const year = new Date().getFullYear();
    const prefix = `Q${year}`;
    
    // Get the last quote number for this year
    const lastQuote = await prisma.quote.findFirst({
      where: {
        quote_number: {
          startsWith: prefix
        }
      },
      orderBy: {
        quote_number: 'desc'
      }
    });
    
    let nextNumber = 1;
    if (lastQuote) {
      const lastNumber = parseInt(lastQuote.quote_number.replace(prefix, ''));
      nextNumber = lastNumber + 1;
    }
    
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  } catch (error) {
    logger.error('Failed to generate quote number', { error });
    throw new ApiError('Failed to generate quote number', 500);
  }
}

/**
 * Calculate line item totals
 */
export function calculateLineItemTotals(lineItems: LineItem[]): {
  subtotal: number;
  tax: number;
  total: number;
} {
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.08; // 8% tax rate - should be configurable
  const total = subtotal + tax;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}

/**
 * Validate line items
 */
export function validateLineItems(lineItems: LineItem[]): void {
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    throw new ApiError('At least one line item is required', 400);
  }
  
  for (const item of lineItems) {
    if (!item.description || item.description.trim() === '') {
      throw new ApiError('Line item description is required', 400);
    }
    
    if (!item.quantity || item.quantity <= 0) {
      throw new ApiError('Line item quantity must be greater than 0', 400);
    }
    
    if (!item.unit_price || item.unit_price < 0) {
      throw new ApiError('Line item unit price must be non-negative', 400);
    }
    
    if (!item.unit || item.unit.trim() === '') {
      throw new ApiError('Line item unit is required', 400);
    }
    
    // Calculate and validate total
    const calculatedTotal = item.quantity * item.unit_price;
    if (Math.abs(item.total - calculatedTotal) > 0.01) {
      throw new ApiError(`Line item total mismatch for "${item.description}"`, 400);
    }
  }
}

/**
 * Create a new quote
 */
export async function createQuote(
  data: CreateQuoteData,
  createdBy: string
): Promise<QuoteWithRelations> {
  try {
    // Validate line items
    validateLineItems(data.line_items);
    
    // Generate quote number
    const quoteNumber = await generateQuoteNumber();
    
    // Calculate totals if not provided
    const calculations = calculateLineItemTotals(data.line_items);
    const subtotal = data.subtotal || calculations.subtotal;
    const tax = data.tax !== undefined ? data.tax : calculations.tax;
    const total = data.total || calculations.total;
    
    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: data.client_id }
    });
    
    if (!client) {
      throw new ApiError('Client not found', 404);
    }
    
    const quote = await prisma.quote.create({
      data: {
        quote_number: quoteNumber,
        client_id: data.client_id,
        project_name: data.project_name,
        status: data.status || QuoteStatus.DRAFT,
        line_items: data.line_items as any,
        subtotal,
        tax,
        total,
        notes: data.notes,
        valid_until: data.valid_until,
        created_by: createdBy,
        updated_by: createdBy
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        },
        updater: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });
    
    logger.info('Quote created successfully', {
      quoteId: quote.id,
      quoteNumber: quote.quote_number,
      clientId: data.client_id,
      total: quote.total,
      createdBy
    });
    
    return quote as QuoteWithRelations;
  } catch (error) {
    logger.error('Failed to create quote', { error, data, createdBy });
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to create quote', 500);
  }
}

/**
 * Get quote by ID
 */
export async function getQuoteById(quoteId: string): Promise<QuoteWithRelations | null> {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        },
        updater: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });
    
    return quote;
  } catch (error) {
    logger.error('Failed to get quote by ID', { error, quoteId });
    throw new ApiError('Failed to retrieve quote', 500);
  }
}

/**
 * Get quote by quote number
 */
export async function getQuoteByNumber(quoteNumber: string): Promise<QuoteWithRelations | null> {
  try {
    const quote = await prisma.quote.findUnique({
      where: { quote_number: quoteNumber },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        },
        updater: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });
    
    return quote;
  } catch (error) {
    logger.error('Failed to get quote by number', { error, quoteNumber });
    throw new ApiError('Failed to retrieve quote', 500);
  }
}

/**
 * List quotes with filtering and pagination
 */
export async function listQuotes(
  filters: QuoteFilters = {},
  page: number = 1,
  limit: number = 20
): Promise<QuoteListResponse> {
  try {
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: Prisma.QuoteWhereInput = {};
    
    if (filters.client_id) {
      where.client_id = filters.client_id;
    }
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.created_by) {
      where.created_by = filters.created_by;
    }
    
    if (filters.search) {
      where.OR = [
        { quote_number: { contains: filters.search, mode: 'insensitive' } },
        { project_name: { contains: filters.search, mode: 'insensitive' } },
        { client: { name: { contains: filters.search, mode: 'insensitive' } } }
      ];
    }
    
    if (filters.date_from || filters.date_to) {
      where.created_at = {};
      if (filters.date_from) {
        where.created_at.gte = filters.date_from;
      }
      if (filters.date_to) {
        where.created_at.lte = filters.date_to;
      }
    }
    
    // Get quotes and total count
    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          creator: {
            select: {
              id: true,
              first_name: true,
              last_name: true
            }
          },
          updater: {
            select: {
              id: true,
              first_name: true,
              last_name: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.quote.count({ where })
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      quotes,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  } catch (error) {
    logger.error('Failed to list quotes', { error, filters, page, limit });
    throw new ApiError('Failed to retrieve quotes', 500);
  }
}

/**
 * Update quote
 */
export async function updateQuote(
  quoteId: string,
  data: UpdateQuoteData,
  updatedBy: string
): Promise<QuoteWithRelations> {
  try {
    // Validate line items if provided
    if (data.line_items) {
      validateLineItems(data.line_items);
    }
    
    // Check if quote exists
    const existingQuote = await prisma.quote.findUnique({
      where: { id: quoteId }
    });
    
    if (!existingQuote) {
      throw new ApiError('Quote not found', 404);
    }
    
    // Calculate totals if line items are updated
    let updateData: any = {
      ...data,
      updated_by: updatedBy
    };
    
    if (data.line_items) {
      const calculations = calculateLineItemTotals(data.line_items);
      updateData.subtotal = data.subtotal || calculations.subtotal;
      updateData.tax = data.tax !== undefined ? data.tax : calculations.tax;
      updateData.total = data.total || calculations.total;
      updateData.line_items = data.line_items as any;
    }
    
    const quote = await prisma.quote.update({
      where: { id: quoteId },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        },
        updater: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });
    
    logger.info('Quote updated successfully', {
      quoteId: quote.id,
      quoteNumber: quote.quote_number,
      updatedBy
    });
    
    return quote;
  } catch (error) {
    logger.error('Failed to update quote', { error, quoteId, data, updatedBy });
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to update quote', 500);
  }
}

/**
 * Update quote status
 */
export async function updateQuoteStatus(
  quoteId: string,
  status: QuoteStatus,
  updatedBy: string
): Promise<QuoteWithRelations> {
  try {
    const quote = await prisma.quote.update({
      where: { id: quoteId },
      data: {
        status,
        updated_by: updatedBy
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        },
        updater: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });
    
    logger.info('Quote status updated', {
      quoteId: quote.id,
      quoteNumber: quote.quote_number,
      status,
      updatedBy
    });
    
    return quote;
  } catch (error) {
    logger.error('Failed to update quote status', { error, quoteId, status, updatedBy });
    throw new ApiError('Failed to update quote status', 500);
  }
}

/**
 * Delete quote (soft delete)
 */
export async function deleteQuote(quoteId: string): Promise<void> {
  try {
    // Check if quote exists
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId }
    });
    
    if (!quote) {
      throw new ApiError('Quote not found', 404);
    }
    
    // For now, we'll do a hard delete since there's no deleted_at field
    // In production, you might want to add soft delete support
    await prisma.quote.delete({
      where: { id: quoteId }
    });
    
    logger.info('Quote deleted successfully', {
      quoteId,
      quoteNumber: quote.quote_number
    });
  } catch (error) {
    logger.error('Failed to delete quote', { error, quoteId });
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to delete quote', 500);
  }
}

/**
 * Get quote statistics
 */
export async function getQuoteStats(
  filters: QuoteFilters = {}
): Promise<QuoteStats> {
  try {
    // Build where clause
    const where: Prisma.QuoteWhereInput = {};
    
    if (filters.client_id) {
      where.client_id = filters.client_id;
    }
    
    if (filters.created_by) {
      where.created_by = filters.created_by;
    }
    
    if (filters.date_from || filters.date_to) {
      where.created_at = {};
      if (filters.date_from) {
        where.created_at.gte = filters.date_from;
      }
      if (filters.date_to) {
        where.created_at.lte = filters.date_to;
      }
    }
    
    // Get counts by status
    const [
      total_quotes,
      draft_quotes,
      sent_quotes,
      pending_quotes,
      accepted_quotes,
      rejected_quotes,
      total_value_result,
      accepted_value_result
    ] = await Promise.all([
      prisma.quote.count({ where }),
      prisma.quote.count({ where: { ...where, status: QuoteStatus.DRAFT } }),
      prisma.quote.count({ where: { ...where, status: QuoteStatus.SENT } }),
      prisma.quote.count({ where: { ...where, status: QuoteStatus.PENDING } }),
      prisma.quote.count({ where: { ...where, status: QuoteStatus.ACCEPTED } }),
      prisma.quote.count({ where: { ...where, status: QuoteStatus.REJECTED } }),
      prisma.quote.aggregate({
        where,
        _sum: { total: true }
      }),
      prisma.quote.aggregate({
        where: { ...where, status: QuoteStatus.ACCEPTED },
        _sum: { total: true }
      })
    ]);
    
    const total_value = Number(total_value_result._sum.total || 0);
    const accepted_value = Number(accepted_value_result._sum.total || 0);
    const average_quote_value = total_quotes > 0 ? total_value / total_quotes : 0;
    
    return {
      total_quotes,
      draft_quotes,
      sent_quotes,
      pending_quotes,
      accepted_quotes,
      rejected_quotes,
      total_value: Number(total_value),
      accepted_value: Number(accepted_value),
      average_quote_value: Number(average_quote_value)
    };
  } catch (error) {
    logger.error('Failed to get quote statistics', { error, filters });
    throw new ApiError('Failed to retrieve quote statistics', 500);
  }
}

/**
 * Duplicate quote
 */
export async function duplicateQuote(
  quoteId: string,
  newProjectName: string,
  createdBy: string
): Promise<QuoteWithRelations> {
  try {
    const originalQuote = await prisma.quote.findUnique({
      where: { id: quoteId }
    });
    
    if (!originalQuote) {
      throw new ApiError('Original quote not found', 404);
    }
    
    // Create new quote with same data but new quote number
    const newQuote = await createQuote({
      client_id: originalQuote.client_id,
      project_name: newProjectName,
      line_items: originalQuote.line_items as unknown as LineItem[],
      subtotal: Number(originalQuote.subtotal),
      tax: originalQuote.tax ? Number(originalQuote.tax) : undefined,
      total: Number(originalQuote.total),
      notes: originalQuote.notes || undefined,
      valid_until: originalQuote.valid_until || undefined,
      status: QuoteStatus.DRAFT
    }, createdBy);
    
    logger.info('Quote duplicated successfully', {
      originalQuoteId: quoteId,
      newQuoteId: newQuote.id,
      createdBy
    });
    
    return newQuote;
  } catch (error) {
    logger.error('Failed to duplicate quote', { error, quoteId, createdBy });
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to duplicate quote', 500);
  }
}
