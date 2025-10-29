import { z } from 'zod';

// Authentication schemas
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    employeeId: z.string().min(3, 'Employee ID must be at least 3 characters'),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  }),
});

// Employee schemas
export const createEmployeeSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    employeeId: z.string().min(3, 'Employee ID must be at least 3 characters'),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    phone: z.string().optional(),
    jobTitle: z.string().optional(),
    departmentId: z.string().uuid('Invalid department ID').optional(),
    roleId: z.string().uuid('Invalid role ID'),
    hireDate: z.string().datetime('Invalid hire date'),
    salary: z.number().positive('Salary must be positive').optional(),
  }),
});

export const updateEmployeeSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').optional(),
    firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
    phone: z.string().optional(),
    jobTitle: z.string().optional(),
    departmentId: z.string().uuid('Invalid department ID').optional(),
    roleId: z.string().uuid('Invalid role ID').optional(),
    salary: z.number().positive('Salary must be positive').optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  }),
});

// Leave request schemas
export const createLeaveRequestSchema = z.object({
  body: z.object({
    leaveTypeId: z.string().uuid('Invalid leave type ID'),
    startDate: z.string().datetime('Invalid start date'),
    endDate: z.string().datetime('Invalid end date'),
    reason: z.string().min(10, 'Reason must be at least 10 characters'),
  }),
});

export const updateLeaveRequestSchema = z.object({
  body: z.object({
    startDate: z.string().datetime('Invalid start date').optional(),
    endDate: z.string().datetime('Invalid end date').optional(),
    reason: z.string().min(10, 'Reason must be at least 10 characters').optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
  }),
});

// Attendance schemas
export const clockInSchema = z.object({
  body: z.object({
    location: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const timeTrackingSchema = z.object({
  body: z.object({
    projectName: z.string().min(2, 'Project name must be at least 2 characters').optional(),
    taskDescription: z.string().min(5, 'Task description must be at least 5 characters').optional(),
    startTime: z.string().datetime('Invalid start time'),
    endTime: z.string().datetime('Invalid end time').optional(),
    billable: z.boolean().default(false),
  }),
});

// Performance schemas
export const createPerformanceReviewSchema = z.object({
  body: z.object({
    employeeId: z.string().uuid('Invalid employee ID'),
    reviewPeriodStart: z.string().datetime('Invalid review period start'),
    reviewPeriodEnd: z.string().datetime('Invalid review period end'),
    overallRating: z.number().min(1).max(5).optional(),
    goalsAchievement: z.number().min(1).max(5).optional(),
    competencyRating: z.number().min(1).max(5).optional(),
    feedback: z.string().optional(),
    improvementAreas: z.string().optional(),
  }),
});

export const createGoalSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
    title: z.string().min(5, 'Goal title must be at least 5 characters'),
    description: z.string().optional(),
    targetDate: z.string().datetime('Invalid target date').optional(),
  }),
});

// Recruitment schemas
export const createJobPostingSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Job title must be at least 5 characters'),
    departmentId: z.string().uuid('Invalid department ID'),
    description: z.string().min(50, 'Job description must be at least 50 characters'),
    requirements: z.string().optional(),
    salaryRange: z.string().optional(),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']),
    location: z.string().optional(),
    closingDate: z.string().datetime('Invalid closing date').optional(),
  }),
});

export const createCandidateSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    phone: z.string().optional(),
    linkedinProfile: z.string().url('Invalid LinkedIn URL').optional(),
  }),
});

// Query parameter schemas
export const paginationSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('10'),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export const dateRangeSchema = z.object({
  query: z.object({
    startDate: z.string().datetime('Invalid start date').optional(),
    endDate: z.string().datetime('Invalid end date').optional(),
  }),
});