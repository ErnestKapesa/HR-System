import { Router } from 'express';
import { attendanceController } from '../controllers/attendance.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All attendance routes require authentication
router.use(authenticate);

// Clock in/out operations
router.post('/clock-in', attendanceController.clockIn);
router.post('/clock-out', attendanceController.clockOut);
router.post('/break-start', attendanceController.startBreak);
router.post('/break-end', attendanceController.endBreak);

// Attendance records
router.get('/', attendanceController.getAttendanceRecords);
router.get('/today', attendanceController.getTodayAttendance);
router.get('/user/:userId', attendanceController.getUserAttendance);
router.get('/user/:userId/summary', attendanceController.getUserAttendanceSummary);

// Time tracking
router.post('/time-tracking', attendanceController.createTimeEntry);
router.get('/time-tracking', attendanceController.getTimeEntries);
router.put('/time-tracking/:id', attendanceController.updateTimeEntry);
router.delete('/time-tracking/:id', attendanceController.deleteTimeEntry);

export default router;