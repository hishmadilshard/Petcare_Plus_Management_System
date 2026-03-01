import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  Divider,
  Chip,
  IconButton,
  alpha
} from '@mui/material';
import {
  Dashboard,
  Pets,
  People,
  EventNote,
  LocalHospital,
  Assignment,
  Settings,
  Logout,
  ChevronLeft,
  ChevronRight,
  MedicalServices,
  Vaccines,
  Receipt,
  Inventory2,
  ManageAccounts
} from '@mui/icons-material';

const drawerWidth = 280;
const collapsedWidth = 80;

const Sidebar = ({ open, onClose, collapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role || 'Admin';
  const userName = user.full_name || user.email || 'User';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const getMenuItems = () => {
    return [
      {
        title: 'Dashboard',
        icon: <Dashboard />,
        path: '/dashboard',
        roles: ['Admin', 'Veterinarian', 'Receptionist']
      },
      {
        title: 'Pet Management',
        icon: <Pets />,
        path: '/pets',
        roles: ['Admin', 'Veterinarian', 'Receptionist']
      },
      {
        title: 'Pet Owners',
        icon: <People />,
        path: '/pet-owners',
        roles: ['Admin', 'Receptionist']
      },
      {
        title: 'Appointments',
        icon: <EventNote />,
        path: '/appointments',
        roles: ['Admin', 'Veterinarian', 'Receptionist']
      },
      {
        title: 'Medical Records',
        icon: <Assignment />,
        path: '/medical-records',
        roles: ['Admin', 'Veterinarian']
      },
      {
        title: 'Vaccinations',
        icon: <Vaccines />,
        path: '/vaccinations',
        roles: ['Admin', 'Veterinarian', 'Receptionist']
      },
      {
        title: 'Billing',
        icon: <Receipt />,
        path: '/billing',
        roles: ['Admin', 'Receptionist']
      },
      {
        title: 'Inventory',
        icon: <Inventory2 />,
        path: '/inventory',
        roles: ['Admin', 'Receptionist']
      },
      {
        title: 'Veterinarians',
        icon: <LocalHospital />,
        path: '/veterinarians',
        roles: ['Admin']
      },
      {
        title: 'Users',
        icon: <ManageAccounts />,
        path: '/users',
        roles: ['Admin']
      },
      {
        title: 'Services',
        icon: <MedicalServices />,
        path: '/services',
        roles: ['Admin', 'Veterinarian']
      },
      {
        title: 'Settings',
        icon: <Settings />,
        path: '/settings',
        roles: ['Admin', 'Veterinarian', 'Receptionist']
      }
    ].filter(item => item.roles.includes(userRole));
  };

  const menuItems = getMenuItems();

  const isActive = (path) => {
    if (path === '/pets') return location.pathname === '/pets' || location.pathname.startsWith('/pets/');
    if (path === '/pet-owners') return location.pathname === '/pet-owners' || location.pathname.startsWith('/pet-owners/');
    return location.pathname === path;
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #001f3f 0%, #003366 100%)', color: 'white' }}>
      {/* Header */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'white', color: '#001f3f', width: 40, height: 40 }}>
              <Pets />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" color="white">PetCare Plus</Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.6)">Management System</Typography>
            </Box>
          </Box>
        )}
        {onToggleCollapse && (
          <IconButton onClick={onToggleCollapse} sx={{ color: 'white', ml: collapsed ? 'auto' : 0 }}>
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        )}
      </Box>

      {/* User Info */}
      {!collapsed && (
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.08)' }}>
            <Avatar sx={{ bgcolor: '#0ea5e9', width: 36, height: 36, fontSize: '0.9rem' }}>
              {userName.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="body2" fontWeight="600" color="white" noWrap>{userName}</Typography>
              <Chip label={userRole} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '0.65rem', height: 18 }} />
            </Box>
          </Box>
        </Box>
      )}

      {/* Menu Items */}
      <List sx={{ flex: 1, px: 1.5, py: 2, overflowY: 'auto' }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 2,
                py: 1.2,
                px: collapsed ? 1.5 : 2,
                justifyContent: collapsed ? 'center' : 'flex-start',
                bgcolor: isActive(item.path) ? 'rgba(255,255,255,0.15)' : 'transparent',
                borderLeft: isActive(item.path) ? '3px solid #0ea5e9' : '3px solid transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                transition: 'all 0.2s'
              }}
            >
              <ListItemIcon sx={{ color: isActive(item.path) ? '#0ea5e9' : 'rgba(255,255,255,0.7)', minWidth: collapsed ? 0 : 40 }}>
                {item.icon}
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isActive(item.path) ? 600 : 400, color: isActive(item.path) ? 'white' : 'rgba(255,255,255,0.7)' }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Logout */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{ borderRadius: 2, py: 1.2, px: 2, justifyContent: collapsed ? 'center' : 'flex-start', '&:hover': { bgcolor: 'rgba(255,0,0,0.15)' } }}
        >
          <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: collapsed ? 0 : 40 }}>
            <Logout />
          </ListItemIcon>
          {!collapsed && <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }} />}
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer variant="temporary" open={open} onClose={onClose} ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', border: 'none' } }}>
        {drawerContent}
      </Drawer>
      {/* Desktop Drawer */}
      <Drawer variant="permanent"
        sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: collapsed ? collapsedWidth : drawerWidth, boxSizing: 'border-box', border: 'none', transition: 'width 0.3s', overflow: 'hidden' } }}>
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;