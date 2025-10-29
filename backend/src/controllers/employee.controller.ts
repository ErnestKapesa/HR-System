import { Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import bcrypt from 'bcryptjs';

export const employeeController = {
  // Get all employees with pagination and filtering
  getAllEmployees: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      department, 
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { employeeId: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { profile: { 
          OR: [
            { firstName: { contains: search as string, mode: 'insensitive' } },
            { lastName: { contains: search as string, mode: 'insensitive' } }
          ]
        }}
      ];
    }

    if (department) {
      where.departmentId = department;
    }

    if (status) {
      where.status = status;
    }

    // Get employees with related data
    const [employees, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          profile: true,
          role: true,
          department: true,
        },
        skip,
        take: Number(limit),
        orderBy: {
          [sortBy as string]: sortOrder as 'asc' | 'desc',
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Remove sensitive data
    const sanitizedEmployees = employees.map(employee => ({
      ...employee,
      passwordHash: undefined,
    }));

    res.status(200).json({
      success: true,
      data: {
        employees: sanitizedEmployees,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  }),

  // Get employee by ID
  getEmployeeById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const employee = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        role: true,
        department: true,
        leaveBalances: {
          include: {
            leaveType: true,
          },
        },
      },
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    // Remove sensitive data
    const sanitizedEmployee = {
      ...employee,
      passwordHash: undefined,
    };

    res.status(200).json({
      success: true,
      data: { employee: sanitizedEmployee },
    });
  }),

  // Create new employee
  createEmployee: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      email,
      employeeId,
      firstName,
      lastName,
      phone,
      jobTitle,
      departmentId,
      roleId,
      hireDate,
      salary,
    } = req.body;

    // Check if employee already exists
    const existingEmployee = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { employeeId }],
      },
    });

    if (existingEmployee) {
      throw new AppError('Employee with this email or employee ID already exists', 400);
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Create employee with profile
    const employee = await prisma.user.create({
      data: {
        email,
        employeeId,
        passwordHash,
        roleId,
        departmentId,
        profile: {
          create: {
            firstName,
            lastName,
            phone,
            jobTitle,
            hireDate: new Date(hireDate),
            salary: salary ? parseFloat(salary) : null,
          },
        },
      },
      include: {
        profile: true,
        role: true,
        department: true,
      },
    });

    // TODO: Send welcome email with temporary password

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: {
        employee: {
          ...employee,
          passwordHash: undefined,
        },
        tempPassword, // In production, this should be sent via email
      },
    });
  }),

  // Update employee
  updateEmployee: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if employee exists
    const existingEmployee = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      throw new AppError('Employee not found', 404);
    }

    // Separate profile data from user data
    const { firstName, lastName, phone, jobTitle, salary, ...userData } = updateData;
    const profileData = { firstName, lastName, phone, jobTitle, salary };

    // Update employee
    const employee = await prisma.user.update({
      where: { id },
      data: {
        ...userData,
        profile: {
          update: profileData,
        },
      },
      include: {
        profile: true,
        role: true,
        department: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: {
        employee: {
          ...employee,
          passwordHash: undefined,
        },
      },
    });
  }),

  // Delete employee (soft delete by setting status to INACTIVE)
  deleteEmployee: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Check if employee exists
    const existingEmployee = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      throw new AppError('Employee not found', 404);
    }

    // Soft delete by updating status
    await prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully',
    });
  }),

  // Get employee profile
  getEmployeeProfile: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const profile = await prisma.profile.findUnique({
      where: { userId: id },
      include: {
        user: {
          select: {
            id: true,
            employeeId: true,
            email: true,
            status: true,
            role: true,
            department: true,
          },
        },
      },
    });

    if (!profile) {
      throw new AppError('Employee profile not found', 404);
    }

    res.status(200).json({
      success: true,
      data: { profile },
    });
  }),

  // Update employee profile
  updateEmployeeProfile: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const profileData = req.body;

    // Check if profile exists
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: id },
    });

    if (!existingProfile) {
      throw new AppError('Employee profile not found', 404);
    }

    // Update profile
    const profile = await prisma.profile.update({
      where: { userId: id },
      data: profileData,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { profile },
    });
  }),

  // Get employee statistics
  getEmployeeStats: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Get various statistics for the employee
    const [
      attendanceCount,
      leaveRequests,
      performanceReviews,
      goals,
    ] = await Promise.all([
      prisma.attendance.count({
        where: { 
          userId: id,
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.leaveRequest.count({
        where: { userId: id },
      }),
      prisma.performanceReview.count({
        where: { employeeId: id },
      }),
      prisma.goal.count({
        where: { userId: id },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          attendanceThisMonth: attendanceCount,
          totalLeaveRequests: leaveRequests,
          performanceReviews,
          totalGoals: goals,
        },
      },
    });
  }),
};