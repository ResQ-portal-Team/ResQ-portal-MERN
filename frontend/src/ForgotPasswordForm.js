import React, { useState, useEffect } from 'react';
import { postJson } from './config';

/**
 * Steps: email → enter OTP + Confirm → new password + Update password.
 */
export default function ForgotPasswordForm({ initialEmail = '' }) {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  const goEmailStep = () => {
    setStep('email');
    setError('');
    setMessage('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const goOtpStep = () => {
    setStep('otp');
    setError('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const requestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Enter the email for your account.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await postJson('/api/auth/forgot-password', { email: trimmed });
      setOtp('');
      setMessage(
        typeof data.message === 'string' ? data.message : 'If this email is registered, a code was sent.'
      );
      goOtpStep();
    } catch (err) {
      let errMsg = err.message || 'Could not send code.';
      if (err.data?.hint) {
        errMsg += `\n\n${err.data.hint}`;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const confirmOtp = async (e) => {
    e?.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Email is missing. Go back and start again.');
      return;
    }
    setLoading(true);
    try {
      await postJson('/api/auth/verify-reset-otp', {
        email: trimmed,
        otp: otp.trim(),
      });
      setError('');
      setStep('password');
    } catch (err) {
      setError(err.message || 'Wrong verification code. Check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const trimmed = email.trim();
    if (!trimmed || !/^\d{6}$/.test(otp.trim())) {
      setError('Enter a valid 6-digit code. Go back if you need to change it.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await postJson('/api/auth/reset-password', {
        email: trimmed,
        otp: otp.trim(),
        newPassword,
      });
      setMessage(data.message || 'Password updated.');
      setStep('email');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Could not update password.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100';

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-600 dark:bg-slate-800/80">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Reset password</p>

      {step === 'email' && (
        <form onSubmit={requestOtp} className="space-y-3">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Account email</label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@example.com"
          />
          {error && <p className="whitespace-pre-line text-sm text-red-600 dark:text-red-400">{error}</p>}
          {message && <p className="text-sm text-green-700 dark:text-green-400">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-800 py-2.5 text-sm font-bold text-white hover:bg-slate-900 disabled:opacity-60 dark:bg-slate-600 dark:hover:bg-slate-500"
          >
            {loading ? 'Sending…' : 'Send code to email'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={confirmOtp} className="space-y-3">
          {message && <p className="text-sm text-green-700 dark:text-green-400">{message}</p>}
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">6-digit code</label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className={inputClass}
            placeholder="000000"
          />
          {error && <p className="whitespace-pre-line text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={goEmailStep}
              className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Checking…' : 'Confirm code'}
            </button>
          </div>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={submitReset} className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Check your email for the verification code (including Spam).
          </p>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">New password</label>
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
            placeholder="At least 6 characters"
          />
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Confirm password</label>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
            placeholder="Repeat password"
          />
          {error && <p className="whitespace-pre-line text-sm text-red-600 dark:text-red-400">{error}</p>}
          {message && <p className="text-sm text-green-700 dark:text-green-400">{message}</p>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                goOtpStep();
                setError('');
              }}
              className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Saving…' : 'Update password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
