import { Router } from 'express';
import { health } from '../controllers/health.controller.js';
import tutorRoutes from './tutor.routes.js';
import agentRoutes from './agent.routes.js';

const router = Router();

router.get('/health', health);
router.use('/tutors', tutorRoutes);
router.use('/agent', agentRoutes);

export default router;
