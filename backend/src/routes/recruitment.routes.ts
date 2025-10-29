import { Router } from 'express';
import { recruitmentController } from '../controllers/recruitment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All recruitment routes require authentication
router.use(authenticate);

// Job postings
router.get('/jobs', recruitmentController.getJobPostings);
router.get('/jobs/:id', recruitmentController.getJobPostingById);
router.post('/jobs', recruitmentController.createJobPosting);
router.put('/jobs/:id', recruitmentController.updateJobPosting);
router.delete('/jobs/:id', recruitmentController.deleteJobPosting);

// Candidates
router.get('/candidates', recruitmentController.getCandidates);
router.get('/candidates/:id', recruitmentController.getCandidateById);
router.post('/candidates', recruitmentController.createCandidate);
router.put('/candidates/:id', recruitmentController.updateCandidate);
router.delete('/candidates/:id', recruitmentController.deleteCandidate);

// Applications
router.get('/applications', recruitmentController.getApplications);
router.get('/applications/:id', recruitmentController.getApplicationById);
router.post('/applications', recruitmentController.createApplication);
router.put('/applications/:id', recruitmentController.updateApplication);
router.delete('/applications/:id', recruitmentController.deleteApplication);

// Recruitment analytics
router.get('/analytics/pipeline', recruitmentController.getRecruitmentPipeline);
router.get('/analytics/metrics', recruitmentController.getRecruitmentMetrics);

export default router;