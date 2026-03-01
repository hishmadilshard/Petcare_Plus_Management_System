import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Stack, Avatar, InputAdornment, Tooltip, CircularProgress, Divider
} from '@mui/material';
import { Add, Edit, Delete, Search, Assignment, Visibility } from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';

const VISIT_TYPES = ['Checkup', 'Follow-up', 'Emergency', 'Surgery', 'Vaccination', 'Dental', 'Consultation'];

const visitTypeColors = {
  Checkup: 'primary', Emergency: 'error', Surgery: 'warning',
  Vaccination: 'success', Dental: 'info', 'Follow-up': 'secondary', Consultation: 'default'
};

const emptyForm = {
  pet_id: '', vet_id: '', record_date: '', visit_type: 'Checkup',
  symptoms: '', diagnosis: '', treatment: '', prescription: '', notes: '', next_visit_date: ''
};

const MedicalRecordsPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [visitTypeFilter, setVisitTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState({ open: false, record: null });
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [vets, setVets] = useState([]);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => { fetchRecords(); fetchVets(); }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await api.get('/medical-records');
      setRecords(res.data.data || res.data || []);
    } catch {
      toast.error('Failed to load medical records');
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
    setEditMode(false); setSelectedId(null); setFormData(emptyForm); setOpenDialog(true);
  };

  const handleEdit = (rec) => {
    setEditMode(true);
    setSelectedId(rec.record_id || rec.id);
    setFormData({
      pet_id: rec.pet_id || '',
      vet_id: rec.vet_id || '',
      record_date: rec.record_date?.split('T')[0] || '',
      visit_type: rec.visit_type || 'Checkup',
      symptoms: rec.symptoms || '',
      diagnosis: rec.diagnosis || '',
      treatment: rec.treatment || '',
      prescription: rec.prescription || '',
      notes: rec.notes || '',
      next_visit_date: rec.next_visit_date?.split('T')[0] || ''
    });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.diagnosis) { toast.error('Diagnosis is required'); return; }
    try {
      if (editMode) {
        await api.put(`/medical-records/${selectedId}`, formData);
        toast.success('Record updated successfully!');
      } else {
        await api.post('/medical-records', formData);
        toast.success('Record created successfully!');
      }
      setOpenDialog(false);
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save record');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/medical-records/${confirmDelete.id}`);
      toast.success('Record deleted successfully!');
      setConfirmDelete({ open: false, id: null });
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete record');
    }
  };

  const getWeekStart = () => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().split('T')[0];
  };

  const stats = {
    total: records.length,
    thisWeek: records.filter(r => r.record_date?.split('T')[0] >= getWeekStart()).length,
    checkups: records.filter(r => r.visit_type === 'Checkup').length,
    surgeries: records.filter(r => r.visit_type === 'Surgery').length,
  };

  const filtered = records.filter(r => {
    const matchSearch = !searchTerm ||
      (r.pet_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.vet_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.diagnosis || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = !visitTypeFilter || r.visit_type === visitTypeFilter;
    const matchFrom = !dateFrom || (r.record_date?.split('T')[0] || '') >= dateFrom;
    const matchTo = !dateTo || (r.record_date?.split('T')[0] || '') <= dateTo;
    return matchSearch && matchType && matchFrom && matchTo;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="#1e3a8a">Medical Records</Typography>
          <Typography variant="body2" color="text.secondary">Manage patient medical history and diagnoses</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleAdd}
          sx={{ bgcolor: '#1e3a8a', '&:hover': { bgcolor: '#1e40af' } }}>
          Add Record
        </Button>
      </Box>

      <Grid container spacing={3} mb={3}>
        {[
          { label: 'Total Records', value: stats.total, color: '#1e3a8a' },
          { label: 'This Week', value: stats.thisWeek, color: '#0ea5e9' },
          { label: 'Checkups', value: stats.checkups, color: '#10b981' },
          { label: 'Surgeries', value: stats.surgeries, color: '#f59e0b' },
        ].map((s, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>{s.label}</Typography>
                    <Typography variant="h4" fontWeight="bold" color="#1e3a8a">{s.value}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: s.color, width: 56, height: 56 }}><Assignment /></Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <TextField placeholder="Search records..." size="small" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
              sx={{ width: 280 }} />
            <TextField select size="small" label="Visit Type" value={visitTypeFilter}
              onChange={e => setVisitTypeFilter(e.target.value)} sx={{ width: 160 }}>
              <MenuItem value="">All Types</MenuItem>
              {VISIT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField size="small" label="From" type="date" value={dateFrom}
              onChange={e => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 170 }} />
            <TextField size="small" label="To" type="date" value={dateTo}
              onChange={e => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 170 }} />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#1e3a8a' }}>
                <TableRow>
                  {['Record Date', 'Pet Name', 'Vet', 'Visit Type', 'Diagnosis', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No records found</Typography>
                  </TableCell></TableRow>
                ) : filtered.map((rec, i) => (
                  <TableRow key={rec.record_id || rec.id || i} hover>
                    <TableCell>{rec.record_date?.split('T')[0] || '-'}</TableCell>
                    <TableCell>{rec.pet_name || rec.pet_id || '-'}</TableCell>
                    <TableCell>{rec.vet_name || rec.vet_id || '-'}</TableCell>
                    <TableCell>
                      <Chip label={rec.visit_type} color={visitTypeColors[rec.visit_type] || 'default'} size="small" />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rec.diagnosis || '-'}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small" color="info" onClick={() => setViewDialog({ open: true, record: rec })}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={() => handleEdit(rec)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error"
                          onClick={() => setConfirmDelete({ open: true, id: rec.record_id || rec.id })}>
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

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? '✏️ Edit Record' : '➕ Add Medical Record'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField fullWidth label="Pet ID" name="pet_id" value={formData.pet_id} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth select label="Veterinarian" name="vet_id" value={formData.vet_id} onChange={handleInputChange}>
                  <MenuItem value="">Select Vet</MenuItem>
                  {vets.map(v => <MenuItem key={v.user_id || v.id} value={v.user_id || v.id}>{v.full_name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Record Date" name="record_date" type="date" value={formData.record_date}
                  onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth select label="Visit Type" name="visit_type" value={formData.visit_type} onChange={handleInputChange}>
                  {VISIT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
            <TextField fullWidth label="Symptoms" name="symptoms" value={formData.symptoms} onChange={handleInputChange} multiline rows={2} />
            <TextField fullWidth label="Diagnosis *" name="diagnosis" value={formData.diagnosis} onChange={handleInputChange} multiline rows={2} required />
            <TextField fullWidth label="Treatment" name="treatment" value={formData.treatment} onChange={handleInputChange} multiline rows={2} />
            <TextField fullWidth label="Prescription" name="prescription" value={formData.prescription} onChange={handleInputChange} multiline rows={2} />
            <TextField fullWidth label="Notes" name="notes" value={formData.notes} onChange={handleInputChange} multiline rows={2} />
            <TextField fullWidth label="Next Visit Date" name="next_visit_date" type="date" value={formData.next_visit_date}
              onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#1e3a8a', '&:hover': { bgcolor: '#1e40af' } }}>
            {editMode ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialog.open} onClose={() => setViewDialog({ open: false, record: null })} maxWidth="md" fullWidth>
        <DialogTitle>📋 Medical Record Details</DialogTitle>
        <DialogContent>
          {viewDialog.record && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {[
                ['Pet', viewDialog.record.pet_name || viewDialog.record.pet_id],
                ['Veterinarian', viewDialog.record.vet_name || viewDialog.record.vet_id],
                ['Date', viewDialog.record.record_date?.split('T')[0]],
                ['Visit Type', viewDialog.record.visit_type],
                ['Symptoms', viewDialog.record.symptoms],
                ['Diagnosis', viewDialog.record.diagnosis],
                ['Treatment', viewDialog.record.treatment],
                ['Prescription', viewDialog.record.prescription],
                ['Notes', viewDialog.record.notes],
                ['Next Visit', viewDialog.record.next_visit_date?.split('T')[0]],
              ].map(([label, value]) => value ? (
                <Box key={label}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
                  <Typography variant="body2">{value}</Typography>
                  <Divider sx={{ mt: 1 }} />
                </Box>
              ) : null)}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setViewDialog({ open: false, record: null })}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={confirmDelete.open} onClose={() => setConfirmDelete({ open: false, id: null })} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Are you sure you want to delete this record?</Typography></DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setConfirmDelete({ open: false, id: null })}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MedicalRecordsPage;
