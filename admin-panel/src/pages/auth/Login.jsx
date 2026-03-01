import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  InputAdornment,
  IconButton,
  Avatar
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Pets,
  Lock,
  Email
} from '@mui/icons-material';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔄 Attempting login...');
      
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      console.log('✅ Login response:', response.data);

      // Extract token from response
      const token = 
        response.data.token || 
        response.data.data?.token || 
        response.data.data?.accessToken ||
        response.data.accessToken;
        
      const user = 
        response.data.user || 
        response.data.data?.user ||
        response.data.data;

      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        console.log('✅ Token saved');
        toast.success('Welcome back! 🎉');
        
        navigate('/dashboard');
      } else {
        console.error('❌ No token in response');
        toast.error('Login failed: No token received');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'white',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            width: '100%',
            boxShadow: '0 8px 32px rgba(0, 31, 63, 0.15)',
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid #e0e0e0'
          }}
        >
          {/* Header Section */}
          <Box
            sx={{
              background: '#001f3f',
              py: 4,
              textAlign: 'center'
            }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                margin: '0 auto',
                bgcolor: 'white',
                color: '#001f3f',
                fontSize: '2.5rem',
                mb: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <Pets fontSize="large" />
            </Avatar>
            <Typography variant="h4" fontWeight="bold" color="white" gutterBottom>
              PetCare Plus
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.9)">
              Admin Portal
            </Typography>
          </Box>

          <CardContent sx={{ p: 5 }}>
            <Typography variant="h5" align="center" fontWeight="600" gutterBottom sx={{ mb: 1, color: '#001f3f' }}>
              Welcome Back
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
              Sign in to your account to continue
            </Typography>

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                autoFocus
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#001f3f' }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#001f3f'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#001f3f'
                    }
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#001f3f'
                  }
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#001f3f' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: '#001f3f' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#001f3f'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#001f3f'
                    }
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#001f3f'
                  }
                }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mt: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  borderRadius: 2,
                  bgcolor: '#001f3f',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(0, 31, 63, 0.25)',
                  '&:hover': {
                    bgcolor: '#003366',
                    boxShadow: '0 6px 16px rgba(0, 31, 63, 0.35)'
                  },
                  '&:disabled': {
                    bgcolor: '#cccccc'
                  }
                }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>

          {/* Footer */}
          <Box
            sx={{
              py: 2,
              textAlign: 'center',
              bgcolor: '#f5f5f5',
              borderTop: '1px solid #e0e0e0'
            }}
          >
            <Typography variant="caption" color="text.secondary">
              © 2026 PetCare Plus Management System
            </Typography>
          </Box>
        </Card>
      </Container>
    </Box>
  );
};

export default Login;