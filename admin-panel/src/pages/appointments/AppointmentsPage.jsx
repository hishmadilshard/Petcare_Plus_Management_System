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
  Paper,
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
  CheckCircle,
  Cancel,
  CalendarMonth,
  EventAvailable,
  EventBusy,
  Schedule
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const SERVICE_TYPES = ['Consultation', 'Vaccination', 'Surgery', 'Grooming', 'Dental', 'Emergency', 'Checkup'];

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    pet_id: '',
    vet_id: '',
    date: '',
    time: '',
    service_type: 'Consultation',
    notes: ''
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAppointments(response.data.data.appointments || response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenDialog = () => {
    setFormData({ pet_id: '', vet_id: '', date: '', time: '', service_type: 'Consultation', notes: '' });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async () => {
    if (!formData.pet_id || !formData.vet_id || !formData.date || !formData.time) {
      toast.error('Pet ID, Vet ID, date, and time are required');
      return;
    }
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_URL}/appointments`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Appointment created successfully!');
      handleCloseDialog();
      fetchAppointments();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create appointment';
      toast.error(message);
    }
  };

  const handleComplete = async (id) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(`${API_URL}/appointments/${id}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Appointment marked as completed');
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete appointment');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(`${API_URL}/appointments/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_URL}/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Appointment deleted');
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete appointment');
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const todayTotal = appointments.filter(a => (a.date || '').startsWith(today)).length;
  const scheduled = appointments.filter(a => a.status === 'Scheduled').length;
  const completed = appointments.filter(a => a.status === 'Completed').length;
  const cancelled = appointments.filter(a => a.status === 'Cancelled').length;

  const getStatusChip = (status) => {
    const map = {
      Scheduled: { color: 'warning', label: 'Scheduled' },
      Confirmed: { color: 'success', label: 'Confirmed' },
      Completed: { color: 'primary', label: 'Completed' },
      Cancelled: { color: 'error', label: 'Cancelled' }
    };
    const cfg = map[status] || { color: 'default', label: status };
    return <Chip label={cfg.label} color={cfg.color} size="small" />;
  };

  const formatDate = (val) => {
    if (!val) return '—';
    return new Date(val).toLocaleDateString();
  };

  const formatTime = (val) => {
    if (!val) return '—';
    if (val.includes('T')) return new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return val;
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
          📅 Appointments
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage and track all pet appointments
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CalendarMonth color="primary" />
                <Typography variant="caption" color="text.secondary">Today's Total</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="primary.main">{todayTotal}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Schedule sx={{ color: 'warning.main' }} />
                <Typography variant="caption" color="text.secondary">Scheduled</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="warning.main">{scheduled}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <EventAvailable sx={{ color: 'success.main' }} />
                <Typography variant="caption" color="text.secondary">Completed</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="success.main">{completed}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <EventBusy sx={{ color: 'error.main' }} />
                <Typography variant="caption" color="text.secondary">Cancelled</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="error.main">{cancelled}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenDialog}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Add Appointment
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
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Time</strong></TableCell>
                  <TableCell><strong>Pet Name</strong></TableCell>
                  <TableCell><strong>Owner</strong></TableCell>
                  <TableCell><strong>Vet</strong></TableCell>
                  <TableCell><strong>Service Type</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography>Loading appointments...</Typography>
                    </TableCell>
                  </TableRow>
                ) : appointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary">No appointments found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  appointments.map((appt) => (
                    <TableRow key={appt.appointment_id || appt.id} hover>
                      <TableCell>{formatDate(appt.date || appt.appointment_date)}</TableCell>
                      <TableCell>{formatTime(appt.time || appt.appointment_time || appt.date || appt.appointment_date)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {appt.pet_name || `Pet #${appt.pet_id}`}
                        </Typography>
                      </TableCell>
                      <TableCell>{appt.owner_name || appt.owner || '—'}</TableCell>
                      <TableCell>{appt.vet_name || `Vet #${appt.vet_id}`}</TableCell>
                      <TableCell>{appt.service_type || '—'}</TableCell>
                      <TableCell>{getStatusChip(appt.status)}</TableCell>
                      <TableCell align="right">
                        {appt.status !== 'Completed' && appt.status !== 'Cancelled' && (
                          <Tooltip title="Mark Complete">
                            <IconButton
                              color="success"
                              size="small"
                              onClick={() => handleComplete(appt.appointment_id || appt.id)}
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                          <Tooltip title="Cancel">
                            <IconButton
                              color="warning"
                              size="small"
                              onClick={() => handleCancel(appt.appointment_id || appt.id)}
                            >
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDelete(appt.appointment_id || appt.id)}
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
        </CardContent>
      </Card>

      {/* Add Appointment Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>➕ Add Appointment</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Pet ID"
              name="pet_id"
              value={formData.pet_id}
              onChange={handleInputChange}
              placeholder="Enter pet ID"
            />
            <TextField
              fullWidth
              label="Vet ID"
              name="vet_id"
              value={formData.vet_id}
              onChange={handleInputChange}
              placeholder="Enter vet user ID"
            />
            <TextField
              fullWidth
              label="Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Time"
              name="time"
              type="time"
              value={formData.time}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              select
              label="Service Type"
              name="service_type"
              value={formData.service_type}
              onChange={handleInputChange}
            >
              {SERVICE_TYPES.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
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
            Create Appointment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentsPage;
