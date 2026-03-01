import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, Button, TextField,
  Stack, Avatar, Divider, CircularProgress
} from '@mui/material';
import { toast } from 'react-toastify';
import api from '../../services/api';

const SettingsPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({ full_name: '', email: '', phone: '' });
  const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    setProfileData({ full_name: stored.full_name || '', email: stored.email || '', phone: stored.phone || '' });
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      const data = res.data.data || res.data;
      setUser(data);
      setProfileData({ full_name: data.full_name || '', email: data.email || '', phone: data.phone || '' });
    } catch {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(stored);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      await api.put('/auth/profile', profileData);
      const updated = { ...user, ...profileData };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      setEditMode(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.current_password || !passwordData.new_password) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      setSavingPassword(true);
      await api.put('/auth/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      toast.success('Password changed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="#1e3a8a">Settings</Typography>
        <Typography variant="body2" color="text.secondary">Manage your profile and account settings</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: '#1e3a8a', width: 56, height: 56, fontSize: '1.5rem' }}>
                  {(profileData.full_name || 'U').charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold" color="#1e3a8a">Profile Information</Typography>
                  <Typography variant="body2" color="text.secondary">{user?.role || 'Staff'}</Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 3 }} />

              {editMode ? (
                <Stack spacing={2.5}>
                  <TextField fullWidth label="Full Name" name="full_name" value={profileData.full_name} onChange={handleProfileChange} />
                  <TextField fullWidth label="Email" name="email" value={profileData.email} disabled helperText="Email cannot be changed" />
                  <TextField fullWidth label="Phone" name="phone" value={profileData.phone} onChange={handleProfileChange} />
                  <Stack direction="row" spacing={2}>
                    <Button variant="outlined" onClick={() => setEditMode(false)} fullWidth>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveProfile} disabled={savingProfile} fullWidth
                      sx={{ bgcolor: '#1e3a8a', '&:hover': { bgcolor: '#1e40af' } }}>
                      {savingProfile ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Stack spacing={2}>
                  {[
                    ['Full Name', profileData.full_name || '-'],
                    ['Email', profileData.email || '-'],
                    ['Phone', profileData.phone || '-'],
                    ['Role', user?.role || '-'],
                  ].map(([label, value]) => (
                    <Box key={label}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
                      <Typography variant="body1">{value}</Typography>
                      <Divider sx={{ mt: 1 }} />
                    </Box>
                  ))}
                  <Button variant="contained" onClick={() => setEditMode(true)}
                    sx={{ bgcolor: '#1e3a8a', '&:hover': { bgcolor: '#1e40af' }, mt: 1 }}>
                    Edit Profile
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Change Password Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" color="#1e3a8a" gutterBottom>Change Password</Typography>
              <Divider sx={{ mb: 3 }} />
              <Stack spacing={2.5}>
                <TextField fullWidth label="Current Password" name="current_password" type="password"
                  value={passwordData.current_password} onChange={handlePasswordChange} />
                <TextField fullWidth label="New Password" name="new_password" type="password"
                  value={passwordData.new_password} onChange={handlePasswordChange} />
                <TextField fullWidth label="Confirm New Password" name="confirm_password" type="password"
                  value={passwordData.confirm_password} onChange={handlePasswordChange} />
                <Button variant="contained" onClick={handleChangePassword} disabled={savingPassword}
                  sx={{ bgcolor: '#1e3a8a', '&:hover': { bgcolor: '#1e40af' } }}>
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettingsPage;
