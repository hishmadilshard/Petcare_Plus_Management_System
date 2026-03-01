import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  InputAdornment,
  MenuItem,
  Paper,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  AttachMoney,
  Receipt,
  CheckCircle
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../../services/api';

const STATUS_COLORS = {
  Paid: 'success',
  Pending: 'warning',
  Overdue: 'error'
};

const defaultForm = {
  owner_id: '',
  pet_id: '',
  service_description: '',
  amount: '',
  due_date: ''
};

const BillingPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [owners, setOwners] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchOwners();
    fetchPets();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/invoices');
      if (response.data.success) {
        setInvoices(response.data.data || []);
      }
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchOwners = async () => {
    try {
      const response = await api.get('/pet-owners');
      if (response.data.success) {
        setOwners(response.data.data.owners || response.data.data || []);
      }
    } catch {
      toast.error('Failed to load owners');
    }
  };

  const fetchPets = async () => {
    try {
      const response = await api.get('/pets');
      if (response.data.success) {
        setPets(response.data.data.pets || response.data.data || []);
      }
    } catch {
      toast.error('Failed to load pets');
    }
  };

  const handleOpenDialog = () => {
    setFormData(defaultForm);
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData(defaultForm);
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormErrors({ ...formErrors, [e.target.name]: '' });
  };

  const validate = () => {
    const errors = {};
    if (!formData.owner_id) errors.owner_id = 'Owner is required';
    if (!formData.service_description.trim()) errors.service_description = 'Service description is required';
    if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0)
      errors.amount = 'Valid amount is required';
    if (!formData.due_date) errors.due_date = 'Due date is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      await api.post('/invoices', { ...formData, amount: Number(formData.amount) });
      toast.success('Invoice created successfully!');
      handleCloseDialog();
      fetchInvoices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (id) => {
    try {
      await api.put(`/invoices/${id}/pay`);
      toast.success('Invoice marked as paid!');
      fetchInvoices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update invoice');
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount) => {
    if (amount == null) return '-';
    return `LKR ${Number(amount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
  };

  const now = new Date();
  const thisMonth = invoices.filter(inv => {
    if (!inv.paid_date && inv.status !== 'Paid') return false;
    const d = new Date(inv.paid_date || inv.invoice_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalRevenue = invoices
    .filter(i => i.status === 'Paid')
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);

  const pendingAmount = invoices
    .filter(i => i.status === 'Pending')
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);

  const paidThisMonth = thisMonth.reduce((sum, i) => sum + Number(i.amount || 0), 0);

  const filtered = invoices.filter(inv => {
    const matchSearch = !searchTerm ||
      (inv.owner_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(inv.invoice_id || '').includes(searchTerm);
    const matchStatus = !filterStatus || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Billing & Invoices
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenDialog} size="large">
          Create Invoice
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={2} sx={{ borderLeft: '4px solid #2e7d32' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney sx={{ color: '#2e7d32' }} />
                <Typography color="text.secondary" variant="body2">Total Revenue (Paid)</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: '#2e7d32', mt: 1 }}>
                {formatCurrency(totalRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={2} sx={{ borderLeft: '4px solid #ed6c02' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Receipt sx={{ color: '#ed6c02' }} />
                <Typography color="text.secondary" variant="body2">Pending Amount</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: '#ed6c02', mt: 1 }}>
                {formatCurrency(pendingAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={2} sx={{ borderLeft: '4px solid #1976d2' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle sx={{ color: '#1976d2' }} />
                <Typography color="text.secondary" variant="body2">Paid This Month</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mt: 1 }}>
                {formatCurrency(paidThisMonth)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by owner name or invoice #..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Filter by Status"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start"><FilterList /></InputAdornment>
              }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {['Paid', 'Pending', 'Overdue'].map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              Showing {filtered.length} of {invoices.length} invoices
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><strong>Invoice #</strong></TableCell>
              <TableCell><strong>Owner Name</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Total Amount</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Receipt sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">No invoices found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(inv => (
                <TableRow key={inv.invoice_id} hover>
                  <TableCell>#{inv.invoice_id}</TableCell>
                  <TableCell>{inv.owner_name || '-'}</TableCell>
                  <TableCell>{formatDate(inv.invoice_date)}</TableCell>
                  <TableCell>
                    <Typography fontWeight="bold">{formatCurrency(inv.amount)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={inv.status || 'Pending'}
                      color={STATUS_COLORS[inv.status] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {inv.status !== 'Paid' && (
                      <Tooltip title="Mark as Paid">
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          startIcon={<CheckCircle />}
                          onClick={() => handleMarkAsPaid(inv.invoice_id)}
                          sx={{ mr: 1 }}
                        >
                          Pay
                        </Button>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Invoice Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create Invoice</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Owner *"
                name="owner_id"
                value={formData.owner_id}
                onChange={handleInputChange}
                error={!!formErrors.owner_id}
                helperText={formErrors.owner_id}
              >
                {owners.map(o => (
                  <MenuItem key={o.owner_id} value={o.owner_id}>{o.full_name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Pet"
                name="pet_id"
                value={formData.pet_id}
                onChange={handleInputChange}
              >
                <MenuItem value="">Not Specified</MenuItem>
                {pets.map(p => (
                  <MenuItem key={p.pet_id} value={p.pet_id}>
                    {p.pet_name} ({p.species})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Service Description *"
                name="service_description"
                value={formData.service_description}
                onChange={handleInputChange}
                error={!!formErrors.service_description}
                helperText={formErrors.service_description}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount (LKR) *"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleInputChange}
                error={!!formErrors.amount}
                helperText={formErrors.amount}
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Due Date *"
                name="due_date"
                type="date"
                value={formData.due_date}
                onChange={handleInputChange}
                error={!!formErrors.due_date}
                helperText={formErrors.due_date}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Invoice'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BillingPage;
