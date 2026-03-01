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
  CircularProgress,
  Badge
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Warning,
  Inventory2,
  AddCircle,
  RemoveCircle
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../../services/api';

const CATEGORIES = ['Medicine', 'Equipment', 'Supplies', 'Food'];

const defaultForm = {
  item_name: '',
  category: '',
  quantity: '',
  unit: '',
  reorder_level: '',
  expiry_date: '',
  supplier: ''
};

const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [openAdjustDialog, setOpenAdjustDialog] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustMode, setAdjustMode] = useState('add'); // 'add' | 'remove'

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inventory');
      if (response.data.success) {
        setItems(response.data.data || []);
      }
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditMode(false);
    setSelectedItem(null);
    setFormData(defaultForm);
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEdit = (item) => {
    setEditMode(true);
    setSelectedItem(item);
    setFormData({
      item_name: item.item_name || '',
      category: item.category || '',
      quantity: item.quantity ?? '',
      unit: item.unit || '',
      reorder_level: item.reorder_level ?? '',
      expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : '',
      supplier: item.supplier || ''
    });
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
    if (!formData.item_name.trim()) errors.item_name = 'Item name is required';
    if (!formData.category) errors.category = 'Category is required';
    if (formData.quantity === '' || isNaN(formData.quantity) || Number(formData.quantity) < 0)
      errors.quantity = 'Valid quantity is required';
    if (!formData.unit.trim()) errors.unit = 'Unit is required';
    if (formData.reorder_level === '' || isNaN(formData.reorder_level) || Number(formData.reorder_level) < 0)
      errors.reorder_level = 'Valid reorder level is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        quantity: Number(formData.quantity),
        reorder_level: Number(formData.reorder_level)
      };
      if (editMode) {
        await api.put(`/inventory/${selectedItem.item_id}`, payload);
        toast.success('Item updated successfully!');
      } else {
        await api.post('/inventory', payload);
        toast.success('Item added successfully!');
      }
      handleCloseDialog();
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/inventory/${id}`);
      toast.success('Item deleted successfully!');
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete item');
    }
  };

  const handleOpenAdjust = (item, mode) => {
    setAdjustItem(item);
    setAdjustMode(mode);
    setAdjustQty('');
    setOpenAdjustDialog(true);
  };

  const handleAdjust = async () => {
    const qty = Number(adjustQty);
    if (!adjustQty || isNaN(qty) || qty <= 0) {
      toast.error('Enter a valid quantity');
      return;
    }
    const newQty = adjustMode === 'add'
      ? adjustItem.quantity + qty
      : Math.max(0, adjustItem.quantity - qty);
    try {
      await api.put(`/inventory/${adjustItem.item_id}`, { quantity: newQty });
      toast.success('Quantity updated successfully!');
      setOpenAdjustDialog(false);
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to adjust quantity');
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const isLowStock = (item) => Number(item.quantity) <= Number(item.reorder_level);

  const lowStockCount = items.filter(isLowStock).length;

  const filtered = items.filter(i =>
    !searchTerm || (i.item_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Inventory Management
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd} size="large">
          Add Item
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Total Items</Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#1976d2', mt: 1 }}>
                {items.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ borderLeft: lowStockCount > 0 ? '4px solid #d32f2f' : undefined }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge badgeContent={lowStockCount} color="error">
                  <Warning color={lowStockCount > 0 ? 'error' : 'disabled'} />
                </Badge>
                <Typography color="text.secondary" variant="body2">Low Stock Alerts</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" sx={{ color: lowStockCount > 0 ? '#d32f2f' : '#757575', mt: 1 }}>
                {lowStockCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {CATEGORIES.slice(0, 2).map(cat => (
          <Grid item xs={12} sm={6} md={3} key={cat}>
            <Card elevation={2}>
              <CardContent>
                <Typography color="text.secondary" variant="body2">{cat}</Typography>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#555', mt: 1 }}>
                  {items.filter(i => i.category === cat).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Search */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by item name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Showing {filtered.length} of {items.length} items
              {lowStockCount > 0 && (
                <Chip
                  label={`${lowStockCount} Low Stock`}
                  color="error"
                  size="small"
                  icon={<Warning />}
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><strong>Item Name</strong></TableCell>
              <TableCell><strong>Category</strong></TableCell>
              <TableCell><strong>Quantity</strong></TableCell>
              <TableCell><strong>Unit</strong></TableCell>
              <TableCell><strong>Reorder Level</strong></TableCell>
              <TableCell><strong>Expiry Date</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Inventory2 sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">No inventory items found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(item => (
                <TableRow
                  key={item.item_id}
                  hover
                  sx={isLowStock(item) ? { backgroundColor: '#fff8f8' } : {}}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {isLowStock(item) && <Warning color="error" fontSize="small" />}
                      {item.item_name}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={item.category || '-'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={isLowStock(item) ? 'bold' : 'normal'} color={isLowStock(item) ? 'error' : 'inherit'}>
                      {item.quantity}
                    </Typography>
                  </TableCell>
                  <TableCell>{item.unit || '-'}</TableCell>
                  <TableCell>{item.reorder_level}</TableCell>
                  <TableCell>{formatDate(item.expiry_date)}</TableCell>
                  <TableCell>
                    <Chip
                      label={isLowStock(item) ? 'Low Stock' : 'OK'}
                      color={isLowStock(item) ? 'error' : 'success'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Add Stock">
                      <IconButton size="small" color="success" onClick={() => handleOpenAdjust(item, 'add')}>
                        <AddCircle fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove Stock">
                      <IconButton size="small" color="warning" onClick={() => handleOpenAdjust(item, 'remove')}>
                        <RemoveCircle fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary" onClick={() => handleOpenEdit(item)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(item.item_id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add / Edit Item Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Item' : 'Add Inventory Item'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Item Name *"
                name="item_name"
                value={formData.item_name}
                onChange={handleInputChange}
                error={!!formErrors.item_name}
                helperText={formErrors.item_name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Category *"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                error={!!formErrors.category}
                helperText={formErrors.category}
              >
                {CATEGORIES.map(c => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unit *"
                name="unit"
                placeholder="e.g. pcs, ml, kg"
                value={formData.unit}
                onChange={handleInputChange}
                error={!!formErrors.unit}
                helperText={formErrors.unit}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity *"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange}
                error={!!formErrors.quantity}
                helperText={formErrors.quantity}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Reorder Level *"
                name="reorder_level"
                type="number"
                value={formData.reorder_level}
                onChange={handleInputChange}
                error={!!formErrors.reorder_level}
                helperText={formErrors.reorder_level}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expiry Date"
                name="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving...' : editMode ? 'Update Item' : 'Add Item'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Adjust Quantity Dialog */}
      <Dialog open={openAdjustDialog} onClose={() => setOpenAdjustDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {adjustMode === 'add' ? 'Add Stock' : 'Remove Stock'}
          {adjustItem && ` — ${adjustItem.item_name}`}
        </DialogTitle>
        <DialogContent dividers>
          {adjustItem && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Current quantity: <strong>{adjustItem.quantity} {adjustItem.unit}</strong>
            </Typography>
          )}
          <TextField
            fullWidth
            label={`Quantity to ${adjustMode === 'add' ? 'Add' : 'Remove'} *`}
            type="number"
            value={adjustQty}
            onChange={e => setAdjustQty(e.target.value)}
            inputProps={{ min: 1 }}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdjustDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={adjustMode === 'add' ? 'success' : 'warning'}
            onClick={handleAdjust}
          >
            {adjustMode === 'add' ? 'Add Stock' : 'Remove Stock'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryPage;
