import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { config } from '../config/database';
import { AppError, asyncHandler } from './error.middleware';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    employeeId: string;
    email: string;
    role: string;
    permissions: any;
  };
}

export const authenticate = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      throw new AppError('Access token is required', 401);
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };

      // Get user with role and permissions
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          role: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 401);
      }

      if (user.status !== 'ACTIVE') {
        throw new AppError('Account is not active', 401);
      }

      // Attach user to request
      req.user = {
        id: user.id,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role.name,
        permissions: user.role.permissions,
      };

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid access token', 401);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Access token has expired', 401);
      }
      throw error;
    }
  }
);

export const authorize = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};

export const checkPermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const userPermissions = req.user.permissions as string[];
    if (!userPermissions.includes(permission) && !userPermissions.includes('*')) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};