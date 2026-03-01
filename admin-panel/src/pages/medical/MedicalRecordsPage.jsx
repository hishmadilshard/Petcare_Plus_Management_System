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
  Divider
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Visibility,
  MedicalServices
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const VISIT_TYPES = ['Checkup', 'Follow-up', 'Emergency', 'Surgery', 'Vaccination', 'Dental'];

const emptyForm = {
  pet_id: '',
  vet_id: '',
  record_date: '',
  visit_type: 'Checkup',
  symptoms: '',
  diagnosis: '',
  treatment: '',
  prescription: '',
  notes: '',
  next_visit_date: ''
};

const MedicalRecordsPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/medical-records`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setRecords(response.data.data.records || response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching medical records:', error);
      toast.error('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddRecord = () => {
    setEditMode(false);
    setSelectedRecord(null);
    setFormData(emptyForm);
    setOpenDialog(true);
  };

  const handleEditRecord = (record) => {
    setEditMode(true);
    setSelectedRecord(record);
    setFormData({
      pet_id: record.pet_id || '',
      vet_id: record.vet_id || '',
      record_date: record.record_date ? record.record_date.split('T')[0] : '',
      visit_type: record.visit_type || 'Checkup',
      symptoms: record.symptoms || '',
      diagnosis: record.diagnosis || '',
      treatment: record.treatment || '',
      prescription: record.prescription || '',
      notes: record.notes || '',
      next_visit_date: record.next_visit_date ? record.next_visit_date.split('T')[0] : ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData(emptyForm);
  };

  const handleSubmit = async () => {
    if (!formData.pet_id || !formData.vet_id || !formData.record_date) {
      toast.error('Pet ID, Vet ID, and record date are required');
      return;
    }
    try {
      const token = localStorage.getItem('accessToken');
      if (editMode) {
        const id = selectedRecord.record_id || selectedRecord.id;
        await axios.put(`${API_URL}/medical-records/${id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Medical record updated successfully!');
      } else {
        await axios.post(`${API_URL}/medical-records`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Medical record created successfully!');
      }
      handleCloseDialog();
      fetchRecords();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save medical record';
      toast.error(message);
    }
  };

  const handleDelete = async (record) => {
    const id = record.record_id || record.id;
    if (!window.confirm('Are you sure you want to delete this medical record?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_URL}/medical-records/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Medical record deleted');
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete record');
    }
  };

  const handleView = (record) => {
    setViewRecord(record);
    setViewDialog(true);
  };

  const filteredRecords = records.filter((r) => {
    const petName = (r.pet_name || '').toLowerCase();
    return petName.includes(searchTerm.toLowerCase());
  });

  const formatDate = (val) => {
    if (!val) return '—';
    return new Date(val).toLocaleDateString();
  };

  const getVisitChip = (type) => {
    const colors = {
      Emergency: 'error',
      Surgery: 'warning',
      Vaccination: 'success',
      Checkup: 'primary',
      'Follow-up': 'info',
      Dental: 'secondary'
    };
    return <Chip label={type} color={colors[type] || 'default'} size="small" />;
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
          🩺 Medical Records
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View and manage pet medical histories
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <MedicalServices color="primary" />
                <Typography variant="caption" color="text.secondary">Total Records</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="primary.main">{records.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Emergency Visits</Typography>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {records.filter(r => r.visit_type === 'Emergency').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Surgeries</Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {records.filter(r => r.visit_type === 'Surgery').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <TextField
              placeholder="Search by pet name..."
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
              sx={{ width: 300 }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddRecord}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Add Record
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
                  <TableCell><strong>Pet</strong></TableCell>
                  <TableCell><strong>Vet</strong></TableCell>
                  <TableCell><strong>Visit Type</strong></TableCell>
                  <TableCell><strong>Diagnosis</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography>Loading records...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">No medical records found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.record_id || record.id} hover>
                      <TableCell>{formatDate(record.record_date)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {record.pet_name || `Pet #${record.pet_id}`}
                        </Typography>
                      </TableCell>
                      <TableCell>{record.vet_name || `Vet #${record.vet_id}`}</TableCell>
                      <TableCell>{getVisitChip(record.visit_type)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {record.diagnosis || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Full Record">
                          <IconButton color="info" size="small" onClick={() => handleView(record)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton color="primary" size="small" onClick={() => handleEditRecord(record)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton color="error" size="small" onClick={() => handleDelete(record)}>
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

      {/* Add / Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? '✏️ Edit Medical Record' : '➕ Add Medical Record'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Pet ID"
                  name="pet_id"
                  value={formData.pet_id}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Vet ID"
                  name="vet_id"
                  value={formData.vet_id}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Record Date"
                  name="record_date"
                  type="date"
                  value={formData.record_date}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Visit Type"
                  name="visit_type"
                  value={formData.visit_type}
                  onChange={handleInputChange}
                >
                  {VISIT_TYPES.map((v) => (
                    <MenuItem key={v} value={v}>{v}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Symptoms"
                  name="symptoms"
                  value={formData.symptoms}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Diagnosis"
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleInputChange}
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
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Next Visit Date"
                  name="next_visit_date"
                  type="date"
                  value={formData.next_visit_date}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
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
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleCloseDialog} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {editMode ? 'Update Record' : 'Create Record'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Record Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>🩺 Full Medical Record</DialogTitle>
        <DialogContent>
          {viewRecord && (
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              {[
                ['Pet', viewRecord.pet_name || `Pet #${viewRecord.pet_id}`],
                ['Vet', viewRecord.vet_name || `Vet #${viewRecord.vet_id}`],
                ['Date', formatDate(viewRecord.record_date)],
                ['Visit Type', viewRecord.visit_type],
                ['Symptoms', viewRecord.symptoms],
                ['Diagnosis', viewRecord.diagnosis],
                ['Treatment', viewRecord.treatment],
                ['Prescription', viewRecord.prescription],
                ['Next Visit', formatDate(viewRecord.next_visit_date)],
                ['Notes', viewRecord.notes]
              ].map(([label, value]) => (
                <Box key={label}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
                  <Typography variant="body2">{value || '—'}</Typography>
                  <Divider sx={{ mt: 1 }} />
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setViewDialog(false)} variant="contained" sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MedicalRecordsPage;
