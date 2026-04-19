import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from './config';
import AppNavBar from './AppNavBar';
import SiteFooter from './SiteFooter';

const initialForm = { name: '', email: '', subject: '', message: '' };

const parseResponseBody = async (res) => {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_err) {
    return { message: 'Server returned a non-JSON response. Please check backend server and API route.' };
  }
};

const ContactUs = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    try {
      const auth = localStorage.getItem('resqToken');
      const res = await fetch(`${API_BASE}/api/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        },
        body: JSON.stringify(form),
      });
      const data = await parseResponseBody(res);
      if (!res.ok) throw new Error(data.message || 'Failed to send message.');
      setNotice(data.message || 'Message sent.');
      setForm(initialForm);
    } catch (err) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3.5 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-blue-400';

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc] font-sans selection:bg-blue-100 dark:bg-slate-950 dark:text-slate-100 dark:selection:bg-blue-900/40">
      <AppNavBar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-2 pb-24 pt-8 md:pt-10">
        <div className="relative mb-12 md:mb-16">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[100px] dark:bg-blue-400/10" />
          <p className="relative mb-2 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Get in touch
          </p>
          <h1 className="relative mb-4 text-4xl font-black leading-tight text-gray-900 dark:text-white md:text-6xl md:leading-[1.1]">
            Contact{' '}
            <span className="italic text-blue-600 dark:text-blue-400">ResQ</span>
          </h1>
          <p className="relative max-w-2xl text-lg leading-relaxed text-gray-500 dark:text-slate-400 md:text-xl">
            Questions, feedback, or campus lost &amp; found support — the admin team reads every message.
          </p>
        </div>

        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <div className="space-y-4">
              <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
                <div className="mb-2 text-2xl">✉️</div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">We reply soon</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-slate-400">
                  Use your SLIIT email when possible so we can verify and respond faster.
                </p>
              </div>
              <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
                <div className="mb-2 text-2xl">🛡️</div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Signed-in users</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-slate-400">
                  Log in before sending to link your ticket to your account and get resolution updates in the bell
                  above.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {notice && (
              <div className="mb-6 rounded-2xl border border-green-200/80 bg-green-50 px-5 py-4 text-sm font-medium text-green-800 dark:border-green-800/50 dark:bg-green-950/40 dark:text-green-300">
                {notice}
              </div>
            )}
            {error && (
              <div className="mb-6 rounded-2xl border border-red-200/80 bg-red-50 px-5 py-4 text-sm font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}

            <form
              onSubmit={onSubmit}
              className="space-y-5 rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-slate-800/80 dark:shadow-none md:p-10"
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                    Your name
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    className={inputClass}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    className={inputClass}
                    placeholder="you@my.sliit.lk"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                  Subject
                </label>
                <input
                  name="subject"
                  value={form.subject}
                  onChange={onChange}
                  className={inputClass}
                  placeholder="How can we help?"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                  Message
                </label>
                <textarea
                  name="message"
                  rows={5}
                  value={form.message}
                  onChange={onChange}
                  className={`${inputClass} resize-y min-h-[140px]`}
                  placeholder="Write your message here…"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="rounded-2xl border-2 border-gray-200 px-8 py-4 text-base font-bold text-gray-800 transition hover:border-blue-600 hover:bg-white hover:text-blue-600 dark:border-slate-600 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:bg-slate-800"
                >
                  Back to home
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60 dark:shadow-blue-900/40"
                >
                  {submitting ? 'Sending…' : 'Send message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default ContactUs;
