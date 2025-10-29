import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { config } from '../config/database';
import { logger } from '../utils/logger';

interface AuthRequest extends Request {
  body: {
    email: string;
    password: string;
    employeeId?: string;
    firstName?: string;
    lastName?: string;
  };
}

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

  const refreshToken = jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });

  return { accessToken, refreshToken };
};

export const authController = {
  // Login user
  login: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    // Find user with profile and role
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        role: true,
        department: true,
      },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      throw new AppError('Account is not active. Please contact administrator.', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Log successful login
    logger.info(`User ${user.email} logged in successfully`, {
      userId: user.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

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
  }),

  // Register new user (admin only)
  register: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password, employeeId, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { employeeId }],
      },
    });

    if (existingUser) {
      throw new AppError('User with this email or employee ID already exists', 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Get default employee role
    const defaultRole = await prisma.role.findFirst({
      where: { name: 'Employee' },
    });

    if (!defaultRole) {
      throw new AppError('Default role not found. Please contact administrator.', 500);
    }

    // Create user with profile
    const user = await prisma.user.create({
      data: {
        email,
        employeeId,
        passwordHash,
        roleId: defaultRole.id,
        profile: {
          create: {
            firstName,
            lastName,
            hireDate: new Date(),
          },
        },
      },
      include: {
        profile: true,
        role: true,
      },
    });

    logger.info(`New user registered: ${user.email}`, {
      userId: user.id,
      employeeId: user.employeeId,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          employeeId: user.employeeId,
          email: user.email,
          role: user.role.name,
          profile: user.profile,
        },
      },
    });
  }),

  // Refresh access token
  refreshToken: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string };
      
      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new AppError('Invalid refresh token', 401);
      }

      // Generate new tokens
      const tokens = generateTokens(user.id);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: tokens,
      });
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }),

  // Logout user
  logout: asyncHandler(async (req: Request, res: Response) => {
    // In a production app, you might want to blacklist the token
    // For now, we'll just return success
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }),

  // Forgot password
  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
      return;
    }

    // TODO: Implement email sending logic
    // For now, just log the reset request
    logger.info(`Password reset requested for user: ${email}`);

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  }),

  // Reset password
  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    // TODO: Implement token verification and password reset logic
    // For now, just return success
    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  }),
};