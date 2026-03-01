import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Tooltip,
  Grid
} from '@mui/material';
import {
  Add,
  Delete,
  AttachMoney,
  PendingActions,
  CheckCircle,
  Receipt
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const emptyForm = {
  owner_id: '',
  total_amount: '',
  due_date: '',
  notes: ''
};

const BillingPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({ total_revenue: 0, month_revenue: 0, pending_amount: 0, pending_count: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchInvoices();
    fetchStats();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setInvoices(response.data.data.invoices || response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/invoices/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStats(response.data.data || response.data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching invoice stats:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenDialog = () => {
    setFormData(emptyForm);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData(emptyForm);
  };

  const handleSubmit = async () => {
    if (!formData.owner_id || !formData.total_amount) {
      toast.error('Owner ID and total amount are required');
      return;
    }
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_URL}/invoices`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Invoice created successfully!');
      handleCloseDialog();
      fetchInvoices();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(`${API_URL}/invoices/${id}/pay`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Invoice marked as paid');
      fetchInvoices();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update invoice');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_URL}/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Invoice deleted');
      fetchInvoices();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete invoice');
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    if (statusFilter === 'All') return true;
    const paymentStatus = invoice.payment_status || invoice.status;
    return paymentStatus === statusFilter;
  });

  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    return `LKR ${num.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (val) => {
    if (!val) return '—';
    return new Date(val).toLocaleDateString();
  };

  const getStatusChip = (status) => {
    if (status === 'Paid') return <Chip label="Paid" color="success" size="small" />;
    return <Chip label="Pending" color="warning" size="small" />;
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
          💰 Billing & Invoices
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage invoices and track revenue
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AttachMoney color="primary" />
                <Typography variant="caption" color="text.secondary">Total Revenue</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                {formatCurrency(stats.total_revenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Receipt sx={{ color: 'success.main' }} />
                <Typography variant="caption" color="text.secondary">This Month</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold" color="success.main">
                {formatCurrency(stats.revenue_this_month)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PendingActions sx={{ color: 'warning.main' }} />
                <Typography variant="caption" color="text.secondary">Pending Amount</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold" color="warning.main">
                {formatCurrency(stats.pending_amount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PendingActions sx={{ color: 'error.main' }} />
                <Typography variant="caption" color="text.secondary">Pending Count</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {stats.pending_count || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <TextField
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              size="small"
              sx={{ width: 180 }}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Paid">Paid</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
            </TextField>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenDialog}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Create Invoice
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Invoice #</strong></TableCell>
                  <TableCell><strong>Owner</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Total (LKR)</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography>Loading invoices...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">No invoices found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => {
                    const id = invoice.invoice_id || invoice.id;
                    const paymentStatus = invoice.payment_status || invoice.status;
                    return (
                      <TableRow key={id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>#{id}</Typography>
                        </TableCell>
                        <TableCell>{invoice.owner_name || `Owner #${invoice.owner_id}`}</TableCell>
                        <TableCell>{formatDate(invoice.created_at || invoice.invoice_date)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(invoice.total_amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>{getStatusChip(paymentStatus)}</TableCell>
                        <TableCell align="right">
                          {paymentStatus !== 'Paid' && (
                            <Tooltip title="Mark as Paid">
                              <IconButton
                                color="success"
                                size="small"
                                onClick={() => handleMarkPaid(id)}
                              >
                                <CheckCircle fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleDelete(id)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>➕ Create Invoice</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Owner ID"
              name="owner_id"
              value={formData.owner_id}
              onChange={handleInputChange}
              placeholder="Enter owner ID"
            />
            <TextField
              fullWidth
              label="Total Amount (LKR)"
              name="total_amount"
              type="number"
              value={formData.total_amount}
              onChange={handleInputChange}
              inputProps={{ min: 0, step: '0.01' }}
            />
            <TextField
              fullWidth
              label="Due Date"
              name="due_date"
              type="date"
              value={formData.due_date}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleCloseDialog} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Create Invoice
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BillingPage;
