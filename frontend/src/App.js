import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import ChatBot from './ChatBot';
import Dashboard from './Dashboard';
import LandingPage from './LandingPage'; // Make sure you have created LandingPage.js
import CommunityHub from './socialpost/CommunityHub';
import CommunityHubContent from './socialpost/CommunityHubContent';
import CommunityHubEventDetail from './socialpost/CommunityHubEventDetail';
import ReportItem from './ReportItem';
import ItemDetailPage from './ItemDetailPage';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import ProtectedAdminRoute from './ProtectedAdminRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* The professional Entry Point of the site */}
        <Route path="/" element={<LandingPage />} />

        {/* Admin login (hardcoded admin — no registration) */}
        <Route path="/login" element={<AdminLogin />} />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />
        
        {/* AI Assistant Registration - Dedicated for new users */}
        <Route path="/onboarding" element={
          <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-5 font-sans">
            <h1 className="text-4xl font-extrabold text-blue-800 mb-8 tracking-tight text-center">
              Welcome to ResQ <br/>
              <span className="text-lg font-medium text-gray-500">Let's set up your profile</span>
            </h1>
            <ChatBot />
          </div>
        } />
        
        {/* The Main Application Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Community Hub — hero → list → event detail (video autoplays on detail) */}
        <Route path="/community-hub" element={<CommunityHub />} />
        <Route path="/community-hub/content/:eventId" element={<CommunityHubEventDetail />} />
        <Route path="/community-hub/content" element={<CommunityHubContent />} />

        {/* Report Item Page */}
        <Route path="/report-item" element={<ReportItem />} />

        {/* Lost & found item detail */}
        <Route path="/items/:itemId" element={<ItemDetailPage />} />
      </Routes>
    </Router>
  );
}

export default App;