const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Login function
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔍 Login attempt:', email);
    console.log('📝 Password received:', password);
    console.log('📝 Password length:', password.length);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    console.log('✅ Input validated');

    // Find user
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.log('❌ User not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];
    console.log('✅ User found:', user.email, 'Role:', user.role, 'Status:', user.status);
    console.log('🔐 Hash from DB:', user.password);
    console.log('🔐 Hash length:', user.password.length);

    // Check if user is active
    if (user.status !== 'Active') {
      console.log('❌ User is inactive');
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    console.log('✅ User is active');

    // Verify password
    console.log('🔄 Comparing passwords...');
    console.log('   Input password:', password);
    console.log('   Stored hash:', user.password);
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    console.log('🔐 Password comparison result:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Invalid password');
      
      // Extra debug: Try hashing the input to see format
      const testHash = await bcrypt.hash(password, 10);
      console.log('🧪 Test hash of input:', testHash);
      console.log('🧪 Test compare result:', await bcrypt.compare(password, testHash));
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('✅ Password valid');

    // Generate tokens
    const accessToken = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      {
        user_id: user.user_id
      },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret-change-this-in-production',
      { expiresIn: '7d' }
    );

    console.log('✅ Tokens generated');
    console.log('🔑 Access Token:', accessToken.substring(0, 30) + '...');

    // Save refresh token
    await db.query(
      'UPDATE users SET refresh_token = ? WHERE user_id = ?',
      [refreshToken, user.user_id]
    );

    console.log('✅ Login successful for:', user.email, `(${user.role})`);

    // Send response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          user_id: user.user_id,
          email: user.email,
          role: user.role,
          full_name: user.full_name
        },
        token: accessToken,
        refreshToken: refreshToken
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Register function
const register = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Registration not implemented'
  });
};

// Logout function
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
};

// Refresh token function
const refreshToken = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Token refresh not implemented'
  });
};

module.exports = {
  login,
  register,
  logout,
  refreshToken
};