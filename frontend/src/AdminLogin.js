import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SiteFooter from './SiteFooter';
import { API_BASE } from './config';
import ForgotPasswordForm from './ForgotPasswordForm';

const parseJson = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await parseJson(res);
      if (!res.ok) {
        throw new Error(data.message || 'Invalid credentials');
      }
      if (data.token) {
        localStorage.setItem('resqToken', data.token);
      }
      if (data.user) {
        localStorage.setItem('resqUser', JSON.stringify(data.user));
      }
      if (data.user?.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 font-sans dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <h1 className="mb-1 text-center text-2xl font-bold text-slate-800 dark:text-slate-100">Admin sign in</h1>
        <p className="mb-8 text-center text-sm text-slate-500 dark:text-slate-400">ResQ Portal</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              placeholder="qwe730375@gmail.com"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              placeholder="••••••••"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword((open) => !open)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
              >
                Forgot password?
              </button>
            </div>
          </div>

          {showForgotPassword && <ForgotPasswordForm initialEmail={email} />}

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-60 shadow-lg shadow-blue-200"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-6 w-full text-center text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          ← Back to home
        </button>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
};

export default AdminLogin;
