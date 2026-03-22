import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from './config';

const formatEventDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setEventsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/community-events`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Failed to load events');
        const upcoming = Array.isArray(data.upcoming) ? data.upcoming : [];
        if (!cancelled) setUpcomingEvents(upcoming.slice(0, 2));
      } catch {
        if (!cancelled) setUpcomingEvents([]);
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Handle smooth scroll for navigation links
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('resqToken');
    localStorage.removeItem('resqUser');
    setCurrentUser(null);
    setShowProfile(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-blue-100 dark:bg-slate-950 dark:text-slate-100 dark:selection:bg-blue-900/40">
      
      {/* Fixed Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 border-b border-gray-100 bg-white/70 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/80">
        <div className="p-5 flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900/50">ResQ</div>
            <span className="text-xl font-black tracking-tight text-gray-900 uppercase dark:text-white">Portal</span>
          </div>
          
          <div className="hidden md:flex gap-8 text-sm font-bold text-gray-500 dark:text-slate-400">
             <button onClick={() => scrollToSection('features')} className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">Features</button>
             <button onClick={() => scrollToSection('how-it-works')} className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">How It Works</button>
             <button onClick={() => scrollToSection('stats')} className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">Stats</button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate('/about')}
              className="rounded-full border-2 border-gray-200 bg-white/80 px-4 py-2 text-sm font-bold text-gray-800 shadow-sm transition-all hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-blue-300 sm:px-5 sm:text-base"
            >
              About Us
            </button>
            {currentUser ? (
              <button
                onClick={() => setShowProfile(true)}
                className="rounded-full bg-gray-900 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-600 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-blue-400 sm:px-6 sm:text-base"
              >
                My Profile
              </button>
            ) : (
              <button
                onClick={() => navigate('/dashboard')}
                className="rounded-full bg-gray-900 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-600 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-blue-400 sm:px-6 sm:text-base"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="mx-auto flex max-w-7xl flex-col items-center gap-16 px-6 pb-20 pt-40 md:flex-row">
        <div className="flex-1 text-center md:text-left">
          <h1 className="mb-8 text-5xl font-black leading-[1.1] text-gray-900 dark:text-white md:text-7xl">
            Find what you <span className="italic text-blue-600 dark:text-blue-400">lost</span>, <br />
            Return what you <span className="italic text-blue-600 dark:text-blue-400">found</span>.
          </h1>
          <p className="mb-10 max-w-lg text-lg leading-relaxed text-gray-500 dark:text-slate-400 md:text-xl">
            The official SLIIT community portal for lost & found items. Join our smart assistant to secure your campus life.
          </p>
          <div className="flex flex-col justify-center gap-5 sm:flex-row md:justify-start">
            <button 
              onClick={() => navigate('/onboarding')} 
              className="rounded-2xl bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-2xl shadow-blue-200 transition-all duration-300 hover:scale-105 dark:shadow-blue-900/40"
            >
              Join with AI Assistant
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="group flex items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 px-8 py-4 text-lg font-bold transition-all duration-300 hover:border-blue-600 hover:bg-white hover:text-blue-600 dark:border-slate-600 dark:hover:border-blue-400 dark:hover:bg-slate-800 dark:hover:text-blue-300"
            >
              Explore Dashboard
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
        </div>

        {/* 3D Visual Section with Breathing Animation */}
        <div className="relative flex flex-1 items-center justify-center">
          {/* Decorative Glow */}
          <div className="absolute h-[400px] w-[400px] animate-pulse rounded-full bg-blue-500/10 blur-[120px] dark:bg-blue-400/10" />
          
          {/* Animated 3D Glass Container */}
          <div className="relative animate-breathing perspective-2000">
            <div className="overflow-hidden rounded-[2.5rem] border border-white/50 shadow-[0_40px_80px_rgba(0,0,0,0.15)] rotate-3d-tilt dark:border-slate-600/50 dark:shadow-[0_40px_80px_rgba(0,0,0,0.5)]">
              <img 
                src="/logo.png" 
                alt="ResQ Portal Visual" 
                className="h-auto w-full max-w-[500px] scale-105 object-cover" 
              />
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="bg-gray-50/50 py-24 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="mb-4 text-4xl font-black text-gray-900 dark:text-white">Powerful Features</h2>
          <p className="mb-16 text-gray-500 dark:text-slate-400">Smart technology for a safer campus environment.</p>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { title: 'AI Smart Matching', desc: 'Our AI automatically matches lost reports with found items based on descriptions.', icon: '🤖' },
              { title: 'Secure Verification', desc: 'Ownership verification protocols to ensure items return to rightful owners.', icon: '🛡️' },
              { title: 'Instant Alerts', desc: 'Real-time notifications sent the moment a potential match is identified.', icon: '🔔' }
            ].map((feature, i) => (
              <div key={i} className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm transition-all hover:-translate-y-2 hover:shadow-2xl dark:border-slate-700 dark:bg-slate-800/80">
                <div className="mb-6 text-4xl">{feature.icon}</div>
                <h3 className="mb-3 text-xl font-bold dark:text-slate-100">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-white py-24 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="mb-16 text-4xl font-black text-gray-900 dark:text-white">How It Works</h2>
          <div className="flex flex-col justify-between gap-12 md:flex-row">
             {[
               { step: '01', title: 'Report', desc: 'Provide details of your lost or found item via the portal.' },
               { step: '02', title: 'Process', desc: 'Our AI engine processes information to find a suitable match.' },
               { step: '03', title: 'Recover', desc: 'Follow verification steps and safely recover your item.' }
             ].map((item, i) => (
               <div key={i} className="flex-1">
                 <div className="mx-auto mb-6 flex h-16 w-16 rotate-3 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-black text-white shadow-xl shadow-blue-200 dark:shadow-blue-900/50">{item.step}</div>
                 <h3 className="mb-3 text-xl font-bold dark:text-slate-100">{item.title}</h3>
                 <p className="text-sm leading-relaxed text-gray-500 dark:text-slate-400">{item.desc}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Real-time Statistics Section */}
      <section id="stats" className="bg-blue-600 py-20 dark:bg-blue-800">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 text-center text-white md:grid-cols-4">
          <div><div className="mb-2 text-4xl font-black">2,500+</div><div className="text-sm font-medium text-blue-100">Items Recovered</div></div>
          <div><div className="mb-2 text-4xl font-black">10,000+</div><div className="text-sm font-medium text-blue-100">Active Community</div></div>
          <div><div className="mb-2 text-4xl font-black">95%</div><div className="text-sm font-medium text-blue-100">Success Rate</div></div>
          <div><div className="mb-2 text-4xl font-black">&lt; 24h</div><div className="text-sm font-medium text-blue-100">Avg. Match Time</div></div>
        </div>
      </section>

      {/* Upcoming community events (latest two by start date) */}
      <section
        className="border-t border-gray-100 bg-gray-50/50 py-16 dark:border-slate-800 dark:bg-slate-900/50"
        aria-labelledby="landing-upcoming-events"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                Community Hub
              </p>
              <h2
                id="landing-upcoming-events"
                className="text-3xl font-black text-gray-900 dark:text-white md:text-4xl"
              >
                Upcoming events
              </h2>
              <p className="mt-2 max-w-xl text-sm text-gray-500 dark:text-slate-400">
                The next happenings on campus — open the hub for the full calendar and archives.
              </p>
            </div>
            <Link
              to="/community-hub/content"
              className="shrink-0 text-sm font-bold text-blue-600 underline-offset-4 transition hover:underline dark:text-blue-400"
            >
              View all events →
            </Link>
          </div>

          {eventsLoading && (
            <div className="grid gap-6 md:grid-cols-2">
              {[0, 1].map((k) => (
                <div
                  key={k}
                  className="h-40 animate-pulse rounded-3xl bg-gray-200/80 dark:bg-slate-800"
                />
              ))}
            </div>
          )}

          {!eventsLoading && upcomingEvents.length === 0 && (
            <p className="rounded-2xl border border-dashed border-gray-200 bg-white/80 py-10 text-center text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
              No upcoming events right now. Check back soon or browse past events in the Community Hub.
            </p>
          )}

          {!eventsLoading && upcomingEvents.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              {upcomingEvents.map((ev) => (
                <Link
                  key={ev._id}
                  to={`/community-hub/content/${ev._id}`}
                  className="group flex overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-blue-500/40"
                >
                  <div className="relative h-36 w-32 shrink-0 bg-gray-100 dark:bg-slate-700 sm:h-auto sm:w-40">
                    {ev.imageUrl ? (
                      <img
                        src={ev.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl text-gray-300 dark:text-slate-500">
                        ◈
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center p-5">
                    {ev.category && (
                      <span className="mb-1 inline-block w-fit rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                        {ev.category}
                      </span>
                    )}
                    <h3 className="line-clamp-2 text-lg font-bold text-gray-900 group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
                      {ev.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                      {formatEventDate(ev.startDateTime)}
                      {ev.location ? ` · ${ev.location}` : ''}
                    </p>
                    <span className="mt-3 inline-flex items-center text-sm font-bold text-blue-600 dark:text-blue-400">
                      View details
                      <span className="ml-1 transition-transform group-hover:translate-x-0.5">→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer Section */}
      <footer className="border-t border-gray-100 py-10 text-center text-xs text-gray-400 dark:border-slate-800 dark:text-slate-500">
        © 2026 ResQ Portal. Built for the SLIIT Community.
      </footer>

      {/* Profile Modal */}
      {showProfile && currentUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl animate-in fade-in zoom-in rounded-3xl bg-white p-8 shadow-2xl duration-300 dark:bg-slate-900 dark:text-slate-100">
            <button onClick={() => setShowProfile(false)} className="absolute right-4 top-4 text-xl text-gray-400 hover:text-black dark:text-slate-500 dark:hover:text-white">✕</button>
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-800 dark:text-slate-100">My Profile</h2>

            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-slate-800">
                <p className="text-xs font-bold uppercase text-gray-400 dark:text-slate-500">Full Name</p>
                <p className="mt-1 font-semibold text-gray-800 dark:text-slate-200">{currentUser.realName}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-slate-800">
                <p className="text-xs font-bold uppercase text-gray-400 dark:text-slate-500">Nickname</p>
                <p className="mt-1 font-semibold text-gray-800 dark:text-slate-200">{currentUser.nickname}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-slate-800">
                <p className="text-xs font-bold uppercase text-gray-400 dark:text-slate-500">Student ID</p>
                <p className="mt-1 font-semibold text-gray-800 dark:text-slate-200">{currentUser.studentId}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-slate-800">
                <p className="text-xs font-bold uppercase text-gray-400 dark:text-slate-500">Email</p>
                <p className="mt-1 font-semibold text-gray-800 dark:text-slate-200">{currentUser.email}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowProfile(false)}
                className="rounded-full border border-gray-200 px-5 py-2 font-bold text-gray-700 transition hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                onClick={handleLogout}
                className="rounded-full bg-gray-800 px-5 py-2 font-bold text-white transition hover:bg-black dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
