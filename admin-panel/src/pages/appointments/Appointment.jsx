import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Avatar, InputAdornment,
  Tooltip, CircularProgress, Stack
} from '@mui/material';
import { Add, CheckCircle, Cancel, Edit, Search, EventNote, CalendarToday, Done, Schedule } from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';

const serviceTypes = ['Consultation', 'Vaccination', 'Surgery', 'Grooming', 'Dental', 'Emergency', 'Checkup', 'Follow-up'];

const statusColors = {
  Confirmed: 'primary', Pending: 'warning', Completed: 'success', Cancelled: 'error', 'In Progress': 'secondary'
};

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null, id: null, title: '' });
  const [formData, setFormData] = useState({
    pet_id: '', vet_id: '', appointment_date: '', appointment_time: '', service_type: 'Consultation', notes: ''
  });

  useEffect(() => { fetchAppointments(); fetchVets(); }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments');
      const data = res.data?.data?.appointments || res.data?.data || [];
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVets = async () => {
    try {
      const res = await api.get('/users?role=Vet');
      setVets(res.data?.data?.users || []);
    } catch { setVets([]); }
  };

  const today = new Date().toISOString().split('T')[0];
  const stats = {
    today: appointments.filter(a => a.appointment_date?.startsWith(today)).length,
    confirmed: appointments.filter(a => a.status === 'Confirmed').length,
    completed: appointments.filter(a => a.status === 'Completed').length,
    cancelled: appointments.filter(a => a.status === 'Cancelled').length,
  };

  const filtered = appointments.filter(a => {
    const matchSearch = !searchTerm ||
      a.pet?.pet_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.veterinarian?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.service_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !statusFilter || a.status === statusFilter;
    const matchDate = !dateFilter || a.appointment_date?.startsWith(dateFilter);
    return matchSearch && matchStatus && matchDate;
  });

  const handleSubmit = async () => {
    if (!formData.pet_id || !formData.appointment_date || !formData.appointment_time) {
      toast.error('Pet ID, date, and time are required'); return;
    }
    try {
      if (editMode) {
        await api.put(`/appointments/${selectedId}`, formData);
        toast.success('Appointment updated');
      } else {
        await api.post('/appointments', formData);
        toast.success('Appointment created');
      }
      setOpenDialog(false);
      resetForm();
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save appointment');
    }
  };

  const handleAction = async () => {
    const { action, id } = confirmDialog;
    try {
      if (action === 'complete') await api.put(`/appointments/${id}/complete`);
      if (action === 'cancel') await api.put(`/appointments/${id}/cancel`);
      toast.success(`Appointment ${action === 'complete' ? 'completed' : 'cancelled'}`);
      fetchAppointments();
    } catch (err) {
      toast.error(`Failed to ${action} appointment`);
    } finally {
      setConfirmDialog({ open: false, action: null, id: null, title: '' });
    }
  };

  const resetForm = () => {
    setFormData({ pet_id: '', vet_id: '', appointment_date: '', appointment_time: '', service_type: 'Consultation', notes: '' });
    setEditMode(false); setSelectedId(null);
  };

  const handleEdit = (appt) => {
    setFormData({
      pet_id: appt.pet_id || '', vet_id: appt.vet_id || '',
      appointment_date: appt.appointment_date?.split('T')[0] || '',
      appointment_time: appt.appointment_time || '',
      service_type: appt.service_type || 'Consultation', notes: appt.notes || ''
    });
    setSelectedId(appt.appointment_id);
    setEditMode(true); setOpenDialog(true);
  };

  const statCards = [
    { label, value: stats.today, icon: <CalendarToday />, color: '#1e3a8a', label: "Today's Appointments" },
    { label: 'Confirmed', value: stats.confirmed, icon: <EventNote />, color: '#0ea5e9' },
    { label: 'Completed', value: stats.completed, icon: <Done />, color: '#10b981' },
    { label: 'Cancelled', value: stats.cancelled, icon: <Cancel />, color: '#dc2626' },
  ];

  return (
    <Box sx={{ p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="#1e3a8a">Appointments</Typography>
          <Typography variant="body2" color="text.secondary">Manage all pet appointments</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} sx={{ bgcolor: '#1e3a8a', '&:hover': { bgcolor: '#1e40af' } }}
          onClick={() => { resetForm(); setOpenDialog(true); }}>
          Add Appointment
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: "Today's Appointments", value: stats.today, icon: <CalendarToday />, color: '#1e3a8a' },
          { label: 'Confirmed', value: stats.confirmed, icon: <EventNote />, color: '#0ea5e9' },
          { label: 'Completed', value: stats.completed, icon: <Done />, color: '#10b981' },
          { label: 'Cancelled', value: stats.cancelled, icon: <Cancel />, color: '#dc2626' },
        ].map((s, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>{s.label}</Typography>
                    <Typography variant="h4" fontWeight="bold" color={s.color}>{s.value}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: s.color, width: 56, height: 56 }}>{s.icon}</Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField size="small" placeholder="Search by pet, vet, service..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)} sx={{ flex: 1 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
            <TextField select size="small" label="Status" value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)} sx={{ minWidth: 160 }}>
              <MenuItem value="">All Status</MenuItem>
              {['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'].map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
            <TextField size="small" label="Date" type="date" value={dateFilter}
              onChange={e => setDateFilter(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }} />
          </Stack>
        </CardContent>
      </Card>

      {/* Table */}
      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#1e3a8a' }}>
              <TableRow>
                {['Date', 'Time', 'Pet', 'Owner', 'Veterinarian', 'Service Type', 'Status', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No appointments found</Typography></TableCell></TableRow>
              ) : filtered.map(a => (
                <TableRow key={a.appointment_id} hover>
                  <TableCell>{a.appointment_date?.split('T')[0] || '-'}</TableCell>
                  <TableCell>{a.appointment_time || '-'}</TableCell>
                  <TableCell>{a.pet?.pet_name || a.pet_id || '-'}</TableCell>
                  <TableCell>{a.pet?.owner?.user?.full_name || '-'}</TableCell>
                  <TableCell>{a.veterinarian?.full_name || '-'}</TableCell>
                  <TableCell>{a.service_type || '-'}</TableCell>
                  <TableCell>
                    <Chip label={a.status} color={statusColors[a.status] || 'default'} size="small" />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      {!['Completed', 'Cancelled'].includes(a.status) && (
                        <Tooltip title="Mark Complete">
                          <IconButton size="small" color="success"
                            onClick={() => setConfirmDialog({ open: true, action: 'complete', id: a.appointment_id, title: 'Mark as Completed?' })}>
                            <CheckCircle fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {!['Completed', 'Cancelled'].includes(a.status) && (
                        <Tooltip title="Cancel">
                          <IconButton size="small" color="error"
                            onClick={() => setConfirmDialog({ open: true, action: 'cancel', id: a.appointment_id, title: 'Cancel this appointment?' })}>
                            <Cancel fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={() => handleEdit(a)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); resetForm(); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1e3a8a', color: 'white' }}>{editMode ? 'Edit Appointment' : 'New Appointment'}</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Pet ID" value={formData.pet_id} onChange={e => setFormData({ ...formData, pet_id: e.target.value })} fullWidth size="small" required />
            <TextField select label="Veterinarian" value={formData.vet_id} onChange={e => setFormData({ ...formData, vet_id: e.target.value })} fullWidth size="small">
              <MenuItem value="">-- Select Vet --</MenuItem>
              {vets.map(v => <MenuItem key={v.user_id} value={v.user_id}>{v.full_name}</MenuItem>)}
            </TextField>
            <TextField label="Date" type="date" value={formData.appointment_date} onChange={e => setFormData({ ...formData, appointment_date: e.target.value })} fullWidth size="small" InputLabelProps={{ shrink: true }} required />
            <TextField label="Time" type="time" value={formData.appointment_time} onChange={e => setFormData({ ...formData, appointment_time: e.target.value })} fullWidth size="small" InputLabelProps={{ shrink: true }} required />
            <TextField select label="Service Type" value={formData.service_type} onChange={e => setFormData({ ...formData, service_type: e.target.value })} fullWidth size="small">
              {serviceTypes.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField label="Notes" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} fullWidth size="small" multiline rows={3} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setOpenDialog(false); resetForm(); }}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} sx={{ bgcolor: '#1e3a8a' }}>
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent><Typography>{confirmDialog.title}</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>No</Button>
          <Button variant="contained" color={confirmDialog.action === 'cancel' ? 'error' : 'success'} onClick={handleAction}>Yes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentsPage;