import { Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const leaveController = {
  // Get leave requests
  getLeaveRequests: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 10, status, userId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [requests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        include: {
          user: { include: { profile: true } },
          leaveType: true,
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        requests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  }),

  // Get leave request by ID
  getLeaveRequestById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const request = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        user: { include: { profile: true } },
        leaveType: true,
      },
    });

    if (!request) {
      throw new AppError('Leave request not found', 404);
    }

    res.status(200).json({
      success: true,
      data: { request },
    });
  }),

  // Create leave request
  createLeaveRequest: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { leaveTypeId, startDate, endDate, reason } = req.body;

    // Calculate days requested
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysRequested = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const request = await prisma.leaveRequest.create({
      data: {
        userId,
        leaveTypeId,
        startDate: start,
        endDate: end,
        daysRequested,
        reason,
      },
      include: {
        leaveType: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Leave request created successfully',
      data: { request },
    });
  }),

  // Update leave request
  updateLeaveRequest: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const request = await prisma.leaveRequest.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: 'Leave request updated successfully',
      data: { request },
    });
  }),

  // Delete leave request
  deleteLeaveRequest: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    await prisma.leaveRequest.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Leave request deleted successfully',
    });
  }),

  // Approve leave request
  approveLeaveRequest: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const approverId = req.user!.id;

    const request = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: approverId,
        approvedAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Leave request approved successfully',
      data: { request },
    });
  }),

  // Reject leave request
  rejectLeaveRequest: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { comments } = req.body;

    const request = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        comments,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Leave request rejected',
      data: { request },
    });
  }),

  // Get leave balances
  getLeaveBalances: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { year = new Date().getFullYear() } = req.query;

    const balances = await prisma.leaveBalance.findMany({
      where: { year: Number(year) },
      include: {
        user: { include: { profile: true } },
        leaveType: true,
      },
    });

    res.status(200).json({
      success: true,
      data: { balances },
    });
  }),

  // Get user leave balances
  getUserLeaveBalances: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.params;
    const { year = new Date().getFullYear() } = req.query;

    const balances = await prisma.leaveBalance.findMany({
      where: {
        userId,
        year: Number(year),
      },
      include: {
        leaveType: true,
      },
    });

    res.status(200).json({
      success: true,
      data: { balances },
    });
  }),

  // Get leave types
  getLeaveTypes: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const leaveTypes = await prisma.leaveType.findMany({
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: { leaveTypes },
    });
  }),

  // Create leave type
  createLeaveType: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const leaveType = await prisma.leaveType.create({
      data: req.body,
    });

    res.status(201).json({
      success: true,
      message: 'Leave type created successfully',
      data: { leaveType },
    });
  }),

  // Update leave type
  updateLeaveType: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const leaveType = await prisma.leaveType.update({
      where: { id },
      data: req.body,
    });

    res.status(200).json({
      success: true,
      message: 'Leave type updated successfully',
      data: { leaveType },
    });
  }),
};