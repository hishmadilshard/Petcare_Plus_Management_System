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
  MedicalServices,
  Vaccines,
  ArrowForward
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

const VetDashboard = () => {
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
          🩺 Veterinarian Dashboard
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Welcome, Dr. {user?.full_name}! Here are your appointments and tasks.
        </Typography>
      </Paper>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="TODAY'S APPOINTMENTS"
            value="8"
            icon={<CalendarMonth sx={{ fontSize: 28 }} />}
            color="#1e3a8a"
            trend="3 completed"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="PATIENTS THIS WEEK"
            value="32"
            icon={<Pets sx={{ fontSize: 28 }} />}
            color="#0ea5e9"
            trend="8 new patients"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="PENDING RECORDS"
            value="5"
            icon={<MedicalServices sx={{ fontSize: 28 }} />}
            color="#10b981"
            trend="Needs completion"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="VACCINATIONS DUE"
            value="12"
            icon={<Vaccines sx={{ fontSize: 28 }} />}
            color="#f59e0b"
            trend="This week"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold" color="primary">
                📅 Today's Appointments
              </Typography>
              <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/appointments')}>
                View All
              </Button>
            </Box>
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              No appointments scheduled for today
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
                  onClick={() => navigate('/medical-records')}
                  sx={{ py: 2, flexDirection: 'column', gap: 1 }}
                >
                  <MedicalServices />
                  <Typography variant="caption">Add Record</Typography>
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/vaccinations')}
                  sx={{ py: 2, flexDirection: 'column', gap: 1 }}
                >
                  <Vaccines />
                  <Typography variant="caption">Vaccinations</Typography>
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/appointments')}
                  sx={{ py: 2, flexDirection: 'column', gap: 1 }}
                >
                  <CalendarMonth />
                  <Typography variant="caption">Appointments</Typography>
                </Button>
              </Grid>
              <Grid item xs={6}>
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
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>
              📋 Pending Tasks
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Complete Medical Records"
                  secondary="5 pending records"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Vaccination Reminders"
                  secondary="12 pets due"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Follow-up Appointments"
                  secondary="3 this week"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VetDashboard;