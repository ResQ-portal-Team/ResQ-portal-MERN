import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ITEM_CATEGORY_GROUPS } from './itemCategories';
import NotificationBell from './NotificationBell';
import SiteFooter from './SiteFooter';
import ForgotPasswordForm from './ForgotPasswordForm';
import { useTheme } from './ThemeContext';

const DASHBOARD_FONT_KEY = 'resq-dashboard-font-scale';

const readDashboardFontScale = () => {
  try {
    const v = localStorage.getItem(DASHBOARD_FONT_KEY);
    if (v === 'sm' || v === 'md' || v === 'lg') return v;
  } catch {
    /* ignore */
  }
  return 'md';
};

const dashboardFontPercent = { sm: '93.75%', md: '100%', lg: '112.5%' };

const collectResqLocalStorage = () => {
  const keys = {};
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith('resq')) {
        const value = localStorage.getItem(key);
        if (value != null) keys[key] = value;
      }
    }
  } catch {
    /* ignore */
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    keys,
  };
};

const createInitialReportForm = () => ({
  title: '',
  description: '',
  type: 'lost',
  category: '',
  location: '',
  incidentDate: '',
  imageFile: null,
});

/** Today as YYYY-MM-DD in the browser local calendar (for date input max). */
const todayIsoDateLocal = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

const parseResponseBody = async (response) => {
  const responseText = await response.text();

  if (!responseText) {
    return {};
  }

  try {
    return JSON.parse(responseText);
  } catch (error) {
    return { message: responseText };
  }
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read the selected image.'));
    reader.readAsDataURL(file);
  });

const normalizeStatus = (status) => (status === 'returned' ? 'returned' : 'active');

const formatItemDate = (value) => {
  if (!value) {
    return 'Just now';
  }

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme, setTheme } = useTheme();
  const itemsSectionRef = useRef(null);
  const optionsMenuRef = useRef(null);
  const restoreBackupInputRef = useRef(null);

  const [showLogin, setShowLogin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [fontScale, setFontScale] = useState(readDashboardFontScale);
  const [showReportModal, setShowReportModal] = useState(false);
  const [pendingProtectedAction, setPendingProtectedAction] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginForgotOpen, setLoginForgotOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState('');
  const [itemsNotice, setItemsNotice] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [reportForm, setReportForm] = useState(createInitialReportForm());
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [actionItemId, setActionItemId] = useState('');
  const [pendingDeleteItem, setPendingDeleteItem] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('resqUser');
    if (!storedUser) return;

    try {
      setCurrentUser(JSON.parse(storedUser));
    } catch (error) {
      localStorage.removeItem('resqUser');
      localStorage.removeItem('resqToken');
    }
  }, []);

  useEffect(() => {
    if (!showOptionsMenu) return undefined;
    const onDoc = (e) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target)) {
        setShowOptionsMenu(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [showOptionsMenu]);

  useEffect(() => {
    try {
      if (fontScale === 'md') {
        localStorage.removeItem(DASHBOARD_FONT_KEY);
      } else {
        localStorage.setItem(DASHBOARD_FONT_KEY, fontScale);
      }
    } catch {
      /* ignore */
    }
  }, [fontScale]);

  const handleBackupData = () => {
    try {
      const payload = collectResqLocalStorage();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resq-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setShowOptionsMenu(false);
    } catch {
      window.alert('Could not export backup.');
    }
  };

  const handleRestoreBackupPick = () => {
    restoreBackupInputRef.current?.click();
  };

  const handleRestoreBackupFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : '';
        const data = JSON.parse(text);
        if (!data || typeof data !== 'object' || !data.keys || typeof data.keys !== 'object') {
          window.alert('Invalid backup file. Expected a ResQ export with a "keys" object.');
          return;
        }
        if (
          !window.confirm(
            'Replace saved data on this device with this backup? This overwrites ResQ settings and may include your sign-in token.',
          )
        ) {
          return;
        }
        Object.entries(data.keys).forEach(([k, v]) => {
          if (typeof k === 'string' && k.startsWith('resq') && typeof v === 'string') {
            localStorage.setItem(k, v);
          }
        });
        const th = localStorage.getItem('resq-theme');
        if (th === 'light' || th === 'dark') {
          setTheme(th);
        }
        setFontScale(readDashboardFontScale());
        try {
          const raw = localStorage.getItem('resqUser');
          setCurrentUser(raw ? JSON.parse(raw) : null);
        } catch {
          setCurrentUser(null);
        }
        setShowOptionsMenu(false);
        window.alert('Backup restored. If something looks wrong, refresh the page.');
      } catch {
        window.alert('Could not read backup file.');
      }
    };
    reader.onerror = () => {
      window.alert('Could not read backup file.');
    };
    reader.readAsText(file);
  };

  const requestApi = async (path, options = {}) => {
    const requestOptions = {
      headers: {
        ...(options.headers || {}),
      },
      ...options,
    };

    let lastError;

    for (const baseUrl of ['', 'http://localhost:5000']) {
      try {
        const response = await fetch(`${baseUrl}${path}`, requestOptions);
        const data = await parseResponseBody(response);

        if (!response.ok) {
          const error = new Error(data?.message || 'Request failed.');
          error.status = response.status;
          error.data = data;
          throw error;
        }

        return data;
      } catch (error) {
        lastError = error;

        if (error.status || baseUrl === 'http://localhost:5000') {
          break;
        }
      }
    }

    throw lastError || new Error('Request failed.');
  };

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setItemsLoading(true);
        setItemsError('');
        const data = await requestApi('/api/items');
        setItems(data.items || []);
      } catch (error) {
        setItemsError(error.message || 'Unable to load items.');
      } finally {
        setItemsLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleLoginInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (!loginData.email || !loginData.password) {
      setLoginError('Please enter both email and password.');
      return;
    }

    try {
      setLoginLoading(true);
      const data = await requestApi('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      localStorage.setItem('resqToken', data.token);
      localStorage.setItem('resqUser', JSON.stringify(data.user));
      setCurrentUser(data.user);
      setShowLogin(false);
      setLoginForgotOpen(false);
      setLoginData({ email: '', password: '' });

      if (pendingProtectedAction === 'report') {
        setShowReportModal(true);
      }

      setPendingProtectedAction('');
    } catch (error) {
      setLoginError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('resqToken');
    localStorage.removeItem('resqUser');
    setCurrentUser(null);
    setShowReportModal(false);
  };

  const handleBrowseItems = () => {
    itemsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openReportModal = () => {
    setItemsNotice('');
    setReportError('');

    if (!currentUser) {
      setPendingProtectedAction('report');
      setShowLogin(true);
      return;
    }

    setShowReportModal(true);
  };

  const handleReportFormChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'imageFile') {
      setReportForm((prev) => ({ ...prev, imageFile: files?.[0] || null }));
      return;
    }

    setReportForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleReportModalClose = () => {
    setShowReportModal(false);
    setReportError('');
    setReportForm(createInitialReportForm());
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setReportError('');
    setItemsNotice('');

    if (!currentUser) {
      setPendingProtectedAction('report');
      setShowLogin(true);
      return;
    }

    if (!reportForm.title.trim() || !reportForm.description.trim() || !reportForm.category.trim() || !reportForm.location.trim()) {
      setReportError('Please fill in title, description, category, and location.');
      return;
    }

    if (!reportForm.incidentDate) {
      setReportError(reportForm.type === 'found' ? 'Please select the date the item was found.' : 'Please select the date the item was lost.');
      return;
    }

    if (reportForm.incidentDate > todayIsoDateLocal()) {
      setReportError('Date must be today or in the past, not in the future.');
      return;
    }

    try {
      setReportLoading(true);
      const token = localStorage.getItem('resqToken');
      const payload = {
        title: reportForm.title.trim(),
        description: reportForm.description.trim(),
        type: reportForm.type,
        category: reportForm.category.trim(),
        location: reportForm.location.trim(),
        eventDate: reportForm.incidentDate,
      };

      if (reportForm.imageFile) {
        payload.imageData = await readFileAsDataUrl(reportForm.imageFile);
      }

      const data = await requestApi('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      setItems((prev) => [data.item, ...prev]);
      setItemsError('');
      setItemsNotice(data.message || 'Item reported successfully.');
      setActiveTab('active');
      handleReportModalClose();
    } catch (error) {
      setReportError(error.message || 'Unable to report this item.');
    } finally {
      setReportLoading(false);
    }
  };

  const handleMarkAsReturned = async (itemId) => {
    const token = localStorage.getItem('resqToken');

    if (!token) {
      setPendingProtectedAction('');
      setShowLogin(true);
      return;
    }

    try {
      setActionItemId(itemId);
      const data = await requestApi(`/api/items/${itemId}/return`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setItems((prev) => prev.map((item) => (item._id === itemId ? data.item : item)));
      setItemsError('');
      setItemsNotice(data.message || 'Item marked as returned.');
      setActiveTab('returned');
    } catch (error) {
      setItemsError(error.message || 'Unable to update item status.');
    } finally {
      setActionItemId('');
    }
  };

  const handleDeleteReturnedItem = async (itemId) => {
    const token = localStorage.getItem('resqToken');

    if (!token) {
      setShowLogin(true);
      return;
    }

    try {
      setActionItemId(itemId);
      const data = await requestApi(`/api/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setItems((prev) => prev.filter((item) => item._id !== itemId));
      setItemsError('');
      setItemsNotice(data.message || 'Returned item deleted successfully.');
    } catch (error) {
      setItemsError(error.message || 'Unable to delete the item.');
    } finally {
      setActionItemId('');
    }
  };

  const openDeleteModal = (item) => {
    setPendingDeleteItem(item);
    setItemsError('');
    setItemsNotice('');
  };

  const closeDeleteModal = () => {
    if (actionItemId) {
      return;
    }

    setPendingDeleteItem(null);
  };

  const confirmDeleteReturnedItem = async () => {
    if (!pendingDeleteItem?._id) {
      return;
    }

    await handleDeleteReturnedItem(pendingDeleteItem._id);
    setPendingDeleteItem(null);
  };

  const activeItems = items.filter((item) => normalizeStatus(item.status) === 'active');
  const returnedItems = items.filter((item) => normalizeStatus(item.status) === 'returned');
  const displayedItems = activeTab === 'active' ? activeItems : returnedItems;
  const foundItemsCount = items.filter((item) => item.type === 'found').length;

  const pageX = 'w-full px-5 sm:px-8 lg:px-12 xl:px-16 2xl:px-20';

  const menuBtn =
    'w-full px-4 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800';
  const fontChip = (active) =>
    `flex-1 rounded-lg border py-1.5 text-center text-xs font-bold transition ${
      active
        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-300'
        : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-slate-600 dark:text-slate-400 dark:hover:border-slate-500'
    }`;

  return (
    <div
      className="flex min-h-screen w-full flex-col bg-gray-50 font-sans text-gray-900 dark:bg-slate-950 dark:text-slate-100"
      style={{ fontSize: dashboardFontPercent[fontScale] }}
    >
      <nav className={`flex items-center justify-between border-b border-gray-100 bg-white py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sticky top-0 z-50 ${pageX}`}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-blue-600 p-2 rounded-lg text-white font-bold text-sm">ResQ</div>
          <span className="text-xl font-bold text-gray-800 tracking-tight text-center dark:text-slate-100">Portal</span>
        </div>
        <div className="flex items-center gap-6">
          <button
            className="text-gray-600 font-medium transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
            onClick={() => navigate('/community-hub')}
          >
            Community Hub
          </button>
          <button
            className="text-gray-600 font-medium transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
            onClick={() => navigate('/contact')}
          >
            Contact Us
          </button>
          <button
            type="button"
            className="text-gray-600 font-medium transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
            onClick={() => navigate('/about')}
          >
            About Us
          </button>

          {/* Notification Bell */}
          <NotificationBell />

          <div className="flex items-center gap-2">
            {currentUser ? (
              <button
                type="button"
                onClick={() => setShowProfile(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition shadow-md shadow-blue-200"
              >
                My Profile
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowLogin(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition shadow-md shadow-blue-200"
              >
                Sign In
              </button>
            )}
            <div className="relative" ref={optionsMenuRef}>
              <input
                ref={restoreBackupInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleRestoreBackupFile}
                aria-hidden="true"
                tabIndex={-1}
              />
              <button
                type="button"
                onClick={() => setShowOptionsMenu((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-400"
                aria-expanded={showOptionsMenu}
                aria-haspopup="true"
                aria-label="Options"
                title="Options"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>
              {showOptionsMenu && (
                <div className="absolute right-0 top-full z-[60] mt-2 w-64 rounded-xl border border-gray-100 bg-white py-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <button
                    type="button"
                    className={`${menuBtn} flex items-center justify-between gap-2`}
                    onClick={() => toggleTheme()}
                  >
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true">{theme === 'dark' ? '🌙' : '☀️'}</span>
                      Dark mode
                    </span>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {theme === 'dark' ? 'On' : 'Off'}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`${menuBtn} flex items-center gap-2`}
                    onClick={handleBackupData}
                  >
                    <span aria-hidden="true">⬇</span> Backup data
                  </button>
                  <button
                    type="button"
                    className={`${menuBtn} flex items-center gap-2`}
                    onClick={handleRestoreBackupPick}
                  >
                    <span aria-hidden="true">⬆</span> Restore data
                  </button>

                  <div className="px-4 py-2">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                      Font size
                    </p>
                    <div className="flex gap-1.5">
                      {[
                        { id: 'sm', label: 'S' },
                        { id: 'md', label: 'M' },
                        { id: 'lg', label: 'L' },
                      ].map(({ id, label }) => (
                        <button
                          key={id}
                          type="button"
                          className={fontChip(fontScale === id)}
                          onClick={() => setFontScale(id)}
                          aria-pressed={fontScale === id}
                          aria-label={`Font size ${label === 'S' ? 'small' : label === 'M' ? 'medium' : 'large'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="my-1 border-t border-gray-100 dark:border-slate-700" role="separator" />

                  <button
                    type="button"
                    className={`${menuBtn} flex items-center gap-2`}
                    onClick={() => {
                      setShowOptionsMenu(false);
                      navigate('/leaderboard');
                    }}
                  >
                    <span aria-hidden="true">🏆</span> Leaderboard
                  </button>
                  <button
                    type="button"
                    className={`${menuBtn} flex items-center gap-2`}
                    onClick={() => {
                      setShowOptionsMenu(false);
                      navigate('/chats');
                    }}
                  >
                    <span aria-hidden="true">💬</span> Chats
                  </button>
                  {currentUser?.role === 'admin' && (
                    <button
                      type="button"
                      className={menuBtn}
                      onClick={() => {
                        setShowOptionsMenu(false);
                        navigate('/admin-dashboard');
                      }}
                    >
                      Admin Dashboard
                    </button>
                  )}
                  {currentUser && (
                    <button
                      type="button"
                      className="w-full px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      onClick={() => {
                        setShowOptionsMenu(false);
                        handleLogout();
                      }}
                    >
                      Sign out
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div
        className="relative bg-blue-900 text-white py-16 sm:py-20 text-center bg-cover bg-center"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,30,0.7), rgba(0,0,30,0.7)), url("https://images.unsplash.com/photo-1523050853023-8c2d29149f0b?auto=format&fit=crop&q=80")',
        }}
      >
        <div className={`relative z-10 mx-auto ${pageX}`}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
            Lost Something? <span className="text-yellow-400">We&apos;ll Help.</span>
          </h1>
          <p className="text-lg sm:text-xl opacity-90 mb-10 mx-auto max-w-4xl font-light leading-relaxed">
            Report lost or found items, upload a photo, and keep the active and returned lists organized from one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleBrowseItems}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              Browse Items
            </button>
            <button
              onClick={openReportModal}
              className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 px-8 py-4 rounded-xl font-bold text-lg transition-all"
            >
              Report an Item
            </button>
          </div>
        </div>
      </div>

      <div className={`mx-auto -mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 relative z-20 ${pageX}`}>
        {[
          { label: 'Items Reported', value: items.length, color: 'text-blue-600' },
          { label: 'Active List', value: activeItems.length, color: 'text-amber-600' },
          { label: 'Returned List', value: returnedItems.length, color: 'text-green-600' },
          { label: 'Found Posts', value: foundItemsCount, color: 'text-purple-600' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-xl transition-shadow hover:shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div ref={itemsSectionRef} className={`mx-auto py-16 sm:py-20 ${pageX}`}>
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-10">
          <div>
            <h2 className="mb-2 text-3xl font-black text-gray-900 dark:text-white">Lost &amp; Found Board</h2>
            <p className="text-gray-500 dark:text-slate-400">
              Active items stay visible until the author marks them as returned. Returned posts can then be deleted by the same author.
            </p>
          </div>
          <div className="flex gap-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                activeTab === 'active' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              Active List
            </button>
            <button
              onClick={() => setActiveTab('returned')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                activeTab === 'returned' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              Returned List
            </button>
          </div>
        </div>

        {itemsNotice && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-800">
            {itemsNotice}
          </div>
        )}

        {itemsError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {itemsError}
          </div>
        )}

        {itemsLoading ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Loading items...
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-sm dark:border-slate-600 dark:bg-slate-900/50">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {activeTab === 'active' ? 'No active items yet.' : 'No returned items yet.'}
            </h3>
            <p className="text-gray-500 mb-6">
              {activeTab === 'active'
                ? 'Use the report popup to add the first lost or found item.'
                : 'Returned posts will appear here after the author marks them as returned.'}
            </p>
            {activeTab === 'active' && (
              <button
                onClick={openReportModal}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
              >
                Report an Item
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8">
            {displayedItems.map((item) => {
              const isAuthor = currentUser?.id === item.postedBy?._id;
              const itemStatus = normalizeStatus(item.status);
              const isBusy = actionItemId === item._id;

              return (
                <div
                  key={item._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/items/${item._id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/items/${item._id}`);
                    }
                  }}
                  className="group cursor-pointer overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-md transition-all duration-300 hover:shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="relative h-56 overflow-hidden bg-gray-100 dark:bg-slate-800">
                    <span
                      className={`absolute top-4 left-4 z-10 text-white text-[10px] uppercase font-black px-3 py-1 rounded-full tracking-tighter ${
                        item.type === 'lost' ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                    >
                      {item.type}
                    </span>
                    <span
                      className={`absolute top-4 right-4 z-10 text-[10px] uppercase font-black px-3 py-1 rounded-full tracking-tighter ${
                        itemStatus === 'returned' ? 'bg-white text-green-700' : 'bg-white text-amber-700'
                      }`}
                    >
                      {itemStatus}
                    </span>
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 via-white to-blue-200 flex items-center justify-center text-5xl text-blue-400 font-black">
                        {item.type === 'lost' ? 'L' : 'F'}
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="font-bold text-xl text-gray-800">{item.title}</h3>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{item.category}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed min-h-[72px]">{item.description}</p>
                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex justify-between gap-4">
                        <span>Location</span>
                        <span className="font-semibold text-gray-700 text-right">{item.location}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>Reported by</span>
                        <span className="font-semibold text-gray-700 text-right">
                          {item.postedBy?.nickname || item.postedBy?.realName || 'Unknown user'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>{item.type === 'found' ? 'Date found' : 'Date lost'}</span>
                        <span className="font-semibold text-gray-700 text-right">
                          {item.date ? formatItemDate(item.date) : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 text-xs text-gray-400">
                        <span>Listed</span>
                        <span className="text-right">{formatItemDate(item.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-5 mt-5 border-t border-gray-100">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {itemStatus === 'returned' ? 'Returned List' : 'Active List'}
                      </span>
                      {isAuthor && itemStatus === 'active' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsReturned(item._id);
                          }}
                          disabled={isBusy}
                          className="text-sm font-black text-green-700 hover:text-green-900 transition disabled:opacity-60"
                        >
                          {isBusy ? 'Updating...' : 'Mark as Returned'}
                        </button>
                      )}
                      {isAuthor && itemStatus === 'returned' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(item);
                          }}
                          disabled={isBusy}
                          className="text-sm font-black text-red-600 hover:text-red-800 transition disabled:opacity-60"
                        >
                          {isBusy ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                      {!isAuthor && <span className="text-xs font-semibold text-gray-400">View only</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-[100] p-4 overflow-y-auto">
          <div className="relative my-6 max-h-[calc(100vh-3rem)] w-full max-w-2xl animate-in overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl fade-in zoom-in duration-300 dark:bg-slate-900">
            <button onClick={handleReportModalClose} className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl">
              x
            </button>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Report a Lost or Found Item</h2>
              <p className="text-sm text-gray-500 mt-2">
                The image is uploaded first, then the image link and item details are stored so the post can be searched and moved to the returned list later.
              </p>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Type</label>
                  <select
                    name="type"
                    value={reportForm.type}
                    onChange={handleReportFormChange}
                    className="w-full p-4 rounded-xl border border-gray-100 bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none focus:border-blue-600 transition-all"
                  >
                    <option value="lost">Lost item</option>
                    <option value="found">Found item</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                  <select
                    name="category"
                    value={reportForm.category}
                    onChange={handleReportFormChange}
                    className="w-full p-4 rounded-xl border border-gray-100 bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none focus:border-blue-600 transition-all"
                  >
                    <option value="">Select a category</option>
                    {ITEM_CATEGORY_GROUPS.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {reportForm.type === 'found' ? 'Date found' : 'Date lost'}
                </label>
                <input
                  type="date"
                  name="incidentDate"
                  value={reportForm.incidentDate}
                  max={todayIsoDateLocal()}
                  onChange={handleReportFormChange}
                  className="w-full p-4 rounded-xl border border-gray-100 bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Item name</label>
                <input
                  type="text"
                  name="title"
                  value={reportForm.title}
                  onChange={handleReportFormChange}
                  placeholder="Black backpack"
                  className="w-full p-4 rounded-xl border border-gray-100 bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={reportForm.location}
                  onChange={handleReportFormChange}
                  placeholder="Main hall, library, Lab 01..."
                  className="w-full p-4 rounded-xl border border-gray-100 bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  rows="5"
                  value={reportForm.description}
                  onChange={handleReportFormChange}
                  placeholder="Add identifying details that help other students recognize the item."
                  className="w-full p-4 rounded-xl border border-gray-100 bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none focus:border-blue-600 transition-all resize-y min-h-[120px]"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Image</label>
                <input
                  type="file"
                  name="imageFile"
                  accept="image/*"
                  onChange={handleReportFormChange}
                  className="w-full p-4 rounded-xl border border-gray-100 bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none focus:border-blue-600 transition-all"
                />
                <p className="text-xs text-gray-400 mt-2">
                  {reportForm.imageFile ? `Selected: ${reportForm.imageFile.name}` : 'Optional. If provided, the image will be uploaded to Cloudinary.'}
                </p>
              </div>

              {reportError && <p className="text-sm text-red-600 font-medium">{reportError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReportModalClose}
                  className="px-5 py-3 rounded-xl font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportLoading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-70"
                >
                  {reportLoading ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLogin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div
            className={`relative w-full animate-in rounded-3xl bg-white p-8 shadow-2xl fade-in zoom-in duration-300 dark:bg-slate-900 ${loginForgotOpen ? 'max-w-lg' : 'max-w-md'}`}
          >
            <button
              onClick={() => {
                setShowLogin(false);
                setLoginForgotOpen(false);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl"
            >
              x
            </button>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-slate-100">Login to ResQ</h2>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <input
                type="email"
                name="email"
                value={loginData.email}
                onChange={handleLoginInputChange}
                placeholder="Student Email"
                className="w-full p-4 rounded-xl border border-gray-100 bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none focus:border-blue-600 transition-all"
              />
              <input
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginInputChange}
                placeholder="Password"
                className="w-full p-4 rounded-xl border border-gray-100 bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none focus:border-blue-600 transition-all"
              />
              <div className="flex justify-end -mt-2">
                <button
                  type="button"
                  onClick={() => setLoginForgotOpen((open) => !open)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
                >
                  Forgot password?
                </button>
              </div>
              {loginError && <p className="text-sm text-red-600 font-medium">{loginError}</p>}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-70"
              >
                {loginLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
            {loginForgotOpen && (
              <div className="mt-4 max-h-[min(70vh,28rem)] overflow-y-auto border-t border-gray-100 pt-4 dark:border-slate-700">
                <ForgotPasswordForm initialEmail={loginData.email} />
              </div>
            )}
            <p className="mt-4 text-center text-sm text-gray-500 dark:text-slate-400">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/onboarding')}
                className="border-0 bg-transparent p-0 text-blue-600 font-bold hover:underline"
              >
                Register with AI
              </button>
            </p>
          </div>
        </div>
      )}

      {pendingDeleteItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-900">
            <button
              onClick={closeDeleteModal}
              disabled={Boolean(actionItemId)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl disabled:opacity-50"
            >
              x
            </button>
            <div className="mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-100 text-red-600 text-xl font-bold mb-4">
                !
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Delete Returned Item?</h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                This will permanently remove <span className="font-semibold text-gray-700">{pendingDeleteItem.title}</span> from the returned list.
                Only the author can do this action.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl px-4 py-3 text-sm text-gray-600 mb-6">
              <div className="flex justify-between gap-4">
                <span>Category</span>
                <span className="font-semibold text-gray-700">{pendingDeleteItem.category}</span>
              </div>
              <div className="flex justify-between gap-4 mt-2">
                <span>Location</span>
                <span className="font-semibold text-gray-700">{pendingDeleteItem.location}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                disabled={Boolean(actionItemId)}
                className="px-5 py-3 rounded-xl font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteReturnedItem}
                disabled={Boolean(actionItemId)}
                className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-200 disabled:opacity-70"
              >
                {actionItemId ? 'Deleting...' : 'Delete Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfile && currentUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="relative w-full max-w-xl animate-in rounded-3xl bg-white p-8 shadow-2xl fade-in zoom-in duration-300 dark:bg-slate-900">
            <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl">
              x
            </button>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">My Profile</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase font-bold">Full Name</p>
                <p className="text-gray-800 font-semibold mt-1">{currentUser.realName}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase font-bold">Nickname</p>
                <p className="text-gray-800 font-semibold mt-1">{currentUser.nickname}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase font-bold">Student ID</p>
                <p className="text-gray-800 font-semibold mt-1">{currentUser.studentId}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase font-bold">Email</p>
                <p className="text-gray-800 font-semibold mt-1">{currentUser.email}</p>
              </div>
              {currentUser.role && (
                <div className="bg-gray-50 rounded-xl p-4 md:col-span-2">
                  <p className="text-gray-400 text-xs uppercase font-bold">Role</p>
                  <p className="text-gray-800 font-semibold mt-1 capitalize">{currentUser.role}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              {currentUser.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    setShowProfile(false);
                    navigate('/admin-dashboard');
                  }}
                  className="px-5 py-2 rounded-full font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition mr-auto"
                >
                  Admin Dashboard
                </button>
              )}
              <button
                onClick={() => setShowProfile(false)}
                className="px-5 py-2 rounded-full font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setShowProfile(false);
                }}
                className="bg-gray-800 text-white px-5 py-2 rounded-full font-bold hover:bg-black transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {!currentUser && (
        <button
          onClick={() => navigate('/onboarding')}
          className="fixed bottom-8 right-8 bg-blue-600 text-white p-5 rounded-2xl shadow-2xl hover:bg-blue-700 hover:-translate-y-2 transition-all flex items-center gap-3 group z-50"
        >
          <span className="font-bold text-sm tracking-tight">Register via Bot</span>
          <span className="text-2xl group-hover:rotate-12 transition-transform">AI</span>
        </button>
      )}

      <SiteFooter />
    </div>
  );
};

export default Dashboard;