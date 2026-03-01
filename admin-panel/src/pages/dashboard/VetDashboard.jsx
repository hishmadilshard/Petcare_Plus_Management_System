import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  LinearProgress,
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
  Divider,
  IconButton
} from '@mui/material';
import {
  TrendingUp,
  Pets,
  CalendarToday,
  Vaccines,
  MedicalServices,
  Assignment,
  ArrowForward,
  CheckCircle,
  AccessTime,
  EventAvailable,
  MoreVert
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const VetDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Medical statistics data
  const weeklyTreatments = [
    { day: 'Mon', treatments: 12, vaccinations: 8 },
    { day: 'Tue', treatments: 15, vaccinations: 6 },
    { day: 'Wed', treatments: 10, vaccinations: 10 },
    { day: 'Thu', treatments: 18, vaccinations: 12 },
    { day: 'Fri', treatments: 14, vaccinations: 9 },
    { day: 'Sat', treatments: 20, vaccinations: 15 },
    { day: 'Sun', treatments: 8, vaccinations: 5 }
  ];

  const treatmentTypes = [
    { name: 'Check-ups', value: 45, color: '#0ea5e9' },
    { name: 'Vaccinations', value: 30, color: '#10b981' },
    { name: 'Surgeries', value: 15, color: '#f59e0b' },
    { name: 'Emergency', value: 10, color: '#ef4444' }
  ];

  // Today's appointments
  const todayAppointments = [
    { id: 1, time: '09:00 AM', petName: 'Max', ownerName: 'John Smith', type: 'Check-up', status: 'completed' },
    { id: 2, time: '10:30 AM', petName: 'Bella', ownerName: 'Emma Wilson', type: 'Vaccination', status: 'completed' },
    { id: 3, time: '11:00 AM', petName: 'Charlie', ownerName: 'Mike Brown', type: 'Surgery', status: 'in-progress' },
    { id: 4, time: '02:00 PM', petName: 'Luna', ownerName: 'Sarah Davis', type: 'Follow-up', status: 'pending' },
    { id: 5, time: '03:30 PM', petName: 'Rocky', ownerName: 'Tom Johnson', type: 'Emergency', status: 'pending' }
  ];

  // Pending medical records
  const pendingRecords = [
    { id: 1, petName: 'Max', diagnosis: 'Dental cleaning', action: 'Add prescription', priority: 'medium' },
    { id: 2, petName: 'Bella', diagnosis: 'Annual check-up', action: 'Complete notes', priority: 'low' },
    { id: 3, petName: 'Charlie', diagnosis: 'Post-surgery', action: 'Update recovery plan', priority: 'high' }
  ];

  // Recent cases
  const recentCases = [
    { id: 1, petName: 'Max', condition: 'Dental Issue', date: '2 hours ago', severity: 'low' },
    { id: 2, petName: 'Bella', condition: 'Vaccination', date: '4 hours ago', severity: 'routine' },
    { id: 3, petName: 'Charlie', condition: 'Surgery Recovery', date: '1 day ago', severity: 'high' },
    { id: 4, petName: 'Luna', condition: 'Skin Allergy', date: '2 days ago', severity: 'medium' }
  ];

  const StatCard = ({ title, value, change, icon, color, subtitle }) => (
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
          <TrendingUp sx={{ fontSize: 20, color: '#10b981' }} />
          <Typography variant="body2" color="success.main" fontWeight={600}>
            {change}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={70} 
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#64748b';
    }
  };

  return (
    <Box>
      {/* Welcome Header */}
      <Paper 
        sx={{ 
          p: 4,
          mb: 4,
          background: 'linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)',
          color: 'white',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" fontWeight="800" gutterBottom>
            Good Day, Dr. {user?.full_name?.split(' ').pop()}! 🩺
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.95, maxWidth: 600 }}>
            You have 5 appointments scheduled for today. 3 medical records pending completion.
          </Typography>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              sx={{ 
                bgcolor: 'white', 
                color: '#0ea5e9',
                fontWeight: 700,
                '&:hover': { bgcolor: '#f1f5f9' }
              }}
              onClick={() => navigate('/appointments')}
            >
              Today's Schedule
            </Button>
            <Button 
              variant="outlined" 
              sx={{ 
                borderColor: 'white', 
                color: 'white',
                fontWeight: 700,
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
              }}
              onClick={() => navigate('/medical-records')}
            >
              Medical Records
            </Button>
          </Box>
        </Box>
        
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
            title="Today's Patients"
            value="12"
            change="+3"
            subtitle="from yesterday"
            icon={<Pets />}
            color="#0ea5e9"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Appointments"
            value="5"
            change="2 completed"
            subtitle="3 remaining"
            icon={<CalendarToday />}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Vaccinations"
            value="8"
            change="+2"
            subtitle="this week"
            icon={<Vaccines />}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Records"
            value="3"
            change="-1"
            subtitle="since yesterday"
            icon={<Assignment />}
            color="#ef4444"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} mb={4}>
        {/* Weekly Treatments */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" color="primary.main">
                    Weekly Activity
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Treatments and vaccinations this week
                  </Typography>
                </Box>
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Box>
              
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyTreatments}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="treatments" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="vaccinations" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Treatment Types Distribution */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                Treatment Types
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                This month's breakdown
              </Typography>
              
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={treatmentTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {treatmentTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <Box sx={{ mt: 2 }}>
                {treatmentTypes.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: item.color }} />
                      <Typography variant="body2" color="text.secondary">{item.name}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="600">{item.value}%</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Section */}
      <Grid container spacing={3}>
        {/* Today's Appointments */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  📅 Today's Schedule
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
                      <TableCell><strong>Time</strong></TableCell>
                      <TableCell><strong>Pet</strong></TableCell>
                      <TableCell><strong>Owner</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {todayAppointments.map((apt) => (
                      <TableRow key={apt.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTime sx={{ fontSize: 18, color: '#64748b' }} />
                            <Typography variant="body2" fontWeight="600">{apt.time}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{apt.petName}</TableCell>
                        <TableCell>{apt.ownerName}</TableCell>
                        <TableCell>{apt.type}</TableCell>
                        <TableCell>
                          <Chip 
                            label={apt.status} 
                            size="small" 
                            color={getStatusColor(apt.status)}
                            sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Medical Records */}
        <Grid item xs={12} md={5}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                ⚠️ Pending Medical Records
              </Typography>

              <List>
                {pendingRecords.map((record, index) => (
                  <React.Fragment key={record.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            bgcolor: `${getPriorityColor(record.priority)}15`,
                            color: getPriorityColor(record.priority)
                          }}
                        >
                          <Assignment />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="600">
                            {record.petName} - {record.diagnosis}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {record.action}
                            </Typography>
                            <Chip 
                              label={record.priority} 
                              size="small"
                              sx={{ 
                                ml: 1,
                                height: 18,
                                fontSize: '0.7rem',
                                bgcolor: `${getPriorityColor(record.priority)}15`,
                                color: getPriorityColor(record.priority)
                              }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < pendingRecords.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>

              <Button 
                fullWidth 
                variant="outlined" 
                sx={{ mt: 2 }}
                onClick={() => navigate('/medical-records')}
              >
                Complete Records
              </Button>
            </CardContent>
          </Card>

          {/* Recent Cases */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                🏥 Recent Cases
              </Typography>

              <List>
                {recentCases.map((case_, index) => (
                  <React.Fragment key={case_.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="600">
                            {case_.petName} - {case_.condition}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {case_.date}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < recentCases.length - 1 && <Divider component="li" />}
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

export default VetDashboard;