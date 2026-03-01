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
  Inventory,
  Receipt
} from '@mui/icons-material';

const drawerWidth = 280;
const collapsedWidth = 80;

const Sidebar = ({ open, onClose, collapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get user info from localStorage
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
        roles: ['Admin', 'Vet', 'Receptionist']
      },
      {
        title: 'Pet Management',
        icon: <Pets />,
        path: '/pets',
        roles: ['Admin', 'Vet', 'Receptionist']
      },
      {
        title: 'Appointments',
        icon: <EventNote />,
        path: '/appointments',
        roles: ['Admin', 'Vet', 'Receptionist']
      },
      {
        title: 'Medical Records',
        icon: <Assignment />,
        path: '/medical-records',
        roles: ['Admin', 'Vet']
      },
      {
        title: 'Inventory',
        icon: <Inventory />,
        path: '/inventory',
        roles: ['Admin', 'Vet', 'Receptionist']
      },
      {
        title: 'Billing',
        icon: <Receipt />,
        path: '/invoices',
        roles: ['Admin', 'Receptionist']
      },
      {
        title: 'Users',
        icon: <People />,
        path: '/users',
        roles: ['Admin']
      },
      {
        title: 'Settings',
        icon: <Settings />,
        path: '/settings',
        roles: ['Admin', 'Vet', 'Receptionist']
      }
    ].filter(item => item.roles.includes(userRole));
  };

  const menuItems = getMenuItems();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #001f3f 0%, #003366 100%)',
        color: 'white'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: collapsed ? 2 : 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        {!collapsed && (
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{
                bgcolor: 'white',
                color: '#001f3f',
                width: 45,
                height: 45,
                fontWeight: 700
              }}
            >
              <Pets />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="700">
                PetCare Plus
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Management System
              </Typography>
            </Box>
          </Box>
        )}
        {collapsed && (
          <Avatar
            sx={{
              bgcolor: 'white',
              color: '#001f3f',
              width: 45,
              height: 45
            }}
          >
            <Pets />
          </Avatar>
        )}
      </Box>

      {/* User Profile */}
      <Box
        sx={{
          p: collapsed ? 2 : 3,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          textAlign: collapsed ? 'center' : 'left'
        }}
      >
        <Box display="flex" alignItems="center" gap={2} justifyContent={collapsed ? 'center' : 'flex-start'}>
          <Avatar
            sx={{
              bgcolor: alpha('#fff', 0.2),
              width: collapsed ? 40 : 50,
              height: collapsed ? 40 : 50,
              border: '2px solid white',
              fontWeight: 700
            }}
          >
            {userName.charAt(0)}
          </Avatar>
          {!collapsed && (
            <Box flex={1}>
              <Typography variant="body1" fontWeight="600" noWrap>
                {userName}
              </Typography>
              <Chip
                label={userRole}
                size="small"
                sx={{
                  bgcolor: alpha('#fff', 0.2),
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 22,
                  mt: 0.5
                }}
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* Menu Items */}
      <List sx={{ flex: 1, py: 2, overflowY: 'auto', overflowX: 'hidden' }}>
        {menuItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ px: collapsed ? 1 : 2, mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 2,
                minHeight: 48,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 0 : 2,
                bgcolor: isActive(item.path) ? alpha('#fff', 0.15) : 'transparent',
                '&:hover': {
                  bgcolor: alpha('#fff', 0.1)
                },
                transition: 'all 0.2s'
              }}
            >
              <ListItemIcon
                sx={{
                  color: 'white',
                  minWidth: collapsed ? 'auto' : 40,
                  justifyContent: 'center'
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{
                    fontSize: '0.95rem',
                    fontWeight: isActive(item.path) ? 600 : 500
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Logout Button */}
      <Box sx={{ p: collapsed ? 1 : 2 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            justifyContent: collapsed ? 'center' : 'flex-start',
            px: collapsed ? 0 : 2,
            bgcolor: alpha('#fff', 0.05),
            '&:hover': {
              bgcolor: alpha('#fff', 0.1)
            }
          }}
        >
          <ListItemIcon
            sx={{
              color: 'white',
              minWidth: collapsed ? 'auto' : 40,
              justifyContent: 'center'
            }}
          >
            <Logout />
          </ListItemIcon>
          {!collapsed && (
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{
                fontSize: '0.95rem',
                fontWeight: 600
              }}
            />
          )}
        </ListItemButton>
      </Box>

      {/* Collapse Toggle */}
      {onToggleCollapse && (
        <Box
          sx={{
            p: 1,
            display: 'flex',
            justifyContent: 'center',
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <IconButton
            onClick={onToggleCollapse}
            sx={{
              color: 'white',
              '&:hover': {
                bgcolor: alpha('#fff', 0.1)
              }
            }}
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Box>
      )}
    </Box>
  );

  return (
    <>
      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: collapsed ? collapsedWidth : drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: collapsed ? collapsedWidth : drawerWidth,
            boxSizing: 'border-box',
            border: 'none',
            transition: 'width 0.3s ease'
          }
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            border: 'none'
          }
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;