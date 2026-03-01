import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Stack, Avatar, InputAdornment, Tooltip, CircularProgress
} from '@mui/material';
import { Add, CheckCircle, Cancel, Edit, Search, EventNote, CalendarToday, Schedule, Done } from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';

const SERVICE_TYPES = ['Consultation', 'Vaccination', 'Surgery', 'Grooming', 'Dental', 'Emergency', 'Checkup', 'Follow-up'];

const statusColors = {
  Confirmed: 'primary',
  Pending: 'warning',
  Completed: 'success',
  Cancelled: 'error',
  'In Progress': 'secondary'
};

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null, id: null, title: '' });
  const [vets, setVets] = useState([]);
  const [formData, setFormData] = useState({
    pet_id: '', vet_id: '', appointment_date: '', appointment_time: '', service_type: 'Consultation', notes: ''
  });

  useEffect(() => { fetchAppointments(); fetchVets(); }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments');
      setAppointments(res.data.data || res.data || []);
    } catch {
      toast.error('Failed to load appointments');
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

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAdd = () => {
    setEditMode(false);
    setSelectedId(null);
    setFormData({ pet_id: '', vet_id: '', appointment_date: '', appointment_time: '', service_type: 'Consultation', notes: '' });
    setOpenDialog(true);
  };

  const handleEdit = (apt) => {
    setEditMode(true);
    setSelectedId(apt.appointment_id || apt.id);
    setFormData({
      pet_id: apt.pet_id || '',
      vet_id: apt.vet_id || '',
      appointment_date: apt.appointment_date?.split('T')[0] || '',
      appointment_time: apt.appointment_time || '',
      service_type: apt.service_type || 'Consultation',
      notes: apt.notes || ''
    });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    try {
      if (editMode) {
        await api.put(`/appointments/${selectedId}`, formData);
        toast.success('Appointment updated successfully!');
      } else {
        await api.post('/appointments', formData);
        toast.success('Appointment created successfully!');
      }
      setOpenDialog(false);
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save appointment');
    }
  };

  const handleConfirmAction = (action, id, title) => {
    setConfirmDialog({ open: true, action, id, title });
  };

  const handleConfirmed = async () => {
    const { action, id } = confirmDialog;
    setConfirmDialog({ open: false, action: null, id: null, title: '' });
    try {
      if (action === 'complete') {
        await api.put(`/appointments/${id}/complete`);
        toast.success('Appointment marked as completed!');
      } else if (action === 'cancel') {
        await api.put(`/appointments/${id}/cancel`);
        toast.success('Appointment cancelled!');
      }
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
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
      (a.pet_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.owner_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.vet_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !statusFilter || a.status === statusFilter;
    const matchDate = !dateFilter || a.appointment_date?.startsWith(dateFilter);
    return matchSearch && matchStatus && matchDate;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="#1e3a8a">Appointments</Typography>
          <Typography variant="body2" color="text.secondary">Manage all clinic appointments</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleAdd}
          sx={{ bgcolor: '#1e3a8a', '&:hover': { bgcolor: '#1e40af' } }}>
          Add Appointment
        </Button>
      </Box>

      <Grid container spacing={3} mb={3}>
        {[
          { label: "Today's Total", value: stats.today, icon: <CalendarToday />, color: '#1e3a8a' },
          { label: 'Confirmed', value: stats.confirmed, icon: <EventNote />, color: '#0ea5e9' },
          { label: 'Completed', value: stats.completed, icon: <Done />, color: '#10b981' },
          { label: 'Cancelled', value: stats.cancelled, icon: <Cancel />, color: '#dc2626' },
        ].map((s, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>{s.label}</Typography>
                    <Typography variant="h4" fontWeight="bold" color="#1e3a8a">{s.value}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: s.color, width: 56, height: 56 }}>{s.icon}</Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <TextField placeholder="Search appointments..." size="small" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
              sx={{ width: 280 }} />
            <TextField select size="small" label="Status" value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)} sx={{ width: 160 }}>
              <MenuItem value="">All Statuses</MenuItem>
              {['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'].map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
            <TextField size="small" label="Date" type="date" value={dateFilter}
              onChange={e => setDateFilter(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#1e3a8a' }}>
                <TableRow>
                  {['Date', 'Time', 'Pet Name', 'Owner Name', 'Vet', 'Service Type', 'Status', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">No records found</Typography>
                    </TableCell>
                  </TableRow>
                ) : filtered.map((apt, i) => (
                  <TableRow key={apt.appointment_id || apt.id || i} hover>
                    <TableCell>{apt.appointment_date?.split('T')[0] || '-'}</TableCell>
                    <TableCell>{apt.appointment_time || '-'}</TableCell>
                    <TableCell>{apt.pet_name || apt.pet_id || '-'}</TableCell>
                    <TableCell>{apt.owner_name || '-'}</TableCell>
                    <TableCell>{apt.vet_name || apt.vet_id || '-'}</TableCell>
                    <TableCell>{apt.service_type || '-'}</TableCell>
                    <TableCell>
                      <Chip label={apt.status} color={statusColors[apt.status] || 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      {['Confirmed', 'Pending'].includes(apt.status) && (
                        <Tooltip title="Mark Complete">
                          <IconButton size="small" color="success"
                            onClick={() => handleConfirmAction('complete', apt.appointment_id || apt.id, 'Mark this appointment as completed?')}>
                            <CheckCircle fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {!['Completed', 'Cancelled'].includes(apt.status) && (
                        <Tooltip title="Cancel">
                          <IconButton size="small" color="error"
                            onClick={() => handleConfirmAction('cancel', apt.appointment_id || apt.id, 'Cancel this appointment?')}>
                            <Cancel fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={() => handleEdit(apt)}>
                          <Edit fontSize="small" />
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
        <DialogTitle>{editMode ? '✏️ Edit Appointment' : '➕ Add Appointment'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 2 }}>
            <TextField fullWidth label="Pet ID" name="pet_id" value={formData.pet_id} onChange={handleInputChange} />
            <TextField fullWidth select label="Veterinarian" name="vet_id" value={formData.vet_id} onChange={handleInputChange}>
              <MenuItem value="">Select Vet</MenuItem>
              {vets.map(v => (
                <MenuItem key={v.user_id || v.id} value={v.user_id || v.id}>{v.full_name}</MenuItem>
              ))}
            </TextField>
            <TextField fullWidth label="Date" name="appointment_date" type="date" value={formData.appointment_date}
              onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
            <TextField fullWidth label="Time" name="appointment_time" type="time" value={formData.appointment_time}
              onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
            <TextField fullWidth select label="Service Type" name="service_type" value={formData.service_type} onChange={handleInputChange}>
              {SERVICE_TYPES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField fullWidth label="Notes" name="notes" value={formData.notes} onChange={handleInputChange} multiline rows={3} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#1e3a8a', '&:hover': { bgcolor: '#1e40af' } }}>
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.title}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>Cancel</Button>
          <Button onClick={handleConfirmed} variant="contained" color="primary">Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentsPage;
