import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Stack, Avatar, InputAdornment, Tooltip, CircularProgress, Alert
} from '@mui/material';
import { Add, Edit, Delete, Search, Inventory2 } from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';

const CATEGORIES = ['Medication', 'Vaccine', 'Equipment', 'Supplies', 'Food', 'Other'];

const getItemStatus = (item) => {
  const today = new Date().toISOString().split('T')[0];
  if (item.expiry_date && item.expiry_date.split('T')[0] < today) return 'Expired';
  if (item.quantity <= (item.reorder_level || 10)) return 'Low Stock';
  return 'OK';
};

const statusColors = { OK: 'success', 'Low Stock': 'error', Expired: 'default' };

const emptyForm = {
  item_name: '', category: 'Medication', description: '', quantity: 0,
  unit: '', unit_price: 0, reorder_level: 10, supplier: '', expiry_date: ''
};

const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [adjustDialog, setAdjustDialog] = useState({ open: false, id: null, name: '' });
  const [adjustData, setAdjustData] = useState({ adjustment: 0, reason: '' });
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory');
      setItems(res.data.data || res.data || []);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAdd = () => { setEditMode(false); setSelectedId(null); setFormData(emptyForm); setOpenDialog(true); };

  const handleEdit = (item) => {
    setEditMode(true);
    setSelectedId(item.item_id || item.id);
    setFormData({
      item_name: item.item_name || '',
      category: item.category || 'Medication',
      description: item.description || '',
      quantity: item.quantity || 0,
      unit: item.unit || '',
      unit_price: item.unit_price || 0,
      reorder_level: item.reorder_level || 10,
      supplier: item.supplier || '',
      expiry_date: item.expiry_date?.split('T')[0] || ''
    });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    try {
      if (editMode) {
        await api.put(`/inventory/${selectedId}`, formData);
        toast.success('Item updated successfully!');
      } else {
        await api.post('/inventory', formData);
        toast.success('Item added successfully!');
      }
      setOpenDialog(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save item');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/inventory/${confirmDelete.id}`);
      toast.success('Item deleted successfully!');
      setConfirmDelete({ open: false, id: null });
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete item');
    }
  };

  const handleAdjust = async () => {
    try {
      await api.put(`/inventory/${adjustDialog.id}/adjust`, adjustData);
      toast.success('Quantity adjusted successfully!');
      setAdjustDialog({ open: false, id: null, name: '' });
      setAdjustData({ adjustment: 0, reason: '' });
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to adjust quantity');
    }
  };

  const lowStockCount = items.filter(i => getItemStatus(i) === 'Low Stock').length;
  const expiredCount = items.filter(i => getItemStatus(i) === 'Expired').length;
  const totalValue = items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0), 0);

  const stats = {
    total: items.length,
    lowStock: lowStockCount,
    expired: expiredCount,
    totalValue,
  };

  const filtered = items.filter(item => {
    const matchSearch = !searchTerm ||
      (item.item_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.supplier || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = !categoryFilter || item.category === categoryFilter;
    const matchStatus = !statusFilter || getItemStatus(item) === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="#1e3a8a">Inventory</Typography>
          <Typography variant="body2" color="text.secondary">Manage clinic supplies and medications</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleAdd}
          sx={{ bgcolor: '#1e3a8a', '&:hover': { bgcolor: '#1e40af' } }}>
          Add Item
        </Button>
      </Box>

      {lowStockCount > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          ⚠️ {lowStockCount} item{lowStockCount > 1 ? 's are' : ' is'} low on stock. Please reorder soon.
        </Alert>
      )}

      <Grid container spacing={3} mb={3}>
        {[
          { label: 'Total Items', value: stats.total, color: '#1e3a8a' },
          { label: 'Low Stock', value: stats.lowStock, color: '#dc2626' },
          { label: 'Expired', value: stats.expired, color: '#64748b' },
          { label: 'Total Value (LKR)', value: `LKR ${stats.totalValue.toLocaleString()}`, color: '#10b981' },
        ].map((s, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>{s.label}</Typography>
                    <Typography variant="h5" fontWeight="bold" color="#1e3a8a">{s.value}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: s.color, width: 56, height: 56 }}><Inventory2 /></Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <TextField placeholder="Search inventory..." size="small" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
              sx={{ width: 280 }} />
            <TextField select size="small" label="Category" value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)} sx={{ width: 160 }}>
              <MenuItem value="">All Categories</MenuItem>
              {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Status" value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)} sx={{ width: 150 }}>
              <MenuItem value="">All Statuses</MenuItem>
              {['OK', 'Low Stock', 'Expired'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#1e3a8a' }}>
                <TableRow>
                  {['Item Name', 'Category', 'Quantity', 'Unit', 'Unit Price', 'Reorder Level', 'Expiry Date', 'Status', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No records found</Typography>
                  </TableCell></TableRow>
                ) : filtered.map((item, i) => (
                  <TableRow key={item.item_id || item.id || i} hover>
                    <TableCell>{item.item_name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit || '-'}</TableCell>
                    <TableCell>LKR {parseFloat(item.unit_price || 0).toLocaleString()}</TableCell>
                    <TableCell>{item.reorder_level || 10}</TableCell>
                    <TableCell>{item.expiry_date?.split('T')[0] || '-'}</TableCell>
                    <TableCell>
                      <Chip label={getItemStatus(item)} color={statusColors[getItemStatus(item)] || 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Adjust Quantity">
                        <IconButton size="small" color="info"
                          onClick={() => { setAdjustDialog({ open: true, id: item.item_id || item.id, name: item.item_name }); setAdjustData({ adjustment: 0, reason: '' }); }}>
                          <Inventory2 fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={() => handleEdit(item)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error"
                          onClick={() => setConfirmDelete({ open: true, id: item.item_id || item.id })}>
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

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? '✏️ Edit Item' : '➕ Add Inventory Item'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 2 }}>
            <TextField fullWidth label="Item Name" name="item_name" value={formData.item_name} onChange={handleInputChange} />
            <TextField fullWidth select label="Category" name="category" value={formData.category} onChange={handleInputChange}>
              {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
            <TextField fullWidth label="Description" name="description" value={formData.description} onChange={handleInputChange} multiline rows={2} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField fullWidth label="Quantity" name="quantity" type="number" value={formData.quantity} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Unit (e.g. bottles)" name="unit" value={formData.unit} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Unit Price (LKR)" name="unit_price" type="number" value={formData.unit_price} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Reorder Level" name="reorder_level" type="number" value={formData.reorder_level} onChange={handleInputChange} />
              </Grid>
            </Grid>
            <TextField fullWidth label="Supplier" name="supplier" value={formData.supplier} onChange={handleInputChange} />
            <TextField fullWidth label="Expiry Date" name="expiry_date" type="date" value={formData.expiry_date}
              onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#1e3a8a', '&:hover': { bgcolor: '#1e40af' } }}>
            {editMode ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Adjust Quantity Dialog */}
      <Dialog open={adjustDialog.open} onClose={() => setAdjustDialog({ open: false, id: null, name: '' })} maxWidth="xs" fullWidth>
        <DialogTitle>📦 Adjust Quantity — {adjustDialog.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 2 }}>
            <TextField fullWidth label="Adjustment (use - to decrease)" type="number"
              value={adjustData.adjustment}
              onChange={e => setAdjustData({ ...adjustData, adjustment: e.target.value })} />
            <TextField fullWidth label="Reason" value={adjustData.reason}
              onChange={e => setAdjustData({ ...adjustData, reason: e.target.value })} multiline rows={2} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setAdjustDialog({ open: false, id: null, name: '' })}>Cancel</Button>
          <Button onClick={handleAdjust} variant="contained" sx={{ bgcolor: '#1e3a8a', '&:hover': { bgcolor: '#1e40af' } }}>
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDelete.open} onClose={() => setConfirmDelete({ open: false, id: null })} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Are you sure you want to delete this item?</Typography></DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setConfirmDelete({ open: false, id: null })}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryPage;
