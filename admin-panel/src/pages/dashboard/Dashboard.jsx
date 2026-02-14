import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  Pets,
  CalendarMonth,
  AttachMoney,
  TrendingUp,
  People,
  Inventory
} from '@mui/icons-material';

const StatCard = ({ title, value, icon, color, trend }) => (
  <Card 
    sx={{ 
      height: '100%',
      background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)'
      }
    }}
  >
    <CardContent sx={{ position: 'relative', zIndex: 1 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 600 }} gutterBottom>
            {title}
          </Typography>
          <Typography variant="h3" fontWeight="bold" sx={{ my: 1 }}>
            {value}
          </Typography>
          {trend && (
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {trend}
            </Typography>
          )}
        </Box>
        <Avatar 
          sx={{ 
            bgcolor: 'rgba(255,255,255,0.3)',
            width: 56,
            height: 56
          }}
        >
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <Box>
      {/* Welcome Header */}
      <Paper 
        sx={{ 
          p: 4,
          mb: 3,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%)',
          color: 'white',
          borderRadius: 3
        }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Welcome back, {user?.full_name}! 👋
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Here's what's happening with your pet care center today.
        </Typography>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="TOTAL PETS"
            value="156"
            icon={<Pets sx={{ fontSize: 28 }} />}
            color="#1e3a8a"
            trend="↑ 12% from last month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="TODAY'S APPOINTMENTS"
            value="12"
            icon={<CalendarMonth sx={{ fontSize: 28 }} />}
            color="#0ea5e9"
            trend="3 pending"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="MONTHLY REVENUE"
            value="LKR 245K"
            icon={<AttachMoney sx={{ fontSize: 28 }} />}
            color="#10b981"
            trend="↑ 8% from last month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="GROWTH RATE"
            value="+23%"
            icon={<TrendingUp sx={{ fontSize: 28 }} />}
            color="#f59e0b"
            trend="This quarter"
          />
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>
              📅 Recent Appointments
            </Typography>
            <Box sx={{ mt: 2, textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No recent appointments to display.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Appointments will appear here once scheduled.
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>
              ⚡ Quick Actions
            </Typography>
            <Box sx={{ mt: 2, textAlign: 'center', py: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Quick action buttons coming soon...
              </Typography>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>
              📊 System Status
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Database: Active
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={100} 
                sx={{ mb: 2, bgcolor: '#e0e7ff', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }}
              />
              
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Storage: 65% Used
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={65} 
                sx={{ mb: 2, bgcolor: '#e0e7ff', '& .MuiLinearProgress-bar': { bgcolor: '#0ea5e9' } }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;