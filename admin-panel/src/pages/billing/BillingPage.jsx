import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Stack, Avatar, InputAdornment, Tooltip, CircularProgress
} from '@mui/material';
import { Add, Delete, Search, Receipt, CheckCircle } from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';

const statusColors = { Paid: 'success', Pending: 'warning', Overdue: 'error' };

const emptyItem = { description: '', quantity: 1, unit_price: 0 };

const today = new Date().toISOString().split('T')[0];

const emptyForm = {
  owner_id: '', appointment_id: '', invoice_date: today, due_date: '', notes: '',
  items: [{ ...emptyItem }]
};

const BillingPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [confirmPay, setConfirmPay] = useState({ open: false, id: null });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => { fetchInvoices(); }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/invoices');
      setInvoices(res.data.data || res.data || []);
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleItemChange = (index, field, value) => {
    const items = [...formData.items];
    items[index] = { ...items[index], [field]: value };
    setFormData({ ...formData, items });
  };

  const addItem = () => setFormData({ ...formData, items: [...formData.items, { ...emptyItem }] });

  const removeItem = (index) => {
    const items = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: items.length ? items : [{ ...emptyItem }] });
  };

  const totalAmount = formData.items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
  }, 0);

  const handleSubmit = async () => {
    try {
      await api.post('/invoices', { ...formData, total_amount: totalAmount });
      toast.success('Invoice created successfully!');
      setOpenDialog(false);
      setFormData(emptyForm);
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create invoice');
    }
  };

  const handleMarkPaid = async () => {
    try {
      await api.put(`/invoices/${confirmPay.id}/pay`);
      toast.success('Invoice marked as paid!');
      setConfirmPay({ open: false, id: null });
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update invoice');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/invoices/${confirmDelete.id}`);
      toast.success('Invoice deleted successfully!');
      setConfirmDelete({ open: false, id: null });
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete invoice');
    }
  };

  const thisMonth = new Date().toISOString().slice(0, 7);
  const stats = {
    totalRevenue: invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (parseFloat(i.total_amount) || 0), 0),
    monthRevenue: invoices.filter(i => i.status === 'Paid' && (i.invoice_date || '').startsWith(thisMonth))
      .reduce((s, i) => s + (parseFloat(i.total_amount) || 0), 0),
    pendingAmount: invoices.filter(i => i.status === 'Pending').reduce((s, i) => s + (parseFloat(i.total_amount) || 0), 0),
    pendingCount: invoices.filter(i => i.status === 'Pending').length,
  };

  const filtered = invoices.filter(inv => {
    const matchSearch = !searchTerm ||
      (inv.owner_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(inv.invoice_id || inv.id || '').includes(searchTerm);
    const matchStatus = !statusFilter || inv.status === statusFilter;
    const matchFrom = !dateFrom || (inv.invoice_date || '') >= dateFrom;
    const matchTo = !dateTo || (inv.invoice_date || '') <= dateTo;
    return matchSearch && matchStatus && matchFrom && matchTo;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="#1e3a8a">Billing & Invoices</Typography>
          <Typography variant="body2" color="text.secondary">Manage invoices and track payments</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setFormData(emptyForm); setOpenDialog(true); }}
          sx={{ bgcolor: '#1e3a8a', '&:hover': { bgcolor: '#1e40af' } }}>
          Create Invoice
        </Button>
      </Box>

      <Grid container spacing={3} mb={3}>
        {[
          { label: 'Total Revenue (LKR)', value: `LKR ${stats.totalRevenue.toLocaleString()}`, color: '#10b981' },
          { label: 'This Month Revenue', value: `LKR ${stats.monthRevenue.toLocaleString()}`, color: '#1e3a8a' },
          { label: 'Pending Amount', value: `LKR ${stats.pendingAmount.toLocaleString()}`, color: '#f59e0b' },
          { label: 'Pending Invoices', value: stats.pendingCount, color: '#dc2626' },
        ].map((s, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>{s.label}</Typography>
                    <Typography variant="h5" fontWeight="bold" color="#1e3a8a">{s.value}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: s.color, width: 56, height: 56 }}><Receipt /></Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <TextField placeholder="Search invoices..." size="small" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
              sx={{ width: 280 }} />
            <TextField select size="small" label="Status" value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)} sx={{ width: 150 }}>
              <MenuItem value="">All Statuses</MenuItem>
              {['Paid', 'Pending', 'Overdue'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField size="small" label="From" type="date" value={dateFrom}
              onChange={e => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 170 }} />
            <TextField size="small" label="To" type="date" value={dateTo}
              onChange={e => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 170 }} />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#1e3a8a' }}>
                <TableRow>
                  {['Invoice #', 'Owner', 'Date', 'Due Date', 'Total (LKR)', 'Status', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No records found</Typography>
                  </TableCell></TableRow>
                ) : filtered.map((inv, i) => (
                  <TableRow key={inv.invoice_id || inv.id || i} hover>
                    <TableCell>#{inv.invoice_id || inv.id}</TableCell>
                    <TableCell>{inv.owner_name || inv.owner_id || '-'}</TableCell>
                    <TableCell>{inv.invoice_date?.split('T')[0] || '-'}</TableCell>
                    <TableCell>{inv.due_date?.split('T')[0] || '-'}</TableCell>
                    <TableCell>LKR {parseFloat(inv.total_amount || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip label={inv.status} color={statusColors[inv.status] || 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      {inv.status === 'Pending' && (
                        <Tooltip title="Mark as Paid">
                          <IconButton size="small" color="success"
                            onClick={() => setConfirmPay({ open: true, id: inv.invoice_id || inv.id })}>
                            <CheckCircle fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error"
                          onClick={() => setConfirmDelete({ open: true, id: inv.invoice_id || inv.id })}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>➕ Create Invoice</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField fullWidth label="Owner ID" name="owner_id" value={formData.owner_id} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Appointment ID (optional)" name="appointment_id" value={formData.appointment_id} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Invoice Date" name="invoice_date" type="date" value={formData.invoice_date}
                  onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Due Date" name="due_date" type="date" value={formData.due_date}
                  onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>

            <Typography variant="subtitle1" fontWeight={600}>Invoice Items</Typography>
            {formData.items.map((item, index) => (
              <Grid container spacing={1} key={index} alignItems="center">
                <Grid item xs={5}>
                  <TextField fullWidth size="small" label="Description" value={item.description}
                    onChange={e => handleItemChange(index, 'description', e.target.value)} />
                </Grid>
                <Grid item xs={2}>
                  <TextField fullWidth size="small" label="Qty" type="number" value={item.quantity}
                    onChange={e => handleItemChange(index, 'quantity', e.target.value)} />
                </Grid>
                <Grid item xs={3}>
                  <TextField fullWidth size="small" label="Unit Price" type="number" value={item.unit_price}
                    onChange={e => handleItemChange(index, 'unit_price', e.target.value)} />
                </Grid>
                <Grid item xs={2}>
                  <Button size="small" color="error" onClick={() => removeItem(index)}>Remove</Button>
                </Grid>
              </Grid>
            ))}
            <Button variant="outlined" onClick={addItem} sx={{ alignSelf: 'flex-start' }}>+ Add Item</Button>
            <Typography variant="h6" fontWeight="bold" color="#1e3a8a">
              Total: LKR {totalAmount.toLocaleString()}
            </Typography>
            <TextField fullWidth label="Notes" name="notes" value={formData.notes} onChange={handleInputChange} multiline rows={3} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#1e3a8a', '&:hover': { bgcolor: '#1e40af' } }}>
            Create Invoice
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmPay.open} onClose={() => setConfirmPay({ open: false, id: null })} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Payment</DialogTitle>
        <DialogContent><Typography>Mark this invoice as paid?</Typography></DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setConfirmPay({ open: false, id: null })}>Cancel</Button>
          <Button onClick={handleMarkPaid} variant="contained" color="success">Mark as Paid</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDelete.open} onClose={() => setConfirmDelete({ open: false, id: null })} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Are you sure you want to delete this invoice?</Typography></DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setConfirmDelete({ open: false, id: null })}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BillingPage;
