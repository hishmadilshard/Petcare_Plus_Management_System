import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Chip,
  Avatar
} from '@mui/material';
import {
  Dashboard,
  Pets,
  CalendarMonth,
  People,
  MedicalServices,
  Vaccines,
  Inventory,
  Receipt,
  Notifications,
  Settings,
  Description
} from '@mui/icons-material';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasRole } = useAuth();

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/dashboard',
      roles: ['Admin', 'Vet', 'Receptionist']
    },
    {
      text: 'Pets',
      icon: <Pets />,
      path: '/pets',
      roles: ['Admin', 'Vet', 'Receptionist']
    },
    {
      text: 'Appointments',
      icon: <CalendarMonth />,
      path: '/appointments',
      roles: ['Admin', 'Vet', 'Receptionist']
    },
    {
      text: 'Medical Records',
      icon: <MedicalServices />,
      path: '/medical-records',
      roles: ['Admin', 'Vet']
    },
    {
      text: 'Vaccinations',
      icon: <Vaccines />,
      path: '/vaccinations',
      roles: ['Admin', 'Vet', 'Receptionist']
    },
    {
      text: 'Inventory',
      icon: <Inventory />,
      path: '/inventory',
      roles: ['Admin', 'Receptionist']
    },
    {
      text: 'Invoices',
      icon: <Receipt />,
      path: '/invoices',
      roles: ['Admin', 'Receptionist']
    },
    {
      text: 'Users',
      icon: <People />,
      path: '/users',
      roles: ['Admin']
    },
    {
      text: 'Notifications',
      icon: <Notifications />,
      path: '/notifications',
      roles: ['Admin', 'Receptionist']
    },
    {
      text: 'Reports',
      icon: <Description />,
      path: '/reports',
      roles: ['Admin']
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#1e3a8a' }}>
      {/* Logo Section */}
      <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#1e40af', color: 'white' }}>
        <Pets sx={{ fontSize: 48, mb: 1 }} />
        <Typography variant="h6" fontWeight="bold">
          PetCare Plus
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          Management System
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* User Info */}
      <Box sx={{ p: 2.5, bgcolor: 'rgba(255,255,255,0.05)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Avatar 
            sx={{ 
              bgcolor: '#0ea5e9', 
              mr: 1.5,
              width: 40,
              height: 40
            }}
          >
            {user?.full_name?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" color="white" noWrap>
              {user?.full_name}
            </Typography>
            <Chip
              label={user?.role}
              size="small"
              sx={{
                height: 20,
                bgcolor: '#0ea5e9',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 600
              }}
            />
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Navigation Menu */}
      <List sx={{ flexGrow: 1, pt: 2, px: 1 }}>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 2,
                color: 'rgba(255,255,255,0.7)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: 'white'
                },
                '&.Mui-selected': {
                  bgcolor: '#0ea5e9',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#0284c7'
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white'
                  }
                }
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'white' : 'rgba(255,255,255,0.7)',
                  minWidth: 40
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: location.pathname === item.path ? 600 : 500
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Settings */}
      <List sx={{ px: 1, pb: 1 }}>
        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => navigate('/settings')}
            sx={{
              borderRadius: 2,
              color: 'rgba(255,255,255,0.7)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)',
                color: 'white'
              }
            }}
          >
            <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 40 }}>
              <Settings />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.2)' }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
          Version 1.0.0
        </Typography>
      </Box>
    </Box>
  );
};

export default Sidebar;