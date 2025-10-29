import { Router } from 'express';
import { employeeController } from '../controllers/employee.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createEmployeeSchema, updateEmployeeSchema } from '../utils/validation';

const router = Router();

// All employee routes require authentication
router.use(authenticate);

// Employee CRUD operations
router.get('/', employeeController.getAllEmployees);
router.get('/:id', employeeController.getEmployeeById);
router.post('/', validateRequest(createEmployeeSchema), employeeController.createEmployee);
router.put('/:id', validateRequest(updateEmployeeSchema), employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

// Employee profile operations
router.get('/:id/profile', employeeController.getEmployeeProfile);
router.put('/:id/profile', employeeController.updateEmployeeProfile);

// Employee statistics
router.get('/:id/stats', employeeController.getEmployeeStats);

export default router;