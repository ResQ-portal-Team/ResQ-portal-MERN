import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2,
  CalendarDays,
  LayoutDashboard,
  Mail,
  PackageSearch,
  RefreshCw,
  Users,
} from 'lucide-react';
import { API_BASE, authHeaders } from './config';
import { PollChartsGrid, downloadPollReportPdf } from './PollBreakdownReport';
import SiteFooter from './SiteFooter';

const ADMIN_NAV = [
  {
    id: 'users',
    label: 'User management',
    shortLabel: 'Users',
    description: 'Accounts & profiles',
    Icon: Users,
  },
  {
    id: 'items',
    label: 'Lost & found',
    shortLabel: 'Lost & found',
    description: 'Posts & listings',
    Icon: PackageSearch,
  },
  {
    id: 'community',
    label: 'Community Hub',
    shortLabel: 'Community',
    description: 'Events & media',
    Icon: CalendarDays,
  },
  {
    id: 'polls',
    label: 'Event polls',
    shortLabel: 'Polls',
    description: 'Feedback & PDFs',
    Icon: BarChart2,
  },
  {
    id: 'contacts',
    label: 'Contact Us',
    shortLabel: 'Contact',
    description: 'Inbox messages',
    Icon: Mail,
  },
];

const SECTION_INTRO = {
  users: {
    title: 'User management',
    subtitle: 'View, edit, or remove registered student accounts and their posted items.',
  },
  items: {
    title: 'Lost & found',
    subtitle: 'Moderate lost and found posts: type, category, status, and author.',
  },
  community: {
    title: 'Community Hub',
    subtitle: 'Publish events, upload banners or video, and move items between upcoming and finished.',
  },
  polls: {
    title: 'Event polls',
    subtitle: 'See poll summaries per event, open detailed breakdowns, and export PDF reports.',
  },
  contacts: {
    title: 'Contact Us',
    subtitle: 'Read messages from the site contact form and mark them resolved.',
  },
};

const parseJson = async (res) => {
  const t = await res.text();
  if (!t) return {};
  try {
    return JSON.parse(t);
  } catch {
    return { message: t };
  }
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read the selected file.'));
    reader.readAsDataURL(file);
  });

const EVENT_CATEGORIES = [
  'Workshop',
  'Seminar',
  'Cultural',
  'Sports',
  'Tech Talk',
  'Competition',
  'Social',
  'Other',
];

const emptyEventForm = () => ({
  title: '',
  description: '',
  startDateTime: '',
  endDateTime: '',
  location: '',
  organizer: '',
  category: 'Workshop',
  videoUrl: '',
  contactInfo: '',
});

/** ISO date from API → value for `<input type="datetime-local" />` (local time). */
const toDateTimeLocalValue = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [communityEventsUpcoming, setCommunityEventsUpcoming] = useState([]);
  const [communityEventsFinished, setCommunityEventsFinished] = useState([]);
  const [pollEvents, setPollEvents] = useState([]);
  const [pollDetailOpen, setPollDetailOpen] = useState(false);
  const [pollDetailLoading, setPollDetailLoading] = useState(false);
  const [pollDetail, setPollDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ realName: '', nickname: '', studentId: '' });

  const [eventForm, setEventForm] = useState(emptyEventForm);
  const [bannerFile, setBannerFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [eventSubmitting, setEventSubmitting] = useState(false);

  const [editCommunityEvent, setEditCommunityEvent] = useState(null);
  const [editEventForm, setEditEventForm] = useState(emptyEventForm);
  const [editBannerFile, setEditBannerFile] = useState(null);
  const [editVideoFile, setEditVideoFile] = useState(null);
  const [editEventSubmitting, setEditEventSubmitting] = useState(false);

  const [editItemImage, setEditItemImage] = useState(null);
  const [itemImageFile, setItemImageFile] = useState(null);
  const [itemImageSubmitting, setItemImageSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/admin/users`, { headers: authHeaders() });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(data.message || 'Failed to load users');
    setUsers(data.users || []);
  }, []);

  const loadItems = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/admin/items`, { headers: authHeaders() });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(data.message || 'Failed to load items');
    setItems(data.items || []);
  }, []);

  const loadContacts = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/admin/contacts`, { headers: authHeaders() });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(data.message || 'Failed to load messages');
    setContacts(data.contacts || []);
  }, []);

  const loadCommunityEvents = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/admin/community-events`, { headers: authHeaders() });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(data.message || 'Failed to load community events');
    setCommunityEventsUpcoming(data.upcoming || []);
    setCommunityEventsFinished(data.finished || []);
  }, []);

  const loadPollSummary = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/admin/event-polls/summary`, { headers: authHeaders() });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(data.message || 'Failed to load poll summary');
    setPollEvents(data.events || []);
  }, []);

  const refresh = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      await Promise.all([loadUsers(), loadItems(), loadCommunityEvents(), loadContacts(), loadPollSummary()]);
    } catch (e) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [loadUsers, loadItems, loadCommunityEvents, loadContacts, loadPollSummary]);

  const openPollDetail = async (eventId) => {
    setPollDetailOpen(true);
    setPollDetail(null);
    setPollDetailLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/event-polls/${eventId}`, { headers: authHeaders() });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data.message || 'Failed to load poll detail');
      setPollDetail(data);
    } catch (e) {
      setError(e.message || 'Failed to load poll detail');
      setPollDetailOpen(false);
    } finally {
      setPollDetailLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user and their posted items?')) return;
    setActionId(`u-${id}`);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionId('');
    }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({
      realName: u.realName || '',
      nickname: u.nickname || '',
      studentId: u.studentId || '',
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setActionId(`edit-${editUser._id}`);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${editUser._id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(editForm),
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data.message || 'Update failed');
      setEditUser(null);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId('');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this post/item permanently?')) return;
    setActionId(`i-${id}`);
    try {
      const res = await fetch(`${API_BASE}/api/admin/items/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionId('');
    }
  };

  const openEditItemImage = (it) => {
    setError('');
    setEditItemImage({ _id: it._id, title: it.title, image: it.image || null });
    setItemImageFile(null);
  };

  const saveItemImage = async (e) => {
    e.preventDefault();
    if (!editItemImage) return;
    if (!itemImageFile) {
      setError('Choose an image to upload.');
      return;
    }
    if (itemImageFile.size > 8 * 1024 * 1024) {
      setError('Image must be under 8MB.');
      return;
    }
    setItemImageSubmitting(true);
    setActionId(`img-${editItemImage._id}`);
    setError('');
    try {
      const imageData = await readFileAsDataUrl(itemImageFile);
      const res = await fetch(`${API_BASE}/api/admin/item-image/${editItemImage._id}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ imageData }),
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setEditItemImage(null);
      setItemImageFile(null);
      await loadItems();
    } catch (err) {
      setError(err.message || 'Failed to update image.');
    } finally {
      setItemImageSubmitting(false);
      setActionId('');
    }
  };

  const handleCreateCommunityEvent = async (e) => {
    e.preventDefault();
    setError('');
    const {
      title,
      description,
      startDateTime,
      endDateTime,
      location,
      organizer,
      category,
      videoUrl,
      contactInfo,
    } = eventForm;

    if (!title.trim() || !description.trim()) {
      setError('Event title and description are required.');
      return;
    }
    if (!startDateTime || !location.trim() || !organizer.trim()) {
      setError('Start date/time, location, and organizer are required.');
      return;
    }

    setEventSubmitting(true);
    try {
      let bannerImageData;
      if (bannerFile) {
        if (bannerFile.size > 8 * 1024 * 1024) {
          throw new Error('Banner image must be under 8MB.');
        }
        bannerImageData = await readFileAsDataUrl(bannerFile);
      }

      let videoData;
      if (videoFile) {
        if (videoFile.size > 20 * 1024 * 1024) {
          throw new Error('Video file must be under 20MB (or use Video URL). Increase REQUEST_BODY_LIMIT on the server for larger uploads.');
        }
        videoData = await readFileAsDataUrl(videoFile);
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        startDateTime: new Date(startDateTime).toISOString(),
        endDateTime: endDateTime ? new Date(endDateTime).toISOString() : null,
        location: location.trim(),
        organizer: organizer.trim(),
        category,
        contactInfo: contactInfo.trim() || null,
        videoUrl: videoUrl.trim() || null,
      };

      if (bannerImageData) payload.bannerImageData = bannerImageData;
      if (videoData) payload.videoData = videoData;

      const res = await fetch(`${API_BASE}/api/admin/community-events`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data.message || 'Failed to create event');

      setEventForm(emptyEventForm());
      setBannerFile(null);
      setVideoFile(null);
      await refresh();
    } catch (err) {
      setError(err.message || 'Failed to create event');
    } finally {
      setEventSubmitting(false);
    }
  };

  const handleDeleteCommunityEvent = async (id) => {
    if (!window.confirm('Delete this community event permanently?')) return;
    setActionId(`ce-${id}`);
    try {
      const res = await fetch(`${API_BASE}/api/admin/community-events/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionId('');
    }
  };

  const handleMarkCommunityEventFinished = async (id) => {
    if (!window.confirm('Mark this event as finished? It will appear under Finished events.')) return;
    setActionId(`ce-fin-${id}`);
    try {
      const res = await fetch(`${API_BASE}/api/admin/community-events/${id}/mark-finished`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data.message || 'Could not mark as finished');
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionId('');
    }
  };

  const openEditCommunityEvent = (ev) => {
    setEditCommunityEvent(ev);
    setEditEventForm({
      title: ev.title || '',
      description: ev.description || '',
      startDateTime: toDateTimeLocalValue(ev.startDateTime),
      endDateTime: toDateTimeLocalValue(ev.endDateTime),
      location: ev.location || '',
      organizer: ev.organizer || '',
      category: ev.category || 'Workshop',
      videoUrl: ev.videoUrl || '',
      contactInfo: ev.contactInfo || '',
      manuallyFinished: Boolean(ev.manuallyFinished),
    });
    setEditBannerFile(null);
    setEditVideoFile(null);
  };

  const closeEditCommunityEvent = () => {
    setEditCommunityEvent(null);
    setEditBannerFile(null);
    setEditVideoFile(null);
  };

  const handleSaveEditCommunityEvent = async (e) => {
    e.preventDefault();
    if (!editCommunityEvent) return;
    setError('');
    const {
      title,
      description,
      startDateTime,
      endDateTime,
      location,
      organizer,
      category,
      videoUrl,
      contactInfo,
      manuallyFinished,
    } = editEventForm;

    if (!title.trim() || !description.trim()) {
      setError('Event title and description are required.');
      return;
    }
    if (!startDateTime || !location.trim() || !organizer.trim()) {
      setError('Start date/time, location, and organizer are required.');
      return;
    }

    setEditEventSubmitting(true);
    setActionId(`ce-edit-${editCommunityEvent._id}`);
    try {
      let bannerImageData;
      if (editBannerFile) {
        if (editBannerFile.size > 8 * 1024 * 1024) {
          throw new Error('Banner image must be under 8MB.');
        }
        bannerImageData = await readFileAsDataUrl(editBannerFile);
      }

      let videoData;
      if (editVideoFile) {
        if (editVideoFile.size > 20 * 1024 * 1024) {
          throw new Error('Video file must be under 20MB (or use Video URL).');
        }
        videoData = await readFileAsDataUrl(editVideoFile);
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        startDateTime: new Date(startDateTime).toISOString(),
        endDateTime: endDateTime ? new Date(endDateTime).toISOString() : null,
        location: location.trim(),
        organizer: organizer.trim(),
        category,
        contactInfo: contactInfo.trim() || null,
        videoUrl: videoUrl.trim() || null,
        manuallyFinished: Boolean(manuallyFinished),
      };

      if (bannerImageData) payload.bannerImageData = bannerImageData;
      if (videoData) payload.videoData = videoData;

      const res = await fetch(`${API_BASE}/api/admin/community-events/${editCommunityEvent._id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data.message || 'Failed to update event');

      closeEditCommunityEvent();
      await refresh();
    } catch (err) {
      setError(err.message || 'Failed to update event');
    } finally {
      setEditEventSubmitting(false);
      setActionId('');
    }
  };

  const formatAuthor = (postedBy) => {
    if (!postedBy) return '—';
    if (typeof postedBy === 'object') {
      return postedBy.nickname || postedBy.email || postedBy.studentId || '—';
    }
    return String(postedBy);
  };

  const formatEventWhen = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleString();
    } catch {
      return '—';
    }
  };

  const navBadge = (id) => {
    switch (id) {
      case 'users':
        return users.length;
      case 'items':
        return items.length;
      case 'community':
        return communityEventsUpcoming.length + communityEventsFinished.length;
      case 'polls':
        return pollEvents.length;
      case 'contacts':
        return contacts.filter((c) => c.status !== 'resolved').length;
      default:
        return null;
    }
  };

  const intro = SECTION_INTRO[tab] || SECTION_INTRO.users;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="shrink-0 border-b border-slate-800 bg-slate-900 text-white px-4 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/90 text-white">
            <LayoutDashboard className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm truncate">User &amp; community content management</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-semibold"
          >
            Main dashboard
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('resqToken');
              localStorage.removeItem('resqUser');
              navigate('/login');
            }}
            className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-sm font-semibold"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex w-full min-h-0 flex-1 flex-col md:flex-row md:items-stretch">
        <aside className="flex shrink-0 flex-col border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 md:w-64 md:min-h-0 md:border-b-0 md:border-r">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 hidden md:block">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sections</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">Choose one area at a time</p>
          </div>
          <nav className="p-2 md:p-3 flex flex-row gap-1 overflow-x-auto md:flex-col md:overflow-x-visible md:gap-0.5">
            {ADMIN_NAV.map(({ id, label, shortLabel, description, Icon }) => {
              const active = tab === id;
              const badge = navBadge(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors md:w-full ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-600'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      active ? 'bg-white/15' : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold leading-tight md:hidden">{shortLabel}</span>
                    <span className="hidden md:block text-sm font-semibold leading-tight">{label}</span>
                    <span className={`hidden md:block text-xs mt-0.5 ${active ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {description}
                    </span>
                  </span>
                  {badge != null && (
                    <span
                      className={`hidden sm:inline-flex min-w-[1.5rem] justify-center rounded-full px-1.5 py-0.5 text-xs font-bold ${
                        active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto p-3 border-t border-slate-100 dark:border-slate-800 hidden md:block">
            <button
              type="button"
              onClick={() => refresh()}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh data
            </button>
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="flex w-full min-h-0 flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-8">
            <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{intro.title}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-3xl">{intro.subtitle}</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm font-medium dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-8 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <RefreshCw className="h-5 w-5 animate-spin shrink-0" />
                <p>Loading dashboard data…</p>
              </div>
            ) : tab === 'polls' ? (
          <div className="space-y-6">
            <section className="rounded-xl border border-slate-100 bg-white p-6 shadow dark:border-slate-700 dark:bg-slate-900">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">Events with poll data</h3>
              <p className="text-sm text-slate-500 mb-4 dark:text-slate-400">
                Feedback from Community Hub event pages (attendance, rating, experience, and suggestions).
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700">
                <table className="w-full text-sm text-slate-800 dark:text-slate-200">
                  <thead className="bg-slate-100 text-left dark:bg-slate-800/90 dark:text-slate-200">
                    <tr>
                      <th className="p-3 font-semibold">Event</th>
                      <th className="p-3 font-semibold">Started</th>
                      <th className="p-3 font-semibold">Responses</th>
                      <th className="p-3 font-semibold">Avg rating</th>
                      <th className="p-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pollEvents.map((row) => (
                      <tr
                        key={String(row.eventId)}
                        className="border-t border-slate-100 dark:border-slate-700/60 dark:hover:bg-slate-800/40"
                      >
                        <td className="p-3 max-w-xs font-medium">{row.title}</td>
                        <td className="p-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                          {row.startDateTime ? formatEventWhen(row.startDateTime) : '—'}
                        </td>
                        <td className="p-3">{row.responseCount}</td>
                        <td className="p-3">
                          {row.avgRating != null ? `${row.avgRating} / 5` : '—'}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => openPollDetail(row.eventId)}
                            disabled={pollDetailLoading}
                            className="text-indigo-600 font-semibold hover:underline disabled:opacity-50 dark:text-indigo-400"
                          >
                            View breakdown
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pollEvents.length === 0 && (
                  <p className="p-6 text-slate-500 text-center dark:text-slate-400">
                    No poll responses yet. They appear after visitors submit feedback on an event page.
                  </p>
                )}
              </div>
            </section>
          </div>
        ) : tab === 'users' ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow dark:border-slate-700 dark:bg-slate-900">
            <table className="w-full text-sm text-slate-800 dark:text-slate-200">
              <thead className="bg-slate-100 text-left dark:bg-slate-800/90 dark:text-slate-200">
                <tr>
                  <th className="p-3 font-semibold">Student ID</th>
                  <th className="p-3 font-semibold">Name</th>
                  <th className="p-3 font-semibold">Nickname</th>
                  <th className="p-3 font-semibold">Email</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u._id}
                    className="border-t border-slate-100 dark:border-slate-700/60 dark:hover:bg-slate-800/50"
                  >
                    <td className="p-3">{u.studentId}</td>
                    <td className="p-3">{u.realName}</td>
                    <td className="p-3">{u.nickname}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{u.email}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        disabled={Boolean(actionId)}
                        className="text-blue-600 font-semibold hover:underline disabled:opacity-50 dark:text-blue-400"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u._id)}
                        disabled={Boolean(actionId)}
                        className="text-red-600 font-semibold hover:underline disabled:opacity-50 dark:text-red-400"
                      >
                        {actionId === `u-${u._id}` ? '…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <p className="p-6 text-slate-500 text-center dark:text-slate-400">No registered users.</p>
            )}
          </div>
        ) : tab === 'items' ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow dark:border-slate-700 dark:bg-slate-900">
            <table className="w-full text-sm text-slate-800 dark:text-slate-200">
              <thead className="bg-slate-100 text-left dark:bg-slate-800/90 dark:text-slate-200">
                <tr>
                  <th className="p-3 font-semibold">Title</th>
                  <th className="p-3 font-semibold">Type</th>
                  <th className="p-3 font-semibold">Category</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Author</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr
                    key={it._id}
                    className="border-t border-slate-100 dark:border-slate-700/60 dark:hover:bg-slate-800/50"
                  >
                    <td className="p-3 max-w-xs truncate" title={it.title}>
                      {it.title}
                    </td>
                    <td className="p-3 capitalize">{it.type}</td>
                    <td className="p-3">{it.category}</td>
                    <td className="p-3">{it.status}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{formatAuthor(it.postedBy)}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEditItemImage(it)}
                        disabled={Boolean(actionId)}
                        className="text-indigo-600 font-semibold hover:underline disabled:opacity-50 dark:text-indigo-400"
                      >
                        Edit image
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(it._id)}
                        disabled={Boolean(actionId)}
                        className="text-red-600 font-semibold hover:underline disabled:opacity-50 dark:text-red-400"
                      >
                        {actionId === `i-${it._id}` ? '…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && (
              <p className="p-6 text-slate-500 text-center dark:text-slate-400">No items yet.</p>
            )}
          </div>
        ) : tab === 'contacts' ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow dark:border-slate-700 dark:bg-slate-900">
            <table className="w-full text-sm text-slate-800 dark:text-slate-200">
              <thead className="bg-slate-100 text-left dark:bg-slate-800/90 dark:text-slate-200">
                <tr>
                  <th className="p-3 font-semibold">From</th>
                  <th className="p-3 font-semibold">Email</th>
                  <th className="p-3 font-semibold">Subject</th>
                  <th className="p-3 font-semibold">Message</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Date</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr
                    key={c._id}
                    className="border-t border-slate-100 dark:border-slate-700/60 dark:hover:bg-slate-800/50"
                  >
                    <td className="p-3">{c.name}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{c.email}</td>
                    <td className="p-3 max-w-xs truncate" title={c.subject}>
                      {c.subject}
                    </td>
                    <td className="p-3 max-w-md truncate text-slate-700 dark:text-slate-300" title={c.message}>
                      {c.message}
                    </td>
                    <td className="p-3 capitalize">{c.status}</td>
                    <td className="p-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {new Date(c.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {c.status !== 'resolved' && (
                        <button
                          type="button"
                          onClick={async () => {
                            setActionId(`c-res-${c._id}`);
                            try {
                              const res = await fetch(`${API_BASE}/api/admin/contacts/${c._id}/resolve`, {
                                method: 'PATCH',
                                headers: authHeaders(),
                              });
                              const data = await parseJson(res);
                              if (!res.ok) throw new Error(data.message || 'Failed to resolve');
                              await loadContacts();
                            } catch (e) {
                              setError(e.message);
                            } finally {
                              setActionId('');
                            }
                          }}
                          disabled={Boolean(actionId)}
                          className="text-emerald-700 font-semibold hover:underline disabled:opacity-50 dark:text-emerald-400"
                        >
                          {actionId === `c-res-${c._id}` ? '…' : 'Mark resolved'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm('Delete this message?')) return;
                          setActionId(`c-del-${c._id}`);
                          try {
                            const res = await fetch(`${API_BASE}/api/admin/contacts/${c._id}`, {
                              method: 'DELETE',
                              headers: authHeaders(),
                            });
                            const data = await parseJson(res);
                            if (!res.ok) throw new Error(data.message || 'Failed to delete');
                            await loadContacts();
                          } catch (e) {
                            setError(e.message);
                          } finally {
                            setActionId('');
                          }
                        }}
                        disabled={Boolean(actionId)}
                        className="text-red-600 font-semibold hover:underline disabled:opacity-50 dark:text-red-400"
                      >
                        {actionId === `c-del-${c._id}` ? '…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {contacts.length === 0 && (
              <p className="p-6 text-slate-500 text-center dark:text-slate-400">No messages yet.</p>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            <section className="rounded-xl border border-slate-100 bg-white p-6 shadow dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Create community event</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Post workshops, seminars, campus events, and more. Banner and video uploads require Cloudinary (CLOUDINARY_URL) on the server.
              </p>

              <form onSubmit={handleCreateCommunityEvent} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Event title *</label>
                  <input
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    placeholder='e.g. SLIIT Tech Talk 2026'
                    value={eventForm.title}
                    onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Event description *</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="What is it, who it's for, why join?"
                    value={eventForm.description}
                    onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Start date &amp; time *</label>
                  <input
                    required
                    type="datetime-local"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    value={eventForm.startDateTime}
                    onChange={(e) => setEventForm((f) => ({ ...f, startDateTime: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">End date &amp; time</label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    value={eventForm.endDateTime}
                    onChange={(e) => setEventForm((f) => ({ ...f, endDateTime: e.target.value }))}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Location / venue *</label>
                  <input
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="Building, room, or online meeting link"
                    value={eventForm.location}
                    onChange={(e) => setEventForm((f) => ({ ...f, location: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Organizer / host *</label>
                  <input
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="Club, department, or person"
                    value={eventForm.organizer}
                    onChange={(e) => setEventForm((f) => ({ ...f, organizer: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Event type / category *</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    value={eventForm.category}
                    onChange={(e) => setEventForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    {EVENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Banner / poster image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full text-xs"
                    onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                  />
                  {bannerFile && <p className="text-xs text-slate-500 mt-1">{bannerFile.name}</p>}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Video clip (optional)</label>
                  <input
                    type="file"
                    accept="video/*"
                    className="w-full text-xs"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  />
                  {videoFile && <p className="text-xs text-slate-500 mt-1">{videoFile.name}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Video URL (optional)</label>
                  <input
                    type="url"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="YouTube, Vimeo, or direct link if not uploading a file above"
                    value={eventForm.videoUrl}
                    onChange={(e) => setEventForm((f) => ({ ...f, videoUrl: e.target.value }))}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Contact info (optional)</label>
                  <textarea
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="Email, phone, social media for inquiries"
                    value={eventForm.contactInfo}
                    onChange={(e) => setEventForm((f) => ({ ...f, contactInfo: e.target.value }))}
                  />
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={eventSubmitting}
                    className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {eventSubmitting ? 'Publishing…' : 'Publish event'}
                  </button>
                </div>
              </form>
            </section>

            <section className="space-y-8">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">Upcoming events</h2>
                <p className="text-sm text-slate-500 mb-3 dark:text-slate-400">
                  Shown first on the public hub. Use Mark finished (or Edit → checkbox) to move to Finished.
                </p>
                <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow dark:border-slate-700 dark:bg-slate-900">
                  <table className="w-full text-sm text-slate-800 dark:text-slate-200">
                    <thead className="bg-slate-100 text-left dark:bg-slate-800/90 dark:text-slate-200">
                      <tr>
                        <th className="p-3 font-semibold">Title</th>
                        <th className="p-3 font-semibold">Category</th>
                        <th className="p-3 font-semibold">Starts</th>
                        <th className="p-3 font-semibold">Venue</th>
                        <th className="p-3 font-semibold">Organizer</th>
                        <th className="p-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {communityEventsUpcoming.map((ev) => (
                        <tr
                          key={ev._id}
                          className="border-t border-slate-100 dark:border-slate-700/60 dark:hover:bg-slate-800/50"
                        >
                          <td className="p-3 max-w-xs font-medium">{ev.title}</td>
                          <td className="p-3">{ev.category}</td>
                          <td className="p-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                            {formatEventWhen(ev.startDateTime)}
                          </td>
                          <td className="p-3 max-w-[140px] truncate" title={ev.location}>
                            {ev.location}
                          </td>
                          <td className="p-3">{ev.organizer}</td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => handleMarkCommunityEventFinished(ev._id)}
                              disabled={Boolean(actionId)}
                              className="text-emerald-700 font-semibold hover:underline disabled:opacity-50 dark:text-emerald-400"
                            >
                              {actionId === `ce-fin-${ev._id}` ? '…' : 'Mark finished'}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditCommunityEvent(ev)}
                              disabled={Boolean(actionId)}
                              className="text-blue-600 font-semibold hover:underline disabled:opacity-50 dark:text-blue-400"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCommunityEvent(ev._id)}
                              disabled={Boolean(actionId)}
                              className="text-red-600 font-semibold hover:underline disabled:opacity-50 dark:text-red-400"
                            >
                              {actionId === `ce-${ev._id}` ? '…' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {communityEventsUpcoming.length === 0 && (
                    <p className="p-6 text-slate-500 text-center dark:text-slate-400">No upcoming events.</p>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">Finished events</h2>
                <p className="text-sm text-slate-500 mb-3 dark:text-slate-400">
                  Past start dates (before today, UTC) or manually marked finished.
                </p>
                <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow dark:border-slate-700 dark:bg-slate-900">
                  <table className="w-full text-sm text-slate-800 dark:text-slate-200">
                    <thead className="bg-slate-100 text-left dark:bg-slate-800/90 dark:text-slate-200">
                      <tr>
                        <th className="p-3 font-semibold">Title</th>
                        <th className="p-3 font-semibold">Category</th>
                        <th className="p-3 font-semibold">Started</th>
                        <th className="p-3 font-semibold">Status</th>
                        <th className="p-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {communityEventsFinished.map((ev) => (
                        <tr
                          key={ev._id}
                          className="border-t border-slate-100 opacity-90 dark:border-slate-700/60 dark:hover:bg-slate-800/50"
                        >
                          <td className="p-3 max-w-xs font-medium">{ev.title}</td>
                          <td className="p-3">{ev.category}</td>
                          <td className="p-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                            {formatEventWhen(ev.startDateTime)}
                          </td>
                          <td className="p-3 text-xs text-slate-600 dark:text-slate-400">
                            {ev.finishedByManual ? 'Manual' : 'Past date'}
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => openEditCommunityEvent(ev)}
                              disabled={Boolean(actionId)}
                              className="text-blue-600 font-semibold hover:underline disabled:opacity-50 dark:text-blue-400"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCommunityEvent(ev._id)}
                              disabled={Boolean(actionId)}
                              className="text-red-600 font-semibold hover:underline disabled:opacity-50 dark:text-red-400"
                            >
                              {actionId === `ce-${ev._id}` ? '…' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {communityEventsFinished.length === 0 && (
                    <p className="p-6 text-slate-500 text-center dark:text-slate-400">No finished events yet.</p>
                  )}
                </div>
              </div>
            </section>
          </div>
            )}
          </div>
        </main>
      </div>

      {editCommunityEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveEditCommunityEvent}
            className="my-8 w-full max-w-2xl space-y-4 rounded-2xl bg-white p-6 text-sm shadow-xl dark:bg-slate-900"
          >
            <h3 className="text-lg font-bold text-slate-800">Edit community event</h3>
            <p className="text-slate-500 text-xs -mt-2">
              Leave file fields empty to keep the current banner or video. Uploading a new file replaces it.
            </p>

            {(editCommunityEvent.imageUrl || editCommunityEvent.videoUrl) && (
              <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                {editCommunityEvent.imageUrl && (
                  <span>
                    Current banner:{' '}
                    <a
                      href={editCommunityEvent.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      view
                    </a>
                  </span>
                )}
                {editCommunityEvent.videoUrl && (
                  <span>
                    Current video:{' '}
                    <a
                      href={editCommunityEvent.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      open
                    </a>
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Event title *</label>
                <input
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  value={editEventForm.title}
                  onChange={(e) => setEditEventForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Event description *</label>
                <textarea
                  required
                  rows={4}
                  className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  value={editEventForm.description}
                  onChange={(e) => setEditEventForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Start date &amp; time *</label>
                <input
                  required
                  type="datetime-local"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  value={editEventForm.startDateTime}
                  onChange={(e) => setEditEventForm((f) => ({ ...f, startDateTime: e.target.value }))}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">End date &amp; time</label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  value={editEventForm.endDateTime}
                  onChange={(e) => setEditEventForm((f) => ({ ...f, endDateTime: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Location / venue *</label>
                <input
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  value={editEventForm.location}
                  onChange={(e) => setEditEventForm((f) => ({ ...f, location: e.target.value }))}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Organizer / host *</label>
                <input
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  value={editEventForm.organizer}
                  onChange={(e) => setEditEventForm((f) => ({ ...f, organizer: e.target.value }))}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Event type / category *</label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  value={editEventForm.category}
                  onChange={(e) => setEditEventForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {EVENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  {!EVENT_CATEGORIES.includes(editEventForm.category) && editEventForm.category && (
                    <option value={editEventForm.category}>{editEventForm.category}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Replace banner</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-xs"
                  onChange={(e) => setEditBannerFile(e.target.files?.[0] || null)}
                />
                {editBannerFile && (
                  <p className="text-xs text-slate-500 mt-1">{editBannerFile.name}</p>
                )}
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Replace video file</label>
                <input
                  type="file"
                  accept="video/*"
                  className="w-full text-xs"
                  onChange={(e) => setEditVideoFile(e.target.files?.[0] || null)}
                />
                {editVideoFile && (
                  <p className="text-xs text-slate-500 mt-1">{editVideoFile.name}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Video URL</label>
                <input
                  type="url"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="YouTube or direct link (replaces uploaded video if changed)"
                  value={editEventForm.videoUrl}
                  onChange={(e) => setEditEventForm((f) => ({ ...f, videoUrl: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Contact info</label>
                <textarea
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  value={editEventForm.contactInfo}
                  onChange={(e) => setEditEventForm((f) => ({ ...f, contactInfo: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2 flex items-start gap-2">
                <input
                  id="edit-manually-finished"
                  type="checkbox"
                  className="mt-1 rounded border-slate-300"
                  checked={Boolean(editEventForm.manuallyFinished)}
                  onChange={(e) =>
                    setEditEventForm((f) => ({ ...f, manuallyFinished: e.target.checked }))
                  }
                />
                <label htmlFor="edit-manually-finished" className="text-sm text-slate-700 leading-snug">
                  Manually marked as finished (lists under Finished events; can be cleared by unchecking)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeEditCommunityEvent}
                disabled={editEventSubmitting}
                className="px-4 py-2 rounded-lg border border-slate-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editEventSubmitting || Boolean(actionId)}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold disabled:opacity-50"
              >
                {editEventSubmitting ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {pollDetailOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-6xl rounded-2xl bg-white p-6 text-sm shadow-xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Poll breakdown</h3>
                {pollDetail?.event && (
                  <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">{pollDetail.event.title}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {!pollDetailLoading && pollDetail?.stats && (
                  <button
                    type="button"
                    onClick={() => downloadPollReportPdf(pollDetail)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                  >
                    Download PDF report
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPollDetailOpen(false);
                    setPollDetail(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200"
                >
                  Close
                </button>
              </div>
            </div>

            {pollDetailLoading && <p className="text-slate-500 py-8">Loading…</p>}

            {!pollDetailLoading && pollDetail && pollDetail.stats && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 border border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Responses</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{pollDetail.stats.total}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 border border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Avg rating</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                      {pollDetail.stats.ratingAverage != null ? `${pollDetail.stats.ratingAverage} / 5` : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 border border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Attended (yes)</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{pollDetail.stats.attendedYes}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 border border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Attended (no)</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{pollDetail.stats.attendedNo}</p>
                  </div>
                </div>
                {(pollDetail.stats.attendedSkipped ?? 0) > 0 && (
                  <p className="text-xs text-slate-500 mt-1 mb-4">
                    Attendance not answered: {pollDetail.stats.attendedSkipped}
                  </p>
                )}

                <PollChartsGrid stats={pollDetail.stats} />

                <div className="grid md:grid-cols-3 gap-4 mb-6 text-xs">
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Star ratings</p>
                    <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <li key={n}>
                          {n}★: {pollDetail.stats.ratingDistribution?.[n] ?? 0}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">How was the event?</p>
                    <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                      {['Good', 'Average', 'Bad'].map((k) => (
                        <li key={k}>
                          {k}: {pollDetail.stats.experience?.[k] ?? 0}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Best part</p>
                    <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                      {['Activities', 'Speaker', 'Food', 'Organization'].map((k) => (
                        <li key={k}>
                          {k}: {pollDetail.stats.bestPart?.[k] ?? 0}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Individual responses</h4>
                <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-700">
                  <table className="w-full text-xs text-slate-800 dark:text-slate-200">
                    <thead className="bg-slate-100 text-left dark:bg-slate-800/90 dark:text-slate-200">
                      <tr>
                        <th className="p-2 font-semibold">When</th>
                        <th className="p-2 font-semibold">Attended</th>
                        <th className="p-2 font-semibold">Rating</th>
                        <th className="p-2 font-semibold">Experience</th>
                        <th className="p-2 font-semibold">Best part</th>
                        <th className="p-2 font-semibold">Suggestion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(pollDetail.responses || []).map((r) => (
                        <tr
                          key={r._id}
                          className="border-t border-slate-100 dark:border-slate-700/60 dark:hover:bg-slate-800/30"
                        >
                          <td className="p-2 whitespace-nowrap text-slate-600 dark:text-slate-400">
                            {new Date(r.createdAt).toLocaleString()}
                          </td>
                          <td className="p-2">
                            {typeof r.attended === 'boolean' ? (r.attended ? 'Yes' : 'No') : '—'}
                          </td>
                          <td className="p-2">{r.rating != null ? r.rating : '—'}</td>
                          <td className="p-2">{r.experience ?? '—'}</td>
                          <td className="p-2">{r.bestPart ?? '—'}</td>
                          <td className="p-2 max-w-[200px] break-words">{r.suggestion || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {editItemImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={saveItemImage}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
          >
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Update item image</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2" title={editItemImage.title}>
              {editItemImage.title}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Replaces the photo on Cloudinary and refreshes AI tags. Server must have CLOUDINARY_URL and GEMINI configured like normal posts.
            </p>
            {editItemImage.image && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Current image</p>
                <img
                  src={editItemImage.image}
                  alt=""
                  className="max-h-40 w-full rounded-lg border border-slate-200 object-contain dark:border-slate-600"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">New image *</label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-sm"
                onChange={(e) => setItemImageFile(e.target.files?.[0] || null)}
              />
              {itemImageFile && (
                <p className="text-xs text-slate-500 mt-1">{itemImageFile.name}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditItemImage(null);
                  setItemImageFile(null);
                }}
                disabled={itemImageSubmitting}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 dark:border-slate-600 dark:text-slate-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={itemImageSubmitting || Boolean(actionId)}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold disabled:opacity-50"
              >
                {itemImageSubmitting ? 'Uploading…' : 'Save image'}
              </button>
            </div>
          </form>
        </div>
      )}

      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={saveEdit}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
          >
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Edit user</h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Full name</label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                value={editForm.realName}
                onChange={(e) => setEditForm((f) => ({ ...f, realName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Nickname</label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                value={editForm.nickname}
                onChange={(e) => setEditForm((f) => ({ ...f, nickname: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Student ID</label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                value={editForm.studentId}
                onChange={(e) => setEditForm((f) => ({ ...f, studentId: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 dark:border-slate-600 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={Boolean(actionId)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="shrink-0 border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
        <SiteFooter />
      </div>
    </div>
  );
};

export default AdminDashboard;
