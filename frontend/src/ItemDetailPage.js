import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { API_BASE } from './config';

const ItemDetailPage = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
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
        if (!res.ok) throw new Error(data.message || 'Item not found.');
        if (!cancelled) setItem(data.item);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Could not load item.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm font-semibold text-blue-700 hover:underline"
        >
          ← Back
        </button>
        <Link to="/dashboard" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
          Dashboard
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {loading && <p className="text-slate-500">Loading…</p>}
        {error && (
          <p className="p-4 rounded-lg bg-red-50 text-red-800 text-sm font-medium" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && item && (
          <article className="bg-white rounded-xl shadow border border-slate-100 overflow-hidden">
            {item.image && (
              <img src={item.image} alt="" className="w-full max-h-80 object-cover bg-slate-100" />
            )}
            <div className="p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                {item.category}
              </p>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{item.title}</h1>
              <div className="flex flex-wrap gap-3 text-sm text-slate-600 mb-4">
                {item.type && (
                  <span className="capitalize">
                    <strong className="text-slate-800">Type:</strong> {item.type}
                  </span>
                )}
                {item.status && (
                  <span>
                    <strong className="text-slate-800">Status:</strong> {item.status}
                  </span>
                )}
                {item.location && (
                  <span>
                    <strong className="text-slate-800">Location:</strong> {item.location}
                  </span>
                )}
                {item.date && (
                  <span>
                    <strong className="text-slate-800">Date:</strong>{' '}
                    {new Date(item.date).toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{item.description}</p>
            </div>
          </article>
        )}
      </main>
    </div>
  );
};

export default ItemDetailPage;
