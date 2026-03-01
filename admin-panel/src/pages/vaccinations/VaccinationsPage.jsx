import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Stack, Avatar, InputAdornment, Tooltip, CircularProgress, Alert
} from '@mui/material';
import { Add, Edit, Delete, Search, Vaccines } from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';

const VACCINE_TYPES = ['Core', 'Non-Core', 'Lifestyle', 'Rabies', 'Bordetella', 'Other'];

const statusColors = { Completed: 'success', Due: 'warning', Overdue: 'error' };

const emptyForm = {
  pet_id: '', vet_id: '', vaccine_name: '', vaccine_type: 'Core',
  given_date: '', next_due_date: '', batch_number: '', notes: ''
};

const VaccinationsPage = () => {
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [vets, setVets] = useState([]);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => { fetchVaccinations(); fetchVets(); }, []);

  const fetchVaccinations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vaccinations');
      setVaccinations(res.data.data || res.data || []);
    } catch {
      toast.error('Failed to load vaccinations');
    } finally {
      setLoading(false);
    }
  };

  const fetchVets = async () => {
    try {
      const res = await api.get('/users?role=Vet');
      setVets(res.data.data?.users || res.data.data || res.data || []);
    } catch {
      setVets([]);
    }
  };

  const getStatus = (vacc) => {
    if (vacc.status) return vacc.status;
    if (!vacc.next_due_date) return 'Completed';
    const today = new Date().toISOString().split('T')[0];
    const nextDue = vacc.next_due_date.split('T')[0];
    if (nextDue < today) return 'Overdue';
    const thisMonthEnd = new Date(); thisMonthEnd.setMonth(thisMonthEnd.getMonth() + 1);
    return nextDue <= thisMonthEnd.toISOString().split('T')[0] ? 'Due' : 'Completed';
  };

  const today = new Date().toISOString().split('T')[0];
  const thisMonthEnd = new Date(); thisMonthEnd.setMonth(thisMonthEnd.getMonth() + 1);
  const thisMonthStr = thisMonthEnd.toISOString().split('T')[0];

  const stats = {
    total: vaccinations.length,
    dueThisMonth: vaccinations.filter(v => {
      const d = v.next_due_date?.split('T')[0];
      return d && d >= today && d <= thisMonthStr;
    }).length,
    overdue: vaccinations.filter(v => {
      const d = v.next_due_date?.split('T')[0];
      return d && d < today;
    }).length,
    completed: vaccinations.filter(v => getStatus(v) === 'Completed').length,
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAdd = () => { setEditMode(false); setSelectedId(null); setFormData(emptyForm); setOpenDialog(true); };

  const handleEdit = (v) => {
    setEditMode(true);
    setSelectedId(v.vaccination_id || v.id);
    setFormData({
      pet_id: v.pet_id || '',
      vet_id: v.vet_id || '',
      vaccine_name: v.vaccine_name || '',
      vaccine_type: v.vaccine_type || 'Core',
      given_date: v.given_date?.split('T')[0] || '',
      next_due_date: v.next_due_date?.split('T')[0] || '',
      batch_number: v.batch_number || '',
      notes: v.notes || ''
    });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    try {
      if (editMode) {
        await api.put(`/vaccinations/${selectedId}`, formData);
        toast.success('Vaccination updated successfully!');
      } else {
        await api.post('/vaccinations', formData);
        toast.success('Vaccination recorded successfully!');
      }
      setOpenDialog(false);
      fetchVaccinations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save vaccination');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/vaccinations/${confirmDelete.id}`);
      toast.success('Vaccination deleted successfully!');
      setConfirmDelete({ open: false, id: null });
      fetchVaccinations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete vaccination');
    }
  };

  const filtered = vaccinations.filter(v => {
    const matchSearch = !searchTerm ||
      (v.pet_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.vaccine_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = !typeFilter || v.vaccine_type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="#1e3a8a">Vaccinations</Typography>
          <Typography variant="body2" color="text.secondary">Track and manage pet vaccination records</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleAdd}
          sx={{ bgcolor: '#1e3a8a', '&:hover': { bgcolor: '#1e40af' } }}>
          Add Vaccination
        </Button>
      </Box>

      {stats.overdue > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          ⚠️ {stats.overdue} vaccination{stats.overdue > 1 ? 's are' : ' is'} overdue. Please take action immediately.
        </Alert>
      )}

      <Grid container spacing={3} mb={3}>
        {[
          { label: 'Total Vaccinations', value: stats.total, color: '#1e3a8a' },
          { label: 'Due This Month', value: stats.dueThisMonth, color: '#f59e0b' },
          { label: 'Overdue', value: stats.overdue, color: '#dc2626' },
          { label: 'Completed', value: stats.completed, color: '#10b981' },
        ].map((s, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>{s.label}</Typography>
                    <Typography variant="h4" fontWeight="bold" color="#1e3a8a">{s.value}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: s.color, width: 56, height: 56 }}><Vaccines /></Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <TextField placeholder="Search vaccinations..." size="small" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
              sx={{ width: 280 }} />
            <TextField select size="small" label="Vaccine Type" value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)} sx={{ width: 160 }}>
              <MenuItem value="">All Types</MenuItem>
              {VACCINE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
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
                  {['Date Given', 'Pet Name', 'Vaccine Name', 'Vaccine Type', 'Vet', 'Next Due Date', 'Status', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No records found</Typography>
                  </TableCell></TableRow>
                ) : filtered.map((v, i) => (
                  <TableRow key={v.vaccination_id || v.id || i} hover>
                    <TableCell>{v.given_date?.split('T')[0] || '-'}</TableCell>
                    <TableCell>{v.pet_name || v.pet_id || '-'}</TableCell>
                    <TableCell>{v.vaccine_name || '-'}</TableCell>
                    <TableCell>{v.vaccine_type || '-'}</TableCell>
                    <TableCell>{v.vet_name || v.vet_id || '-'}</TableCell>
                    <TableCell>{v.next_due_date?.split('T')[0] || '-'}</TableCell>
                    <TableCell>
                      <Chip label={getStatus(v)} color={statusColors[getStatus(v)] || 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={() => handleEdit(v)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error"
                          onClick={() => setConfirmDelete({ open: true, id: v.vaccination_id || v.id })}>
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? '✏️ Edit Vaccination' : '➕ Add Vaccination'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 2 }}>
            <TextField fullWidth label="Pet ID" name="pet_id" value={formData.pet_id} onChange={handleInputChange} />
            <TextField fullWidth select label="Veterinarian" name="vet_id" value={formData.vet_id} onChange={handleInputChange}>
              <MenuItem value="">Select Vet</MenuItem>
              {vets.map(v => <MenuItem key={v.user_id || v.id} value={v.user_id || v.id}>{v.full_name}</MenuItem>)}
            </TextField>
            <TextField fullWidth label="Vaccine Name" name="vaccine_name" value={formData.vaccine_name} onChange={handleInputChange} />
            <TextField fullWidth select label="Vaccine Type" name="vaccine_type" value={formData.vaccine_type} onChange={handleInputChange}>
              {VACCINE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField fullWidth label="Date Given" name="given_date" type="date" value={formData.given_date}
              onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
            <TextField fullWidth label="Next Due Date" name="next_due_date" type="date" value={formData.next_due_date}
              onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
            <TextField fullWidth label="Batch Number" name="batch_number" value={formData.batch_number} onChange={handleInputChange} />
            <TextField fullWidth label="Notes" name="notes" value={formData.notes} onChange={handleInputChange} multiline rows={3} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#1e3a8a', '&:hover': { bgcolor: '#1e40af' } }}>
            {editMode ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDelete.open} onClose={() => setConfirmDelete({ open: false, id: null })} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Are you sure you want to delete this vaccination record?</Typography></DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setConfirmDelete({ open: false, id: null })}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VaccinationsPage;
