import api from './api';

// Types for client management
export interface Client {
  id: string;
  name: string;
  type: 'GENERAL_CONTRACTOR' | 'DEVELOPER' | 'HOMEOWNER' | 'COMMERCIAL' | 'OTHER';
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  tax_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  updater?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

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
    clients: Client[];
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
  data: Client;
  message?: string;
}

/**
 * Get all clients with optional filters and pagination
 */
export const getAllClients = async (
  filters?: ClientFilters,
  pagination?: ClientPaginationOptions
): Promise<ClientsResponse> => {
  const params = {
    ...filters,
    ...pagination,
  };

  const response = await api.get('/clients', { params });
  return response as unknown as ClientsResponse;
};

/**
 * Get a single client by ID
 */
export const getClientById = async (id: string): Promise<ClientResponse> => {
  const response = await api.get(`/clients/${id}`);
  return response as unknown as ClientResponse;
};

/**
 * Create a new client
 */
export const createClient = async (data: CreateClientData): Promise<ClientResponse> => {
  const response = await api.post('/clients', data);
  return response as unknown as ClientResponse;
};

/**
 * Update an existing client
 */
export const updateClient = async (id: string, data: UpdateClientData): Promise<ClientResponse> => {
  const response = await api.put(`/clients/${id}`, data);
  return response as unknown as ClientResponse;
};

/**
 * Delete a client (soft delete)
 */
export const deleteClient = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/clients/${id}`);
  return response as unknown as { success: boolean; message: string };
};

// Export all functions as a service object
export const clientService = {
  getAll: getAllClients,
  getById: getClientById,
  create: createClient,
  update: updateClient,
  delete: deleteClient,
};

export default clientService;
