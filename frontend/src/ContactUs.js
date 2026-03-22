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
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center px-8">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-blue-600 p-2 rounded-lg text-white font-bold text-sm">ResQ</div>
          <span className="text-xl font-bold text-gray-800 tracking-tight text-center">Portal</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 relative">
          <button
            type="button"
            onClick={() => {
              setShowBellPanel((v) => !v);
              loadNotifications();
            }}
            className="relative text-gray-600 hover:text-blue-600 transition"
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
            className="text-gray-600 font-medium hover:text-blue-600 transition"
          >
            About Us
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 font-medium hover:text-blue-600 transition"
          >
            Back to Dashboard
          </button>

          {showBellPanel && (
            <div className="absolute right-0 top-12 w-96 max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-xl z-20 p-3">
              <h3 className="text-sm font-bold text-gray-800 mb-2">Resolved updates</h3>
              {loadingNotifications ? (
                <p className="text-sm text-gray-500 py-3">Loading...</p>
              ) : notifications.length === 0 ? (
                <p className="text-sm text-gray-500 py-3">No resolved updates yet.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n._id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {n.subject || 'Contact request'}
                      </p>
                      <p className="text-xs text-green-700 font-medium mt-1">
                        Your contact request has been marked as resolved by admin.
                      </p>
                      {n.message && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          Message: {n.message}
                        </p>
                      )}
                      <div className="mt-2 flex justify-between items-center gap-2">
                        <span className="text-[11px] text-gray-500">
                          {n.resolvedAt ? new Date(n.resolvedAt).toLocaleString() : 'Just now'}
                        </span>
                        {n.resolvedSeenByUser === true ? (
                          <span className="text-[11px] font-semibold text-gray-400">Read</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => markSeen(n._id)}
                            className="text-xs font-semibold text-blue-600 hover:underline"
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

      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Contact us</h1>
        <p className="text-gray-500 mb-6">
          Have a question or feedback? Send us a message and the admin team will review it.
        </p>

        {notice && <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800 text-sm">{notice}</div>}
        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div>}

        <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow border border-gray-100 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Your name</label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-blue-600 outline-none"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-blue-600 outline-none"
                placeholder="you@my.sliit.lk"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
            <input
              name="subject"
              value={form.subject}
              onChange={onChange}
              className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-blue-600 outline-none"
              placeholder="How can we help?"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
            <textarea
              name="message"
              rows={5}
              value={form.message}
              onChange={onChange}
              className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-blue-600 outline-none resize-y"
              placeholder="Write your message here..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-70"
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
