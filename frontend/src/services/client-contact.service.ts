/**
 * Client Contact Service
 * 
 * Frontend API client for client contact management including:
 * - CRUD operations for client contacts
 * - Primary contact management
 * - Contact validation and error handling
 */

import api from './api';

// Types for client contact management
export interface ClientContact {
  id: string;
  client_id: string;
  name: string;
  title?: string;
  phone?: string;
  email?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

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

export interface ClientContactPaginationOptions {
  page?: number;
  limit?: number;
}

export interface ClientContactResponse {
  success: boolean;
  data: ClientContact;
  message?: string;
}

export interface ClientContactsResponse {
  success: boolean;
  data: {
    contacts: ClientContact[];
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
  filters?: ClientContactFilters,
  pagination?: ClientContactPaginationOptions
): Promise<ClientContactsResponse> => {
  const params = {
    ...filters,
    ...pagination,
  };

  const response = await api.get(`/clients/${clientId}/contacts`, { params });
  return response as unknown as ClientContactsResponse;
};

/**
 * Get a single contact by ID
 */
export const getClientContactById = async (clientId: string, contactId: string): Promise<ClientContactResponse> => {
  const response = await api.get(`/clients/${clientId}/contacts/${contactId}`);
  return response as unknown as ClientContactResponse;
};

/**
 * Create a new client contact
 */
export const createClientContact = async (data: CreateClientContactData): Promise<ClientContactResponse> => {
  const response = await api.post(`/clients/${data.client_id}/contacts`, data);
  return response as unknown as ClientContactResponse;
};

/**
 * Update an existing client contact
 */
export const updateClientContact = async (
  clientId: string, 
  contactId: string, 
  data: UpdateClientContactData
): Promise<ClientContactResponse> => {
  const response = await api.put(`/clients/${clientId}/contacts/${contactId}`, data);
  return response as unknown as ClientContactResponse;
};

/**
 * Delete a client contact
 */
export const deleteClientContact = async (clientId: string, contactId: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/clients/${clientId}/contacts/${contactId}`);
  return response as unknown as { success: boolean; message: string };
};

/**
 * Set a contact as primary for a client
 */
export const setPrimaryContact = async (clientId: string, contactId: string): Promise<ClientContactResponse> => {
  const response = await api.post(`/clients/${clientId}/contacts/${contactId}/primary`);
  return response as unknown as ClientContactResponse;
};

// Export all functions as a service object
export const clientContactService = {
  getAll: getClientContacts,
  getById: getClientContactById,
  create: createClientContact,
  update: updateClientContact,
  delete: deleteClientContact,
  setPrimary: setPrimaryContact,
};

export default clientContactService;
