import React, { useState, useEffect } from 'react';
import { Trophy, Award, Medal, Crown, Star, TrendingUp, Loader, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
  }, [timeFrame]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('resqToken');
      const response = await fetch(`/api/users/leaderboard?time=${timeFrame}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-8 h-8 text-yellow-500" />;
    if (index === 1) return <Award className="w-7 h-7 text-gray-400" />;
    if (index === 2) return <Medal className="w-7 h-7 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center font-bold text-gray-400">{index + 1}</span>;
  };

  const getGradient = (index) => {
    if (index === 0) return 'from-yellow-500 to-orange-500';
    if (index === 1) return 'from-gray-400 to-gray-500';
    if (index === 2) return 'from-amber-600 to-amber-700';
    return 'from-blue-500 to-purple-500';
  };

  const getRankBadge = (index) => {
    if (index === 0) return '👑 Champion';
    if (index === 1) return '🥈 Runner Up';
    if (index === 2) return '🥉 Third Place';
    return `#${index + 1}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 🆕 Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-full shadow-lg mb-4">
            <Trophy className="w-6 h-6" />
            <span className="font-bold text-lg">Trust Leaderboard</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Top Helpers</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Students who helped return the most items
          </p>
        </div>

        {/* Time Filter */}
        <div className="flex justify-center gap-3 mb-8">
          <button
            onClick={() => setTimeFrame('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              timeFrame === 'all' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setTimeFrame('week')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              timeFrame === 'week' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeFrame('month')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              timeFrame === 'month' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            This Month
          </button>
        </div>

        {/* Leaderboard List */}
        {users.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No data yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Start helping others to appear on the leaderboard!
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-6 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Browse Items
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user, index) => (
              <div
                key={user._id}
                className={`bg-gradient-to-r ${getGradient(index)} rounded-xl p-5 text-white shadow-lg transform transition hover:scale-102 hover:shadow-xl`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {getRankIcon(index)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-lg">{user.nickname || user.realName}</p>
                        {index === 0 && <Crown className="w-4 h-4 text-yellow-300" />}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm opacity-90">
                          {getRankBadge(index)}
                        </span>
                        <span className="text-xs opacity-75 flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {user.itemsReturned || 0} items returned
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">{user.trustScore || 0}</p>
                    <p className="text-xs opacity-75">points</p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-white/30 rounded-full h-2">
                    <div
                      className="bg-white h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(((user.trustScore || 0) / 500) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex justify-between mt-3 text-xs opacity-75">
                  <span>📦 {user.itemsFound || 0} found</span>
                  <span>🔍 {user.itemsLost || 0} lost</span>
                  <span>✅ {user.successfulHandovers || 0} handovers</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Info Card */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-800 dark:text-white">How to earn points?</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span className="text-gray-600 dark:text-gray-300">Report a found item</span>
              <span className="text-green-600 font-bold ml-auto">+10</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span className="text-gray-600 dark:text-gray-300">Successfully return item (OTP)</span>
              <span className="text-green-600 font-bold ml-auto">+50</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span className="text-gray-600 dark:text-gray-300">Help others in chat</span>
              <span className="text-green-600 font-bold ml-auto">+5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;