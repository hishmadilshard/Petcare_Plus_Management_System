import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  LinearProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Pets,
  CalendarMonth,
  AttachMoney,
  People,
  Inventory,
  Assignment,
  ArrowForward,
  MoreVert,
  CheckCircle,
  Warning,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Sample data for charts
  const revenueData = [
    { month: 'Jan', revenue: 45000, appointments: 120 },
    { month: 'Feb', revenue: 52000, appointments: 145 },
    { month: 'Mar', revenue: 48000, appointments: 130 },
    { month: 'Apr', revenue: 61000, appointments: 168 },
    { month: 'May', revenue: 55000, appointments: 152 },
    { month: 'Jun', revenue: 67000, appointments: 180 }
  ];

  const petDistribution = [
    { name: 'Dogs', value: 156, color: '#1e3a8a' },
    { name: 'Cats', value: 98, color: '#0ea5e9' },
    { name: 'Birds', value: 45, color: '#10b981' },
    { name: 'Others', value: 23, color: '#f59e0b' }
  ];

  const appointmentStatus = [
    { status: 'Completed', count: 145, color: '#10b981' },
    { status: 'Scheduled', count: 68, color: '#0ea5e9' },
    { status: 'Cancelled', count: 12, color: '#ef4444' }
  ];

  // Recent activities
  const recentActivities = [
    { id: 1, action: 'New pet registered', user: 'Sarah Johnson', time: '5 mins ago', type: 'success' },
    { id: 2, action: 'Invoice #1234 paid', user: 'John Doe', time: '15 mins ago', type: 'success' },
    { id: 3, action: 'Low stock alert: Vaccines', user: 'System', time: '1 hour ago', type: 'warning' },
    { id: 4, action: 'New appointment scheduled', user: 'Mike Smith', time: '2 hours ago', type: 'info' },
    { id: 5, action: 'User account created', user: 'Admin', time: '3 hours ago', type: 'success' }
  ];

  // Upcoming appointments
  const upcomingAppointments = [
    { id: 1, petName: 'Max', ownerName: 'John Smith', time: '10:00 AM', service: 'Vaccination' },
    { id: 2, petName: 'Bella', ownerName: 'Emma Wilson', time: '11:30 AM', service: 'Check-up' },
    { id: 3, petName: 'Charlie', ownerName: 'Mike Brown', time: '02:00 PM', service: 'Surgery' },
    { id: 4, petName: 'Luna', ownerName: 'Sarah Davis', time: '03:30 PM', service: 'Grooming' }
  ];

  const StatCard = ({ title, value, change, icon, color, trend }) => (
    <Card 
      sx={{ 
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
              {title}
            </Typography>
            <Typography variant="h3" fontWeight="bold" color="primary.main" sx={{ mt: 1 }}>
              {value}
            </Typography>
          </Box>
          <Avatar 
            sx={{ 
              bgcolor: `${color}15`,
              width: 56,
              height: 56
            }}
          >
            {React.cloneElement(icon, { sx: { fontSize: 28, color: color } })}
          </Avatar>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {trend === 'up' ? (
            <TrendingUp sx={{ fontSize: 20, color: '#10b981' }} />
          ) : (
            <TrendingDown sx={{ fontSize: 20, color: '#ef4444' }} />
          )}
          <Typography variant="body2" color={trend === 'up' ? 'success.main' : 'error.main'} fontWeight={600}>
            {change}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            vs last month
          </Typography>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={75} 
          sx={{ 
            mt: 2, 
            height: 6, 
            borderRadius: 3,
            bgcolor: `${color}15`,
            '& .MuiLinearProgress-bar': {
              bgcolor: color,
              borderRadius: 3
            }
          }} 
        />
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Welcome Header */}
      <Paper 
        sx={{ 
          p: 4,
          mb: 4,
          background: 'linear-gradient(135deg, #d7d7d9 0%, #0ea5e9 100%)',
          color: 'white',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" fontWeight="800" gutterBottom>
            Welcome back, {user?.full_name}! 👋
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.95, maxWidth: 600 }}>
            Here's what's happening with your clinic today. You have 12 appointments scheduled and 3 pending tasks.
          </Typography>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              sx={{ 
                bgcolor: 'white', 
                color: '#1e3a8a',
                fontWeight: 700,
                '&:hover': { bgcolor: '#f1f5f9' }
              }}
              onClick={() => navigate('/appointments')}
            >
              View Appointments
            </Button>
            <Button 
              variant="outlined" 
              sx={{ 
                borderColor: 'white', 
                color: 'white',
                fontWeight: 700,
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
              }}
              onClick={() => navigate('/reports')}
            >
              View Reports
            </Button>
          </Box>
        </Box>
        
        {/* Background decoration */}
        <Box 
          sx={{ 
            position: 'absolute',
            right: -50,
            top: -50,
            width: 300,
            height: 300,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.1)',
            zIndex: 0
          }} 
        />
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value="LKR 245K"
            change="+12.5%"
            icon={<AttachMoney />}
            color="#10b981"
            trend="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Pets"
            value="322"
            change="+8.2%"
            icon={<Pets />}
            color="#1e3a8a"
            trend="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Appointments"
            value="180"
            change="+15.3%"
            icon={<CalendarMonth />}
            color="#0ea5e9"
            trend="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Users"
            value="45"
            change="-2.4%"
            icon={<People />}
            color="#f59e0b"
            trend="down"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} mb={4}>
        {/* Revenue Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" color="primary.main">
                    Revenue Overview
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monthly revenue and appointment trends
                  </Typography>
                </Box>
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Box>
              
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#1e3a8a" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Pet Distribution */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                Pet Distribution
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                By species
              </Typography>
              
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={petDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {petDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <Box sx={{ mt: 2 }}>
                {petDistribution.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: item.color }} />
                      <Typography variant="body2" color="text.secondary">{item.name}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="600">{item.value}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Section */}
      <Grid container spacing={3}>
        {/* Upcoming Appointments */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  📅 Today's Appointments
                </Typography>
                <Button 
                  size="small" 
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/appointments')}
                >
                  View All
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Pet</strong></TableCell>
                      <TableCell><strong>Owner</strong></TableCell>
                      <TableCell><strong>Time</strong></TableCell>
                      <TableCell><strong>Service</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {upcomingAppointments.map((apt) => (
                      <TableRow key={apt.id} hover>
                        <TableCell>{apt.petName}</TableCell>
                        <TableCell>{apt.ownerName}</TableCell>
                        <TableCell>{apt.time}</TableCell>
                        <TableCell>
                          <Chip label={apt.service} size="small" color="primary" variant="outlined" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                🔔 Recent Activity
              </Typography>

              <List>
                {recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            bgcolor: activity.type === 'success' ? '#10b98115' : 
                                     activity.type === 'warning' ? '#f59e0b15' : '#0ea5e915',
                            color: activity.type === 'success' ? '#10b981' : 
                                   activity.type === 'warning' ? '#f59e0b' : '#0ea5e9'
                          }}
                        >
                          {activity.type === 'success' ? <CheckCircle /> : 
                           activity.type === 'warning' ? <Warning /> : <Assignment />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="600">
                            {activity.action}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              by {activity.user}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              • {activity.time}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;