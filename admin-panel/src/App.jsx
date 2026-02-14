import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserManagement from './pages/users/UserManagement';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Unauthorized from './pages/auth/Unauthorized';

// Dashboard Pages
import AdminDashboard from './pages/dashboard/AdminDashboard';
import VetDashboard from './pages/dashboard/VetDashboard';
import ReceptionistDashboard from './pages/dashboard/ReceptionistDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// Navy Blue & White Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1e3a8a',
      light: '#3b82f6',
      dark: '#1e40af',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#0ea5e9',
      light: '#38bdf8',
      dark: '#0284c7',
      contrastText: '#ffffff'
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff'
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16
        }
      }
    }
  }
});

// Dashboard Router Component
const DashboardRouter = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (user.role === 'Admin') {
    return <AdminDashboard />;
  } else if (user.role === 'Vet') {
    return <VetDashboard />;
  } else if (user.role === 'Receptionist') {
    return <ReceptionistDashboard />;
  }
  
  return <Navigate to="/unauthorized" replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Protected Routes */}
              <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardRouter />} />
                
                {/* Admin Only Routes */}
                <Route 
                  path="users" 
                  element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                      <div>User Management (Coming Soon)</div>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="reports" 
                  element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                      <div>Reports (Coming Soon)</div>
                    </ProtectedRoute>
                  } 
                />

                {/* Vet Only Routes */}
                <Route 
                  path="medical-records" 
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'Vet']}>
                      <div>Medical Records (Coming Soon)</div>
                    </ProtectedRoute>
                  } 
                />

                {/* Staff Routes (Admin, Receptionist) */}
                <Route 
                  path="inventory" 
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'Receptionist']}>
                      <div>Inventory (Coming Soon)</div>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="invoices" 
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'Receptionist']}>
                      <div>Invoices (Coming Soon)</div>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="notifications" 
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'Receptionist']}>
                      <div>Notifications (Coming Soon)</div>
                    </ProtectedRoute>
                  } 
                />

                {/* Common Routes (All roles) */}
                <Route 
                  path="pets" 
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'Vet', 'Receptionist']}>
                      <div>Pets (Coming Soon)</div>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="appointments" 
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'Vet', 'Receptionist']}>
                      <div>Appointments (Coming Soon)</div>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="vaccinations" 
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'Vet', 'Receptionist']}>
                      <div>Vaccinations (Coming Soon)</div>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="settings" 
                  element={
                    <ProtectedRoute>
                      <div>Settings (Coming Soon)</div>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="users" 
                  element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                  <UserManagement />
                </ProtectedRoute>
                } 
              />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <ToastContainer position="top-right" autoClose={3000} />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;