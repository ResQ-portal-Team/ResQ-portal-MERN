import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    location: '',
    description: '',
    type: 'lost',
    imageFile: null
  });

  const loadItems = async (searchTerm = '') => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/items', {
        params: {
          search: searchTerm || undefined
        }
      });
      setItems(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load Lost & Found posts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadItems(search);
    }, search ? 350 : 0);

    return () => clearTimeout(timer);
  }, [search]);

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleInputChange = (event) => {
    const { name, value, files } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: files ? files[0] : value
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      category: '',
      location: '',
      description: '',
      type: 'lost',
      imageFile: null
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setAlert('');
    setError('');

    try {
      const imageData = formData.imageFile
        ? await readFileAsDataUrl(formData.imageFile)
        : '';

      const response = await axios.post('/api/items/add', {
        title: formData.title,
        category: formData.category,
        location: formData.location,
        description: formData.description,
        type: formData.type,
        imageData
      });

      setAlert(
        response.data.matchFound
          ? `Post created. Potential match found for ${response.data.matchedItem.title}.`
          : 'Post created and added to the Active List.'
      );
      resetForm();
      event.target.reset();
      await loadItems(search);
      setShowReportModal(false);
      setShowItemsModal(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to create the Lost & Found post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkReturned = async (itemId) => {
    try {
      await axios.patch(`/api/items/${itemId}/return`);
      setAlert('Post status updated from Active to Returned.');
      await loadItems(search);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to update the item status.');
    }
  };

  const openReportModal = () => {
    setAlert('');
    setError('');
    setShowReportModal(true);
  };

  const openItemsModal = () => {
    setAlert('');
    setError('');
    setShowItemsModal(true);
  };

  const activeItems = items.filter((item) => item.status === 'active' || item.status === 'pending');
  const returnedItems = items.filter((item) => item.status === 'returned');

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
            onClick={() => setShowLogin(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition shadow-md shadow-blue-200"
          >
            Sign In
          </button>
        </div>
      </nav>

      <div
        className="relative bg-blue-900 text-white py-20 px-8 text-center bg-cover bg-center"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,30,0.7), rgba(0,0,30,0.7)), url("https://images.unsplash.com/photo-1523050853023-8c2d29149f0b?auto=format&fit=crop&q=80")'
        }}
      >
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            Lost Something? <span className="text-yellow-400">We&apos;ll Help.</span>
          </h1>
          <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Report lost items, browse found belongings, and connect with fellow students on the SLIIT campus.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={openItemsModal}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              Browse Items
            </button>
            <button
              onClick={openReportModal}
              className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 px-8 py-4 rounded-xl font-bold text-lg transition-all"
            >
              Report an Item →
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto -mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 px-4 relative z-20">
        {[
          { label: 'Items Reported', value: '1,247', icon: '📦', color: 'text-blue-600' },
          { label: 'Items Returned', value: '893', icon: '📈', color: 'text-green-600' },
          { label: 'Trust Score Avg', value: '87%', icon: '🛡️', color: 'text-yellow-600' },
          { label: 'Events This Month', value: '12', icon: '📅', color: 'text-purple-600' }
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow border border-gray-100 flex flex-col items-center text-center"
          >
            <div className="text-3xl mb-3">{stat.icon}</div>
            <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto py-20 px-4">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Recent Posts</h2>
            <p className="text-gray-500">Latest lost & found reports from across the campus</p>
          </div>
          <button
            onClick={openItemsModal}
            className="text-blue-600 font-bold hover:text-blue-800 transition flex items-center gap-1 group"
          >
            View All <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-3xl shadow-md overflow-hidden border border-gray-100 hover:shadow-2xl transition-all group duration-300">
            <div className="relative h-56 bg-gray-100 overflow-hidden">
              <span className="absolute top-4 left-4 z-10 bg-red-500 text-white text-[10px] uppercase font-black px-3 py-1 rounded-full tracking-tighter">
                Lost
              </span>
              <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80')] bg-cover bg-center group-hover:scale-110 transition-transform duration-500"></div>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-xl text-gray-800 mb-2">MacBook Pro Charger</h3>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed line-clamp-2">
                White 67W USB-C charger, left in the computer lab during the afternoon session.
              </p>
              <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lab A3</span>
                <button
                  onClick={openItemsModal}
                  className="text-blue-600 text-sm font-black hover:underline transition-all"
                >
                  VIEW DETAILS
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Report a Lost or Found Item</h2>
                <p className="text-sm text-gray-500 mt-1">
                  The image is uploaded to Cloudinary first, then the image URL and item details are saved in MongoDB.
                </p>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-black text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-gray-700">Item Name</span>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-500"
                    placeholder="Blue water bottle"
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-gray-700">Category</span>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-500"
                    placeholder="Accessories"
                    required
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-gray-700">Location</span>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-500"
                    placeholder="Library entrance"
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-gray-700">Post Type</span>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-500"
                  >
                    <option value="lost">Lost</option>
                    <option value="found">Found</option>
                  </select>
                </label>
              </div>

              <label className="space-y-2 block">
                <span className="text-sm font-bold text-gray-700">Description</span>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-500 resize-none"
                  placeholder="Add any details that make the item easier to recognize."
                />
              </label>

              <label className="space-y-2 block">
                <span className="text-sm font-bold text-gray-700">Item Image</span>
                <input
                  type="file"
                  name="imageFile"
                  onChange={handleInputChange}
                  accept="image/*"
                  className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600"
                />
              </label>

              {alert && (
                <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{alert}</div>
              )}
              {error && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-5 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isSubmitting ? 'Saving Post...' : 'Create Lost & Found Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showItemsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[105] p-4">
          <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Lost & Found Posts</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Active posts stay searchable until they are marked as returned.
                </p>
              </div>
              <button
                onClick={() => setShowItemsModal(false)}
                className="text-gray-400 hover:text-black text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-8 max-h-[78vh] overflow-y-auto">
              <div className="mb-6">
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by item name, category, or location"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {alert && (
                <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 mb-4">{alert}</div>
              )}
              {error && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 mb-4">{error}</div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="bg-gray-50 rounded-3xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-black text-gray-900">Active List</h3>
                      <p className="text-sm text-gray-500">Open lost and found posts.</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                      {activeItems.length} Active
                    </span>
                  </div>

                  <div className="space-y-4">
                    {isLoading ? (
                      <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-8 text-center text-sm text-gray-500">
                        Loading posts...
                      </div>
                    ) : activeItems.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-8 text-center text-sm text-gray-500">
                        No active posts found.
                      </div>
                    ) : (
                      activeItems.map((item) => (
                        <article key={item._id} className="rounded-3xl border border-gray-100 bg-white overflow-hidden">
                          {item.image && <img src={item.image} alt={item.title} className="h-48 w-full object-cover" />}
                          <div className="p-6">
                            <div className="flex items-center justify-between gap-4 mb-3">
                              <div>
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] ${
                                    item.type === 'lost' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                  }`}
                                >
                                  {item.type}
                                </span>
                                <h4 className="text-xl font-black text-gray-900 mt-3">{item.title}</h4>
                              </div>
                              <button
                                onClick={() => handleMarkReturned(item._id)}
                                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 transition"
                              >
                                Mark Returned
                              </button>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed mb-4">
                              {item.description || 'No extra description provided.'}
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                              <span className="rounded-full bg-gray-50 px-3 py-2">{item.category}</span>
                              <span className="rounded-full bg-gray-50 px-3 py-2">{item.location}</span>
                            </div>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-3xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-black text-gray-900">Returned List</h3>
                      <p className="text-sm text-gray-500">Posts moved out after recovery.</p>
                    </div>
                    <span className="rounded-full bg-green-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-green-700">
                      {returnedItems.length} Returned
                    </span>
                  </div>

                  <div className="space-y-4">
                    {isLoading ? (
                      <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-8 text-center text-sm text-gray-500">
                        Loading posts...
                      </div>
                    ) : returnedItems.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-8 text-center text-sm text-gray-500">
                        No returned items yet.
                      </div>
                    ) : (
                      returnedItems.map((item) => (
                        <article key={item._id} className="rounded-3xl border border-green-100 bg-green-50 p-6">
                          <div className="flex items-center justify-between gap-4 mb-3">
                            <div>
                              <span className="inline-flex rounded-full bg-green-200 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-green-800">
                                Returned
                              </span>
                              <h4 className="text-xl font-black text-gray-900 mt-3">{item.title}</h4>
                            </div>
                            <div className="text-right text-xs font-bold uppercase tracking-[0.2em] text-green-700">
                              {item.type}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed mb-4">
                            {item.description || 'No extra description provided.'}
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-600">
                            <span className="rounded-full bg-white px-3 py-2">{item.category}</span>
                            <span className="rounded-full bg-white px-3 py-2">{item.location}</span>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLogin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in duration-300">
            <button onClick={() => setShowLogin(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl">
              ×
            </button>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login to ResQ</h2>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Student Email"
                className="w-full p-4 border border-gray-100 bg-gray-50 rounded-xl outline-none focus:border-blue-600 transition-all"
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full p-4 border border-gray-100 bg-gray-50 rounded-xl outline-none focus:border-blue-600 transition-all"
              />
              <button className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                Sign In
              </button>
              <p className="text-center text-sm text-gray-500 mt-4">
                Don&apos;t have an account?{' '}
                <span onClick={() => navigate('/onboarding')} className="text-blue-600 font-bold cursor-pointer hover:underline">
                  Register with AI
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => navigate('/onboarding')}
        className="fixed bottom-8 right-8 bg-blue-600 text-white p-5 rounded-2xl shadow-2xl hover:bg-blue-700 hover:-translate-y-2 transition-all flex items-center gap-3 group z-50"
      >
        <span className="font-bold text-sm tracking-tight">Register via Bot</span>
        <span className="text-2xl group-hover:rotate-12 transition-transform">🤖</span>
      </button>

      <footer className="text-center py-12 text-gray-400 text-xs font-medium border-t bg-white mt-12">
        © 2026 ResQ Portal — SLIIT Campus. Built for students, by students.
      </footer>
    </div>
  );
};

export default Dashboard;
