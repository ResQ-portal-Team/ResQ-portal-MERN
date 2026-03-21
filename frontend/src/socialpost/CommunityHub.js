import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CommunityHubHeader from './CommunityHubHeader';
import './CommunityHub.css';

/** Add your photo to frontend/public/ — change the filename here if needed */
const HERO_BG = `${process.env.PUBLIC_URL || ''}/community-hub-hero.jpg`;

/** Match --hub-exit-delay + --hub-exit-duration in CommunityHub.css */
const HERO_EXIT_MS = 700;

const CommunityHub = () => {
  const navigate = useNavigate();
  const [heroExiting, setHeroExiting] = useState(false);
  const transitionStarted = useRef(false);

  const goToHubContent = useCallback(() => {
    if (transitionStarted.current) return;
    transitionStarted.current = true;
    setHeroExiting(true);
    window.setTimeout(() => {
      navigate('/community-hub/content');
    }, HERO_EXIT_MS);
  }, [navigate]);

  return (
    <div className="community-hub-root font-sans">
      <section
        className={`community-hub-hero${heroExiting ? ' community-hub-hero--exiting' : ''}`}
        style={{
          '--hub-hero-image': `url("${HERO_BG}")`,
        }}
      >
        <CommunityHubHeader />

        <div className="community-hub-hero-center">
          <div className="community-hub-title-block">
            <div className="community-hub-title-row">
              <h1 className="community-hub-hero-title">SLIIT</h1>
              <button
                type="button"
                className="community-hub-title-dropdown"
                onClick={goToHubContent}
                disabled={heroExiting}
                aria-label="Continue to Community Hub"
              >
                <svg
                  className="community-hub-title-chevron"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  aria-hidden
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <p className="community-hub-hero-tagline">Community Hub</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CommunityHub;
