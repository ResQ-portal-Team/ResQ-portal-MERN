import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './CommunityHub.css';

/** Add your photo to frontend/public/ — change the filename here if needed */
const HERO_BG = `${process.env.PUBLIC_URL || ''}/community-hub-hero.jpg`;

const CommunityHub = () => {
  const navigate = useNavigate();
  const hubContentRef = useRef(null);
  const [hubDetailsOpen, setHubDetailsOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postMessage, setPostMessage] = useState('');

  const openHubDetails = useCallback(() => {
    setHubDetailsOpen(true);
    setTimeout(() => {
      hubContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }, []);

  const toggleHubDetails = useCallback(() => {
    setHubDetailsOpen((open) => {
      const next = !open;
      if (next) {
        setTimeout(() => {
          hubContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      }
      return next;
    });
  }, []);

  const handleClear = () => {
    setPostTitle('');
    setPostContent('');
    setPostMessage('');
  };

  const handlePost = () => {
    if (!postTitle.trim() || !postContent.trim()) {
      setPostMessage('Please enter both title and details before posting.');
      return;
    }

    setPostMessage('Post submitted in UI. Connect this to backend to save it.');
    setPostTitle('');
    setPostContent('');
  };

  return (
    <div className="community-hub-root font-sans">
      <section
        className="community-hub-hero"
        style={{
          '--hub-hero-image': `url("${HERO_BG}")`,
        }}
      >
        <header className="community-hub-nav" role="banner">
          <div className="community-hub-nav-inner">
            <div className="community-hub-nav-top">
              <div className="community-hub-nav-top-links">
                <span className="community-hub-info-label">Information for:</span>
                <button type="button" className="community-hub-nav-top-btn" onClick={openHubDetails}>
                  Students
                </button>
                <button type="button" className="community-hub-nav-top-btn" onClick={openHubDetails}>
                  Faculty &amp; Staff
                </button>
                <button type="button" className="community-hub-nav-top-btn" onClick={openHubDetails}>
                  Visitors
                </button>
                <button type="button" className="community-hub-nav-top-btn" onClick={openHubDetails}>
                  Alumni
                </button>
                <span className="community-hub-search" aria-hidden>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3-3" />
                  </svg>
                  Search
                </span>
              </div>
            </div>
            <div className="community-hub-nav-main">
              <button type="button" className="community-hub-logo" onClick={() => navigate('/')}>
                SLIIT University
              </button>
              <nav className="community-hub-main-links" aria-label="Community Hub">
                <button type="button" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </button>
                <button type="button" onClick={() => navigate('/report-item')}>
                  Report Item
                </button>
                <span className="is-active">Community Hub</span>
                <button type="button" onClick={() => navigate('/')}>
                  Home
                </button>
              </nav>
            </div>
          </div>
        </header>

        <div className="community-hub-hero-center">
          <h1 className="community-hub-hero-title">SLIIT</h1>
          <p className="community-hub-hero-tagline">Community Hub</p>
        </div>

        <button
          type="button"
          className={`community-hub-explore${hubDetailsOpen ? ' is-open' : ''}`}
          onClick={toggleHubDetails}
          aria-expanded={hubDetailsOpen}
          aria-controls="hub-content"
        >
          SLIIT Community Hub
          <svg className="community-hub-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </section>

      <div
        className={`community-hub-details-wrap${hubDetailsOpen ? ' is-open' : ''}`}
        aria-hidden={!hubDetailsOpen}
      >
        <div className="community-hub-details-inner">
          <main id="hub-content" ref={hubContentRef} className="community-hub-content">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <section className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Create a Social Post</h2>
                <p className="text-sm text-gray-500 mb-4">
                  This ties in with your upcoming social post feature. You can hook this form to your backend later.
                </p>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="Post title (e.g. Found headphones near library)"
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <textarea
                    rows="4"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Share more details with the community..."
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                  {postMessage && <p className="text-sm text-gray-600">{postMessage}</p>}
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={handleClear}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handlePost}
                      className="px-5 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-md shadow-blue-200"
                    >
                      Post to Hub
                    </button>
                  </div>
                </div>
              </section>

              <aside className="space-y-6">
                <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Tips</h3>
                  <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                    <li>Don&apos;t share sensitive personal information.</li>
                    <li>Add clear locations and times.</li>
                    <li>Be respectful to other community members.</li>
                  </ul>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-sm text-blue-900">
                  <h3 className="font-bold mb-2">Coming Soon</h3>
                  <p>
                    This hub will later show a live feed of social posts, comments, and reactions once your backend is wired up.
                  </p>
                </div>
              </aside>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default CommunityHub;
