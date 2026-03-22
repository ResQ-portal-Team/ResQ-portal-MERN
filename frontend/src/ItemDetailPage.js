import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { API_BASE } from './config';

const ItemDetailPage = () => {
  const { itemId } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/items/${itemId}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Could not load this item.');
        if (!cancelled) setItem(data.item);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Could not load this item.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  const authorLabel = (postedBy) => {
    if (!postedBy) return '—';
    if (typeof postedBy === 'object') {
      return postedBy.nickname || postedBy.email || postedBy.studentId || '—';
    }
    return String(postedBy);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/dashboard"
          className="inline-block mb-4 text-blue-700 font-semibold hover:underline"
        >
          ← Back to Dashboard
        </Link>

        {loading && <p className="text-gray-600">Loading…</p>}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 text-red-800 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        {!loading && !error && item && (
          <article className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="relative h-64 sm:h-80 bg-gray-100">
              <span
                className={`absolute top-4 left-4 z-10 text-white text-[10px] uppercase font-black px-3 py-1 rounded-full ${
                  item.type === 'lost' ? 'bg-red-500' : 'bg-emerald-500'
                }`}
              >
                {item.type}
              </span>
              {item.image ? (
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl text-blue-300 font-black">
                  {item.type === 'lost' ? 'L' : 'F'}
                </div>
              )}
            </div>
            <div className="p-6 sm:p-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">{item.title}</h1>
              <p className="text-sm text-gray-500 mb-4">
                Posted by {authorLabel(item.postedBy)} · {item.category || '—'} · {item.location || '—'}
              </p>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{item.description}</p>
              {item.date && (
                <p className="mt-4 text-sm text-gray-500">
                  <span className="font-semibold text-gray-600">Date:</span> {item.date}
                </p>
              )}
              <p className="mt-2 text-sm">
                <span className="font-semibold text-gray-600">Status:</span>{' '}
                <span className="capitalize">{item.status || '—'}</span>
              </p>
            </div>
          </article>
        )}
      </div>
    </div>
  );
};

export default ItemDetailPage;
