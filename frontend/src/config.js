/** Backend API base (dev: direct to Express; set REACT_APP_API_URL in production). */
export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export function authHeaders() {
  const token = localStorage.getItem('resqToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
