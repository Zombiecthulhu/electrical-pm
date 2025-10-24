/**
 * Quote Form Component
 * 
 * Comprehensive form for creating and editing quotes with line items management.
 * Includes validation, calculations, and client selection.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  quoteService, 
  CreateQuoteData, 
  UpdateQuoteData, 
  LineItem, 
  QuoteStatus 
} from '../../services/quote.service';
import { useClientStore } from '../../store/client.store';

interface QuoteFormProps {
  quote?: any; // Quote for editing
  onSave: (data: CreateQuoteData | UpdateQuoteData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface FormData {
  client_id: string;
  project_name: string;
  line_items: LineItem[];
  notes: string;
  valid_until: Date | null;
  status: QuoteStatus;
  subtotal?: number;
  tax?: number;
  total?: number;
}

const QuoteForm: React.FC<QuoteFormProps> = ({
  quote,
  onSave,
  onCancel,
  loading = false
}) => {
  const { clients, loadClients } = useClientStore();
  const [lineItemErrors, setLineItemErrors] = useState<Record<string, string[]>>({});
  const [showCalculations, setShowCalculations] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<FormData>({
    defaultValues: {
      client_id: quote?.client_id || '',
      project_name: quote?.project_name || '',
      line_items: quote?.line_items || [quoteService.generateLineItem()],
      notes: quote?.notes || '',
      valid_until: quote?.valid_until ? new Date(quote.valid_until) : null,
      status: quote?.status || QuoteStatus.DRAFT
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'line_items'
  });

  const watchedLineItems = watch('line_items');

  // Load clients on mount
  useEffect(() => {
    if (clients.length === 0) {
      loadClients();
    }
  }, [clients.length, loadClients]);

  // Calculate totals when line items change
  useEffect(() => {
    const totals = quoteService.calculateLineItemTotals(watchedLineItems);
    setValue('subtotal', totals.subtotal);
    setValue('tax', totals.tax);
    setValue('total', totals.total);
  }, [watchedLineItems, setValue]);

  const handleAddLineItem = () => {
    append(quoteService.generateLineItem());
  };

  const handleRemoveLineItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const handleLineItemChange = (index: number, field: keyof LineItem, value: any) => {
    const updatedItems = [...watchedLineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate total for this item
    if (field === 'quantity' || field === 'unit_price') {
      const item = updatedItems[index];
      item.total = item.quantity * item.unit_price;
    }
    
    setValue('line_items', updatedItems);
  };

  const validateLineItems = () => {
    const validation = quoteService.validateLineItems(watchedLineItems);
    const errors: Record<string, string[]> = {};
    
    if (!validation.isValid) {
      watchedLineItems.forEach((_, index) => {
        const itemErrors = quoteService.validateLineItem(watchedLineItems[index]);
        if (itemErrors.length > 0) {
          errors[index] = itemErrors;
        }
      });
    }
    
    setLineItemErrors(errors);
    return validation.isValid;
  };

  const onSubmit = async (data: FormData) => {
    if (!validateLineItems()) {
      return;
    }

    const quoteData = {
      ...data,
      valid_until: data.valid_until?.toISOString(),
      subtotal: quoteService.calculateLineItemTotals(data.line_items).subtotal,
      tax: quoteService.calculateLineItemTotals(data.line_items).tax,
      total: quoteService.calculateLineItemTotals(data.line_items).total
    };

    await onSave(quoteData);
  };

  const totals = quoteService.calculateLineItemTotals(watchedLineItems);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {quote ? 'Edit Quote' : 'Create New Quote'}
            </Typography>

            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
              {/* Client Selection */}
              <Box>
                <Controller
                  name="client_id"
                  control={control}
                  rules={{ required: 'Client is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.client_id}>
                      <InputLabel>Client</InputLabel>
                      <Select
                        {...field}
                        label="Client"
                        disabled={loading}
                      >
                        {clients.map((client) => (
                          <MenuItem key={client.id} value={client.id}>
                            {client.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
                {errors.client_id && (
                  <Typography color="error" variant="caption">
                    {errors.client_id.message}
                  </Typography>
                )}
              </Box>

              {/* Project Name */}
              <Box>
                <Controller
                  name="project_name"
                  control={control}
                  rules={{ required: 'Project name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Project Name"
                      error={!!errors.project_name}
                      helperText={errors.project_name?.message}
                      disabled={loading}
                    />
                  )}
                />
              </Box>

              {/* Status */}
              <Box>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        {...field}
                        label="Status"
                        disabled={loading}
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
                  )}
                />
              </Box>

              {/* Valid Until */}
              <Box>
                <Controller
                  name="valid_until"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      label="Valid Until"
                      disabled={loading}
                      slotProps={{
                        textField: {
                          fullWidth: true
                        }
                      }}
                    />
                  )}
                />
              </Box>
            </Box>

            <Box mt={3}>
              {/* Notes */}
              <Box>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={3}
                      label="Notes"
                      disabled={loading}
                    />
                  )}
                />
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Line Items Section */}
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Line Items</Typography>
                <Box>
                  <Button
                    startIcon={<CalculateIcon />}
                    onClick={() => setShowCalculations(!showCalculations)}
                    size="small"
                  >
                    {showCalculations ? 'Hide' : 'Show'} Calculations
                  </Button>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddLineItem}
                    disabled={loading}
                    size="small"
                    sx={{ ml: 1 }}
                  >
                    Add Item
                  </Button>
                </Box>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell align="center" width={100}>Qty</TableCell>
                      <TableCell align="center" width={80}>Unit</TableCell>
                      <TableCell align="right" width={120}>Unit Price</TableCell>
                      <TableCell align="right" width={120}>Total</TableCell>
                      <TableCell align="center" width={60}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            value={watchedLineItems[index]?.description || ''}
                            onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                            error={!!lineItemErrors[index]?.some(err => err.includes('Description'))}
                            disabled={loading}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={watchedLineItems[index]?.quantity || 0}
                            onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            error={!!lineItemErrors[index]?.some(err => err.includes('Quantity'))}
                            disabled={loading}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={watchedLineItems[index]?.unit || ''}
                            onChange={(e) => handleLineItemChange(index, 'unit', e.target.value)}
                            error={!!lineItemErrors[index]?.some(err => err.includes('Unit'))}
                            disabled={loading}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={watchedLineItems[index]?.unit_price || 0}
                            onChange={(e) => handleLineItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            error={!!lineItemErrors[index]?.some(err => err.includes('Unit price'))}
                            disabled={loading}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={watchedLineItems[index]?.total || 0}
                            disabled
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            onClick={() => handleRemoveLineItem(index)}
                            disabled={loading || fields.length === 1}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Line Item Errors */}
              {Object.keys(lineItemErrors).length > 0 && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {Object.entries(lineItemErrors).map(([index, errors]) => (
                    <div key={index}>
                      Line item {parseInt(index) + 1}: {errors.join(', ')}
                    </div>
                  ))}
                </Alert>
              )}
            </Box>

            {/* Calculations */}
            {showCalculations && (
              <Box mt={3}>
                <Typography variant="h6" gutterBottom>Calculations</Typography>
                <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2}>
                  <Box>
                    <TextField
                      label="Subtotal"
                      value={quoteService.formatCurrency(totals.subtotal)}
                      disabled
                      fullWidth
                    />
                  </Box>
                  <Box>
                    <TextField
                      label="Tax (8%)"
                      value={quoteService.formatCurrency(totals.tax)}
                      disabled
                      fullWidth
                    />
                  </Box>
                  <Box>
                    <TextField
                      label="Total"
                      value={quoteService.formatCurrency(totals.total)}
                      disabled
                      fullWidth
                      InputProps={{
                        sx: { fontWeight: 'bold', fontSize: '1.1rem' }
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            )}

            {/* Form Actions */}
            <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading || !isValid}
              >
                {loading ? 'Saving...' : (quote ? 'Update Quote' : 'Create Quote')}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default QuoteForm;
