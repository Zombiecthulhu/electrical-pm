/**
 * Quote Management Page
 * 
 * Main page for quote management with list, detail, and form views.
 * Handles navigation between different quote management interfaces.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Snackbar,
  Alert,
  Dialog,
  DialogContent,
  Backdrop,
  CircularProgress
} from '@mui/material';
import { useQuoteStore } from '../store/quote.store';
import { Quote, CreateQuoteData, UpdateQuoteData, QuoteStatus } from '../services/quote.service';
import QuoteList from '../components/modules/QuoteList';
import QuoteDetail from '../components/modules/QuoteDetail';
import QuoteForm from '../components/modules/QuoteForm';

type ViewMode = 'list' | 'detail' | 'create' | 'edit';

const QuoteManagement: React.FC = () => {
  const {
    currentQuote,
    loading,
    error,
    fetchQuoteById,
    createQuote,
    updateQuote,
    updateQuoteStatus,
    deleteQuote,
    duplicateQuote,
    clearError
  } = useQuoteStore();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Handle view mode changes
  const handleViewQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setViewMode('detail');
  };

  const handleEditQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setViewMode('edit');
  };

  const handleCreateQuote = () => {
    setSelectedQuote(null);
    setViewMode('create');
  };

  const handleBackToList = () => {
    setSelectedQuote(null);
    setViewMode('list');
  };

  // Handle quote operations
  const handleSaveQuote = async (data: CreateQuoteData | UpdateQuoteData) => {
    try {
      if (viewMode === 'create') {
        await createQuote(data as CreateQuoteData);
        setSuccessMessage('Quote created successfully');
      } else if (viewMode === 'edit' && selectedQuote) {
        await updateQuote(selectedQuote.id, data as UpdateQuoteData);
        setSuccessMessage('Quote updated successfully');
      }
      setViewMode('list');
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleDeleteQuote = async (quote: Quote) => {
    try {
      await deleteQuote(quote.id);
      setSuccessMessage('Quote deleted successfully');
      if (viewMode === 'detail' && selectedQuote?.id === quote.id) {
        setViewMode('list');
      }
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleDuplicateQuote = async (quote: Quote) => {
    try {
      const projectName = `${quote.project_name} (Copy)`;
      await duplicateQuote(quote.id, projectName);
      setSuccessMessage('Quote duplicated successfully');
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleStatusChange = async (quote: Quote, status: QuoteStatus) => {
    try {
      await updateQuoteStatus(quote.id, status);
      setSuccessMessage(`Quote status updated to ${status.toLowerCase()}`);
      // Refresh the current quote if it's the same one
      if (selectedQuote?.id === quote.id) {
        await fetchQuoteById(quote.id);
        setSelectedQuote(currentQuote);
      }
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleCancelForm = () => {
    setViewMode('list');
  };

  // Load quote details when in detail/edit mode
  useEffect(() => {
    if ((viewMode === 'detail' || viewMode === 'edit') && selectedQuote) {
      fetchQuoteById(selectedQuote.id);
    }
  }, [viewMode, selectedQuote, fetchQuoteById]);

  // Update selected quote when current quote changes
  useEffect(() => {
    if (currentQuote && (viewMode === 'detail' || viewMode === 'edit')) {
      setSelectedQuote(currentQuote);
    }
  }, [currentQuote, viewMode]);

  const renderContent = () => {
    switch (viewMode) {
      case 'list':
        return (
          <QuoteList
            onViewQuote={handleViewQuote}
            onEditQuote={handleEditQuote}
            onCreateQuote={handleCreateQuote}
          />
        );

      case 'detail':
        return selectedQuote ? (
          <QuoteDetail
            quote={selectedQuote}
            onEdit={handleEditQuote}
            onDelete={handleDeleteQuote}
            onDuplicate={handleDuplicateQuote}
            onStatusChange={handleStatusChange}
          />
        ) : null;

      case 'create':
        return (
          <QuoteForm
            onSave={handleSaveQuote}
            onCancel={handleCancelForm}
            loading={loading}
          />
        );

      case 'edit':
        return selectedQuote ? (
          <QuoteForm
            quote={selectedQuote}
            onSave={handleSaveQuote}
            onCancel={handleCancelForm}
            loading={loading}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Main Content */}
      {renderContent()}

      {/* Loading Backdrop */}
      <Backdrop open={loading} sx={{ zIndex: 9999 }}>
        <CircularProgress color="primary" />
      </Backdrop>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={clearError}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={clearError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default QuoteManagement;
