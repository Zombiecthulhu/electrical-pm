import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateClientData {
  name: string;
  type: 'GENERAL_CONTRACTOR' | 'DEVELOPER' | 'HOMEOWNER' | 'COMMERCIAL' | 'OTHER';
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  tax_id?: string;
  notes?: string;
}

export interface UpdateClientData {
  name?: string;
  type?: 'GENERAL_CONTRACTOR' | 'DEVELOPER' | 'HOMEOWNER' | 'COMMERCIAL' | 'OTHER';
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  tax_id?: string;
  notes?: string;
}

export interface ClientFilters {
  search?: string;
  type?: string;
}

export interface ClientPaginationOptions {
  page?: number;
  limit?: number;
}

export interface ClientsResponse {
  success: boolean;
  data: {
    clients: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message?: string;
}

export interface ClientResponse {
  success: boolean;
  data: any;
  message?: string;
}

/**
 * Get all clients with optional filters and pagination
 */
export const getAllClients = async (
  filters: ClientFilters = {},
  pagination: ClientPaginationOptions = {}
): Promise<ClientsResponse> => {
  try {
    const { search, type } = filters;
    const { page = 1, limit = 20 } = pagination;

    // Build where clause
    const where: any = {
      deleted_at: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    // Get total count
    const total = await prisma.client.count({ where });

    // Get clients with pagination
    const clients = await prisma.client.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        clients,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    };
  } catch (error: any) {
    logger.error('Error fetching clients', { error: error.message, filters, pagination });
    throw new Error('Failed to fetch clients');
  }
};

/**
 * Get single client by ID
 */
export const getClientById = async (id: string): Promise<ClientResponse> => {
  try {
    const client = await prisma.client.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      include: {
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            project_number: true,
            status: true,
          },
        },
      },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    return {
      success: true,
      data: client,
    };
  } catch (error: any) {
    logger.error('Error fetching client', { error: error.message, clientId: id });
    throw error;
  }
};

/**
 * Create new client
 */
export const createClient = async (data: CreateClientData, userId: string): Promise<ClientResponse> => {
  try {
    // Validate required fields
    if (!data.name) {
      throw new Error('Client name is required');
    }

    const client = await prisma.client.create({
      data: {
        name: data.name,
        type: data.type,
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website,
        tax_id: data.tax_id,
        notes: data.notes,
        created_by: userId,
        updated_by: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    logger.info('Client created successfully', {
      userId,
      clientId: client.id,
      clientName: client.name,
    });

    return {
      success: true,
      data: client,
    };
  } catch (error: any) {
    logger.error('Error creating client', { error: error.message, userId, data });
    throw error;
  }
};

/**
 * Update existing client
 */
export const updateClient = async (id: string, data: UpdateClientData, userId: string): Promise<ClientResponse> => {
  try {
    // Check if client exists
    const existingClient = await prisma.client.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existingClient) {
      throw new Error('Client not found');
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        ...data,
        updated_by: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    logger.info('Client updated successfully', {
      userId,
      clientId: client.id,
      clientName: client.name,
    });

    return {
      success: true,
      data: client,
    };
  } catch (error: any) {
    logger.error('Error updating client', { error: error.message, userId, clientId: id, data });
    throw error;
  }
};

/**
 * Delete client (soft delete)
 */
export const deleteClient = async (id: string, userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Check if client exists
    const existingClient = await prisma.client.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existingClient) {
      throw new Error('Client not found');
    }

    await prisma.client.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        updated_by: userId,
      },
    });

    logger.info('Client deleted successfully', {
      userId,
      clientId: id,
      clientName: existingClient.name,
    });

    return {
      success: true,
      message: 'Client deleted successfully',
    };
  } catch (error: any) {
    logger.error('Error deleting client', { error: error.message, userId, clientId: id });
    throw error;
  }
};
