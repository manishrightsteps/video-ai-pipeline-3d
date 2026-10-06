import { pipeline } from 'node:stream/promises';
import * as tutorService from '../services/tutor.service.js';

// Abort the upstream ElevenLabs call if the browser disconnects mid-request.
function clientAbortSignal(req, res) {
  const controller = new AbortController();
  res.on('close', () => {
    if (!res.writableFinished) controller.abort();
  });
  return controller.signal;
}

export function list(_req, res) {
  res.json({ success: true, data: tutorService.getTutors() });
}

export function getOne(req, res) {
  res.json({ success: true, data: tutorService.getTutor(req.validated.params.tutorId) });
}

/** POST /tutors/:tutorId/speak — streams MP3 audio of the tutor saying `text`. */
export async function speak(req, res) {
  const { tutorId } = req.validated.params;
  const { text, voiceSettings } = req.validated.body;
  const signal = clientAbortSignal(req, res);

  const { stream, contentType } = await tutorService.speakStream({ tutorId, text, voiceSettings, signal });

  res.status(200).set({
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'X-Accel-Buffering': 'no', // disable proxy buffering (nginx) so audio starts immediately
  });

  try {
    await pipeline(stream, res);
  } catch (err) {
    if (err.name === 'AbortError' || err.code === 'ERR_STREAM_PREMATURE_CLOSE') {
      req.log.info('Client closed audio stream early');
      return;
    }
    throw err;
  }
}

/** POST /tutors/:tutorId/speak/timestamps — audio (base64) + character alignment for lip-sync. */
export async function speakWithTimestamps(req, res) {
  const { tutorId } = req.validated.params;
  const { text, voiceSettings } = req.validated.body;
  const data = await tutorService.speakWithTimestamps({
    tutorId,
    text,
    voiceSettings,
    signal: clientAbortSignal(req, res),
  });
  res.json({ success: true, data });
}
