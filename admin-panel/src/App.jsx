import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

// Management Pages
import UserManagement from './pages/users/UserManagement';
import PetManagement from './pages/pets/PetManagement';
import AppointmentsPage from './pages/appointments/AppointmentsPage';
import MedicalRecordsPage from './pages/medical/MedicalRecordsPage';
import BillingPage from './pages/billing/BillingPage';
import InventoryPage from './pages/inventory/InventoryPage';

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
    },
    error: {
      main: '#dc2626'
    },
    warning: {
      main: '#f59e0b'
    },
    success: {
      main: '#10b981'
    },
    info: {
      main: '#0ea5e9'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      color: '#1e3a8a'
    },
    h5: {
      fontWeight: 600,
      color: '#1e3a8a'
    },
    h6: {
      fontWeight: 600,
      color: '#1e3a8a'
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '10px 24px'
        },
        contained: {
          boxShadow: '0 4px 6px -1px rgba(30, 58, 138, 0.3)',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgba(30, 58, 138, 0.4)'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'medium'
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
              {/* ==================== PUBLIC ROUTES ==================== */}
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* ==================== PROTECTED ROUTES ==================== */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                {/* Default Redirect */}
                <Route index element={<Navigate to="/dashboard" replace />} />
                
                {/* ==================== DASHBOARD ==================== */}
                {/* All Roles - Shows different dashboard based on role */}
                <Route path="dashboard" element={<DashboardRouter />} />
                
                {/* ==================== USER MANAGEMENT ==================== */}
                {/* Admin Only - Full CRUD */}
                <Route 
                  path="users" 
                  element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                      <UserManagement />
                    </ProtectedRoute>
                  } 
                />
                
                {/* ==================== PET MANAGEMENT ==================== */}
                {/* Admin: Full CRUD */}
                {/* Vet: View, Add Medical Notes */}
                {/* Receptionist: Full CRUD */}
                <Route 
                  path="pets" 
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'Vet', 'Receptionist']}>
                      <PetManagement />
                    </ProtectedRoute>
                  } 
                />
                
                {/* ==================== APPOINTMENTS ==================== */}
                <Route 
                  path="appointments" 
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'Vet', 'Receptionist']}>
                      <AppointmentsPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* ==================== MEDICAL RECORDS ==================== */}
                <Route 
                  path="medical-records" 
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'Vet']}>
                      <MedicalRecordsPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* ==================== VACCINATIONS ==================== */}
                {/* Admin: Full CRUD */}
                {/* Vet: Full CRUD (Administer, Schedule) */}
                {/* Receptionist: View, Schedule Reminders */}
                <Route 
                  path="vaccinations" 
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'Vet', 'Receptionist']}>
                      <div style={{ padding: 20 }}>
                        <h2>💉 Vaccination Management</h2>
                        <p><strong>Admin:</strong> Full CRUD access</p>
                        <p><strong>Vet:</strong> Administer vaccines, create schedules, update records</p>
                        <p><strong>Receptionist:</strong> View schedules, send reminders to pet owners</p>
                        <p style={{ color: '#64748b', marginTop: 20 }}>Coming Soon...</p>
                      </div>
                    </ProtectedRoute>
                  } 
                />
                
                {/* ==================== INVENTORY ==================== */}
                <Route 
                  path="inventory" 
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'Vet', 'Receptionist']}>
                      <InventoryPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* ==================== INVOICES / BILLING ==================== */}
                <Route 
                  path="invoices" 
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'Receptionist']}>
                      <BillingPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* ==================== NOTIFICATIONS ==================== */}
                {/* Admin: Send All Types */}
                {/* Vet: No Access */}
                {/* Receptionist: Send to Pet Owners (Appointments, Reminders) */}
                <Route 
                  path="notifications" 
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'Receptionist']}>
                      <div style={{ padding: 20 }}>
                        <h2>🔔 Notification Center</h2>
                        <p><strong>Admin:</strong> Send all notifications (system, users, owners)</p>
                        <p><strong>Vet:</strong> ❌ No Access</p>
                        <p><strong>Receptionist:</strong> Send appointment reminders, vaccination alerts to pet owners</p>
                        <p style={{ color: '#64748b', marginTop: 20 }}>Coming Soon...</p>
                      </div>
                    </ProtectedRoute>
                  } 
                />
                
                {/* ==================== REPORTS & ANALYTICS ==================== */}
                {/* Admin: All Reports (Revenue, Appointments, Inventory) */}
                {/* Vet: Medical Reports Only */}
                {/* Receptionist: No Access */}
                <Route 
                  path="reports" 
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'Vet']}>
                      <div style={{ padding: 20 }}>
                        <h2>📊 Reports & Analytics</h2>
                        <p><strong>Admin:</strong> All reports - revenue, appointments, inventory, user activity</p>
                        <p><strong>Vet:</strong> Medical reports, treatment statistics, patient outcomes</p>
                        <p><strong>Receptionist:</strong> ❌ No Access</p>
                        <p style={{ color: '#64748b', marginTop: 20 }}>Coming Soon...</p>
                      </div>
                    </ProtectedRoute>
                  } 
                />
                
                {/* ==================== SETTINGS ==================== */}
                {/* Admin: System Settings, Clinic Info */}
                {/* Vet: Profile Settings Only */}
                {/* Receptionist: Profile Settings Only */}
                <Route 
                  path="settings" 
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'Vet', 'Receptionist']}>
                      <div style={{ padding: 20 }}>
                        <h2>⚙️ Settings</h2>
                        <p><strong>Admin:</strong> System configuration, clinic info, email/SMS settings, user preferences</p>
                        <p><strong>Vet:</strong> Personal profile, change password, notification preferences</p>
                        <p><strong>Receptionist:</strong> Personal profile, change password</p>
                        <p style={{ color: '#64748b', marginTop: 20 }}>Coming Soon...</p>
                      </div>
                    </ProtectedRoute>
                  } 
                />
              </Route>

              {/* ==================== 404 CATCH ALL ==================== */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            {/* Toast Notifications */}
            <ToastContainer 
              position="top-right" 
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
              style={{ zIndex: 9999 }}
            />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;