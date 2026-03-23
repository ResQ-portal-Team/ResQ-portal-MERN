/**
 * Backend origin for fetch(). Defaults to Express on port 5000 (avoids CRA dev-server 404s on POST /api).
 * Optional: same-origin `/api` works when setupProxy.js is present and you set REACT_APP_API_URL= (empty).
 * Production: set REACT_APP_API_URL to your API origin.
 */
export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export function authHeaders() {
  const token = localStorage.getItem('resqToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
