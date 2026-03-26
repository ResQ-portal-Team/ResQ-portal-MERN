import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import { ThemeProvider } from './ThemeContext';
import ThemeToggle from './ThemeToggle';
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
import ContactUs from './ContactUs';
import AboutUs from './AboutUs';

// 🆕 NEW CHAT COMPONENTS
import MyChats from './MyChats';
import ChatWindow from './ChatWindow';

function App() {
  return (
    <ThemeProvider>
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
          <Route
            path="/onboarding"
            element={
              <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-5 font-sans dark:bg-slate-950 dark:text-slate-100">
                <h1 className="mb-8 text-center text-4xl font-extrabold tracking-tight text-blue-800 dark:text-blue-400">
                  Welcome to ResQ <br />
                  <span className="text-lg font-medium text-gray-500 dark:text-slate-400">
                    Let's set up your profile
                  </span>
                </h1>
                <ChatBot />
              </div>
            }
          />

          {/* The Main Application Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* 🆕 CHAT ROUTES */}
          <Route path="/chats" element={<MyChats />} />
          <Route path="/chat/:chatRoomId" element={<ChatWindow />} />

          {/* Community Hub — hero → list → event detail (video autoplays on detail) */}
          <Route path="/community-hub" element={<CommunityHub />} />
          <Route path="/community-hub/content/:eventId" element={<CommunityHubEventDetail />} />
          <Route path="/community-hub/content" element={<CommunityHubContent />} />

          {/* Report Item Page */}
          <Route path="/report-item" element={<ReportItem />} />

          {/* Item Detail Page */}
          <Route path="/items/:itemId" element={<ItemDetailPage />} />

          {/* Contact Us */}
          <Route path="/contact" element={<ContactUs />} />

          <Route path="/about" element={<AboutUs />} />
        </Routes>
        <ThemeToggle />
      </Router>
    </ThemeProvider>
  );
}

export default App;