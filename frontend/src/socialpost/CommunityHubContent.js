import React from 'react';
import CommunityHubHeader from './CommunityHubHeader';
import './CommunityHub.css';

const CommunityHubContent = () => {
  return (
    <div className="community-hub-content-page font-sans">
      <CommunityHubHeader sticky />

      <main id="hub-content" className="community-hub-content community-hub-content--empty" aria-label="Community Hub" />
    </div>
  );
};

export default CommunityHubContent;
