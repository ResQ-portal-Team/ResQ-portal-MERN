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

const pageX = 'w-full px-5 sm:px-8 lg:px-12 xl:px-16 2xl:px-20';

const normalizeStatus = (status) => {
  const s = (status || 'active').toLowerCase();
  if (s === 'returned') return 'returned';
  if (s === 'pending') return 'pending';
  return 'active';
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
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-slate-100 to-gray-50 dark:from-slate-950 dark:to-slate-900">
        <div
          className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400"
          aria-hidden
        />
        <p className="font-medium text-gray-600 dark:text-slate-400">Loading item details…</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className={`min-h-screen w-full bg-gray-50 py-8 dark:bg-slate-950 ${pageX}`}>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-400 dark:hover:bg-slate-800"
        >
          <span aria-hidden>←</span> Back to dashboard
        </button>
        <div className="rounded-2xl border border-red-200/80 bg-red-50/90 p-6 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {error || 'Item not found.'}
        </div>
      </div>
    );
  }

  const status = normalizeStatus(item.status);
  const isLost = item.type === 'lost';

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-100/90 via-gray-50 to-gray-100 pb-12 font-sans text-gray-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100">
      <div className={`mx-auto max-w-[1920px] pt-6 sm:pt-8 ${pageX}`}>
        <nav className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200/90 bg-white/90 px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm backdrop-blur transition hover:border-blue-200 hover:bg-blue-50/80 hover:text-blue-800 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100 dark:hover:border-blue-500/40 dark:hover:bg-slate-800 dark:hover:text-blue-300"
          >
            <span className="text-lg leading-none" aria-hidden>
              ←
            </span>
            Lost &amp; found board
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white ${
                isLost ? 'bg-red-500 shadow-sm shadow-red-500/30' : 'bg-emerald-600 shadow-sm shadow-emerald-600/25'
              }`}
            >
              {isLost ? 'Lost' : 'Found'}
            </span>
            <span className="rounded-full border border-gray-200 bg-white/90 px-3 py-1 text-xs font-semibold text-gray-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {item.category}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                status === 'returned'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                  : status === 'pending'
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
              }`}
            >
              {status}
            </span>
          </div>
        </nav>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-start xl:gap-8">
          <div className="xl:col-span-8 2xl:col-span-9">
            <article className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-xl shadow-gray-200/40 dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-black/40">
              {/* Large image on top — details below */}
              <div className="relative w-full bg-gray-100 dark:bg-slate-800">
                <div className="relative h-[min(72vh,920px)] min-h-[280px] w-full sm:min-h-[360px] lg:min-h-[420px]">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      className="h-full w-full object-cover object-center"
                    />
                  ) : (
                    <div className="flex h-full min-h-[inherit] w-full items-center justify-center bg-gradient-to-br from-blue-100 via-slate-50 to-indigo-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
                      <span className="select-none text-8xl font-black text-blue-400/90 dark:text-blue-500/50 sm:text-9xl">
                        {isLost ? 'L' : 'F'}
                      </span>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 lg:p-10">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/90">Item details</p>
                    <h1 className="mt-2 max-w-4xl text-2xl font-black leading-tight text-white drop-shadow-sm sm:text-3xl lg:text-4xl xl:text-5xl">
                      {item.title}
                    </h1>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 p-6 sm:p-8 lg:p-10 xl:p-12 dark:border-slate-700/80">
                <p className="mb-6 text-base leading-relaxed text-gray-600 dark:text-slate-300 sm:text-lg lg:text-xl">
                  {item.description}
                </p>

                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                  Information
                </h2>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                  {[
                    { label: 'Location', value: item.location },
                    {
                      label: item.type === 'found' ? 'Date found' : 'Date lost',
                      value: item.date ? formatItemDate(item.date) : 'Not specified',
                    },
                    { label: 'Listed on', value: formatItemDate(item.createdAt) },
                    {
                      label: 'Status',
                      value: <span className="capitalize">{status}</span>,
                    },
                    {
                      label: 'Reported by',
                      value: item.postedBy?.nickname || item.postedBy?.realName || 'Unknown user',
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="rounded-2xl border border-gray-100 bg-gray-50/90 px-4 py-3.5 dark:border-slate-700 dark:bg-slate-800/80"
                    >
                      <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                        {row.label}
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </article>
          </div>

          <aside className="xl:col-span-4 2xl:col-span-3">
            <div className="sticky top-6 overflow-hidden rounded-3xl border border-gray-200/90 bg-white shadow-lg shadow-gray-200/30 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/30">
              <div className="border-b border-gray-100 bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-8 text-white dark:from-blue-700 dark:to-indigo-900">
                <p className="text-sm font-medium text-blue-100">Contact poster</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight">Chat</h2>
                <p className="mt-2 text-sm leading-relaxed text-blue-100/95">
                  Coordinate return or pickup. Messaging will be available here soon.
                </p>
              </div>
              <div className="p-6">
                <div className="mb-5 flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3 dark:bg-slate-800/80">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
                    {(item.postedBy?.nickname || item.postedBy?.realName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900 dark:text-white">
                      {item.postedBy?.nickname || item.postedBy?.realName || 'Unknown user'}
                    </p>
                    {item.postedBy?.email && (
                      <p className="truncate text-xs text-gray-500 dark:text-slate-400">{item.postedBy.email}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="w-full rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 active:scale-[0.99] dark:shadow-blue-900/40"
                >
                  Open chat
                </button>
                <p className="mt-4 text-center text-xs text-gray-400 dark:text-slate-500">
                  Demo placeholder — no messages yet.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailPage;
