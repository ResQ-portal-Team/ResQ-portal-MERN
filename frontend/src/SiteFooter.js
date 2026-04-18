import React from 'react';
import { Link } from 'react-router-dom';

const linkClass =
  'text-sm text-gray-600 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400';

const SiteFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full min-w-0 shrink-0 border-t border-gray-200 bg-gray-50 dark:border-slate-800 dark:bg-slate-950">
      <div className="w-full px-5 py-12 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="grid w-full grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-16 xl:gap-x-24">
          <div>
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="rounded-lg bg-blue-600 px-2 py-1 text-sm font-bold text-white">ResQ</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">Portal</span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-500 dark:text-slate-400 lg:max-w-sm">
              SLIIT community lost &amp; found — report items, find matches, and return belongings safely.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">Explore</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/" className={linkClass}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className={linkClass}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/community-hub" className={linkClass}>
                  Community Hub
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className={linkClass}>
                  Leaderboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">Support</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/contact" className={linkClass}>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/about" className={linkClass}>
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">Get started</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/dashboard" className={linkClass}>
                  Sign in
                </Link>
              </li>
              <li>
                <Link to="/onboarding" className={linkClass}>
                  Register
                </Link>
              </li>
              <li>
                <Link to="/report-item" className={linkClass}>
                  Report an item
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 dark:border-slate-800 sm:flex-row">
          <p className="text-center text-xs text-gray-500 dark:text-slate-500 sm:text-left">
            © {year} ResQ Portal · SLIIT Campus. Built for students, by students.
          </p>
          <p className="text-center text-xs text-gray-400 dark:text-slate-600 sm:text-right">
            Lost &amp; found, simplified.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
