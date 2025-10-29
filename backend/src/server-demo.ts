import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Mock user data for demo (in production this would be in database)
const mockUsers = [
  {
    id: '1',
    employeeId: 'TBT001',
    email: 'prisca12345@transbantu.org',
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXzgVmeRBdaa', // admin2024!
    role: { name: 'HR Admin' },
    department: { name: 'Human Resources' },
    profile: {
      firstName: 'Prisca',
      lastName: 'Sakala',
      jobTitle: 'HR and Admin Officer'
    },
    status: 'ACTIVE'
  },
  {
    id: '2',
    employeeId: 'TBT002',
    email: 'sarah23456@transbantu.org',
    passwordHash: '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // transbantu2024!
    role: { name: 'Officer' },
    department: { name: 'Project Management' },
    profile: {
      firstName: 'Sarah',
      lastName: 'Chirwa',
      jobTitle: 'Project Officer'
    },
    status: 'ACTIVE'
  },
  {
    id: '3',
    employeeId: 'TBT003',
    email: 'yang34567@transbantu.org',
    passwordHash: '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // transbantu2024!
    role: { name: 'Officer' },
    department: { name: 'Project Management' },
    profile: {
      firstName: 'Yang',
      lastName: 'Ngandwe',
      jobTitle: 'Ass Project Officer'
    },
    status: 'ACTIVE'
  }
];

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

// Generate JWT tokens
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  return { accessToken, refreshToken };
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Transbantu HR API (Demo Mode)',
    version: '1.0.0'
  });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user in mock data
    const user = mockUsers.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active. Please contact HR administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    console.log(`User ${user.email} logged in successfully`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          employeeId: user.employeeId,
          email: user.email,
          role: user.role.name,
          department: user.department?.name,
          profile: user.profile,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Basic API routes for dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalEmployees: 16,
        presentToday: 14,
        onLeave: 1,
        pendingLeaves: 3,
        newHires: 0,
        performanceReviewsDue: 5,
        attendanceRate: 87.5,
      },
    },
  });
});

// Get all users (for admin)
app.get('/api/users', (req, res) => {
  const sanitizedUsers = mockUsers.map(user => ({
    ...user,
    passwordHash: undefined,
  }));

  res.json({
    success: true,
    data: { users: sanitizedUsers }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Transbantu HR API Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'} (DEMO MODE)`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log('');
  console.log('🔑 Demo Login Credentials:');
  console.log('HR Admin: prisca12345@transbantu.org / admin2024!');
  console.log('Staff: sarah23456@transbantu.org / transbantu2024!');
  console.log('Staff: yang34567@transbantu.org / transbantu2024!');
});

export default app;