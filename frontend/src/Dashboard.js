import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const stats = [];
  const recentPosts = [];

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

  const handleLoginInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (!loginData.email || !loginData.password) {
      setLoginError('Please enter both email and password.');
      return;
    }

    try {
      setLoginLoading(true);
      const requestBody = JSON.stringify(loginData);
      let response;

      try {
        response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody,
        });
      } catch (primaryError) {
        response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody,
        });
      }

      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : {};
      if (!response.ok) {
        setLoginError(data?.message || 'Login failed. Please try again.');
        return;
      }

      localStorage.setItem('resqToken', data.token);
      localStorage.setItem('resqUser', JSON.stringify(data.user));
      setCurrentUser(data.user);
      setShowLogin(false);
      setLoginData({ email: '', password: '' });
    } catch (error) {
      setLoginError('Cannot reach backend server. Please make sure backend is running on port 5000.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('resqToken');
    localStorage.removeItem('resqUser');
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center px-8 sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-blue-600 p-2 rounded-lg text-white font-bold text-sm">ResQ</div>
          <span className="text-xl font-bold text-gray-800 tracking-tight text-center">Portal</span>
        </div>
        <div className="flex items-center gap-6">
          <button
            className="text-gray-600 font-medium hover:text-blue-600 transition"
            onClick={() => navigate('/community-hub')}
          >
            Community Hub
          </button>
          {currentUser ? (
            <button
              onClick={() => setShowProfile(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition shadow-md shadow-blue-200"
            >
              My Profile
            </button>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition shadow-md shadow-blue-200"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Hero Header Section */}
      <div className="relative bg-blue-900 text-white py-20 px-8 text-center bg-cover bg-center" style={{backgroundImage: 'linear-gradient(rgba(0,0,30,0.7), rgba(0,0,30,0.7)), url("https://images.unsplash.com/photo-1523050853023-8c2d29149f0b?auto=format&fit=crop&q=80")'}}>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">Lost Something? <span className="text-yellow-400">We'll Help.</span></h1>
          <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto font-light leading-relaxed">Report lost items, browse found belongings, and connect with fellow students on the SLIIT campus.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg">
              🔍 Browse Items
            </button>
            <button className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 px-8 py-4 rounded-xl font-bold text-lg transition-all">
              Report an Item →
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="max-w-6xl mx-auto -mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 px-4 relative z-20">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow border border-gray-100 flex flex-col items-center text-center">
            <div className="text-3xl mb-3">{stat.icon}</div>
            <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">{stat.label}</div>
          </div>
        ))}
        {stats.length === 0 && (
          <div className="col-span-2 md:col-span-4 bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center text-gray-500 font-medium">
            No statistics available yet.
          </div>
        )}
      </div>

      {/* Recent Posts Section */}
      <div className="max-w-6xl mx-auto py-20 px-4">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Recent Posts</h2>
            <p className="text-gray-500">Latest lost & found reports from across the campus</p>
          </div>
          <button className="text-blue-600 font-bold hover:text-blue-800 transition flex items-center gap-1 group">
            View All <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

        {/* Item Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recentPosts.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 bg-white rounded-3xl shadow-md border border-gray-100 p-10 text-center text-gray-500 font-medium">
              No recent posts yet.
            </div>
          )}
        </div>
      </div>

      {/* Login Modal Overlay */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in duration-300">
            <button onClick={() => setShowLogin(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl">✕</button>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login to ResQ</h2>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <input
                type="email"
                name="email"
                value={loginData.email}
                onChange={handleLoginInputChange}
                placeholder="Student Email"
                className="w-full p-4 border border-gray-100 bg-gray-50 rounded-xl outline-none focus:border-blue-600 transition-all"
              />
              <input
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginInputChange}
                placeholder="Password"
                className="w-full p-4 border border-gray-100 bg-gray-50 rounded-xl outline-none focus:border-blue-600 transition-all"
              />
              {loginError && (
                <p className="text-sm text-red-600 font-medium">{loginError}</p>
              )}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-70"
              >
                {loginLoading ? 'Signing In...' : 'Sign In'}
              </button>
              <p className="text-center text-sm text-gray-500 mt-4">
                Don't have an account? <span onClick={() => navigate('/onboarding')} className="text-blue-600 font-bold cursor-pointer hover:underline">Register with AI</span>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && currentUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-xl relative animate-in fade-in zoom-in duration-300">
            <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl">✕</button>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">My Profile</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase font-bold">Full Name</p>
                <p className="text-gray-800 font-semibold mt-1">{currentUser.realName}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase font-bold">Nickname</p>
                <p className="text-gray-800 font-semibold mt-1">{currentUser.nickname}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase font-bold">Student ID</p>
                <p className="text-gray-800 font-semibold mt-1">{currentUser.studentId}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase font-bold">Email</p>
                <p className="text-gray-800 font-semibold mt-1">{currentUser.email}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowProfile(false)}
                className="px-5 py-2 rounded-full font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setShowProfile(false);
                }}
                className="bg-gray-800 text-white px-5 py-2 rounded-full font-bold hover:bg-black transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Bot Access (logged-out users only) */}
      {!currentUser && (
        <button 
          onClick={() => navigate('/onboarding')}
          className="fixed bottom-8 right-8 bg-blue-600 text-white p-5 rounded-2xl shadow-2xl hover:bg-blue-700 hover:-translate-y-2 transition-all flex items-center gap-3 group z-50"
        >
          <span className="font-bold text-sm tracking-tight">Register via Bot</span>
          <span className="text-2xl group-hover:rotate-12 transition-transform">🤖</span>
        </button>
      )}

      <footer className="text-center py-12 text-gray-400 text-xs font-medium border-t bg-white mt-12">
        © 2026 ResQ Portal — SLIIT Campus. Built for students, by students.
      </footer>
    </div>
  );
};

export default Dashboard;