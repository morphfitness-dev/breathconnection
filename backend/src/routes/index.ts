import { Router } from 'express';
import authRoutes from './auth';
import assessmentRoutes from './assessment';
import programmeRoutes from './programme';
import sessionsRoutes from './sessions';
import metricsRoutes from './metrics';
import wearablesRoutes from './wearables';
import gamificationRoutes from './gamification';

const router = Router();

router.use('/auth', authRoutes);
router.use('/assessment', assessmentRoutes);
router.use('/programme', programmeRoutes);
router.use('/sessions', sessionsRoutes);
router.use('/metrics', metricsRoutes);
router.use('/wearables', wearablesRoutes);
router.use('/gamification', gamificationRoutes);

export default router;
