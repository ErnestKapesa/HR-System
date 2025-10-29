import { Router } from 'express';
import { performanceController } from '../controllers/performance.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All performance routes require authentication
router.use(authenticate);

// Performance reviews
router.get('/reviews', performanceController.getPerformanceReviews);
router.get('/reviews/:id', performanceController.getPerformanceReviewById);
router.post('/reviews', performanceController.createPerformanceReview);
router.put('/reviews/:id', performanceController.updatePerformanceReview);
router.delete('/reviews/:id', performanceController.deletePerformanceReview);

// Goals
router.get('/goals', performanceController.getGoals);
router.get('/goals/user/:userId', performanceController.getUserGoals);
router.post('/goals', performanceController.createGoal);
router.put('/goals/:id', performanceController.updateGoal);
router.delete('/goals/:id', performanceController.deleteGoal);

// Performance analytics
router.get('/analytics/overview', performanceController.getPerformanceOverview);
router.get('/analytics/trends', performanceController.getPerformanceTrends);

export default router;