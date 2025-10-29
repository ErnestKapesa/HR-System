import { Router } from 'express';
import { leaveController } from '../controllers/leave.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All leave routes require authentication
router.use(authenticate);

// Leave requests
router.get('/requests', leaveController.getLeaveRequests);
router.get('/requests/:id', leaveController.getLeaveRequestById);
router.post('/requests', leaveController.createLeaveRequest);
router.put('/requests/:id', leaveController.updateLeaveRequest);
router.delete('/requests/:id', leaveController.deleteLeaveRequest);

// Leave approvals
router.put('/requests/:id/approve', leaveController.approveLeaveRequest);
router.put('/requests/:id/reject', leaveController.rejectLeaveRequest);

// Leave balances
router.get('/balances', leaveController.getLeaveBalances);
router.get('/balances/user/:userId', leaveController.getUserLeaveBalances);

// Leave types
router.get('/types', leaveController.getLeaveTypes);
router.post('/types', leaveController.createLeaveType);
router.put('/types/:id', leaveController.updateLeaveType);

export default router;