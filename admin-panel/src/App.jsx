import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import AppointmentsPage from './pages/appointments/AppointmentsPage';
import MedicalRecordsPage from './pages/medical/MedicalRecordsPage';
import VaccinationsPage from './pages/vaccinations/VaccinationsPage';
import PetManagement from './pages/pets/PetManagement';
import UserManagement from './pages/users/UserManagement';
import SettingsPage from './pages/settings/settingsPage';
import ServicesPage from './pages/services/ServicesPage';
import VeterinariansPage from './pages/veterinarians/VeterinariansPage';

const App = () => {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pets" element={<PetManagement />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/medical-records" element={<MedicalRecordsPage />} />
          <Route path="/vaccinations" element={<VaccinationsPage />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/veterinarians" element={<VeterinariansPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
};

export default App;