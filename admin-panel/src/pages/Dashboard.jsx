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
  Paper
} from '@mui/material';
import {
  Pets,
  People,
  EventNote,
  LocalHospital,
  TrendingUp
} from '@mui/icons-material';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPets: 0,
    totalOwners: 0,
    totalAppointments: 0,
    totalVets: 0
  });
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
        totalAppointments: 0,
        totalVets: 0
      });

      setLoading(false);
    } catch (error) {
      console.error('❌ Dashboard error:', error);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Pets',
      value: stats.totalPets,
      icon: <Pets sx={{ fontSize: 40 }} />,
      color: '#001f3f',
      bgColor: '#e3f2fd'
    },
    {
      title: 'Pet Owners',
      value: stats.totalOwners,
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#1565c0',
      bgColor: '#e8f5e9'
    },
    {
      title: 'Appointments',
      value: stats.totalAppointments,
      icon: <EventNote sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      bgColor: '#fff3e0'
    },
    {
      title: 'Veterinarians',
      value: stats.totalVets,
      icon: <LocalHospital sx={{ fontSize: 40 }} />,
      color: '#e65100',
      bgColor: '#fce4ec'
    }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <CircularProgress size={60} sx={{ color: '#001f3f', mb: 2 }} />
        <Typography variant="body1" color="text.secondary">Loading dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="700" sx={{ color: '#001f3f', mb: 3 }}>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                border: '1px solid #e0e0e0',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 24px rgba(0,31,63,0.12)',
                  borderColor: card.color
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Avatar
                    sx={{
                      bgcolor: card.bgColor,
                      color: card.color,
                      width: 64,
                      height: 64
                    }}
                  >
                    {card.icon}
                  </Avatar>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom fontWeight="500">
                  {card.title}
                </Typography>
                <Typography variant="h3" fontWeight="700" sx={{ color: card.color }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;