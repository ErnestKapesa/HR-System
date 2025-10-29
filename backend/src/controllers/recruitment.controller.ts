import { Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const recruitmentController = {
  // Job Postings
  getJobPostings: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 10, status, departmentId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;

    const [jobPostings, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        include: {
          department: true,
          applications: true,
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.jobPosting.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        jobPostings,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  }),

  getJobPostingById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id },
      include: {
        department: true,
        applications: {
          include: {
            candidate: true,
          },
        },
      },
    });

    if (!jobPosting) {
      throw new AppError('Job posting not found', 404);
    }

    res.status(200).json({
      success: true,
      data: { jobPosting },
    });
  }),

  createJobPosting: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const postedBy = req.user!.id;
    const jobData = { ...req.body, postedBy };

    const jobPosting = await prisma.jobPosting.create({
      data: jobData,
      include: {
        department: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Job posting created successfully',
      data: { jobPosting },
    });
  }),

  updateJobPosting: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const jobPosting = await prisma.jobPosting.update({
      where: { id },
      data: req.body,
    });

    res.status(200).json({
      success: true,
      message: 'Job posting updated successfully',
      data: { jobPosting },
    });
  }),

  deleteJobPosting: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    await prisma.jobPosting.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Job posting deleted successfully',
    });
  }),

  // Candidates
  getCandidates: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        include: {
          applications: {
            include: {
              jobPosting: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.candidate.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        candidates,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  }),

  getCandidateById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        applications: {
          include: {
            jobPosting: true,
          },
        },
      },
    });

    if (!candidate) {
      throw new AppError('Candidate not found', 404);
    }

    res.status(200).json({
      success: true,
      data: { candidate },
    });
  }),

  createCandidate: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const candidate = await prisma.candidate.create({
      data: req.body,
    });

    res.status(201).json({
      success: true,
      message: 'Candidate created successfully',
      data: { candidate },
    });
  }),

  updateCandidate: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const candidate = await prisma.candidate.update({
      where: { id },
      data: req.body,
    });

    res.status(200).json({
      success: true,
      message: 'Candidate updated successfully',
      data: { candidate },
    });
  }),

  deleteCandidate: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    await prisma.candidate.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Candidate deleted successfully',
    });
  }),

  // Applications
  getApplications: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 10, status, jobPostingId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (jobPostingId) where.jobPostingId = jobPostingId;

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          candidate: true,
          jobPosting: true,
        },
        skip,
        take: Number(limit),
        orderBy: { applicationDate: 'desc' },
      }),
      prisma.application.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  }),

  getApplicationById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        candidate: true,
        jobPosting: true,
      },
    });

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    res.status(200).json({
      success: true,
      data: { application },
    });
  }),

  createApplication: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const application = await prisma.application.create({
      data: req.body,
      include: {
        candidate: true,
        jobPosting: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Application created successfully',
      data: { application },
    });
  }),

  updateApplication: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const application = await prisma.application.update({
      where: { id },
      data: req.body,
    });

    res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      data: { application },
    });
  }),

  deleteApplication: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    await prisma.application.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully',
    });
  }),

  // Analytics
  getRecruitmentPipeline: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const pipeline = await prisma.application.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    res.status(200).json({
      success: true,
      data: { pipeline },
    });
  }),

  getRecruitmentMetrics: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const [
      totalJobs,
      activeJobs,
      totalApplications,
      totalCandidates,
    ] = await Promise.all([
      prisma.jobPosting.count(),
      prisma.jobPosting.count({ where: { status: 'ACTIVE' } }),
      prisma.application.count(),
      prisma.candidate.count(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalJobs,
          activeJobs,
          totalApplications,
          totalCandidates,
        },
      },
    });
  }),
};