import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  CircularProgress,
  Stack,
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Link,
  Paper
} from '@mui/material';
import { Visibility, VisibilityOff, Pets, LoginOutlined } from '@mui/icons-material';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5000/api';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      navigate('/dashboard', { replace: true });
    }

    // Load remembered email if exists
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔵 Attempting login for:', formData.email);

      const response = await axios.post(`${API_URL}/auth/login`, {
        email: formData.email,
        password: formData.password
      });

      console.log('✅ Login response:', response.data);

      if (response.data.success) {
        const { user, tokens } = response.data.data;

        // Save tokens
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        // Handle remember me
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        console.log('✅ Tokens saved, redirecting to dashboard...');
        toast.success(`Welcome back, ${user.full_name}!`);

        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      } else {
        setError('Login failed');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      const message = err.response?.data?.message || 'Invalid email or password. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast.info('Password reset feature coming soon!');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}
    >
      <Container maxWidth="sm">
        {/* Logo & Branding */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Paper
            elevation={0}
            sx={{
              display: 'inline-flex',
              p: 2.5,
              borderRadius: '50%',
              backgroundColor: '#1e3a8a',
              mb: 2,
              boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.3)'
            }}
          >
            <Pets sx={{ fontSize: 52, color: 'white' }} />
          </Paper>
          <Typography 
            variant="h3" 
            fontWeight="800" 
            sx={{ 
              color: '#1e3a8a',
              letterSpacing: '-0.5px',
              mb: 0.5
            }}
          >
            PetCare Plus
          </Typography>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: '#64748b',
              fontWeight: 500,
              letterSpacing: '0.5px'
            }}
          >
            Petcare Plus Management System
          </Typography>
        </Box>

        {/* Login Card */}
        <Card 
          elevation={0}
          sx={{ 
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
          }}
        >
          <CardContent sx={{ p: 5 }}>
            {/* Title */}
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="h5" 
                fontWeight="700" 
                color="primary.main"
                gutterBottom
              >
                Sign In
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter your credentials to access your account
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  borderRadius: 2,
                  border: '1px solid #fecaca',
                  backgroundColor: '#fef2f2'
                }}
              >
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {/* Email Field */}
                <Box>
                  <Typography 
                    variant="caption" 
                    fontWeight="600" 
                    color="text.primary"
                    sx={{ mb: 1, display: 'block' }}
                  >
                    Email Address
                  </Typography>
                  <TextField
                    fullWidth
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="admin@petcareplus.lk"
                    autoComplete="email"
                    autoFocus
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: '#ffffff',
                        '&:hover fieldset': {
                          borderColor: 'primary.main'
                        },
                        '&.Mui-focused fieldset': {
                          borderWidth: 2
                        }
                      }
                    }}
                  />
                </Box>

                {/* Password Field */}
                <Box>
                  <Typography 
                    variant="caption" 
                    fontWeight="600" 
                    color="text.primary"
                    sx={{ mb: 1, display: 'block' }}
                  >
                    Password
                  </Typography>
                  <TextField
                    fullWidth
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton 
                            onClick={() => setShowPassword(!showPassword)} 
                            edge="end"
                            tabIndex={-1}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: '#ffffff',
                        '&:hover fieldset': {
                          borderColor: 'primary.main'
                        },
                        '&.Mui-focused fieldset': {
                          borderWidth: 2
                        }
                      }
                    }}
                  />
                </Box>

                {/* Remember Me & Forgot Password */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        sx={{
                          color: '#94a3b8',
                          '&.Mui-checked': {
                            color: '#1e3a8a'
                          }
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" color="text.secondary">
                        Remember me
                      </Typography>
                    }
                  />
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={handleForgotPassword}
                    sx={{
                      color: '#1e3a8a',
                      fontWeight: 600,
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    Forgot password?
                  </Link>
                </Box>

                {/* Sign In Button */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? null : <LoginOutlined />}
                  sx={{ 
                    py: 1.8,
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: 2,
                    textTransform: 'none',
                    backgroundColor: '#1e3a8a',
                    boxShadow: '0 4px 6px -1px rgba(30, 58, 138, 0.3)',
                    '&:hover': {
                      backgroundColor: '#1e40af',
                      boxShadow: '0 10px 15px -3px rgba(30, 58, 138, 0.4)'
                    },
                    '&:disabled': {
                      backgroundColor: '#94a3b8'
                    }
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            © 2026 PetCare Plus Management System
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Developed by Hishma Dilshar
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;