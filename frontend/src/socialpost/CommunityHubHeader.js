import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Same bar as /community-hub: SLIIT University + Home.
 * @param {{ sticky?: boolean }} props — sticky top bar on /community-hub/content
 */
const CommunityHubHeader = ({ sticky = false }) => {
  const navigate = useNavigate();

  return (
    <header
      className={`community-hub-nav${sticky ? ' community-hub-nav--sticky' : ''}`}
      role="banner"
    >
      <div className="community-hub-nav-inner">
        <div className="community-hub-nav-main">
          <button type="button" className="community-hub-logo" onClick={() => navigate('/')}>
            SLIIT University
          </button>
          <nav className="community-hub-main-links" aria-label="Site">
            <button type="button" onClick={() => navigate('/')}>
              Home
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default CommunityHubHeader;
