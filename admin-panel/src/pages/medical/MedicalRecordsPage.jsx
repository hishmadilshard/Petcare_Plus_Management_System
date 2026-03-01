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
  Divider
} from '@mui/material';
import {
  Add,
  Search,
  Delete,
  Visibility,
  MedicalServices
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../../services/api';

const VISIT_TYPES = ['Routine Checkup', 'Vaccination', 'Surgery', 'Emergency', 'Follow-up'];

const defaultForm = {
  pet_id: '',
  vet_id: '',
  visit_date: '',
  visit_type: '',
  diagnosis: '',
  treatment: '',
  prescription: '',
  notes: ''
};

const MedicalRecordsPage = () => {
  const [records, setRecords] = useState([]);
  const [pets, setPets] = useState([]);
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRecords();
    fetchPets();
    fetchVets();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await api.get('/medical-records');
      if (response.data.success) {
        setRecords(response.data.data || []);
      }
    } catch {
      toast.error('Failed to load medical records');
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
    if (!formData.visit_date) errors.visit_date = 'Visit date is required';
    if (!formData.visit_type) errors.visit_type = 'Visit type is required';
    if (!formData.diagnosis.trim()) errors.diagnosis = 'Diagnosis is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      await api.post('/medical-records', formData);
      toast.success('Medical record created successfully!');
      handleCloseDialog();
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create medical record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this medical record?')) return;
    try {
      await api.delete(`/medical-records/${id}`);
      toast.success('Medical record deleted successfully!');
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete medical record');
    }
  };

  const handleView = (record) => {
    setSelectedRecord(record);
    setOpenViewDialog(true);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const truncate = (str, n = 50) => {
    if (!str) return '-';
    return str.length > n ? str.substring(0, n) + '...' : str;
  };

  const filtered = records.filter(r =>
    !searchTerm || (r.pet_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Medical Records
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenDialog} size="large">
          Add Record
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: 'Total Records', value: records.length, color: '#1976d2' },
          { label: 'This Month', value: records.filter(r => {
            if (!r.visit_date) return false;
            const d = new Date(r.visit_date);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).length, color: '#2e7d32' },
          { label: 'Surgeries', value: records.filter(r => r.visit_type === 'Surgery').length, color: '#ed6c02' },
          { label: 'Emergencies', value: records.filter(r => r.visit_type === 'Emergency').length, color: '#d32f2f' }
        ].map(card => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Card elevation={2}>
              <CardContent>
                <Typography color="text.secondary" variant="body2">{card.label}</Typography>
                <Typography variant="h4" fontWeight="bold" sx={{ color: card.color, mt: 1 }}>
                  {card.value}
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
              placeholder="Search by pet name..."
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
              Showing {filtered.length} of {records.length} records
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
              <TableCell><strong>Vet</strong></TableCell>
              <TableCell><strong>Visit Date</strong></TableCell>
              <TableCell><strong>Visit Type</strong></TableCell>
              <TableCell><strong>Diagnosis</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <MedicalServices sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">No medical records found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(record => (
                <TableRow key={record.record_id} hover>
                  <TableCell>{record.pet_name || '-'}</TableCell>
                  <TableCell>{record.vet_name || '-'}</TableCell>
                  <TableCell>{formatDate(record.visit_date)}</TableCell>
                  <TableCell>
                    <Chip label={record.visit_type || '-'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{truncate(record.diagnosis)}</TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton size="small" color="primary" onClick={() => handleView(record)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(record.record_id)}>
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

      {/* Add Record Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add Medical Record</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={6}>
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
                  <MenuItem key={v.user_id} value={v.user_id}>{v.full_name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Visit Date *"
                name="visit_date"
                type="date"
                value={formData.visit_date}
                onChange={handleInputChange}
                error={!!formErrors.visit_date}
                helperText={formErrors.visit_date}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Visit Type *"
                name="visit_type"
                value={formData.visit_type}
                onChange={handleInputChange}
                error={!!formErrors.visit_type}
                helperText={formErrors.visit_type}
              >
                {VISIT_TYPES.map(t => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Diagnosis *"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleInputChange}
                error={!!formErrors.diagnosis}
                helperText={formErrors.diagnosis}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Treatment"
                name="treatment"
                value={formData.treatment}
                onChange={handleInputChange}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Prescription"
                name="prescription"
                value={formData.prescription}
                onChange={handleInputChange}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Record'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Record Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Medical Record Details</DialogTitle>
        <DialogContent dividers>
          {selectedRecord && (
            <Grid container spacing={2}>
              {[
                { label: 'Pet', value: selectedRecord.pet_name },
                { label: 'Veterinarian', value: selectedRecord.vet_name },
                { label: 'Visit Date', value: formatDate(selectedRecord.visit_date) },
                { label: 'Visit Type', value: selectedRecord.visit_type },
                { label: 'Diagnosis', value: selectedRecord.diagnosis },
                { label: 'Treatment', value: selectedRecord.treatment },
                { label: 'Prescription', value: selectedRecord.prescription },
                { label: 'Notes', value: selectedRecord.notes }
              ].map(({ label, value }) => (
                <Grid item xs={12} key={label}>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                  <Typography variant="body1">{value || '-'}</Typography>
                  <Divider sx={{ mt: 1 }} />
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MedicalRecordsPage;
