import config from '../config/index.js';
import logger from '../utils/logger.js';
import ApiError from '../utils/ApiError.js';

const { apiKey, baseUrl, timeoutMs } = config.elevenlabs;

// Merge a caller-supplied abort signal (e.g. client disconnect) with our timeout.
function buildSignal(signal) {
  const timeout = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

async function request(path, { method = 'GET', query, body, signal, accept = 'application/json' } = {}) {
  const url = new URL(path, baseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        'xi-api-key': apiKey,
        Accept: accept,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: buildSignal(signal),
    });
  } catch (err) {
    if (err.name === 'TimeoutError') throw ApiError.badGateway('ElevenLabs request timed out');
    if (err.name === 'AbortError') throw err; // client went away; let caller decide
    logger.error({ err, path }, 'ElevenLabs network error');
    throw ApiError.serviceUnavailable('Unable to reach ElevenLabs');
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let detail;
    try {
      detail = JSON.parse(text)?.detail;
    } catch {
      detail = text.slice(0, 500);
    }
    logger.warn({ status: response.status, path, detail }, 'ElevenLabs API error');

    if (response.status === 401) throw ApiError.badGateway('ElevenLabs authentication failed');
    if (response.status === 429) throw new ApiError(429, 'Voice service is busy, please retry shortly');
    if (response.status === 422 || response.status === 400) {
      throw ApiError.badRequest('ElevenLabs rejected the request', detail);
    }
    throw ApiError.badGateway('ElevenLabs request failed');
  }

  return response;
}

/**
 * Text-to-speech, streamed. Returns the upstream Response so the caller can
 * pipe audio to the client as it is generated (low latency for the character).
 */
export async function streamSpeech({ text, voiceId, modelId, voiceSettings, outputFormat, signal }) {
  return request(`/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream`, {
    method: 'POST',
    accept: 'audio/mpeg',
    query: { output_format: outputFormat },
    body: {
      text,
      model_id: modelId,
      voice_settings: voiceSettings,
    },
    signal,
  });
}

/**
 * Text-to-speech with character-level timestamps (for lip-sync / captions on
 * the frontend character). Returns { audio_base64, alignment, normalized_alignment }.
 */
export async function speechWithTimestamps({ text, voiceId, modelId, voiceSettings, outputFormat, signal }) {
  const res = await request(`/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps`, {
    method: 'POST',
    query: { output_format: outputFormat },
    body: { text, model_id: modelId, voice_settings: voiceSettings },
    signal,
  });
  return res.json();
}

export async function listVoices() {
  const res = await request('/v1/voices');
  return res.json();
}

/** Signed WebSocket URL so the browser can talk to the agent without seeing our API key. */
export async function getConversationSignedUrl(agentId) {
  const res = await request('/v1/convai/conversation/get-signed-url', { query: { agent_id: agentId } });
  return res.json(); // { signed_url }
}

/** WebRTC conversation token (alternative to the signed URL). */
export async function getConversationToken(agentId) {
  const res = await request('/v1/convai/conversation/token', { query: { agent_id: agentId } });
  return res.json(); // { token }
}

export async function createAgent(payload) {
  const res = await request('/v1/convai/agents/create', { method: 'POST', body: payload });
  return res.json(); // { agent_id }
}

export async function updateAgent(agentId, payload) {
  const res = await request(`/v1/convai/agents/${encodeURIComponent(agentId)}`, { method: 'PATCH', body: payload });
  return res.json();
}
