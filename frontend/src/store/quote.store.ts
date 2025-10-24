/**
 * Quote Store
 * 
 * Zustand store for managing quote state and operations.
 * Provides centralized state management for quote-related data.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  quoteService, 
  Quote, 
  CreateQuoteData, 
  UpdateQuoteData, 
  QuoteFilters, 
  QuoteListResponse, 
  QuoteStats,
  QuotePaginationOptions,
  LineItem
} from '../services/quote.service';

interface QuoteState {
  // Data
  quotes: Quote[];
  currentQuote: Quote | null;
  stats: QuoteStats | null;
  
  // UI State
  loading: boolean;
  error: string | null;
  
  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  
  // Filters
  filters: QuoteFilters;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setQuotes: (quotes: Quote[]) => void;
  setCurrentQuote: (quote: Quote | null) => void;
  setStats: (stats: QuoteStats | null) => void;
  setPagination: (pagination: QuoteState['pagination']) => void;
  setFilters: (filters: QuoteFilters) => void;
  
  // API Actions
  fetchQuotes: (filters?: QuoteFilters, pagination?: QuotePaginationOptions) => Promise<void>;
  fetchQuoteById: (id: string) => Promise<void>;
  fetchQuoteByNumber: (quoteNumber: string) => Promise<void>;
  fetchStats: (filters?: QuoteFilters) => Promise<void>;
  createQuote: (data: CreateQuoteData) => Promise<Quote>;
  updateQuote: (id: string, data: UpdateQuoteData) => Promise<Quote>;
  updateQuoteStatus: (id: string, status: string) => Promise<Quote>;
  deleteQuote: (id: string) => Promise<void>;
  duplicateQuote: (id: string, projectName: string) => Promise<Quote>;
  
  // Utility Actions
  clearError: () => void;
  clearCurrentQuote: () => void;
  resetFilters: () => void;
}

const useQuoteStore = create<QuoteState>()(
  devtools(
    (set, get) => ({
      // Initial state
      quotes: [],
      currentQuote: null,
      stats: null,
      loading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      },
      filters: {},
      
      // Basic setters
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setQuotes: (quotes) => set({ quotes }),
      setCurrentQuote: (quote) => set({ currentQuote: quote }),
      setStats: (stats) => set({ stats }),
      setPagination: (pagination) => set({ pagination }),
      setFilters: (filters) => set({ filters }),
      
      // API Actions
      fetchQuotes: async (filters = {}, pagination = { page: 1, limit: 20 }) => {
        try {
          set({ loading: true, error: null });
          
          const response = await quoteService.listQuotes(filters, pagination);
          
          set({
            quotes: response.quotes,
            pagination: response.pagination,
            filters,
            loading: false
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to fetch quotes';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },
      
      fetchQuoteById: async (id) => {
        try {
          set({ loading: true, error: null });
          
          const quote = await quoteService.getQuoteById(id);
          
          set({ currentQuote: quote, loading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to fetch quote';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },
      
      fetchQuoteByNumber: async (quoteNumber) => {
        try {
          set({ loading: true, error: null });
          
          const quote = await quoteService.getQuoteByNumber(quoteNumber);
          
          set({ currentQuote: quote, loading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to fetch quote';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },
      
      fetchStats: async (filters = {}) => {
        try {
          set({ loading: true, error: null });
          
          const stats = await quoteService.getQuoteStats(filters);
          
          set({ stats, loading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to fetch stats';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },
      
      createQuote: async (data) => {
        try {
          set({ loading: true, error: null });
          
          const quote = await quoteService.createQuote(data);
          
          // Add to quotes list
          const { quotes } = get();
          set({ quotes: [quote, ...quotes], loading: false });
          
          return quote;
        } catch (error: any) {
          const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to create quote';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },
      
      updateQuote: async (id, data) => {
        try {
          set({ loading: true, error: null });
          
          const quote = await quoteService.updateQuote(id, data);
          
          // Update in quotes list
          const { quotes } = get();
          const updatedQuotes = quotes.map(q => q.id === id ? quote : q);
          set({ quotes: updatedQuotes, currentQuote: quote, loading: false });
          
          return quote;
        } catch (error: any) {
          const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to update quote';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },
      
      updateQuoteStatus: async (id, status) => {
        try {
          set({ loading: true, error: null });
          
          const quote = await quoteService.updateQuoteStatus(id, status as any);
          
          // Update in quotes list
          const { quotes } = get();
          const updatedQuotes = quotes.map(q => q.id === id ? quote : q);
          set({ quotes: updatedQuotes, currentQuote: quote, loading: false });
          
          return quote;
        } catch (error: any) {
          const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to update quote status';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },
      
      deleteQuote: async (id) => {
        try {
          set({ loading: true, error: null });
          
          await quoteService.deleteQuote(id);
          
          // Remove from quotes list
          const { quotes } = get();
          const filteredQuotes = quotes.filter(q => q.id !== id);
          set({ quotes: filteredQuotes, loading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to delete quote';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },
      
      duplicateQuote: async (id, projectName) => {
        try {
          set({ loading: true, error: null });
          
          const quote = await quoteService.duplicateQuote(id, projectName);
          
          // Add to quotes list
          const { quotes } = get();
          set({ quotes: [quote, ...quotes], loading: false });
          
          return quote;
        } catch (error: any) {
          const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to duplicate quote';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },
      
      // Utility Actions
      clearError: () => set({ error: null }),
      clearCurrentQuote: () => set({ currentQuote: null }),
      resetFilters: () => set({ filters: {} })
    }),
    {
      name: 'quote-store',
      partialize: (state) => ({
        filters: state.filters,
        pagination: state.pagination
      })
    }
  )
);

export default useQuoteStore;
