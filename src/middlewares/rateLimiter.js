import rateLimit from 'express-rate-limit';
import config from '../config/index.js';

export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  limit: config.rateLimit.max,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many requests, please slow down' } },
});

// TTS and agent sessions cost ElevenLabs credits — keep these tighter.
export const voiceLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  limit: Math.max(1, Math.floor(config.rateLimit.max / 3)),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, error: { message: 'Voice request limit reached, please wait a moment' } },
});
