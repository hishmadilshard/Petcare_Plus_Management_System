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
  ListItemText
} from '@mui/material';
import {
  CalendarMonth,
  Pets,
  Receipt,
  Notifications,
  PersonAdd
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon, color, trend }) => (
  <Card 
    sx={{ 
      height: '100%',
      background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
      color: 'white'
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

const ReceptionistDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <Box>
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
          📋 Reception Dashboard
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Welcome, {user?.full_name}! Manage appointments and client services.
        </Typography>
      </Paper>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="TODAY'S APPOINTMENTS"
            value="12"
            icon={<CalendarMonth sx={{ fontSize: 28 }} />}
            color="#1e3a8a"
            trend="4 pending check-in"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="NEW REGISTRATIONS"
            value="5"
            icon={<Pets sx={{ fontSize: 28 }} />}
            color="#0ea5e9"
            trend="This week"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="PENDING INVOICES"
            value="8"
            icon={<Receipt sx={{ fontSize: 28 }} />}
            color="#f59e0b"
            trend="LKR 45,000"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="NOTIFICATIONS SENT"
            value="23"
            icon={<Notifications sx={{ fontSize: 28 }} />}
            color="#10b981"
            trend="Today"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>
              📅 Today's Schedule
            </Typography>
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              No appointments scheduled yet
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>
              🚀 Quick Actions
            </Typography>
            <Grid container spacing={1} mt={1}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/appointments')}
                  sx={{ py: 2, flexDirection: 'column', gap: 1 }}
                >
                  <CalendarMonth />
                  <Typography variant="caption">New Appointment</Typography>
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/pets')}
                  sx={{ py: 2, flexDirection: 'column', gap: 1 }}
                >
                  <PersonAdd />
                  <Typography variant="caption">Register Pet</Typography>
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/invoices')}
                  sx={{ py: 2, flexDirection: 'column', gap: 1 }}
                >
                  <Receipt />
                  <Typography variant="caption">Create Invoice</Typography>
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/notifications')}
                  sx={{ py: 2, flexDirection: 'column', gap: 1 }}
                >
                  <Notifications />
                  <Typography variant="caption">Send Notification</Typography>
                </Button>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>
              ⚠️ Pending Tasks
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Pending Check-ins"
                  secondary="4 appointments"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Unpaid Invoices"
                  secondary="8 invoices"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Follow-up Calls"
                  secondary="6 clients"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReceptionistDashboard;