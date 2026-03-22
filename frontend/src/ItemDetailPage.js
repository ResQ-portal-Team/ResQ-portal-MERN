import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const formatItemDate = (value) => {
  if (!value) {
    return 'Not available';
  }

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const ItemDetailPage = () => {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      setError('');

      let lastError;
      for (const baseUrl of ['', 'http://localhost:5000']) {
        try {
          const response = await fetch(`${baseUrl}/api/items/${itemId}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data?.message || 'Failed to fetch item details.');
          }

          setItem(data.item);
          setLoading(false);
          return;
        } catch (fetchError) {
          lastError = fetchError;
        }
      }

      setError(lastError?.message || 'Unable to load item details.');
      setLoading(false);
    };

    if (itemId) {
      fetchItem();
    }
  }, [itemId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600 font-semibold">
        Loading item details...
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate('/dashboard')} className="text-blue-700 font-semibold hover:underline mb-4">
            ← Back to Dashboard
          </button>
          <div className="bg-white border border-red-100 text-red-700 rounded-2xl p-6">
            {error || 'Item not found.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="text-blue-700 font-semibold hover:underline mb-4">
          ← Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="relative h-64 sm:h-80 bg-gray-100">
              {item.image ? (
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-100 via-white to-blue-200 flex items-center justify-center text-6xl text-blue-400 font-black">
                  {item.type === 'lost' ? 'L' : 'F'}
                </div>
              )}
              <span className={`absolute top-4 left-4 text-white text-xs font-bold px-3 py-1 rounded-full ${item.type === 'lost' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                {item.type}
              </span>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h1 className="text-3xl font-black text-gray-900">{item.title}</h1>
                <span className="text-xs uppercase font-bold tracking-wider text-gray-500">{item.category}</span>
              </div>
              <p className="text-gray-700 leading-relaxed mb-6">{item.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-400 uppercase text-xs font-bold">Location</p>
                  <p className="text-gray-800 font-semibold mt-1">{item.location}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-400 uppercase text-xs font-bold">
                    {item.type === 'found' ? 'Date found' : 'Date lost'}
                  </p>
                  <p className="text-gray-800 font-semibold mt-1">
                    {item.date ? formatItemDate(item.date) : 'Not specified'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-400 uppercase text-xs font-bold">Listed on</p>
                  <p className="text-gray-800 font-semibold mt-1">{formatItemDate(item.createdAt)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-400 uppercase text-xs font-bold">Status</p>
                  <p className="text-gray-800 font-semibold mt-1">{item.status || 'active'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-400 uppercase text-xs font-bold">Reported By</p>
                  <p className="text-gray-800 font-semibold mt-1">
                    {item.postedBy?.nickname || item.postedBy?.realName || 'Unknown user'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <aside className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Chat</h2>
            <p className="text-sm text-gray-500 mb-6">
              Chat system will be added later. Use this button placeholder for now.
            </p>
            <button
              type="button"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition"
            >
              Open Chat
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailPage;
