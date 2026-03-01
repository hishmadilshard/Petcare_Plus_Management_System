import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  console.log('🔐 ProtectedRoute Check:');
  console.log('  Token exists:', !!token);
  console.log('  Current path:', window.location.pathname);
  
  // If no token, redirect to login
  if (!token) {
    console.log('  ❌ No token - redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  console.log('  ✅ Token found - rendering protected content');
  return children;
};

export default ProtectedRoute;