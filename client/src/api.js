// Backend base URL, e.g. a dev tunnel. Empty = same origin (Vite proxies /api to :4000).
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function request(path, options) {
  const res = await fetch(`${API_URL}/api/v1${path}`, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.success) {
    const details = body.error?.details?.map((d) => `${d.path}: ${d.message}`).join(', ');
    throw new Error([body.error?.message || `Request failed (${res.status})`, details].filter(Boolean).join(' — '));
  }
  return body.data;
}

export const getTutors = () => request('/tutors');

/** Returns { signedUrl, overrides } built by the backend for this student + topic. */
export const createSession = (payload) =>
  request('/agent/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
