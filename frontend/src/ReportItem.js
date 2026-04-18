import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from './config';
import { ITEM_CATEGORY_GROUPS } from './itemCategories';
import MatchSuccessModal from './MatchSuccessModal';
import SiteFooter from './SiteFooter';

const todayIsoDateLocal = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

const initialFormState = {
  title: '',
  description: '',
  type: 'lost',
  category: '',
  location: '',
  incidentDate: '',
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read the selected image.'));
    reader.readAsDataURL(file);
  });

const ReportItem = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormState);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 🆕 Match Modal State
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchData, setMatchData] = useState(null);

  const currentUser = (() => {
    try {
      const raw = localStorage.getItem('resqUser');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  })();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
  };

  // 🆕 Handle View Details
  const handleViewDetails = (itemId) => {
    setShowMatchModal(false);
    navigate(`/items/${itemId}`);
  };

  // 🆕 Handle Start Chat
  const handleStartChat = async (itemId, matchedUserId) => {
    setShowMatchModal(false);
    
    try {
      const token = localStorage.getItem('resqToken');
      const response = await fetch(`${API_BASE}/api/chat/room`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itemId, matchedUserId })
      });
      const data = await response.json();
      if (data.success) {
        navigate(`/chat/${data.chatRoom._id}`);
      } else {
        console.error('Failed to create chat room');
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('resqToken');
    if (!token || !currentUser?.id) {
      setError('Please sign in from the dashboard first to submit a report.');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim() || !formData.category || !formData.location.trim()) {
      setError('Please fill in title, description, category, and location.');
      return;
    }

    if (!formData.incidentDate) {
      setError(formData.type === 'found' ? 'Please select the date the item was found.' : 'Please select the date the item was lost.');
      return;
    }

    if (formData.incidentDate > todayIsoDateLocal()) {
      setError('Date must be today or in the past, not in the future.');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      type: formData.type,
      category: formData.category,
      location: formData.location.trim(),
      eventDate: formData.incidentDate,
    };

    try {
      if (imageFile) {
        payload.imageData = await readFileAsDataUrl(imageFile);
      }
    } catch (fileErr) {
      setError(fileErr.message || 'Could not read the image file.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.message || 'Failed to submit report.');
        return;
      }

      setSuccess(data?.message || 'Report submitted successfully.');
      
      // 🆕 Check for matches and show modal
      if (data.matchFound && data.matches && data.matches.length > 0) {
        setMatchData({
          yourItem: data.item,
          matches: data.matches,
          message: data.message
        });
        setShowMatchModal(true);
      } else {
        // No matches, just show success and redirect
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
      
      setFormData(initialFormState);
      setImageFile(null);
      
    } catch (submitError) {
      setError('Cannot reach the server. Check that the backend is running and REACT_APP_API_URL if set.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex min-h-screen flex-col bg-gray-50 font-sans text-gray-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto w-full max-w-2xl flex-1 p-4 sm:p-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-4 text-blue-700 font-semibold hover:underline"
          >
            ← Back to Dashboard
          </button>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-900 sm:p-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Report a Lost or Found Item</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="lost">Lost item</option>
                    <option value="found">Found item</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {formData.type === 'found' ? 'Date found' : 'Date lost'}
                </label>
                <input
                  type="date"
                  name="incidentDate"
                  value={formData.incidentDate}
                  max={todayIsoDateLocal()}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Item name</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Black backpack"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Main hall, library, Lab 01..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Identifying details: color, brand, marks, when and where last seen, etc."
                  rows={6}
                  className="min-h-[140px] w-full resize-y rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
                {imageFile && <p className="text-xs text-gray-500 mt-1">Selected: {imageFile.name}</p>}
              </div>

              {error && <p className="text-sm font-medium text-red-600">{error}</p>}
              {success && <p className="text-sm font-medium text-green-600">{success}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-70"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>
        <SiteFooter />
      </div>

      {/* 🆕 Match Success Modal */}
      {showMatchModal && matchData && (
        <MatchSuccessModal
          matchData={matchData}
          onClose={() => {
            setShowMatchModal(false);
            navigate('/dashboard');
          }}
          onViewDetails={handleViewDetails}
          onStartChat={handleStartChat}
        />
      )}
    </>
  );
};

export default ReportItem;