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
  InputAdornment,
  Tooltip,
  Grid,
  Alert
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Inventory2,
  Warning,
  Tune
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const CATEGORIES = ['Medication', 'Vaccine', 'Equipment', 'Supplies', 'Food', 'Other'];

const emptyItemForm = {
  item_name: '',
  category: 'Medication',
  description: '',
  quantity: '',
  unit: '',
  unit_price: '',
  reorder_level: '',
  supplier: '',
  expiry_date: ''
};

const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total_items: 0, low_stock_items: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemForm, setItemForm] = useState(emptyItemForm);

  const [openAdjustDialog, setOpenAdjustDialog] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ adjustment: '', reason: '' });

  useEffect(() => {
    fetchInventory();
    fetchStats();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setItems(response.data.data.items || response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/inventory/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStats(response.data.data || response.data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
    }
  };

  const handleItemInputChange = (e) => {
    setItemForm({ ...itemForm, [e.target.name]: e.target.value });
  };

  const handleAddItem = () => {
    setEditMode(false);
    setSelectedItem(null);
    setItemForm(emptyItemForm);
    setOpenItemDialog(true);
  };

  const handleEditItem = (item) => {
    setEditMode(true);
    setSelectedItem(item);
    setItemForm({
      item_name: item.item_name || '',
      category: item.category || 'Medication',
      description: item.description || '',
      quantity: item.quantity ?? '',
      unit: item.unit || '',
      unit_price: item.unit_price ?? '',
      reorder_level: item.reorder_level ?? '',
      supplier: item.supplier || '',
      expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : ''
    });
    setOpenItemDialog(true);
  };

  const handleCloseItemDialog = () => {
    setOpenItemDialog(false);
    setItemForm(emptyItemForm);
  };

  const handleSubmitItem = async () => {
    if (!itemForm.item_name || itemForm.quantity === '') {
      toast.error('Item name and quantity are required');
      return;
    }
    try {
      const token = localStorage.getItem('accessToken');
      if (editMode) {
        const id = selectedItem.item_id || selectedItem.id;
        await axios.put(`${API_URL}/inventory/${id}`, itemForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Item updated successfully!');
      } else {
        await axios.post(`${API_URL}/inventory`, itemForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Item added successfully!');
      }
      handleCloseItemDialog();
      fetchInventory();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save item');
    }
  };

  const handleDelete = async (item) => {
    const id = item.item_id || item.id;
    if (!window.confirm(`Are you sure you want to delete "${item.item_name}"?`)) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_URL}/inventory/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Item deleted');
      fetchInventory();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete item');
    }
  };

  const handleOpenAdjust = (item) => {
    setAdjustItem(item);
    setAdjustForm({ adjustment: '', reason: '' });
    setOpenAdjustDialog(true);
  };

  const handleSubmitAdjust = async () => {
    if (adjustForm.adjustment === '') {
      toast.error('Adjustment value is required');
      return;
    }
    try {
      const token = localStorage.getItem('accessToken');
      const id = adjustItem.item_id || adjustItem.id;
      await axios.put(`${API_URL}/inventory/${id}/adjust`, adjustForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Quantity adjusted successfully!');
      setOpenAdjustDialog(false);
      fetchInventory();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to adjust quantity');
    }
  };

  const isLowStock = (item) => {
    const qty = parseInt(item.quantity) || 0;
    const reorder = parseInt(item.reorder_level) || 0;
    return qty <= reorder;
  };

  const lowStockItems = items.filter(isLowStock);

  const filteredItems = items.filter((item) => {
    const matchSearch = (item.item_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === 'All' || item.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const formatDate = (val) => {
    if (!val) return '—';
    return new Date(val).toLocaleDateString();
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
          📦 Inventory
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage medical supplies, medications, and equipment
        </Typography>
      </Box>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
          <strong>{lowStockItems.length} item{lowStockItems.length > 1 ? 's are' : ' is'} below reorder level:</strong>{' '}
          {lowStockItems.map((i) => i.item_name).join(', ')}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Inventory2 color="primary" />
                <Typography variant="caption" color="text.secondary">Total Items</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {stats.total_items ?? items.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Warning sx={{ color: 'error.main' }} />
                <Typography variant="caption" color="text.secondary">Low Stock Items</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {stats.low_stock_items ?? lowStockItems.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search items..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
                sx={{ width: 260 }}
              />
              <TextField
                select
                label="Category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                size="small"
                sx={{ width: 180 }}
              >
                <MenuItem value="All">All Categories</MenuItem>
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </TextField>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddItem}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Add Item
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
                  <TableCell><strong>Item Name</strong></TableCell>
                  <TableCell><strong>Category</strong></TableCell>
                  <TableCell><strong>Quantity</strong></TableCell>
                  <TableCell><strong>Unit</strong></TableCell>
                  <TableCell><strong>Reorder Level</strong></TableCell>
                  <TableCell><strong>Expiry</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography>Loading inventory...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary">No items found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const id = item.item_id || item.id;
                    const low = isLowStock(item);
                    return (
                      <TableRow key={id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{item.item_name}</Typography>
                          {item.supplier && (
                            <Typography variant="caption" color="text.secondary">
                              {item.supplier}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip label={item.category} size="small" variant="outlined" color="primary" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color={low ? 'error.main' : 'text.primary'}>
                            {item.quantity}
                          </Typography>
                        </TableCell>
                        <TableCell>{item.unit || '—'}</TableCell>
                        <TableCell>{item.reorder_level ?? '—'}</TableCell>
                        <TableCell>{formatDate(item.expiry_date)}</TableCell>
                        <TableCell>
                          {low ? (
                            <Chip label="Low Stock" color="error" size="small" />
                          ) : (
                            <Chip label="OK" color="success" size="small" />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Adjust Qty">
                            <IconButton
                              color="info"
                              size="small"
                              onClick={() => handleOpenAdjust(item)}
                            >
                              <Tune fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => handleEditItem(item)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleDelete(item)}
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

      {/* Add / Edit Item Dialog */}
      <Dialog open={openItemDialog} onClose={handleCloseItemDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? '✏️ Edit Item' : '➕ Add Inventory Item'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Item Name"
                  name="item_name"
                  value={itemForm.item_name}
                  onChange={handleItemInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Category"
                  name="category"
                  value={itemForm.category}
                  onChange={handleItemInputChange}
                >
                  {CATEGORIES.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={itemForm.description}
                  onChange={handleItemInputChange}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Quantity"
                  name="quantity"
                  type="number"
                  value={itemForm.quantity}
                  onChange={handleItemInputChange}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Unit"
                  name="unit"
                  value={itemForm.unit}
                  onChange={handleItemInputChange}
                  placeholder="e.g. tablets, ml, pcs"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Unit Price (LKR)"
                  name="unit_price"
                  type="number"
                  value={itemForm.unit_price}
                  onChange={handleItemInputChange}
                  inputProps={{ min: 0, step: '0.01' }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Reorder Level"
                  name="reorder_level"
                  type="number"
                  value={itemForm.reorder_level}
                  onChange={handleItemInputChange}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Supplier"
                  name="supplier"
                  value={itemForm.supplier}
                  onChange={handleItemInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Expiry Date"
                  name="expiry_date"
                  type="date"
                  value={itemForm.expiry_date}
                  onChange={handleItemInputChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleCloseItemDialog} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            onClick={handleSubmitItem}
            variant="contained"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {editMode ? 'Update Item' : 'Add Item'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Adjust Quantity Dialog */}
      <Dialog open={openAdjustDialog} onClose={() => setOpenAdjustDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tune />
            Adjust Quantity
          </Box>
        </DialogTitle>
        <DialogContent>
          {adjustItem && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
              Current quantity of <strong>{adjustItem.item_name}</strong>: {adjustItem.quantity} {adjustItem.unit}
            </Typography>
          )}
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              label="Adjustment"
              type="number"
              value={adjustForm.adjustment}
              onChange={(e) => setAdjustForm({ ...adjustForm, adjustment: e.target.value })}
              helperText="Use positive to add, negative to subtract"
            />
            <TextField
              fullWidth
              label="Reason"
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenAdjustDialog(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            onClick={handleSubmitAdjust}
            variant="contained"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Apply Adjustment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryPage;
