import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, authHeaders } from './config';

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

  const refresh = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      await Promise.all([loadUsers(), loadItems(), loadCommunityEvents(), loadContacts()]);
    } catch (e) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [loadUsers, loadItems, loadCommunityEvents, loadContacts]);

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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="bg-slate-900 text-white px-4 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm">User &amp; community content management</p>
        </div>
        <div className="flex gap-2">
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setTab('users')}
            className={`px-4 py-2 font-semibold border-b-2 -mb-px ${
              tab === 'users' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'
            }`}
          >
            User management
          </button>
          <button
            type="button"
            onClick={() => setTab('items')}
            className={`px-4 py-2 font-semibold border-b-2 -mb-px ${
              tab === 'items' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'
            }`}
          >
            Lost &amp; found
          </button>
          <button
            type="button"
            onClick={() => setTab('community')}
            className={`px-4 py-2 font-semibold border-b-2 -mb-px ${
              tab === 'community' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'
            }`}
          >
            Community Hub
          </button>
          <button
            type="button"
            onClick={() => setTab('contacts')}
            className={`px-4 py-2 font-semibold border-b-2 -mb-px ${
              tab === 'contacts' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'
            }`}
          >
            Contact Us
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-800 text-sm font-medium">{error}</div>
        )}

        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : tab === 'users' ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow dark:border-slate-700 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left">
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
                  <tr key={u._id} className="border-t border-slate-100">
                    <td className="p-3">{u.studentId}</td>
                    <td className="p-3">{u.realName}</td>
                    <td className="p-3">{u.nickname}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        disabled={Boolean(actionId)}
                        className="text-blue-600 font-semibold hover:underline disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u._id)}
                        disabled={Boolean(actionId)}
                        className="text-red-600 font-semibold hover:underline disabled:opacity-50"
                      >
                        {actionId === `u-${u._id}` ? '…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <p className="p-6 text-slate-500 text-center">No registered users.</p>}
          </div>
        ) : tab === 'items' ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow dark:border-slate-700 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left">
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
                  <tr key={it._id} className="border-t border-slate-100">
                    <td className="p-3 max-w-xs truncate" title={it.title}>
                      {it.title}
                    </td>
                    <td className="p-3 capitalize">{it.type}</td>
                    <td className="p-3">{it.category}</td>
                    <td className="p-3">{it.status}</td>
                    <td className="p-3">{formatAuthor(it.postedBy)}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(it._id)}
                        disabled={Boolean(actionId)}
                        className="text-red-600 font-semibold hover:underline disabled:opacity-50"
                      >
                        {actionId === `i-${it._id}` ? '…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && <p className="p-6 text-slate-500 text-center">No items yet.</p>}
          </div>
        ) : tab === 'contacts' ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow dark:border-slate-700 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left">
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
                  <tr key={c._id} className="border-t border-slate-100">
                    <td className="p-3">{c.name}</td>
                    <td className="p-3">{c.email}</td>
                    <td className="p-3 max-w-xs truncate" title={c.subject}>{c.subject}</td>
                    <td className="p-3 max-w-md truncate" title={c.message}>{c.message}</td>
                    <td className="p-3 capitalize">{c.status}</td>
                    <td className="p-3 whitespace-nowrap">{new Date(c.createdAt).toLocaleString()}</td>
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
                          className="text-emerald-700 font-semibold hover:underline disabled:opacity-50"
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
                        className="text-red-600 font-semibold hover:underline disabled:opacity-50"
                      >
                        {actionId === `c-del-${c._id}` ? '…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {contacts.length === 0 && <p className="p-6 text-slate-500 text-center">No messages yet.</p>}
          </div>
        ) : (
          <div className="space-y-10">
            <section className="rounded-xl border border-slate-100 bg-white p-6 shadow dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-lg font-bold text-slate-800 mb-1">Create community event</h2>
              <p className="text-sm text-slate-500 mb-6">
                Post workshops, seminars, campus events, and more. Banner and video uploads require Cloudinary (CLOUDINARY_URL) on the server.
              </p>

              <form onSubmit={handleCreateCommunityEvent} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Event title *</label>
                  <input
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    placeholder='e.g. SLIIT Tech Talk 2026'
                    value={eventForm.title}
                    onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Event description *</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 resize-y"
                    placeholder="What is it, who it's for, why join?"
                    value={eventForm.description}
                    onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start date &amp; time *</label>
                  <input
                    required
                    type="datetime-local"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    value={eventForm.startDateTime}
                    onChange={(e) => setEventForm((f) => ({ ...f, startDateTime: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End date &amp; time</label>
                  <input
                    type="datetime-local"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    value={eventForm.endDateTime}
                    onChange={(e) => setEventForm((f) => ({ ...f, endDateTime: e.target.value }))}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Location / venue *</label>
                  <input
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    placeholder="Building, room, or online meeting link"
                    value={eventForm.location}
                    onChange={(e) => setEventForm((f) => ({ ...f, location: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Organizer / host *</label>
                  <input
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    placeholder="Club, department, or person"
                    value={eventForm.organizer}
                    onChange={(e) => setEventForm((f) => ({ ...f, organizer: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Event type / category *</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Banner / poster image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full text-xs"
                    onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                  />
                  {bannerFile && <p className="text-xs text-slate-500 mt-1">{bannerFile.name}</p>}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Video clip (optional)</label>
                  <input
                    type="file"
                    accept="video/*"
                    className="w-full text-xs"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  />
                  {videoFile && <p className="text-xs text-slate-500 mt-1">{videoFile.name}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Video URL (optional)</label>
                  <input
                    type="url"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    placeholder="YouTube, Vimeo, or direct link if not uploading a file above"
                    value={eventForm.videoUrl}
                    onChange={(e) => setEventForm((f) => ({ ...f, videoUrl: e.target.value }))}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Contact info (optional)</label>
                  <textarea
                    rows={2}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
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
                <h2 className="text-lg font-bold text-slate-800 mb-3">Upcoming events</h2>
                <p className="text-sm text-slate-500 mb-3">
                  Shown first on the public hub. Use Mark finished (or Edit → checkbox) to move to Finished.
                </p>
                <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow dark:border-slate-700 dark:bg-slate-900">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-left">
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
                        <tr key={ev._id} className="border-t border-slate-100">
                          <td className="p-3 max-w-xs font-medium">{ev.title}</td>
                          <td className="p-3">{ev.category}</td>
                          <td className="p-3 whitespace-nowrap">{formatEventWhen(ev.startDateTime)}</td>
                          <td className="p-3 max-w-[140px] truncate" title={ev.location}>
                            {ev.location}
                          </td>
                          <td className="p-3">{ev.organizer}</td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => handleMarkCommunityEventFinished(ev._id)}
                              disabled={Boolean(actionId)}
                              className="text-emerald-700 font-semibold hover:underline disabled:opacity-50"
                            >
                              {actionId === `ce-fin-${ev._id}` ? '…' : 'Mark finished'}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditCommunityEvent(ev)}
                              disabled={Boolean(actionId)}
                              className="text-blue-600 font-semibold hover:underline disabled:opacity-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCommunityEvent(ev._id)}
                              disabled={Boolean(actionId)}
                              className="text-red-600 font-semibold hover:underline disabled:opacity-50"
                            >
                              {actionId === `ce-${ev._id}` ? '…' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {communityEventsUpcoming.length === 0 && (
                    <p className="p-6 text-slate-500 text-center">No upcoming events.</p>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-3">Finished events</h2>
                <p className="text-sm text-slate-500 mb-3">
                  Past start dates (before today, UTC) or manually marked finished.
                </p>
                <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow dark:border-slate-700 dark:bg-slate-900">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-left">
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
                        <tr key={ev._id} className="border-t border-slate-100 opacity-90">
                          <td className="p-3 max-w-xs font-medium">{ev.title}</td>
                          <td className="p-3">{ev.category}</td>
                          <td className="p-3 whitespace-nowrap">{formatEventWhen(ev.startDateTime)}</td>
                          <td className="p-3 text-xs text-slate-600">
                            {ev.finishedByManual ? 'Manual' : 'Past date'}
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => openEditCommunityEvent(ev)}
                              disabled={Boolean(actionId)}
                              className="text-blue-600 font-semibold hover:underline disabled:opacity-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCommunityEvent(ev._id)}
                              disabled={Boolean(actionId)}
                              className="text-red-600 font-semibold hover:underline disabled:opacity-50"
                            >
                              {actionId === `ce-${ev._id}` ? '…' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {communityEventsFinished.length === 0 && (
                    <p className="p-6 text-slate-500 text-center">No finished events yet.</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
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
                <label className="block font-semibold text-slate-700 mb-1">Event title *</label>
                <input
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  value={editEventForm.title}
                  onChange={(e) => setEditEventForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Event description *</label>
                <textarea
                  required
                  rows={4}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 resize-y"
                  value={editEventForm.description}
                  onChange={(e) => setEditEventForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Start date &amp; time *</label>
                <input
                  required
                  type="datetime-local"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  value={editEventForm.startDateTime}
                  onChange={(e) => setEditEventForm((f) => ({ ...f, startDateTime: e.target.value }))}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">End date &amp; time</label>
                <input
                  type="datetime-local"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  value={editEventForm.endDateTime}
                  onChange={(e) => setEditEventForm((f) => ({ ...f, endDateTime: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Location / venue *</label>
                <input
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  value={editEventForm.location}
                  onChange={(e) => setEditEventForm((f) => ({ ...f, location: e.target.value }))}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Organizer / host *</label>
                <input
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  value={editEventForm.organizer}
                  onChange={(e) => setEditEventForm((f) => ({ ...f, organizer: e.target.value }))}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Event type / category *</label>
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
                <label className="block font-semibold text-slate-700 mb-1">Replace banner</label>
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
                <label className="block font-semibold text-slate-700 mb-1">Replace video file</label>
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
                <label className="block font-semibold text-slate-700 mb-1">Video URL</label>
                <input
                  type="url"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  placeholder="YouTube or direct link (replaces uploaded video if changed)"
                  value={editEventForm.videoUrl}
                  onChange={(e) => setEditEventForm((f) => ({ ...f, videoUrl: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Contact info</label>
                <textarea
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
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

      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={saveEdit}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
          >
            <h3 className="text-lg font-bold text-slate-800">Edit user</h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Full name</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={editForm.realName}
                onChange={(e) => setEditForm((f) => ({ ...f, realName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Nickname</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={editForm.nickname}
                onChange={(e) => setEditForm((f) => ({ ...f, nickname: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Student ID</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={editForm.studentId}
                onChange={(e) => setEditForm((f) => ({ ...f, studentId: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="px-4 py-2 rounded-lg border border-slate-200"
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
    </div>
  );
};

export default AdminDashboard;
