import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All report routes require authentication
router.use(authenticate);

// Report generation
router.post('/generate', reportController.generateReport);
router.get('/templates', reportController.getReportTemplates);

// Specific reports
router.get('/attendance', reportController.getAttendanceReport);
router.get('/leave', reportController.getLeaveReport);
router.get('/performance', reportController.getPerformanceReport);
router.get('/headcount', reportController.getHeadcountReport);
router.get('/turnover', reportController.getTurnoverReport);

// Dashboard analytics
router.get('/dashboard/stats', reportController.getDashboardStats);
router.get('/dashboard/charts', reportController.getDashboardCharts);

export default router;