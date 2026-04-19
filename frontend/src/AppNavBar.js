import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from './config';

const parseResponseBody = async (res) => {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_err) {
    return { message: 'Server returned a non-JSON response. Please check backend server and API route.' };
  }
};

/** Shared top nav: Home, Dashboard, notifications, Contact Us, About Us, Login / My Profile. */
const AppNavBar = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [showBellPanel, setShowBellPanel] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const token = localStorage.getItem('resqToken');

  useEffect(() => {
    const stored = localStorage.getItem('resqUser');
    if (!stored) return;
    try {
      setCurrentUser(JSON.parse(stored));
    } catch {
      localStorage.removeItem('resqUser');
      localStorage.removeItem('resqToken');
    }
  }, []);

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
      /* ignore */
    }
  };

  const unreadCount = notifications.filter((n) => n.resolvedSeenByUser !== true).length;

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-white p-4 px-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex cursor-pointer items-center gap-2" onClick={() => navigate('/')}>
        <div className="rounded-lg bg-blue-600 p-2 text-sm font-bold text-white">ResQ</div>
        <span className="text-center text-xl font-bold tracking-tight text-gray-800 dark:text-slate-100">Portal</span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="font-medium text-gray-600 transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
        >
          Home
        </button>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="font-medium text-gray-600 transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
        >
          Dashboard
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowBellPanel((v) => !v);
              loadNotifications();
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-400"
            title="Notifications"
          >
            <span className="text-lg" role="img" aria-label="notifications">
              🔔
            </span>
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
          {showBellPanel && (
            <div className="absolute right-0 top-12 z-30 w-96 max-w-[90vw] rounded-2xl border border-gray-100 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-3 text-sm font-black text-gray-900 dark:text-white">Resolved updates</h3>
              {loadingNotifications ? (
                <p className="py-4 text-sm text-gray-500 dark:text-slate-400">Loading…</p>
              ) : notifications.length === 0 ? (
                <p className="py-4 text-sm text-gray-500 dark:text-slate-400">No resolved updates yet.</p>
              ) : (
                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n._id}
                      className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/80"
                    >
                      <p className="truncate text-sm font-bold text-gray-900 dark:text-slate-100">
                        {n.subject || 'Contact request'}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-green-700 dark:text-green-400">
                        Your request was marked resolved by admin.
                      </p>
                      {n.message && (
                        <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-slate-400">{n.message}</p>
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
                            className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
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

        <button
          type="button"
          onClick={() => navigate('/contact')}
          className="font-medium text-gray-600 transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
        >
          Contact Us
        </button>
        <button
          type="button"
          onClick={() => navigate('/about')}
          className="font-medium text-gray-600 transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
        >
          About Us
        </button>
        {currentUser ? (
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-md shadow-blue-200 transition hover:bg-blue-700"
          >
            My Profile
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="font-medium text-gray-600 transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default AppNavBar;
