import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const createInitialReportForm = () => ({
  title: '',
  description: '',
  type: 'lost',
  category: '',
  location: '',
  imageFile: null,
});

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
  const itemsSectionRef = useRef(null);

  const [showLogin, setShowLogin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [pendingProtectedAction, setPendingProtectedAction] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
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

    try {
      setReportLoading(true);
      const token = localStorage.getItem('resqToken');
      const payload = {
        title: reportForm.title.trim(),
        description: reportForm.description.trim(),
        type: reportForm.type,
        category: reportForm.category.trim(),
        location: reportForm.location.trim(),
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

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center px-8 sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-blue-600 p-2 rounded-lg text-white font-bold text-sm">ResQ</div>
          <span className="text-xl font-bold text-gray-800 tracking-tight text-center">Portal</span>
        </div>
        <div className="flex items-center gap-6">
          <button
            className="text-gray-600 font-medium hover:text-blue-600 transition"
            onClick={() => navigate('/community-hub')}
          >
            Community Hub
          </button>
          <button
            className="text-gray-600 font-medium hover:text-blue-600 transition"
            onClick={() => navigate('/contact')}
          >
            Contact Us
          </button>
          {currentUser ? (
            <button
              onClick={() => setShowProfile(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition shadow-md shadow-blue-200"
            >
              My Profile
            </button>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition shadow-md shadow-blue-200"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      <div
        className="relative bg-blue-900 text-white py-20 px-8 text-center bg-cover bg-center"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,30,0.7), rgba(0,0,30,0.7)), url("https://images.unsplash.com/photo-1523050853023-8c2d29149f0b?auto=format&fit=crop&q=80")',
        }}
      >
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            Lost Something? <span className="text-yellow-400">We&apos;ll Help.</span>
          </h1>
          <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
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

      <div className="max-w-6xl mx-auto -mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 px-4 relative z-20">
        {[
          { label: 'Items Reported', value: items.length, color: 'text-blue-600' },
          { label: 'Active List', value: activeItems.length, color: 'text-amber-600' },
          { label: 'Returned List', value: returnedItems.length, color: 'text-green-600' },
          { label: 'Found Posts', value: foundItemsCount, color: 'text-purple-600' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow border border-gray-100 flex flex-col items-center text-center"
          >
            <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div ref={itemsSectionRef} className="max-w-6xl mx-auto py-20 px-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Lost &amp; Found Board</h2>
            <p className="text-gray-500">
              Active items stay visible until the author marks them as returned. Returned posts can then be deleted by the same author.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex gap-2">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                activeTab === 'active' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Active List
            </button>
            <button
              onClick={() => setActiveTab('returned')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                activeTab === 'returned' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
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
          <div className="bg-white rounded-3xl border border-gray-100 shadow-md p-8 text-center text-gray-500">
            Loading items...
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm p-12 text-center">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  className="bg-white rounded-3xl shadow-md overflow-hidden border border-gray-100 hover:shadow-2xl transition-all group duration-300 cursor-pointer"
                >
                  <div className="relative h-56 bg-gray-100 overflow-hidden">
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
                        <span>Date</span>
                        <span className="font-semibold text-gray-700 text-right">{formatItemDate(item.createdAt || item.date)}</span>
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
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-2xl relative animate-in fade-in zoom-in duration-300 my-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
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
                    className="w-full p-4 border border-gray-100 bg-gray-50 rounded-xl outline-none focus:border-blue-600 transition-all"
                  >
                    <option value="lost">Lost item</option>
                    <option value="found">Found item</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={reportForm.category}
                    onChange={handleReportFormChange}
                    placeholder="Wallet, ID card, laptop..."
                    className="w-full p-4 border border-gray-100 bg-gray-50 rounded-xl outline-none focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Item name</label>
                <input
                  type="text"
                  name="title"
                  value={reportForm.title}
                  onChange={handleReportFormChange}
                  placeholder="Black backpack"
                  className="w-full p-4 border border-gray-100 bg-gray-50 rounded-xl outline-none focus:border-blue-600 transition-all"
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
                  className="w-full p-4 border border-gray-100 bg-gray-50 rounded-xl outline-none focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  rows="4"
                  value={reportForm.description}
                  onChange={handleReportFormChange}
                  placeholder="Add identifying details that help other students recognize the item."
                  className="w-full p-4 border border-gray-100 bg-gray-50 rounded-xl outline-none focus:border-blue-600 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Image</label>
                <input
                  type="file"
                  name="imageFile"
                  accept="image/*"
                  onChange={handleReportFormChange}
                  className="w-full p-4 border border-gray-100 bg-gray-50 rounded-xl outline-none focus:border-blue-600 transition-all"
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
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in duration-300">
            <button onClick={() => setShowLogin(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl">
              x
            </button>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login to ResQ</h2>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <input
                type="email"
                name="email"
                value={loginData.email}
                onChange={handleLoginInputChange}
                placeholder="Student Email"
                className="w-full p-4 border border-gray-100 bg-gray-50 rounded-xl outline-none focus:border-blue-600 transition-all"
              />
              <input
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginInputChange}
                placeholder="Password"
                className="w-full p-4 border border-gray-100 bg-gray-50 rounded-xl outline-none focus:border-blue-600 transition-all"
              />
              {loginError && <p className="text-sm text-red-600 font-medium">{loginError}</p>}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-70"
              >
                {loginLoading ? 'Signing In...' : 'Sign In'}
              </button>
              <p className="text-center text-sm text-gray-500 mt-4">
                Don&apos;t have an account?{' '}
                <span onClick={() => navigate('/onboarding')} className="text-blue-600 font-bold cursor-pointer hover:underline">
                  Register with AI
                </span>
              </p>
            </form>
          </div>
        </div>
      )}

      {pendingDeleteItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 relative">
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
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-xl relative animate-in fade-in zoom-in duration-300">
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

      <footer className="text-center py-12 text-gray-400 text-xs font-medium border-t bg-white mt-12">
        Copyright 2026 ResQ Portal | SLIIT Campus. Built for students, by students.
      </footer>
    </div>
  );
};

export default Dashboard;
