import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import ChatBot from './ChatBot';
import Dashboard from './Dashboard';
import LandingPage from './LandingPage';
import CommunityHub from './socialpost/CommunityHub';
import CommunityHubContent from './socialpost/CommunityHubContent';
import CommunityHubEventDetail from './socialpost/CommunityHubEventDetail';
import ReportItem from './ReportItem';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import ItemDetailPage from './ItemDetailPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={<AdminLogin />} />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/onboarding"
          element={
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-5 font-sans">
              <h1 className="text-4xl font-extrabold text-blue-800 mb-8 tracking-tight text-center">
                Welcome to ResQ <br />
                <span className="text-lg font-medium text-gray-500">Let's set up your profile</span>
              </h1>
              <ChatBot />
            </div>
          }
        />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/community-hub" element={<CommunityHub />} />
        <Route path="/community-hub/content/:eventId" element={<CommunityHubEventDetail />} />
        <Route path="/community-hub/content" element={<CommunityHubContent />} />

        <Route path="/report-item" element={<ReportItem />} />

        <Route path="/items/:itemId" element={<ItemDetailPage />} />
      </Routes>
    </Router>
  );
}

export default App;
