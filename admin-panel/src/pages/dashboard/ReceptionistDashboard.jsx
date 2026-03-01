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
  IconButton,
  Badge
} from '@mui/material';
import {
  TrendingUp,
  CalendarToday,
  AttachMoney,
  Pets,
  Schedule,
  Notifications,
  ArrowForward,
  CheckCircle,
  AccessTime,
  Warning,
  MoreVert,
  Phone,
  Email
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

const ReceptionistDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Appointment statistics
  const weeklyAppointments = [
    { day: 'Mon', appointments: 18, completed: 15 },
    { day: 'Tue', appointments: 22, completed: 20 },
    { day: 'Wed', appointments: 20, completed: 18 },
    { day: 'Thu', appointments: 25, completed: 22 },
    { day: 'Fri', appointments: 28, completed: 25 },
    { day: 'Sat', appointments: 30, completed: 28 },
    { day: 'Sun', appointments: 12, completed: 10 }
  ];

  const paymentStatus = [
    { name: 'Paid', value: 68, color: '#10b981' },
    { name: 'Pending', value: 22, color: '#f59e0b' },
    { name: 'Overdue', value: 10, color: '#ef4444' }
  ];

  // Today's appointments
  const todayAppointments = [
    { id: 1, time: '09:00 AM', petName: 'Max', ownerName: 'John Smith', phone: '077-1234567', status: 'confirmed' },
    { id: 2, time: '10:30 AM', petName: 'Bella', ownerName: 'Emma Wilson', phone: '077-2345678', status: 'confirmed' },
    { id: 3, time: '11:00 AM', petName: 'Charlie', ownerName: 'Mike Brown', phone: '077-3456789', status: 'pending' },
    { id: 4, time: '02:00 PM', petName: 'Luna', ownerName: 'Sarah Davis', phone: '077-4567890', status: 'pending' },
    { id: 5, time: '03:30 PM', petName: 'Rocky', ownerName: 'Tom Johnson', phone: '077-5678901', status: 'cancelled' }
  ];

  // Pending payments
  const pendingPayments = [
    { id: 1, invoiceNo: 'INV-001', ownerName: 'John Smith', amount: 'LKR 5,000', dueDate: 'Today', overdue: false },
    { id: 2, invoiceNo: 'INV-002', ownerName: 'Emma Wilson', amount: 'LKR 3,500', dueDate: 'Yesterday', overdue: true },
    { id: 3, invoiceNo: 'INV-003', ownerName: 'Mike Brown', amount: 'LKR 8,200', dueDate: '2 days ago', overdue: true }
  ];

  // Notifications & reminders
  const notifications = [
    { id: 1, type: 'appointment', message: 'Appointment reminder: Max - 09:00 AM', time: '30 mins', priority: 'high' },
    { id: 2, type: 'payment', message: 'Payment overdue: INV-002', time: '1 hour', priority: 'high' },
    { id: 3, type: 'vaccination', message: 'Vaccination due: Bella next week', time: '2 hours', priority: 'medium' },
    { id: 4, type: 'info', message: 'New pet registered: Rocky', time: '3 hours', priority: 'low' }
  ];

  // Quick stats
  const quickStats = [
    { label: 'Check-ins Today', value: 8, icon: '✅' },
    { label: 'Pending Check-ins', value: 4, icon: '⏰' },
    { label: 'New Registrations', value: 3, icon: '🆕' },
    { label: 'Cancelled', value: 2, icon: '❌' }
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Welcome Header */}
      <Paper 
        sx={{ 
          p: 4,
          mb: 4,
          background: 'linear-gradient(135deg, #f59e0b 0%, #10b981 100%)',
          color: 'white',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" fontWeight="800" gutterBottom>
            Hello, {user?.full_name}! 👋
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.95, maxWidth: 600 }}>
            You have 12 appointments scheduled today. 3 pending check-ins and 2 payment reminders.
          </Typography>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              sx={{ 
                bgcolor: 'white', 
                color: '#f59e0b',
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
              onClick={() => navigate('/invoices')}
            >
              Pending Payments
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
            title="Today's Appointments"
            value="12"
            change="+3"
            subtitle="from yesterday"
            icon={<CalendarToday />}
            color="#0ea5e9"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Payments"
            value="LKR 45K"
            change="+12%"
            subtitle="this week"
            icon={<AttachMoney />}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="New Registrations"
            value="8"
            change="+2"
            subtitle="this week"
            icon={<Pets />}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Notifications"
            value="15"
            change="4 urgent"
            subtitle="need attention"
            icon={<Notifications />}
            color="#ef4444"
          />
        </Grid>
      </Grid>

      {/* Quick Stats */}
      <Grid container spacing={2} mb={4}>
        {quickStats.map((stat, index) => (
          <Grid item xs={6} md={3} key={index}>
            <Paper sx={{ p: 2, textAlign: 'center', border: '2px solid #f1f5f9' }}>
              <Typography variant="h4" mb={1}>{stat.icon}</Typography>
              <Typography variant="h5" fontWeight="bold" color="primary.main">{stat.value}</Typography>
              <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} mb={4}>
        {/* Weekly Appointments */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" color="primary.main">
                    Weekly Appointments
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Scheduled vs completed appointments
                  </Typography>
                </Box>
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Box>
              
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={weeklyAppointments}>
                  <defs>
                    <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="appointments" 
                    stroke="#0ea5e9" 
                    fillOpacity={1} 
                    fill="url(#colorAppointments)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#10b981" 
                    fill="transparent" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Status */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                Payment Status
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                This month's overview
              </Typography>
              
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={paymentStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <Box sx={{ mt: 2 }}>
                {paymentStatus.map((item, index) => (
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
        <Grid item xs={12} md={8}>
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
                      <TableCell><strong>Time</strong></TableCell>
                      <TableCell><strong>Pet</strong></TableCell>
                      <TableCell><strong>Owner</strong></TableCell>
                      <TableCell><strong>Contact</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
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
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{apt.phone}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={apt.status} 
                            size="small" 
                            color={getStatusColor(apt.status)}
                            sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" color="primary">
                            <Phone fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="primary">
                            <Email fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Pending Payments */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                💰 Pending Payments
              </Typography>

              <List>
                {pendingPayments.map((payment, index) => (
                  <React.Fragment key={payment.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            bgcolor: payment.overdue ? '#ef444415' : '#f59e0b15',
                            color: payment.overdue ? '#ef4444' : '#f59e0b'
                          }}
                        >
                          {payment.overdue ? <Warning /> : <AttachMoney />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="600">
                            {payment.ownerName}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {payment.invoiceNo} • {payment.amount}
                            </Typography>
                            <br />
                            <Chip 
                              label={payment.dueDate}
                              size="small"
                              color={payment.overdue ? 'error' : 'warning'}
                              sx={{ height: 18, fontSize: '0.7rem', mt: 0.5 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < pendingPayments.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>

              <Button 
                fullWidth 
                variant="outlined" 
                sx={{ mt: 2 }}
                onClick={() => navigate('/invoices')}
              >
                View All Invoices
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  🔔 Notifications
                </Typography>
                <Badge badgeContent={4} color="error">
                  <Notifications />
                </Badge>
              </Box>

              <List>
                {notifications.map((notif, index) => (
                  <React.Fragment key={notif.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="600">
                            {notif.message}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {notif.time} ago
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < notifications.length - 1 && <Divider component="li" />}
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

export default ReceptionistDashboard;