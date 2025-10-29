import { Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const performanceController = {
  // Get performance reviews
  getPerformanceReviews: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 10, employeeId, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    const [reviews, total] = await Promise.all([
      prisma.performanceReview.findMany({
        where,
        include: {
          employee: { include: { profile: true } },
          reviewer: { include: { profile: true } },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.performanceReview.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  }),

  // Get performance review by ID
  getPerformanceReviewById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const review = await prisma.performanceReview.findUnique({
      where: { id },
      include: {
        employee: { include: { profile: true } },
        reviewer: { include: { profile: true } },
      },
    });

    if (!review) {
      throw new AppError('Performance review not found', 404);
    }

    res.status(200).json({
      success: true,
      data: { review },
    });
  }),

  // Create performance review
  createPerformanceReview: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const reviewerId = req.user!.id;
    const reviewData = { ...req.body, reviewerId };

    const review = await prisma.performanceReview.create({
      data: reviewData,
      include: {
        employee: { include: { profile: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Performance review created successfully',
      data: { review },
    });
  }),

  // Update performance review
  updatePerformanceReview: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const review = await prisma.performanceReview.update({
      where: { id },
      data: req.body,
    });

    res.status(200).json({
      success: true,
      message: 'Performance review updated successfully',
      data: { review },
    });
  }),

  // Delete performance review
  deletePerformanceReview: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    await prisma.performanceReview.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Performance review deleted successfully',
    });
  }),

  // Get goals
  getGoals: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId, status } = req.query;

    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const goals = await prisma.goal.findMany({
      where,
      include: {
        user: { include: { profile: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: { goals },
    });
  }),

  // Get user goals
  getUserGoals: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.params;

    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: { goals },
    });
  }),

  // Create goal
  createGoal: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const goal = await prisma.goal.create({
      data: req.body,
    });

    res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      data: { goal },
    });
  }),

  // Update goal
  updateGoal: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const goal = await prisma.goal.update({
      where: { id },
      data: req.body,
    });

    res.status(200).json({
      success: true,
      message: 'Goal updated successfully',
      data: { goal },
    });
  }),

  // Delete goal
  deleteGoal: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    await prisma.goal.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Goal deleted successfully',
    });
  }),

  // Get performance overview
  getPerformanceOverview: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const currentYear = new Date().getFullYear();

    const [
      totalReviews,
      completedReviews,
      averageRating,
      totalGoals,
      completedGoals,
    ] = await Promise.all([
      prisma.performanceReview.count({
        where: {
          reviewPeriodStart: {
            gte: new Date(currentYear, 0, 1),
          },
        },
      }),
      prisma.performanceReview.count({
        where: {
          status: 'APPROVED',
          reviewPeriodStart: {
            gte: new Date(currentYear, 0, 1),
          },
        },
      }),
      prisma.performanceReview.aggregate({
        where: {
          status: 'APPROVED',
          reviewPeriodStart: {
            gte: new Date(currentYear, 0, 1),
          },
        },
        _avg: {
          overallRating: true,
        },
      }),
      prisma.goal.count(),
      prisma.goal.count({
        where: { status: 'COMPLETED' },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalReviews,
          completedReviews,
          reviewCompletionRate: totalReviews > 0 ? (completedReviews / totalReviews) * 100 : 0,
          averageRating: averageRating._avg.overallRating || 0,
          totalGoals,
          completedGoals,
          goalCompletionRate: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0,
        },
      },
    });
  }),

  // Get performance trends
  getPerformanceTrends: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // TODO: Implement performance trends analysis
    res.status(200).json({
      success: true,
      data: {
        trends: {
          message: 'Performance trends analysis will be implemented',
        },
      },
    });
  }),
};