import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Divider
} from '@mui/material';
import {
  Pets,
  People,
  EventNote,
  LocalHospital,
  TrendingUp,
  TrendingDown,
  MoreVert,
  CalendarMonth,
  AssignmentTurnedIn,
  Visibility
} from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPets: 0,
    totalOwners: 0,
    totalAppointments: 0,
    totalVets: 0
  });
  const [recentPets, setRecentPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('No authentication token found');
        setError('Please login to view dashboard');
        setLoading(false);
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const [petsRes, ownersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/pets', config).catch(() => ({ data: { data: { pets: [] } } })),
        axios.get('http://localhost:5000/api/pet-owners', config).catch(() => ({ data: { data: { owners: [] } } }))
      ]);

      const pets = petsRes.data?.data?.pets || [];
      const owners = ownersRes.data?.data?.owners || [];

      setStats({
        totalPets: pets.length,
        totalOwners: owners.length,
        totalAppointments: Math.floor(pets.length * 0.6),
        totalVets: 3
      });

      setRecentPets(pets.slice(0, 6));
      setLoading(false);
    } catch (error) {
      console.error('❌ Dashboard error:', error);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  // Sample data for charts
  const monthlyData = [
    { month: 'Jan', pets: 12, appointments: 25 },
    { month: 'Feb', pets: 19, appointments: 32 },
    { month: 'Mar', pets: 15, appointments: 28 },
    { month: 'Apr', pets: 25, appointments: 45 },
    { month: 'May', pets: 22, appointments: 38 },
    { month: 'Jun', pets: stats.totalPets, appointments: stats.totalAppointments }
  ];

  const speciesData = [
    { name: 'Dogs', value: Math.ceil(stats.totalPets * 0.6), color: '#001f3f' },
    { name: 'Cats', value: Math.ceil(stats.totalPets * 0.3), color: '#0074D9' },
    { name: 'Others', value: Math.ceil(stats.totalPets * 0.1), color: '#7FDBFF' }
  ];

  const statCards = [
    {
      title: 'Total Pets',
      value: stats.totalPets,
      icon: <Pets sx={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      change: '+12.5%',
      trending: 'up',
      description: 'vs last month'
    },
    {
      title: 'Pet Owners',
      value: stats.totalOwners,
      icon: <People sx={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      change: '+8.2%',
      trending: 'up',
      description: 'vs last month'
    },
    {
      title: 'Appointments',
      value: stats.totalAppointments,
      icon: <EventNote sx={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      change: '+15.3%',
      trending: 'up',
      description: 'vs last month'
    },
    {
      title: 'Veterinarians',
      value: stats.totalVets,
      icon: <LocalHospital sx={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      change: '0%',
      trending: 'neutral',
      description: 'Active staff'
    }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <CircularProgress size={70} thickness={4} sx={{ color: '#001f3f', mb: 3 }} />
        <Typography variant="h6" color="text.secondary" fontWeight="500">Loading Dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight="700" sx={{ color: '#001f3f', mb: 1 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back! Here's your clinic overview for today.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Card
              elevation={0}
              sx={{
                background: card.gradient,
                color: 'white',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.3)',
                      color: 'white',
                      width: 56,
                      height: 56
                    }}
                  >
                    {card.icon}
                  </Avatar>
                  <IconButton size="small" sx={{ color: 'white' }}>
                    <MoreVert />
                  </IconButton>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                  {card.title}
                </Typography>
                <Typography variant="h3" fontWeight="700" mb={2}>
                  {card.value}
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  {card.trending === 'up' ? (
                    <TrendingUp fontSize="small" />
                  ) : card.trending === 'down' ? (
                    <TrendingDown fontSize="small" />
                  ) : null}
                  <Typography variant="body2" fontWeight="600">
                    {card.change}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {card.description}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Monthly Trends */}
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid #e0e0e0',
              height: '100%'
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h6" fontWeight="700" sx={{ color: '#001f3f' }}>
                  Monthly Overview
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pets registration and appointments trends
                </Typography>
              </Box>
              <Button variant="outlined" size="small" sx={{ borderRadius: 2 }}>
                View Report
              </Button>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip />
                <Legend />
                <Bar dataKey="pets" fill="#667eea" radius={[8, 8, 0, 0]} />
                <Bar dataKey="appointments" fill="#f5576c" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Species Distribution */}
        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid #e0e0e0',
              height: '100%'
            }}
          >
            <Typography variant="h6" fontWeight="700" sx={{ color: '#001f3f', mb: 1 }}>
              Species Distribution
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={3}>
              Breakdown of registered pets
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={speciesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {speciesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Box mt={2}>
              {speciesData.map((item, index) => (
                <Box key={index} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: item.color
                      }}
                    />
                    <Typography variant="body2">{item.name}</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="600">
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Pets & Upcoming Appointments */}
      <Grid container spacing={3}>
        {/* Recent Pets */}
        <Grid item xs={12} lg={7}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid #e0e0e0',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ p: 3, bgcolor: '#fafafa' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" fontWeight="700" sx={{ color: '#001f3f' }}>
                    Recent Registrations
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Newly added pets
                  </Typography>
                </Box>
                <Button
                  variant="text"
                  endIcon={<Visibility />}
                  sx={{ textTransform: 'none' }}
                >
                  View All
                </Button>
              </Box>
            </Box>
            <Divider />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#001f3f' }}>Pet</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#001f3f' }}>Species</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#001f3f' }}>Breed</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#001f3f' }}>Weight</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#001f3f' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentPets.length > 0 ? (
                    recentPets.map((pet, index) => (
                      <TableRow
                        key={index}
                        sx={{
                          '&:hover': { bgcolor: '#f8f9fa' },
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar
                              sx={{
                                width: 40,
                                height: 40,
                                bgcolor: '#667eea',
                                fontWeight: 700
                              }}
                            >
                              {pet.pet_name?.charAt(0)}
                            </Avatar>
                            <Typography fontWeight="600">{pet.pet_name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{pet.species}</TableCell>
                        <TableCell>{pet.breed || '-'}</TableCell>
                        <TableCell>{pet.weight ? `${pet.weight} kg` : '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label="Healthy"
                            size="small"
                            sx={{
                              bgcolor: '#e8f5e9',
                              color: '#2e7d32',
                              fontWeight: 600,
                              borderRadius: 2
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                        <Pets sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
                        <Typography color="text.secondary">No pets registered yet</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} lg={5}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid #e0e0e0',
              height: '100%'
            }}
          >
            <Typography variant="h6" fontWeight="700" sx={{ color: '#001f3f', mb: 3 }}>
              Upcoming Appointments
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              {[
                { time: '09:00 AM', pet: 'Max', owner: 'Dr. Williams', type: 'Checkup' },
                { time: '10:30 AM', pet: 'Luna', owner: 'Mr. Kumar', type: 'Vaccination' },
                { time: '02:00 PM', pet: 'Bruno', owner: 'Mrs. Silva', type: 'Surgery' },
                { time: '04:00 PM', pet: 'Whiskers', owner: 'Ms. Fernando', type: 'Grooming' }
              ].map((appointment, index) => (
                <Card
                  key={index}
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: '#001f3f',
                      boxShadow: '0 4px 12px rgba(0,31,63,0.1)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: '#667eea', width: 40, height: 40 }}>
                          <CalendarMonth />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="700">
                            {appointment.pet}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {appointment.owner}
                          </Typography>
                        </Box>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="body2" fontWeight="600" color="primary">
                          {appointment.time}
                        </Typography>
                        <Chip
                          label={appointment.type}
                          size="small"
                          sx={{ mt: 0.5, fontSize: '0.7rem', height: 20 }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;