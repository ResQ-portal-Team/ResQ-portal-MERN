import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from './config';

const initialForm = { name: '', email: '', subject: '', message: '' };

const parseResponseBody = async (res) => {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_err) {
    // Some proxy/server errors return HTML (e.g., <!DOCTYPE ...>).
    return { message: 'Server returned a non-JSON response. Please check backend server and API route.' };
  }
};

const ContactUs = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [showBellPanel, setShowBellPanel] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const token = localStorage.getItem('resqToken');

  const loadNotifications = async () => {
    if (!token) {
      setNotifications([]);
      return;
    }
    setLoadingNotifications(true);
    try {
      const res = await fetch(`${API_BASE}/api/contacts/my-notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseResponseBody(res);
      if (!res.ok) throw new Error(data.message || 'Failed to load notifications.');
      setNotifications(data.notifications || []);
    } catch (_err) {
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    const id = setInterval(() => {
      loadNotifications();
    }, 10000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const markSeen = async (id) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/contacts/my-notifications/${id}/seen`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseResponseBody(res);
      if (!res.ok) throw new Error(data.message || 'Failed to update notification.');
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, resolvedSeenByUser: true } : n))
      );
    } catch (_err) {
      // Keep UX simple: ignore to avoid blocking user.
    }
  };

  const unreadCount = notifications.filter((n) => n.resolvedSeenByUser !== true).length;

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
      const token = localStorage.getItem('resqToken');
      const res = await fetch(`${API_BASE}/api/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      const data = await parseResponseBody(res);
      if (!res.ok) throw new Error(data.message || 'Failed to send message.');
      setNotice(data.message || 'Message sent.');
      setForm(initialForm);
      // Optional: redirect back after a short delay
      // setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 dark:bg-slate-950 dark:text-slate-100">
      <nav className="flex items-center justify-between border-b border-gray-100 bg-white p-4 px-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-blue-600 p-2 rounded-lg text-white font-bold text-sm">ResQ</div>
          <span className="text-center text-xl font-bold tracking-tight text-gray-800 dark:text-slate-100">Portal</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 relative">
          <button
            type="button"
            onClick={() => {
              setShowBellPanel((v) => !v);
              loadNotifications();
            }}
            className="relative text-gray-600 transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
            title="Notifications"
          >
            <span className="text-xl" role="img" aria-label="notifications">
              🔔
            </span>
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/about')}
            className="font-medium text-gray-600 transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
          >
            About Us
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="font-medium text-gray-600 transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
          >
            Back to Dashboard
          </button>

          {showBellPanel && (
            <div className="absolute right-0 top-12 z-20 w-96 max-w-[90vw] rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-slate-600 dark:bg-slate-900">
              <h3 className="mb-2 text-sm font-bold text-gray-800 dark:text-slate-100">Resolved updates</h3>
              {loadingNotifications ? (
                <p className="py-3 text-sm text-gray-500 dark:text-slate-400">Loading...</p>
              ) : notifications.length === 0 ? (
                <p className="py-3 text-sm text-gray-500 dark:text-slate-400">No resolved updates yet.</p>
              ) : (
                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n._id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800/80">
                      <p className="truncate text-sm font-semibold text-gray-800 dark:text-slate-100">
                        {n.subject || 'Contact request'}
                      </p>
                      <p className="mt-1 text-xs font-medium text-green-700 dark:text-green-400">
                        Your contact request has been marked as resolved by admin.
                      </p>
                      {n.message && (
                        <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-slate-400">
                          Message: {n.message}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-gray-500 dark:text-slate-500">
                          {n.resolvedAt ? new Date(n.resolvedAt).toLocaleString() : 'Just now'}
                        </span>
                        {n.resolvedSeenByUser === true ? (
                          <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500">Read</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => markSeen(n._id)}
                            className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      <div className="mx-auto max-w-3xl p-6">
        <h1 className="mb-2 text-3xl font-black text-gray-900 dark:text-white">Contact us</h1>
        <p className="mb-6 text-gray-500 dark:text-slate-400">
          Have a question or feedback? Send us a message and the admin team will review it.
        </p>

        {notice && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800/50 dark:bg-green-950/40 dark:text-green-300">
            {notice}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow dark:border-slate-700 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-300">Your name</label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-300">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                placeholder="you@my.sliit.lk"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-300">Subject</label>
            <input
              name="subject"
              value={form.subject}
              onChange={onChange}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              placeholder="How can we help?"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-300">Message</label>
            <textarea
              name="message"
              rows={5}
              value={form.message}
              onChange={onChange}
              className="w-full resize-y rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              placeholder="Write your message here..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:opacity-70"
            >
              {submitting ? 'Sending…' : 'Send message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactUs;
