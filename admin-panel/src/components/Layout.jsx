import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, AppBar, Toolbar, IconButton, Typography, Avatar, Badge } from '@mui/material';
import { Menu as MenuIcon, Notifications } from '@mui/icons-material';
import Sidebar from './Sidebar';

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          bgcolor: '#f5f7fa',
          minHeight: '100vh'
        }}
      >
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'white',
            color: '#001f3f',
            borderBottom: '1px solid #e0e0e0'
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
              {user.full_name || 'Welcome'}
            </Typography>

            <IconButton color="inherit">
              <Badge badgeContent={0} color="error">
                <Notifications />
              </Badge>
            </IconButton>

            <Avatar sx={{ width: 36, height: 36, bgcolor: '#001f3f', ml: 1 }}>
              {user.full_name?.charAt(0) || 'U'}
            </Avatar>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;