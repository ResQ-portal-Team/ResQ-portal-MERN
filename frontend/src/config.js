/**
 * Backend origin for fetch(). Defaults to Express on port 5000 (avoids CRA dev-server 404s on POST /api).
 * Optional: same-origin `/api` works when setupProxy.js is present and you set REACT_APP_API_URL= (empty).
 * Production: set REACT_APP_API_URL to your API origin.
 */
export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/** Bases for fetch(): CRA dev proxy first when unset, then direct :5000. */
export function getApiBases() {
  const explicit = process.env.REACT_APP_API_URL;
  if (explicit != null && explicit !== '') {
    return [explicit.replace(/\/$/, '')];
  }
  return ['', 'http://localhost:5000'];
}

/**
 * POST JSON with the same URL fallback as the dashboard (fixes proxy / port issues).
 * @param {string} path e.g. /api/auth/login
 * @param {object} body JSON-serializable
 */
export async function postJson(path, body) {
  const init = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
  const bases = getApiBases();
  let lastError;
  for (let i = 0; i < bases.length; i += 1) {
    const baseUrl = bases[i];
    try {
      const response = await fetch(`${baseUrl}${path}`, init);
      const text = await response.text();
      let data = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      }
      if (!response.ok) {
        const err = new Error(data.message || 'Request failed.');
        err.status = response.status;
        err.data = data;
        throw err;
      }
      return { response, data };
    } catch (err) {
      lastError = err;
      if (err.status != null || i === bases.length - 1) {
        break;
      }
    }
  }
  throw lastError || new Error('Request failed');
}

/** GET with the same base URL fallback as postJson. */
export async function getJson(path) {
  const bases = getApiBases();
  let lastError;
  for (let i = 0; i < bases.length; i += 1) {
    const baseUrl = bases[i];
    try {
      const response = await fetch(`${baseUrl}${path}`);
      const text = await response.text();
      let data = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      }
      if (!response.ok) {
        const err = new Error(data.message || 'Request failed.');
        err.status = response.status;
        err.data = data;
        throw err;
      }
      return { response, data };
    } catch (err) {
      lastError = err;
      if (err.status != null || i === bases.length - 1) {
        break;
      }
    }
  }
  throw lastError || new Error('Request failed');
}

export function authHeaders() {
  const token = localStorage.getItem('resqToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
