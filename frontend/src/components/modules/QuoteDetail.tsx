/**
 * Quote Detail Component
 * 
 * Comprehensive detail view for quotes with line items, client info, and actions.
 * Includes status updates, editing, and duplication capabilities.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box as MuiBox
} from '@mui/material';
import {
  Edit as EditIcon,
  ContentCopy as DuplicateIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { 
  quoteService, 
  Quote, 
  QuoteStatus 
} from '../../services/quote.service';

interface QuoteDetailProps {
  quote: Quote;
  onEdit: (quote: Quote) => void;
  onDelete: (quote: Quote) => void;
  onDuplicate: (quote: Quote) => void;
  onStatusChange: (quote: Quote, status: QuoteStatus) => void;
}

const QuoteDetail: React.FC<QuoteDetailProps> = ({
  quote,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange
}) => {
  const [statusDialog, setStatusDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [duplicateDialog, setDuplicateDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState(`${quote.project_name} (Copy)`);

  // Debug logging in development (only on mount/update)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('QuoteDetail - Raw quote data:', quote);
      console.log('QuoteDetail - Subtotal type:', typeof quote.subtotal, quote.subtotal);
      console.log('QuoteDetail - Tax type:', typeof quote.tax, quote.tax);
      console.log('QuoteDetail - Total type:', typeof quote.total, quote.total);
      if (quote.line_items && quote.line_items.length > 0) {
        console.log('QuoteDetail - First line item:', quote.line_items[0]);
      }
    }
  }, [quote.id]); // Only log when quote ID changes

  // Validate quote data
  if (!quote) {
    return (
      <Alert severity="error">
        Quote data is not available.
      </Alert>
    );
  }

  // Check for required nested objects
  if (!quote.client) {
    console.error('Quote missing client:', quote);
    return (
      <Alert severity="error">
        Quote is missing client information.
      </Alert>
    );
  }

  if (!quote.creator) {
    console.error('Quote missing creator:', quote);
    return (
      <Alert severity="error">
        Quote is missing creator information.
      </Alert>
    );
  }

  // Validate client has required fields
  if (typeof quote.client.name !== 'string' || typeof quote.client.type !== 'string') {
    console.error('Client data invalid:', quote.client);
    return (
      <Alert severity="error">
        Client data is malformed. Name: {typeof quote.client.name}, Type: {typeof quote.client.type}
      </Alert>
    );
  }

  // Validate creator has required fields
  if (typeof quote.creator.first_name !== 'string' || typeof quote.creator.last_name !== 'string') {
    console.error('Creator data invalid:', quote.creator);
    return (
      <Alert severity="error">
        Creator data is malformed. First: {typeof quote.creator.first_name}, Last: {typeof quote.creator.last_name}
      </Alert>
    );
  }

  if (!Array.isArray(quote.line_items)) {
    console.error('Quote line items invalid:', { 
      lineItemsType: typeof quote.line_items,
      lineItems: quote.line_items 
    });
    return (
      <Alert severity="error">
        Quote line items are invalid (not an array).
      </Alert>
    );
  }

  const handleStatusChange = (newStatus: QuoteStatus) => {
    onStatusChange(quote, newStatus);
    setStatusDialog(false);
  };

  const handleDelete = () => {
    onDelete(quote);
    setDeleteDialog(false);
  };

  const handleDuplicate = () => {
    onDuplicate(quote);
    setDuplicateDialog(false);
  };

  const getStatusActions = () => {
    switch (quote.status) {
      case QuoteStatus.DRAFT:
        return [
          <Button
            key="send"
            variant="contained"
            startIcon={<SendIcon />}
            onClick={() => handleStatusChange(QuoteStatus.SENT)}
            sx={{ mr: 1 }}
          >
            Send Quote
          </Button>
        ];
      case QuoteStatus.SENT:
        return [
          <Button
            key="pending"
            variant="contained"
            color="warning"
            startIcon={<CheckIcon />}
            onClick={() => handleStatusChange(QuoteStatus.PENDING)}
            sx={{ mr: 1 }}
          >
            Mark as Pending
          </Button>
        ];
      case QuoteStatus.PENDING:
        return [
          <Button
            key="accept"
            variant="contained"
            color="success"
            startIcon={<CheckIcon />}
            onClick={() => handleStatusChange(QuoteStatus.ACCEPTED)}
            sx={{ mr: 1 }}
          >
            Accept
          </Button>,
          <Button
            key="reject"
            variant="contained"
            color="error"
            startIcon={<CloseIcon />}
            onClick={() => handleStatusChange(QuoteStatus.REJECTED)}
            sx={{ mr: 1 }}
          >
            Reject
          </Button>
        ];
      default:
        return [];
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {quote.quote_number}
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {quote.project_name}
          </Typography>
          <Chip
            label={quoteService.getStatusDisplayText(quote.status)}
            color={quoteService.getStatusColor(quote.status)}
            size="medium"
          />
        </Box>
        <Box display="flex" gap={1}>
          {getStatusActions()}
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => onEdit(quote)}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            startIcon={<DuplicateIcon />}
            onClick={() => setDuplicateDialog(true)}
          >
            Duplicate
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            Print
          </Button>
          <IconButton
            color="error"
            onClick={() => setDeleteDialog(true)}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
        {/* Client Information */}
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Client Information
              </Typography>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Client Name
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {quote.client.name}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  Client Type
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {quote.client.type}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Quote Information */}
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quote Information
              </Typography>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Created By
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {quote.creator.first_name} {quote.creator.last_name}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  Created Date
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {new Date(quote.created_at).toLocaleDateString()}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  Valid Until
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : 'No expiration'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Line Items */}
      <Box mt={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Line Items
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell align="center" width={100}>Qty</TableCell>
                      <TableCell align="center" width={80}>Unit</TableCell>
                      <TableCell align="right" width={120}>Unit Price</TableCell>
                      <TableCell align="right" width={120}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {quote.line_items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2">
                            {item.description}
                          </Typography>
                          {item.notes && (
                            <Typography variant="caption" color="text.secondary">
                              {item.notes}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {item.quantity}
                        </TableCell>
                        <TableCell align="center">
                          {item.unit}
                        </TableCell>
                        <TableCell align="right">
                          {quoteService.formatCurrency(item.unit_price)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {quoteService.formatCurrency(item.total)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Totals */}
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Box width={300}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2">
                      {quoteService.formatCurrency(quote.subtotal)}
                    </Typography>
                  </Box>
                  {quote.tax && (
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Tax (8%):</Typography>
                      <Typography variant="body2">
                        {quoteService.formatCurrency(quote.tax)}
                      </Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {quoteService.formatCurrency(quote.total)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

      {/* Notes */}
      {quote.notes && (
        <Box mt={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notes
              </Typography>
              <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                {quote.notes}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Status Change Dialog */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)}>
        <DialogTitle>Change Quote Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value=""
              onChange={(e) => handleStatusChange(e.target.value as QuoteStatus)}
              label="New Status"
            >
              {Object.values(QuoteStatus).map((status) => (
                <MenuItem key={status} value={status}>
                  <Chip
                    label={quoteService.getStatusDisplayText(status)}
                    color={quoteService.getStatusColor(status)}
                    size="small"
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Quote</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete quote "{quote.quote_number}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Duplicate Dialog */}
      <Dialog open={duplicateDialog} onClose={() => setDuplicateDialog(false)}>
        <DialogTitle>Duplicate Quote</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="New Project Name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDuplicateDialog(false)}>Cancel</Button>
          <Button onClick={handleDuplicate} variant="contained">
            Duplicate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuoteDetail;
