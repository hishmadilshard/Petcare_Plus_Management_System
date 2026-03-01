import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, Button, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Stack, Avatar, InputAdornment, Tooltip, CircularProgress
} from '@mui/material';
import { Add, Edit, Search, LocalHospital } from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';

const emptyForm = { full_name: '', email: '', phone: '', password: '', role: 'Vet', status: 'Active' };

const VeterinariansPage = () => {
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => { fetchVets(); }, []);

  const fetchVets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users?role=Vet');
      setVets(res.data.data?.users || res.data.data || res.data || []);
    } catch {
      toast.error('Failed to load veterinarians');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAdd = () => { setEditMode(false); setSelectedId(null); setFormData(emptyForm); setOpenDialog(true); };

  const handleEdit = (vet) => {
    setEditMode(true);
    setSelectedId(vet.user_id || vet.id);
    setFormData({
      full_name: vet.full_name || '',
      email: vet.email || '',
      phone: vet.phone || '',
      password: '',
      role: 'Vet',
      status: vet.status || 'Active'
    });
    setOpenDialog(true);
  };

  const handleToggleStatus = async (vet) => {
    const newStatus = vet.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await api.put(`/users/${vet.user_id || vet.id}`, { ...vet, status: newStatus });
      toast.success(`Veterinarian ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully!`);
      fetchVets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleSubmit = async () => {
    try {
      if (editMode) {
        const data = { full_name: formData.full_name, phone: formData.phone, status: formData.status, role: 'Vet' };
        if (formData.password) data.password = formData.password;
        await api.put(`/users/${selectedId}`, data);
        toast.success('Veterinarian updated successfully!');
      } else {
        await api.post('/users', { ...formData, role: 'Vet' });
        toast.success('Veterinarian added successfully!');
      }
      setOpenDialog(false);
      fetchVets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save veterinarian');
    }
  };

  const filtered = vets.filter(v =>
    !searchTerm ||
    (v.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="#1e3a8a">Veterinarians</Typography>
          <Typography variant="body2" color="text.secondary">Manage veterinary staff members</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleAdd}
          sx={{ bgcolor: '#1e3a8a', '&:hover': { bgcolor: '#1e40af' } }}>
          Add Veterinarian
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField placeholder="Search veterinarians..." size="small" value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            sx={{ width: 300 }} />
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">No veterinarians found</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filtered.map((vet, i) => (
            <Grid item xs={12} sm={6} md={4} key={vet.user_id || vet.id || i}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#1e3a8a', width: 64, height: 64, mb: 1.5, fontSize: '1.5rem' }}>
                      {(vet.full_name || 'V').charAt(0)}
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold" color="#1e3a8a">{vet.full_name}</Typography>
                    <Typography variant="body2" color="text.secondary">{vet.email}</Typography>
                    <Typography variant="body2" color="text.secondary">{vet.phone || '-'}</Typography>
                    <Chip
                      label={vet.status || 'Active'}
                      color={vet.status === 'Active' ? 'success' : 'warning'}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary" onClick={() => handleEdit(vet)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={vet.status === 'Active' ? 'Deactivate' : 'Activate'}>
                      <IconButton size="small"
                        color={vet.status === 'Active' ? 'warning' : 'success'}
                        onClick={() => handleToggleStatus(vet)}>
                        <LocalHospital fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? '✏️ Edit Veterinarian' : '➕ Add Veterinarian'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 2 }}>
            <TextField fullWidth label="Full Name" name="full_name" value={formData.full_name} onChange={handleInputChange} />
            <TextField fullWidth label="Email" name="email" type="email" value={formData.email}
              onChange={handleInputChange} disabled={editMode}
              helperText={editMode ? 'Email cannot be changed' : ''} />
            <TextField fullWidth label="Phone" name="phone" value={formData.phone} onChange={handleInputChange} />
            <TextField fullWidth label={editMode ? 'New Password (leave empty to keep current)' : 'Password'}
              name="password" type="password" value={formData.password} onChange={handleInputChange} />
            <TextField fullWidth select label="Status" name="status" value={formData.status} onChange={handleInputChange}>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#1e3a8a', '&:hover': { bgcolor: '#1e40af' } }}>
            {editMode ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VeterinariansPage;
