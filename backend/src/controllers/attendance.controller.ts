import { Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const attendanceController = {
  // Clock in
  clockIn: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already clocked in today
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    if (existingAttendance && existingAttendance.clockIn) {
      throw new AppError('Already clocked in today', 400);
    }

    // Create or update attendance record
    const attendance = await prisma.attendance.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      update: {
        clockIn: new Date(),
        status: 'PRESENT',
      },
      create: {
        userId,
        date: today,
        clockIn: new Date(),
        status: 'PRESENT',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Clocked in successfully',
      data: { attendance },
    });
  }),

  // Clock out
  clockOut: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's attendance record
    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    if (!attendance || !attendance.clockIn) {
      throw new AppError('No clock-in record found for today', 400);
    }

    if (attendance.clockOut) {
      throw new AppError('Already clocked out today', 400);
    }

    // Calculate total hours
    const clockOutTime = new Date();
    const totalHours = (clockOutTime.getTime() - attendance.clockIn.getTime()) / (1000 * 60 * 60);
    const adjustedHours = Math.max(0, totalHours - (attendance.breakDuration / 60));

    // Update attendance record
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        clockOut: clockOutTime,
        totalHours: parseFloat(adjustedHours.toFixed(2)),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Clocked out successfully',
      data: { attendance: updatedAttendance },
    });
  }),

  // Start break
  startBreak: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // TODO: Implement break tracking logic
    res.status(200).json({
      success: true,
      message: 'Break started',
    });
  }),

  // End break
  endBreak: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // TODO: Implement break tracking logic
    res.status(200).json({
      success: true,
      message: 'Break ended',
    });
  }),

  // Get attendance records
  getAttendanceRecords: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 10, startDate, endDate, userId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (userId) {
      where.userId = userId;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { date: 'desc' },
      }),
      prisma.attendance.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        records,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  }),

  // Get today's attendance
  getTodayAttendance: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const records = await prisma.attendance.findMany({
      where: { date: today },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { clockIn: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: { records },
    });
  }),

  // Get user attendance
  getUserAttendance: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const where: any = { userId };
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const records = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: { records },
    });
  }),

  // Get user attendance summary
  getUserAttendanceSummary: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.params;
    
    // Get current month stats
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const [totalDays, presentDays, totalHours] = await Promise.all([
      prisma.attendance.count({
        where: {
          userId,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      prisma.attendance.count({
        where: {
          userId,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
          status: 'PRESENT',
        },
      }),
      prisma.attendance.aggregate({
        where: {
          userId,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: {
          totalHours: true,
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalDays,
          presentDays,
          absentDays: totalDays - presentDays,
          totalHours: totalHours._sum.totalHours || 0,
          attendanceRate: totalDays > 0 ? (presentDays / totalDays) * 100 : 0,
        },
      },
    });
  }),

  // Create time entry
  createTimeEntry: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { projectName, taskDescription, startTime, endTime, billable } = req.body;

    const timeEntry = await prisma.timeTracking.create({
      data: {
        userId,
        projectName,
        taskDescription,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        billable: billable || false,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Time entry created successfully',
      data: { timeEntry },
    });
  }),

  // Get time entries
  getTimeEntries: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    const where: any = { userId };
    
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const entries = await prisma.timeTracking.findMany({
      where,
      orderBy: { startTime: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: { entries },
    });
  }),

  // Update time entry
  updateTimeEntry: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const timeEntry = await prisma.timeTracking.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: 'Time entry updated successfully',
      data: { timeEntry },
    });
  }),

  // Delete time entry
  deleteTimeEntry: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    await prisma.timeTracking.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Time entry deleted successfully',
    });
  }),
};