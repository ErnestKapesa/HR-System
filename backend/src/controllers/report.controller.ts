import { Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const reportController = {
  // Generate custom report
  generateReport: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { type, dateRange, filters } = req.body;

    // TODO: Implement report generation logic based on type
    res.status(200).json({
      success: true,
      message: 'Report generation initiated',
      data: {
        reportId: 'temp-report-id',
        status: 'processing',
      },
    });
  }),

  // Get report templates
  getReportTemplates: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const templates = [
      {
        id: 'attendance',
        name: 'Attendance Report',
        description: 'Employee attendance summary',
        fields: ['employee', 'department', 'date_range', 'status'],
      },
      {
        id: 'leave',
        name: 'Leave Report',
        description: 'Leave requests and balances',
        fields: ['employee', 'leave_type', 'date_range', 'status'],
      },
      {
        id: 'performance',
        name: 'Performance Report',
        description: 'Performance reviews and ratings',
        fields: ['employee', 'department', 'review_period', 'rating'],
      },
    ];

    res.status(200).json({
      success: true,
      data: { templates },
    });
  }),

  // Attendance report
  getAttendanceReport: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { startDate, endDate, departmentId, employeeId } = req.query;

    const where: any = {};
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }
    if (employeeId) where.userId = employeeId;
    if (departmentId) {
      where.user = { departmentId };
    }

    const attendanceData = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          include: {
            profile: true,
            department: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate summary statistics
    const summary = {
      totalRecords: attendanceData.length,
      presentDays: attendanceData.filter(a => a.status === 'PRESENT').length,
      absentDays: attendanceData.filter(a => a.status === 'ABSENT').length,
      lateDays: attendanceData.filter(a => a.status === 'LATE').length,
      totalHours: attendanceData.reduce((sum, a) => sum + (Number(a.totalHours) || 0), 0),
    };

    res.status(200).json({
      success: true,
      data: {
        report: attendanceData,
        summary,
      },
    });
  }),

  // Leave report
  getLeaveReport: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { startDate, endDate, departmentId, leaveTypeId } = req.query;

    const where: any = {};
    if (startDate && endDate) {
      where.startDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }
    if (leaveTypeId) where.leaveTypeId = leaveTypeId;
    if (departmentId) {
      where.user = { departmentId };
    }

    const leaveData = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: {
          include: {
            profile: true,
            department: true,
          },
        },
        leaveType: true,
      },
      orderBy: { startDate: 'desc' },
    });

    const summary = {
      totalRequests: leaveData.length,
      approvedRequests: leaveData.filter(l => l.status === 'APPROVED').length,
      pendingRequests: leaveData.filter(l => l.status === 'PENDING').length,
      rejectedRequests: leaveData.filter(l => l.status === 'REJECTED').length,
      totalDaysRequested: leaveData.reduce((sum, l) => sum + l.daysRequested, 0),
    };

    res.status(200).json({
      success: true,
      data: {
        report: leaveData,
        summary,
      },
    });
  }),

  // Performance report
  getPerformanceReport: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { startDate, endDate, departmentId } = req.query;

    const where: any = {};
    if (startDate && endDate) {
      where.reviewPeriodStart = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }
    if (departmentId) {
      where.employee = { departmentId };
    }

    const performanceData = await prisma.performanceReview.findMany({
      where,
      include: {
        employee: {
          include: {
            profile: true,
            department: true,
          },
        },
        reviewer: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { reviewPeriodStart: 'desc' },
    });

    const summary = {
      totalReviews: performanceData.length,
      completedReviews: performanceData.filter(p => p.status === 'APPROVED').length,
      averageRating: performanceData.reduce((sum, p) => sum + (Number(p.overallRating) || 0), 0) / performanceData.length || 0,
    };

    res.status(200).json({
      success: true,
      data: {
        report: performanceData,
        summary,
      },
    });
  }),

  // Headcount report
  getHeadcountReport: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const [
      totalEmployees,
      activeEmployees,
      departmentBreakdown,
      roleBreakdown,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.groupBy({
        by: ['departmentId'],
        _count: { departmentId: true },
        where: { status: 'ACTIVE' },
      }),
      prisma.user.groupBy({
        by: ['roleId'],
        _count: { roleId: true },
        where: { status: 'ACTIVE' },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalEmployees,
          activeEmployees,
          inactiveEmployees: totalEmployees - activeEmployees,
        },
        departmentBreakdown,
        roleBreakdown,
      },
    });
  }),

  // Turnover report
  getTurnoverReport: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // TODO: Implement turnover calculation logic
    res.status(200).json({
      success: true,
      data: {
        message: 'Turnover report will be implemented',
      },
    });
  }),

  // Dashboard stats
  getDashboardStats: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalEmployees,
      presentToday,
      onLeave,
      pendingLeaves,
      newHires,
      performanceReviewsDue,
    ] = await Promise.all([
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.attendance.count({
        where: {
          date: today,
          status: 'PRESENT',
        },
      }),
      prisma.leaveRequest.count({
        where: {
          status: 'APPROVED',
          startDate: { lte: today },
          endDate: { gte: today },
        },
      }),
      prisma.leaveRequest.count({
        where: { status: 'PENDING' },
      }),
      prisma.user.count({
        where: {
          profile: {
            hireDate: {
              gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        },
      }),
      prisma.performanceReview.count({
        where: {
          status: 'DRAFT',
          reviewPeriodEnd: {
            lte: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
          },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalEmployees,
          presentToday,
          onLeave,
          pendingLeaves,
          newHires,
          performanceReviewsDue,
          attendanceRate: totalEmployees > 0 ? (presentToday / totalEmployees) * 100 : 0,
        },
      },
    });
  }),

  // Dashboard charts data
  getDashboardCharts: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Get last 7 days attendance data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    }).reverse();

    const attendanceData = await Promise.all(
      last7Days.map(async (date) => {
        const count = await prisma.attendance.count({
          where: {
            date,
            status: 'PRESENT',
          },
        });
        return {
          date: date.toISOString().split('T')[0],
          count,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        charts: {
          weeklyAttendance: attendanceData,
        },
      },
    });
  }),
};