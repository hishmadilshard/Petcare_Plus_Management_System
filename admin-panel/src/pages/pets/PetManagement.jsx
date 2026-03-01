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
  Avatar,
  InputAdornment,
  MenuItem,
  Tabs,
  Tab,
  Paper,
  Tooltip
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  FilterList
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../../services/api';

const PetManagement = () => {
  const [pets, setPets] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // Dialogs
  const [openPetDialog, setOpenPetDialog] = useState(false);
  const [openOwnerDialog, setOpenOwnerDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);

  // Pet Form Data
  const [petFormData, setPetFormData] = useState({
    owner_id: '',
    pet_name: '',
    species: 'Dog',
    breed: '',
    date_of_birth: '',
    gender: 'Male',
    color: '',
    weight: '',
    microchip_number: '',
    medical_conditions: '',
    allergies: '',
    current_medications: '',
    special_notes: ''
  });

  // Owner Form Data
  const [ownerFormData, setOwnerFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    nic: '',
    emergency_contact: '',
    notes: ''
  });

  const [formErrors, setFormErrors] = useState({});

  const speciesList = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Fish', 'Reptile', 'Other'];

  // Fetch pets and owners on component mount
  useEffect(() => {
    fetchPets();
    fetchOwners();
  }, []);

  const fetchPets = async () => {
    try {
      setLoading(true);
      console.log('🐾 Fetching pets...');
      const response = await api.get('/pets');

      console.log('✅ Pets response:', response.data);

      if (response.data.success) {
        setPets(response.data.data.pets || response.data.data || []);
      }
    } catch (error) {
      console.error('❌ Error fetching pets:', error);
      toast.error('Failed to load pets');
    } finally {
      setLoading(false);
    }
  };

  const fetchOwners = async () => {
    try {
      console.log('👥 Fetching owners...');
      const response = await api.get('/pet-owners');
      
      console.log('✅ Owners response:', response.data);
      
      if (response.data.success) {
        const ownersList = response.data.data.owners || response.data.data || [];
        console.log('📋 Setting owners:', ownersList.length, 'owners');
        setOwners(ownersList);
      }
    } catch (error) {
      console.error('❌ Error fetching owners:', error.response?.data || error.message);
      toast.error('Failed to load pet owners');
      setOwners([]); // Set empty array on error
    }
  };

  // Pet Dialog Handlers
  const handleAddPet = () => {
    console.log('➕ Opening Add Pet dialog');
    fetchOwners(); // Refresh owners list
    setEditMode(false);
    setSelectedPet(null);
    setPetFormData({
      owner_id: '',
      pet_name: '',
      species: 'Dog',
      breed: '',
      date_of_birth: '',
      gender: 'Male',
      color: '',
      weight: '',
      microchip_number: '',
      medical_conditions: '',
      allergies: '',
      current_medications: '',
      special_notes: ''
    });
    setFormErrors({});
    setOpenPetDialog(true);
  };

  const handleEditPet = (pet) => {
    console.log('✏️ Editing pet:', pet.pet_name);
    fetchOwners();
    setEditMode(true);
    setSelectedPet(pet);
    setPetFormData({
      owner_id: pet.owner_id,
      pet_name: pet.pet_name,
      species: pet.species,
      breed: pet.breed || '',
      date_of_birth: pet.date_of_birth || '',
      gender: pet.gender || 'Male',
      color: pet.color || '',
      weight: pet.weight || '',
      microchip_number: pet.microchip_number || '',
      medical_conditions: pet.medical_conditions || '',
      allergies: pet.allergies || '',
      current_medications: pet.current_medications || '',
      special_notes: pet.special_notes || ''
    });
    setFormErrors({});
    setOpenPetDialog(true);
  };

  const handleViewPet = (pet) => {
    setSelectedPet(pet);
    setOpenViewDialog(true);
  };

  const handleClosePetDialog = () => {
    setOpenPetDialog(false);
    setPetFormData({
      owner_id: '',
      pet_name: '',
      species: 'Dog',
      breed: '',
      date_of_birth: '',
      gender: 'Male',
      color: '',
      weight: '',
      microchip_number: '',
      medical_conditions: '',
      allergies: '',
      current_medications: '',
      special_notes: ''
    });
    setFormErrors({});
  };

  const handlePetInputChange = (e) => {
    setPetFormData({
      ...petFormData,
      [e.target.name]: e.target.value
    });
    setFormErrors({
      ...formErrors,
      [e.target.name]: ''
    });
  };

  const validatePetForm = () => {
    const errors = {};

    if (!petFormData.owner_id) {
      errors.owner_id = 'Pet owner is required';
    }
    if (!petFormData.pet_name.trim()) {
      errors.pet_name = 'Pet name is required';
    }
    if (!petFormData.species) {
      errors.species = 'Species is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitPet = async () => {
    if (!validatePetForm()) {
      return;
    }

    try {
      if (editMode) {
        await api.put(`/pets/${selectedPet.pet_id}`, petFormData);
        toast.success('Pet updated successfully!');
      } else {
        await api.post('/pets', petFormData);
        toast.success('Pet registered successfully!');
      }

      handleClosePetDialog();
      fetchPets();
    } catch (error) {
      console.error('Error saving pet:', error);
      const message = error.response?.data?.message || 'Failed to save pet';
      toast.error(message);
    }
  };

  const handleDeletePet = async (petId, petName) => {
    if (!window.confirm(`Are you sure you want to delete ${petName}?`)) {
      return;
    }

    try {
      await api.delete(`/pets/${petId}`);
      toast.success('Pet deleted successfully!');
      fetchPets();
    } catch (error) {
      console.error('Error deleting pet:', error);
      const message = error.response?.data?.message || 'Failed to delete pet';
      toast.error(message);
    }
  };

  // Owner Dialog Handlers
  const handleAddOwner = () => {
    setOwnerFormData({
      full_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      nic: '',
      emergency_contact: '',
      notes: ''
    });
    setFormErrors({});
    setOpenOwnerDialog(true);
  };

  const handleCloseOwnerDialog = () => {
    setOpenOwnerDialog(false);
    setOwnerFormData({
      full_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      nic: '',
      emergency_contact: '',
      notes: ''
    });
    setFormErrors({});
  };

  const handleOwnerInputChange = (e) => {
    setOwnerFormData({
      ...ownerFormData,
      [e.target.name]: e.target.value
    });
    setFormErrors({
      ...formErrors,
      [e.target.name]: ''
    });
  };

  const validateOwnerForm = () => {
    const errors = {};

    if (!ownerFormData.full_name.trim()) {
      errors.full_name = 'Full name is required';
    }
    if (!ownerFormData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(ownerFormData.email)) {
      errors.email = 'Email is invalid';
    }
    if (!ownerFormData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitOwner = async () => {
    if (!validateOwnerForm()) {
      return;
    }

    try {
      await api.post('/pet-owners', ownerFormData);
      toast.success('Pet owner registered successfully!');
      handleCloseOwnerDialog();
      fetchOwners();
    } catch (error) {
      console.error('Error saving owner:', error);
      const message = error.response?.data?.message || 'Failed to save owner';
      toast.error(message);
    }
  };

  // Filter pets
  const filteredPets = pets.filter(pet => {
    const matchesSearch = 
      pet.pet_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.owner?.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecies = filterSpecies === '' || pet.species === filterSpecies;

    return matchesSearch && matchesSpecies;
  });

  // Get species color
  const getSpeciesColor = (species) => {
    const colors = {
      Dog: '#1e3a8a',
      Cat: '#0ea5e9',
      Bird: '#10b981',
      Rabbit: '#f59e0b',
      Hamster: '#ef4444',
      Fish: '#3b82f6',
      Reptile: '#059669',
      Other: '#64748b'
    };
    return colors[species] || '#64748b';
  };

  // Get species emoji
  const getSpeciesEmoji = (species) => {
    const emojis = {
      Dog: '🐕',
      Cat: '🐈',
      Bird: '🐦',
      Rabbit: '🐰',
      Hamster: '🐹',
      Fish: '🐠',
      Reptile: '🦎',
      Other: '🐾'
    };
    return emojis[species] || '🐾';
  };

  // Calculate age
  const calculateAge = (birthDate) => {
    if (!birthDate) return 'Unknown';
    const today = new Date();
    const birth = new Date(birthDate);
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    
    if (years === 0) {
      return `${months} months`;
    } else if (months < 0) {
      return `${years - 1} years`;
    }
    return `${years} years`;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
          🐾 Pet Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Register and manage pets and their owners
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Total Pets</Typography>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {pets.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Pet Owners</Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {owners.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Dogs</Typography>
              <Typography variant="h4" fontWeight="bold" color="info.main">
                {pets.filter(p => p.species === 'Dog').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Cats</Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {pets.filter(p => p.species === 'Cat').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Pets" />
          <Tab label="Pet Owners" />
        </Tabs>
      </Paper>

      {/* Tab 0: Pets List */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            {/* Actions Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                <TextField
                  placeholder="Search pets or owners..."
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
                <TextField
                  select
                  size="small"
                  value={filterSpecies}
                  onChange={(e) => setFilterSpecies(e.target.value)}
                  sx={{ width: 150 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FilterList />
                      </InputAdornment>
                    )
                  }}
                >
                  <MenuItem value="">All Species</MenuItem>
                  {speciesList.map(species => (
                    <MenuItem key={species} value={species}>{species}</MenuItem>
                  ))}
                </TextField>
              </Box>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddPet}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Register Pet
              </Button>
            </Box>

            {/* Pets Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Pet</strong></TableCell>
                    <TableCell><strong>Species</strong></TableCell>
                    <TableCell><strong>Breed</strong></TableCell>
                    <TableCell><strong>Age</strong></TableCell>
                    <TableCell><strong>Owner</strong></TableCell>
                    <TableCell><strong>Contact</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography>Loading pets...</Typography>
                      </TableCell>
                    </TableRow>
                  ) : filteredPets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="text.secondary">No pets found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPets.map((pet) => (
                      <TableRow key={pet.pet_id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: getSpeciesColor(pet.species) }}>
                              {getSpeciesEmoji(pet.species)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="600">
                                {pet.pet_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {pet.gender}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={pet.species}
                            size="small"
                            sx={{ 
                              bgcolor: `${getSpeciesColor(pet.species)}15`,
                              color: getSpeciesColor(pet.species)
                            }}
                          />
                        </TableCell>
                        <TableCell>{pet.breed || '-'}</TableCell>
                        <TableCell>{calculateAge(pet.date_of_birth)}</TableCell>
                        <TableCell>{pet.owner?.full_name}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{pet.owner?.phone}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {pet.owner?.email}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="View Details">
                            <IconButton size="small" color="info" onClick={() => handleViewPet(pet)}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Pet">
                            <IconButton size="small" color="primary" onClick={() => handleEditPet(pet)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Pet">
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => handleDeletePet(pet.pet_id, pet.pet_name)}
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
      )}

      {/* Tab 1: Pet Owners List */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">Pet Owners</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddOwner}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Add Owner
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Owner Name</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Phone</strong></TableCell>
                    <TableCell><strong>City</strong></TableCell>
                    <TableCell><strong>Pets</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {owners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="text.secondary">No pet owners found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    owners.map((owner) => (
                      <TableRow key={owner.owner_id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {owner.full_name.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" fontWeight="600">
                              {owner.full_name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{owner.email}</TableCell>
                        <TableCell>{owner.phone}</TableCell>
                        <TableCell>{owner.city || '-'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={`${owner.pets?.length || 0} pets`} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Pet Dialog */}
      <Dialog open={openPetDialog} onClose={handleClosePetDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? '✏️ Edit Pet' : '🐾 Register New Pet'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Pet Owner"
                name="owner_id"
                value={petFormData.owner_id}
                onChange={handlePetInputChange}
                error={!!formErrors.owner_id}
                helperText={formErrors.owner_id || `${owners.length} owners available`}
                required
              >
                <MenuItem value="">
                  <em>Select Owner</em>
                </MenuItem>
                {owners.length === 0 ? (
                  <MenuItem disabled>
                    <em>No owners available - Add an owner first</em>
                  </MenuItem>
                ) : (
                  owners.map(owner => (
                    <MenuItem key={owner.owner_id} value={owner.owner_id}>
                      {owner.full_name} - {owner.phone}
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pet Name"
                name="pet_name"
                value={petFormData.pet_name}
                onChange={handlePetInputChange}
                error={!!formErrors.pet_name}
                helperText={formErrors.pet_name}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Species"
                name="species"
                value={petFormData.species}
                onChange={handlePetInputChange}
                required
              >
                {speciesList.map(species => (
                  <MenuItem key={species} value={species}>
                    {getSpeciesEmoji(species)} {species}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Breed"
                name="breed"
                value={petFormData.breed}
                onChange={handlePetInputChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                name="date_of_birth"
                type="date"
                value={petFormData.date_of_birth}
                onChange={handlePetInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Gender"
                name="gender"
                value={petFormData.gender}
                onChange={handlePetInputChange}
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Unknown">Unknown</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Color"
                name="color"
                value={petFormData.color}
                onChange={handlePetInputChange}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Weight (kg)"
                name="weight"
                type="number"
                value={petFormData.weight}
                onChange={handlePetInputChange}
                inputProps={{ step: 0.1, min: 0 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Microchip Number"
                name="microchip_number"
                value={petFormData.microchip_number}
                onChange={handlePetInputChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Medical Conditions"
                name="medical_conditions"
                value={petFormData.medical_conditions}
                onChange={handlePetInputChange}
                placeholder="Any existing medical conditions..."
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Allergies"
                name="allergies"
                value={petFormData.allergies}
                onChange={handlePetInputChange}
                placeholder="Food allergies, medication allergies..."
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Current Medications"
                name="current_medications"
                value={petFormData.current_medications}
                onChange={handlePetInputChange}
                placeholder="Currently taking medications..."
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Special Notes"
                name="special_notes"
                value={petFormData.special_notes}
                onChange={handlePetInputChange}
                placeholder="Behavior notes, special care instructions..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleClosePetDialog} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitPet}
            variant="contained"
            sx={{ textTransform: 'none', fontWeight: 600 }}
            disabled={owners.length === 0}
          >
            {editMode ? 'Update Pet' : 'Register Pet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Owner Dialog */}
      <Dialog open={openOwnerDialog} onClose={handleCloseOwnerDialog} maxWidth="sm" fullWidth>
        <DialogTitle>👤 Register Pet Owner</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                name="full_name"
                value={ownerFormData.full_name}
                onChange={handleOwnerInputChange}
                error={!!formErrors.full_name}
                helperText={formErrors.full_name}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={ownerFormData.email}
                onChange={handleOwnerInputChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={ownerFormData.phone}
                onChange={handleOwnerInputChange}
                error={!!formErrors.phone}
                helperText={formErrors.phone}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emergency Contact"
                name="emergency_contact"
                value={ownerFormData.emergency_contact}
                onChange={handleOwnerInputChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                multiline
                rows={2}
                value={ownerFormData.address}
                onChange={handleOwnerInputChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={ownerFormData.city}
                onChange={handleOwnerInputChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="NIC"
                name="nic"
                value={ownerFormData.nic}
                onChange={handleOwnerInputChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                multiline
                rows={2}
                value={ownerFormData.notes}
                onChange={handleOwnerInputChange}
                placeholder="Additional notes about the owner..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleCloseOwnerDialog} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitOwner}
            variant="contained"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Register Owner
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Pet Details Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          🐾 Pet Details: {selectedPet?.pet_name}
        </DialogTitle>
        <DialogContent>
          {selectedPet && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Basic Information
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">Species:</Typography>
                      <Typography variant="body1" fontWeight="600" gutterBottom>
                        {getSpeciesEmoji(selectedPet.species)} {selectedPet.species}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Breed:</Typography>
                      <Typography variant="body1" fontWeight="600" gutterBottom>
                        {selectedPet.breed || 'Not specified'}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Age:</Typography>
                      <Typography variant="body1" fontWeight="600" gutterBottom>
                        {calculateAge(selectedPet.date_of_birth)}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Gender:</Typography>
                      <Typography variant="body1" fontWeight="600" gutterBottom>
                        {selectedPet.gender}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Color:</Typography>
                      <Typography variant="body1" fontWeight="600" gutterBottom>
                        {selectedPet.color || 'Not specified'}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Weight:</Typography>
                      <Typography variant="body1" fontWeight="600">
                        {selectedPet.weight ? `${selectedPet.weight} kg` : 'Not recorded'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Owner Information
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">Name:</Typography>
                      <Typography variant="body1" fontWeight="600" gutterBottom>
                        {selectedPet.owner?.full_name}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Phone:</Typography>
                      <Typography variant="body1" fontWeight="600" gutterBottom>
                        {selectedPet.owner?.phone}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Email:</Typography>
                      <Typography variant="body1" fontWeight="600" gutterBottom>
                        {selectedPet.owner?.email}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Address:</Typography>
                      <Typography variant="body1" fontWeight="600">
                        {selectedPet.owner?.address || 'Not provided'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Medical Information
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">Microchip Number:</Typography>
                      <Typography variant="body1" fontWeight="600" gutterBottom>
                        {selectedPet.microchip_number || 'Not registered'}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Medical Conditions:</Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedPet.medical_conditions || 'None'}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Allergies:</Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedPet.allergies || 'None'}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Current Medications:</Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedPet.current_medications || 'None'}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Special Notes:</Typography>
                      <Typography variant="body1">
                        {selectedPet.special_notes || 'None'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenViewDialog(false)} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PetManagement;