/**
 * Client Contact Service
 * 
 * Business logic for managing client contacts including:
 * - CRUD operations for client contacts
 * - Primary contact management
 * - Contact validation and error handling
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateClientContactData {
  client_id: string;
  name: string;
  title?: string;
  phone?: string;
  email?: string;
  is_primary?: boolean;
}

export interface UpdateClientContactData {
  name?: string;
  title?: string;
  phone?: string;
  email?: string;
  is_primary?: boolean;
}

export interface ClientContactFilters {
  client_id?: string;
  is_primary?: boolean;
  search?: string;
}

export interface ClientContactResponse {
  success: boolean;
  data: any;
  message?: string;
}

export interface ClientContactsResponse {
  success: boolean;
  data: {
    contacts: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message?: string;
}

/**
 * Get all contacts for a client
 */
export const getClientContacts = async (
  clientId: string,
  filters: ClientContactFilters = {},
  pagination: { page?: number; limit?: number } = {}
): Promise<ClientContactsResponse> => {
  try {
    const { page = 1, limit = 20 } = pagination;
    const { is_primary, search } = filters;

    // Build where clause
    const where: any = {
      client_id: clientId,
    };

    if (is_primary !== undefined) {
      where.is_primary = is_primary;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.clientContact.count({ where });

    // Get contacts with pagination
    const contacts = await prisma.clientContact.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { is_primary: 'desc' },
        { name: 'asc' }
      ],
    });

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        contacts,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    };
  } catch (error: any) {
    logger.error('Error fetching client contacts', { error: error.message, clientId, filters, pagination });
    throw new Error('Failed to fetch client contacts');
  }
};

/**
 * Get single contact by ID
 */
export const getClientContactById = async (contactId: string): Promise<ClientContactResponse> => {
  try {
    const contact = await prisma.clientContact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    return {
      success: true,
      data: contact,
    };
  } catch (error: any) {
    logger.error('Error fetching client contact', { error: error.message, contactId });
    throw error;
  }
};

/**
 * Create new client contact
 */
export const createClientContact = async (data: CreateClientContactData): Promise<ClientContactResponse> => {
  try {
    // Validate required fields
    if (!data.client_id) {
      throw new Error('Client ID is required');
    }
    if (!data.name) {
      throw new Error('Contact name is required');
    }

    // If this contact is being set as primary, unset other primary contacts
    if (data.is_primary) {
      await prisma.clientContact.updateMany({
        where: { 
          client_id: data.client_id,
          is_primary: true 
        },
        data: { is_primary: false }
      });
    }

    const contact = await prisma.clientContact.create({
      data: {
        client_id: data.client_id,
        name: data.name,
        title: data.title,
        phone: data.phone,
        email: data.email,
        is_primary: data.is_primary || false,
      },
    });

    logger.info('Client contact created successfully', {
      contactId: contact.id,
      clientId: data.client_id,
      contactName: contact.name,
    });

    return {
      success: true,
      data: contact,
    };
  } catch (error: any) {
    logger.error('Error creating client contact', { error: error.message, data });
    throw error;
  }
};

/**
 * Update existing client contact
 */
export const updateClientContact = async (contactId: string, data: UpdateClientContactData): Promise<ClientContactResponse> => {
  try {
    // Check if contact exists
    const existingContact = await prisma.clientContact.findUnique({
      where: { id: contactId },
    });

    if (!existingContact) {
      throw new Error('Contact not found');
    }

    // If this contact is being set as primary, unset other primary contacts for the same client
    if (data.is_primary) {
      await prisma.clientContact.updateMany({
        where: { 
          client_id: existingContact.client_id,
          is_primary: true,
          id: { not: contactId }
        },
        data: { is_primary: false }
      });
    }

    const contact = await prisma.clientContact.update({
      where: { id: contactId },
      data: {
        name: data.name,
        title: data.title,
        phone: data.phone,
        email: data.email,
        is_primary: data.is_primary,
      },
    });

    logger.info('Client contact updated successfully', {
      contactId: contact.id,
      clientId: existingContact.client_id,
      contactName: contact.name,
    });

    return {
      success: true,
      data: contact,
    };
  } catch (error: any) {
    logger.error('Error updating client contact', { error: error.message, contactId, data });
    throw error;
  }
};

/**
 * Delete client contact
 */
export const deleteClientContact = async (contactId: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Check if contact exists
    const existingContact = await prisma.clientContact.findUnique({
      where: { id: contactId },
    });

    if (!existingContact) {
      throw new Error('Contact not found');
    }

    await prisma.clientContact.delete({
      where: { id: contactId },
    });

    logger.info('Client contact deleted successfully', {
      contactId,
      clientId: existingContact.client_id,
      contactName: existingContact.name,
    });

    return {
      success: true,
      message: 'Contact deleted successfully',
    };
  } catch (error: any) {
    logger.error('Error deleting client contact', { error: error.message, contactId });
    throw error;
  }
};

/**
 * Set primary contact for a client
 */
export const setPrimaryContact = async (contactId: string): Promise<ClientContactResponse> => {
  try {
    // Get the contact to find the client_id
    const contact = await prisma.clientContact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    // Unset all other primary contacts for this client
    await prisma.clientContact.updateMany({
      where: { 
        client_id: contact.client_id,
        is_primary: true 
      },
      data: { is_primary: false }
    });

    // Set this contact as primary
    const updatedContact = await prisma.clientContact.update({
      where: { id: contactId },
      data: { is_primary: true },
    });

    logger.info('Primary contact set successfully', {
      contactId,
      clientId: contact.client_id,
      contactName: updatedContact.name,
    });

    return {
      success: true,
      data: updatedContact,
    };
  } catch (error: any) {
    logger.error('Error setting primary contact', { error: error.message, contactId });
    throw error;
  }
};
