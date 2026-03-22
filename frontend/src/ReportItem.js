import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const initialFormState = {
  title: '',
  description: '',
  type: 'lost',
  category: '',
  location: '',
  date: '',
  image: '',
};

const ReportItem = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormState);
  const [selectedFileName, setSelectedFileName] = useState('No file chosen');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFileName('No file chosen');
      setFormData((prev) => ({ ...prev, image: '' }));
      return;
    }

    setSelectedFileName(file.name);
    // Backend currently expects image as a string (URL/filename).
    setFormData((prev) => ({ ...prev, image: file.name }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentUser?.id) {
      setError('Please sign in first to submit a report.');
      return;
    }

    if (!formData.title || !formData.description || !formData.category || !formData.location || !formData.date) {
      setError('Please fill all required fields.');
      return;
    }

    const payload = {
      ...formData,
      postedBy: currentUser.id,
    };

    try {
      setLoading(true);
      let response;

      try {
        response = await fetch('/api/items/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (primaryError) {
        response = await fetch('http://localhost:5000/api/items/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || data?.message || 'Failed to submit report.');
        return;
      }

      setSuccess(data?.message || 'Report submitted successfully.');
      setFormData(initialFormState);
      setSelectedFileName('No file chosen');
      navigate('/dashboard');
    } catch (submitError) {
      setError('Cannot reach backend server. Please make sure backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-4 text-blue-700 font-semibold hover:underline"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Report an Item</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Item name</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Item name"
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-blue-600 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Description"
                rows={4}
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-blue-600 outline-none resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
              <input
                type="text"
                value="Lost"
                disabled
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Category"
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-blue-600 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Location"
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-blue-600 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-blue-600 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Attachment (optional)</label>
              <div className="flex items-center gap-3">
                <label className="bg-gray-100 px-4 py-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-200 transition">
                  Choose File
                  <input type="file" className="hidden" onChange={handleFileChange} />
                </label>
                <span className="text-sm text-gray-500">{selectedFileName}</span>
              </div>
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
    </div>
  );
};

export default ReportItem;
