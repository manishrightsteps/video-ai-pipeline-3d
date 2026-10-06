import { Router } from 'express';
import config from '../config/index.js';
import * as agentController from '../controllers/agent.controller.js';
import validate from '../middlewares/validate.js';
import { voiceLimiter } from '../middlewares/rateLimiter.js';
import { sessionBody } from '../validators/tutor.validator.js';

const router = Router();

router.post('/session', voiceLimiter, validate({ body: sessionBody }), agentController.createSession);
// Lists every voice on the ElevenLabs account — handy for picking a tutor voice, not for public use.
if (!config.isProd) router.get('/voices', agentController.voices);

export default router;
