/**
 * Client Store
 * 
 * Zustand store for client state management including:
 * - Client list and pagination
 * - Current client details
 * - Client contacts
 * - Client projects
 * - Loading states and errors
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { clientService, Client, CreateClientData, UpdateClientData, ClientFilters, ClientPaginationOptions } from '../services/client.service';
import { clientContactService, ClientContact } from '../services/client-contact.service';
import { clientProjectService, ClientProject } from '../services/client-project.service';

// ClientContact and ClientProject interfaces are now imported from services

export interface ClientState {
  // Client list state
  clients: Client[];
  totalClients: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  
  // Current client state
  currentClient: Client | null;
  clientContacts: ClientContact[];
  clientProjects: ClientProject[];
  
  // Filters and search
  filters: ClientFilters;
  searchQuery: string;
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isLoadingContacts: boolean;
  isLoadingProjects: boolean;
  
  // Error states
  error: string | null;
  contactsError: string | null;
  projectsError: string | null;
  
  // Actions
  setClients: (clients: Client[], total: number) => void;
  setCurrentClient: (client: Client | null) => void;
  setClientContacts: (contacts: ClientContact[]) => void;
  setClientProjects: (projects: ClientProject[]) => void;
  setFilters: (filters: ClientFilters) => void;
  setSearchQuery: (query: string) => void;
  setPagination: (page: number, pageSize: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Async actions
  loadClients: (filters?: ClientFilters, pagination?: ClientPaginationOptions) => Promise<void>;
  loadClientById: (id: string) => Promise<void>;
  createClient: (data: CreateClientData) => Promise<Client | null>;
  updateClient: (id: string, data: UpdateClientData) => Promise<Client | null>;
  deleteClient: (id: string) => Promise<boolean>;
  loadClientContacts: (clientId: string) => Promise<void>;
  loadClientProjects: (clientId: string) => Promise<void>;
  
  // Utility actions
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  clients: [],
  totalClients: 0,
  currentPage: 0,
  pageSize: 20,
  totalPages: 0,
  currentClient: null,
  clientContacts: [],
  clientProjects: [],
  filters: {},
  searchQuery: '',
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isLoadingContacts: false,
  isLoadingProjects: false,
  error: null,
  contactsError: null,
  projectsError: null,
};

export const useClientStore = create<ClientState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Basic setters
      setClients: (clients, total) => {
        const totalPages = Math.ceil(total / get().pageSize);
        set({ clients, totalClients: total, totalPages });
      },

      setCurrentClient: (client) => set({ currentClient: client }),

      setClientContacts: (contacts) => set({ clientContacts: contacts }),

      setClientProjects: (projects) => set({ clientProjects: projects }),

      setFilters: (filters) => set({ filters }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      setPagination: (page, pageSize) => {
        const totalPages = Math.ceil(get().totalClients / pageSize);
        set({ currentPage: page, pageSize, totalPages });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      // Load clients with filters and pagination
      loadClients: async (filters = {}, pagination = {}) => {
        set({ isLoading: true, error: null });
        
        try {
          const currentState = get();
          const finalFilters = { ...currentState.filters, ...filters };
          const finalPagination = {
            page: pagination.page ?? currentState.currentPage + 1,
            limit: pagination.limit ?? currentState.pageSize,
          };

          const response = await clientService.getAll(finalFilters, finalPagination);
          
          if (response.success && response.data) {
            get().setClients(response.data.clients, response.data.pagination.total);
            get().setPagination(
              response.data.pagination.page - 1,
              response.data.pagination.limit
            );
          } else {
            throw new Error(response.message || 'Failed to load clients');
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to load clients' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Load single client by ID
      loadClientById: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await clientService.getById(id);
          
          if (response.success && response.data) {
            set({ currentClient: response.data });
          } else {
            throw new Error(response.message || 'Client not found');
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to load client' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Create new client
      createClient: async (data) => {
        set({ isCreating: true, error: null });
        
        try {
          const response = await clientService.create(data);
          
          if (response.success && response.data) {
            // Add to current clients list
            const currentState = get();
            set({
              clients: [response.data, ...currentState.clients],
              totalClients: currentState.totalClients + 1,
            });
            return response.data;
          } else {
            throw new Error(response.message || 'Failed to create client');
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to create client' });
          return null;
        } finally {
          set({ isCreating: false });
        }
      },

      // Update existing client
      updateClient: async (id, data) => {
        set({ isUpdating: true, error: null });
        
        try {
          const response = await clientService.update(id, data);
          
          if (response.success && response.data) {
            // Update in current clients list
            const currentState = get();
            const updatedClients = currentState.clients.map(client =>
              client.id === id ? response.data : client
            );
            set({ clients: updatedClients });
            
            // Update current client if it's the same one
            if (currentState.currentClient?.id === id) {
              set({ currentClient: response.data });
            }
            
            return response.data;
          } else {
            throw new Error(response.message || 'Failed to update client');
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to update client' });
          return null;
        } finally {
          set({ isUpdating: false });
        }
      },

      // Delete client
      deleteClient: async (id) => {
        set({ isDeleting: true, error: null });
        
        try {
          const response = await clientService.delete(id);
          
          if (response.success) {
            // Remove from current clients list
            const currentState = get();
            const filteredClients = currentState.clients.filter(client => client.id !== id);
            set({
              clients: filteredClients,
              totalClients: Math.max(0, currentState.totalClients - 1),
            });
            
            // Clear current client if it's the same one
            if (currentState.currentClient?.id === id) {
              set({ currentClient: null, clientContacts: [], clientProjects: [] });
            }
            
            return true;
          } else {
            throw new Error(response.message || 'Failed to delete client');
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to delete client' });
          return false;
        } finally {
          set({ isDeleting: false });
        }
      },

      // Load client contacts
      loadClientContacts: async (clientId) => {
        set({ isLoadingContacts: true, contactsError: null });
        
        try {
          const response = await clientContactService.getAll(clientId);
          
          if (response.success && response.data) {
            set({ clientContacts: response.data.contacts || [] });
          } else {
            throw new Error(response.message || 'Failed to load contacts');
          }
        } catch (error: any) {
          set({ contactsError: error.message || 'Failed to load contacts' });
        } finally {
          set({ isLoadingContacts: false });
        }
      },

      // Load client projects
      loadClientProjects: async (clientId) => {
        set({ isLoadingProjects: true, projectsError: null });
        
        try {
          const response = await clientProjectService.getAll(clientId);
          
          if (response.success && response.data) {
            set({ clientProjects: response.data.projects || [] });
          } else {
            throw new Error(response.message || 'Failed to load projects');
          }
        } catch (error: any) {
          set({ projectsError: error.message || 'Failed to load projects' });
        } finally {
          set({ isLoadingProjects: false });
        }
      },

      // Utility actions
      clearError: () => set({ error: null, contactsError: null, projectsError: null }),

      reset: () => set(initialState),
    }),
    {
      name: 'client-store',
    }
  )
);

// Export individual selectors for better performance
export const useClients = () => useClientStore((state) => state.clients);
export const useCurrentClient = () => useClientStore((state) => state.currentClient);
export const useClientContacts = () => useClientStore((state) => state.clientContacts);
export const useClientProjects = () => useClientStore((state) => state.clientProjects);
export const useClientLoading = () => useClientStore((state) => state.isLoading);
export const useClientError = () => useClientStore((state) => state.error);
export const useClientActions = () => useClientStore((state) => ({
  loadClients: state.loadClients,
  loadClientById: state.loadClientById,
  createClient: state.createClient,
  updateClient: state.updateClient,
  deleteClient: state.deleteClient,
  loadClientContacts: state.loadClientContacts,
  loadClientProjects: state.loadClientProjects,
  clearError: state.clearError,
  reset: state.reset,
}));

export default useClientStore;
