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
  Button,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import {
  Pets,
  CalendarMonth,
  AttachMoney,
  TrendingUp,
  People,
  Inventory,
  ArrowForward
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon, color, trend }) => (
  <Card 
    sx={{ 
      height: '100%',
      background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    }}
  >
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography variant="h3" fontWeight="bold" sx={{ my: 1 }}>
            {value}
          </Typography>
          {trend && <Typography variant="caption" sx={{ opacity: 0.9 }}>{trend}</Typography>}
        </Box>
        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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
          👨‍💼 Admin Dashboard
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Welcome, {user?.full_name}! You have full system access.
        </Typography>
      </Paper>

      {/* Stats */}
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
            title="TOTAL USERS"
            value="45"
            icon={<People sx={{ fontSize: 28 }} />}
            color="#0ea5e9"
            trend="5 active today"
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
            title="LOW STOCK ITEMS"
            value="8"
            icon={<Inventory sx={{ fontSize: 28 }} />}
            color="#f59e0b"
            trend="Needs attention"
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>
              🚀 Quick Actions
            </Typography>
            <Grid container spacing={2} mt={1}>
              <Grid item xs={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/users')}
                  sx={{ py: 2, flexDirection: 'column', gap: 1 }}
                >
                  <People />
                  <Typography variant="caption">Manage Users</Typography>
                </Button>
              </Grid>
              <Grid item xs={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/pets')}
                  sx={{ py: 2, flexDirection: 'column', gap: 1 }}
                >
                  <Pets />
                  <Typography variant="caption">View Pets</Typography>
                </Button>
              </Grid>
              <Grid item xs={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/inventory')}
                  sx={{ py: 2, flexDirection: 'column', gap: 1 }}
                >
                  <Inventory />
                  <Typography variant="caption">Inventory</Typography>
                </Button>
              </Grid>
              <Grid item xs={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/reports')}
                  sx={{ py: 2, flexDirection: 'column', gap: 1 }}
                >
                  <TrendingUp />
                  <Typography variant="caption">Reports</Typography>
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>
              ⚠️ System Alerts
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Low Stock Alert"
                  secondary="8 items need restocking"
                  primaryTypographyProps={{ fontSize: '0.9rem' }}
                />
                <Chip label="New" size="small" color="error" />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Pending Invoices"
                  secondary="12 unpaid invoices"
                  primaryTypographyProps={{ fontSize: '0.9rem' }}
                />
                <Chip label="Action" size="small" color="warning" />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Expiring Items"
                  secondary="3 items expiring soon"
                  primaryTypographyProps={{ fontSize: '0.9rem' }}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;