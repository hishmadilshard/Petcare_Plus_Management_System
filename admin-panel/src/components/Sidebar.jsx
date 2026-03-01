import React from 'react';
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
  ChevronRight
} from '@mui/icons-material';

const drawerWidth = 280;
const collapsedWidth = 80;

const Sidebar = ({ open, onClose, collapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role || 'Admin';
  const userName = user.full_name || 'User';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const menuItems = [
    { title: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { title: 'Pet Management', icon: <Pets />, path: '/pets' },
    { title: 'Pet Owners', icon: <People />, path: '/pet-owners' },
    { title: 'Appointments', icon: <EventNote />, path: '/appointments' },
    { title: 'Medical Records', icon: <Assignment />, path: '/medical-records' },
    { title: 'Veterinarians', icon: <LocalHospital />, path: '/veterinarians' },
    { title: 'Settings', icon: <Settings />, path: '/settings' }
  ];

  const isActive = (path) => location.pathname === path;

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
      <Box sx={{ p: collapsed ? 2 : 3, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        {!collapsed && (
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'white', color: '#001f3f', width: 45, height: 45, fontWeight: 700 }}>
              <Pets />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="700">PetCare Plus</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>Management System</Typography>
            </Box>
          </Box>
        )}
        {collapsed && <Avatar sx={{ bgcolor: 'white', color: '#001f3f', width: 45, height: 45 }}><Pets /></Avatar>}
      </Box>

      {/* User Profile */}
      <Box sx={{ p: collapsed ? 2 : 3, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: alpha('#fff', 0.2), width: 50, height: 50, border: '2px solid white', fontWeight: 700 }}>
            {userName.charAt(0)}
          </Avatar>
          {!collapsed && (
            <Box flex={1}>
              <Typography variant="body1" fontWeight="600">{userName}</Typography>
              <Chip label={userRole} size="small" sx={{ bgcolor: alpha('#fff', 0.2), color: 'white', mt: 0.5, height: 22 }} />
            </Box>
          )}
        </Box>
      </Box>

      {/* Menu */}
      <List sx={{ flex: 1, py: 2 }}>
        {menuItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ px: collapsed ? 1 : 2, mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 2,
                minHeight: 48,
                justifyContent: collapsed ? 'center' : 'flex-start',
                bgcolor: isActive(item.path) ? alpha('#fff', 0.15) : 'transparent',
                '&:hover': { bgcolor: alpha('#fff', 0.1) }
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: collapsed ? 'auto' : 40 }}>
                {item.icon}
              </ListItemIcon>
              {!collapsed && <ListItemText primary={item.title} />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Logout */}
      <Box sx={{ p: collapsed ? 1 : 2 }}>
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <ListItemIcon sx={{ color: 'white', minWidth: collapsed ? 'auto' : 40 }}>
            <Logout />
          </ListItemIcon>
          {!collapsed && <ListItemText primary="Logout" />}
        </ListItemButton>
      </Box>

      {onToggleCollapse && (
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <IconButton onClick={onToggleCollapse} sx={{ color: 'white' }}>
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Box>
      )}
    </Box>
  );

  return (
    <>
      <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, width: collapsed ? collapsedWidth : drawerWidth, '& .MuiDrawer-paper': { width: collapsed ? collapsedWidth : drawerWidth, transition: 'width 0.3s ease' } }}>
        {drawerContent}
      </Drawer>
      <Drawer variant="temporary" open={open} onClose={onClose} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}>
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;