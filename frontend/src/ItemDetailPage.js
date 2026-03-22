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
      <div className="flex min-h-screen items-center justify-center bg-gray-50 font-semibold text-gray-600 dark:bg-slate-950 dark:text-slate-300">
        Loading item details...
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 dark:bg-slate-950">
        <div className="mx-auto max-w-4xl">
          <button onClick={() => navigate('/dashboard')} className="mb-4 font-semibold text-blue-700 hover:underline dark:text-blue-400">
            ← Back to Dashboard
          </button>
          <div className="rounded-2xl border border-red-100 bg-white p-6 text-red-700 dark:border-red-900/50 dark:bg-slate-900 dark:text-red-400">
            {error || 'Item not found.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-gray-900 dark:bg-slate-950 dark:text-slate-100 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <button onClick={() => navigate('/dashboard')} className="mb-4 font-semibold text-blue-700 hover:underline dark:text-blue-400">
          ← Back to Dashboard
        </button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900 lg:col-span-2">
            <div className="relative h-64 bg-gray-100 dark:bg-slate-800 sm:h-80">
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
                <h1 className="text-3xl font-black text-gray-900 dark:text-white">{item.title}</h1>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">{item.category}</span>
              </div>
              <p className="mb-6 leading-relaxed text-gray-700 dark:text-slate-300">{item.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-slate-800">
                  <p className="text-xs font-bold uppercase text-gray-400 dark:text-slate-500">Location</p>
                  <p className="mt-1 font-semibold text-gray-800 dark:text-slate-200">{item.location}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-slate-800">
                  <p className="text-xs font-bold uppercase text-gray-400 dark:text-slate-500">
                    {item.type === 'found' ? 'Date found' : 'Date lost'}
                  </p>
                  <p className="mt-1 font-semibold text-gray-800 dark:text-slate-200">
                    {item.date ? formatItemDate(item.date) : 'Not specified'}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-slate-800">
                  <p className="text-xs font-bold uppercase text-gray-400 dark:text-slate-500">Listed on</p>
                  <p className="mt-1 font-semibold text-gray-800 dark:text-slate-200">{formatItemDate(item.createdAt)}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-slate-800">
                  <p className="text-xs font-bold uppercase text-gray-400 dark:text-slate-500">Status</p>
                  <p className="mt-1 font-semibold text-gray-800 dark:text-slate-200">{item.status || 'active'}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-slate-800">
                  <p className="text-xs font-bold uppercase text-gray-400 dark:text-slate-500">Reported By</p>
                  <p className="mt-1 font-semibold text-gray-800 dark:text-slate-200">
                    {item.postedBy?.nickname || item.postedBy?.realName || 'Unknown user'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <aside className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">Chat</h2>
            <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">
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
