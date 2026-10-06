import { Router } from 'express';
import * as tutorController from '../controllers/tutor.controller.js';
import validate from '../middlewares/validate.js';
import { voiceLimiter } from '../middlewares/rateLimiter.js';
import { speakBody, tutorIdParams } from '../validators/tutor.validator.js';

const router = Router();

router.get('/', tutorController.list);
router.get('/:tutorId', validate({ params: tutorIdParams }), tutorController.getOne);
router.post(
  '/:tutorId/speak',
  voiceLimiter,
  validate({ params: tutorIdParams, body: speakBody }),
  tutorController.speak,
);
router.post(
  '/:tutorId/speak/timestamps',
  voiceLimiter,
  validate({ params: tutorIdParams, body: speakBody }),
  tutorController.speakWithTimestamps,
);

export default router;
