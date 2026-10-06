import * as tutorService from '../services/tutor.service.js';

/**
 * POST /agent/session — short-lived credentials + per-student overrides for the frontend.
 * Frontend: conversation.startSession({ signedUrl, overrides })
 */
export async function createSession(req, res) {
  const data = await tutorService.startSession(req.validated.body);
  res.status(201).set('Cache-Control', 'no-store').json({ success: true, data });
}

export async function voices(_req, res) {
  res.json({ success: true, data: await tutorService.getVoices() });
}
