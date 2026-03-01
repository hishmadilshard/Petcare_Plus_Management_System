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
  Delete,
  CheckCircle,
  Cancel,
  Done,
  FilterList,
  Event
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../../services/api';

const SERVICE_TYPES = ['Consultation', 'Vaccination', 'Surgery', 'Grooming', 'Dental', 'Emergency'];

const STATUS_COLORS = {
  Pending: 'warning',
  Confirmed: 'success',
  Completed: 'info',
  Cancelled: 'error'
};

const defaultForm = {
  pet_id: '',
  vet_id: '',
  appointment_date: '',
  appointment_time: '',
  service_type: '',
  notes: ''
};

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [pets, setPets] = useState([]);
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchPets();
    fetchVets();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments');
      if (response.data.success) {
        setAppointments(response.data.data || []);
      }
    } catch (error) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
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

  const fetchVets = async () => {
    try {
      const response = await api.get('/users');
      if (response.data.success) {
        const allUsers = response.data.data.users || response.data.data || [];
        setVets(allUsers.filter(u => u.role === 'Vet' || u.role === 'vet'));
      }
    } catch {
      toast.error('Failed to load vets');
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
    if (!formData.pet_id) errors.pet_id = 'Pet is required';
    if (!formData.appointment_date) errors.appointment_date = 'Date is required';
    if (!formData.appointment_time) errors.appointment_time = 'Time is required';
    if (!formData.service_type) errors.service_type = 'Service type is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      await api.post('/appointments', formData);
      toast.success('Appointment created successfully!');
      handleCloseDialog();
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/appointments/${id}`, { status });
      toast.success(`Appointment ${status.toLowerCase()} successfully!`);
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update appointment');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    try {
      await api.delete(`/appointments/${id}`);
      toast.success('Appointment deleted successfully!');
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete appointment');
    }
  };

  const formatDateTime = (date, time) => {
    if (!date) return '-';
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
    return time ? `${dateStr} ${time}` : dateStr;
  };

  const filtered = appointments.filter(a => {
    const matchSearch = !searchTerm ||
      (a.pet_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !filterStatus || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusCounts = appointments.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Appointments Management
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenDialog} size="large">
          New Appointment
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: 'Total', value: appointments.length, color: '#1976d2' },
          { label: 'Pending', value: statusCounts.Pending || 0, color: '#ed6c02' },
          { label: 'Confirmed', value: statusCounts.Confirmed || 0, color: '#2e7d32' },
          { label: 'Completed', value: statusCounts.Completed || 0, color: '#0288d1' }
        ].map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Card elevation={2}>
              <CardContent>
                <Typography color="text.secondary" variant="body2">{card.label} Appointments</Typography>
                <Typography variant="h4" fontWeight="bold" sx={{ color: card.color, mt: 1 }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by pet name..."
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
              {['Pending', 'Confirmed', 'Completed', 'Cancelled'].map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              Showing {filtered.length} of {appointments.length} appointments
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><strong>Pet Name</strong></TableCell>
              <TableCell><strong>Owner</strong></TableCell>
              <TableCell><strong>Vet</strong></TableCell>
              <TableCell><strong>Date / Time</strong></TableCell>
              <TableCell><strong>Service Type</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Event sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">No appointments found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((appt) => (
                <TableRow key={appt.appointment_id} hover>
                  <TableCell>{appt.pet_name || '-'}</TableCell>
                  <TableCell>{appt.owner_name || '-'}</TableCell>
                  <TableCell>{appt.vet_name || '-'}</TableCell>
                  <TableCell>{formatDateTime(appt.appointment_date, appt.appointment_time)}</TableCell>
                  <TableCell>{appt.service_type || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={appt.status || 'Pending'}
                      color={STATUS_COLORS[appt.status] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {appt.status === 'Pending' && (
                      <Tooltip title="Confirm">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleStatusUpdate(appt.appointment_id, 'Confirmed')}
                        >
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {(appt.status === 'Confirmed' || appt.status === 'Pending') && (
                      <Tooltip title="Mark Complete">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleStatusUpdate(appt.appointment_id, 'Completed')}
                        >
                          <Done fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                      <Tooltip title="Cancel">
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleStatusUpdate(appt.appointment_id, 'Cancelled')}
                        >
                          <Cancel fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(appt.appointment_id)}
                      >
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

      {/* Add Appointment Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>New Appointment</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Pet *"
                name="pet_id"
                value={formData.pet_id}
                onChange={handleInputChange}
                error={!!formErrors.pet_id}
                helperText={formErrors.pet_id}
              >
                {pets.map(p => (
                  <MenuItem key={p.pet_id} value={p.pet_id}>
                    {p.pet_name} ({p.species})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Veterinarian"
                name="vet_id"
                value={formData.vet_id}
                onChange={handleInputChange}
              >
                <MenuItem value="">Not Assigned</MenuItem>
                {vets.map(v => (
                  <MenuItem key={v.user_id} value={v.user_id}>
                    {v.full_name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Appointment Date *"
                name="appointment_date"
                type="date"
                value={formData.appointment_date}
                onChange={handleInputChange}
                error={!!formErrors.appointment_date}
                helperText={formErrors.appointment_date}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Appointment Time *"
                name="appointment_time"
                type="time"
                value={formData.appointment_time}
                onChange={handleInputChange}
                error={!!formErrors.appointment_time}
                helperText={formErrors.appointment_time}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Service Type *"
                name="service_type"
                value={formData.service_type}
                onChange={handleInputChange}
                error={!!formErrors.service_type}
                helperText={formErrors.service_type}
              >
                {SERVICE_TYPES.map(s => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Appointment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentsPage;
