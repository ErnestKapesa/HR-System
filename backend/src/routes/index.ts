import { Router } from 'express';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Transbantu HR API',
    version: '1.0.0'
  });
});

export default router;