import React from 'react';
import { X, MapPin, Calendar, CheckCircle, XCircle } from 'lucide-react';

const MatchConfirmationModal = ({ matchData, onClose, onConfirm, onReject }) => {
  const scorePercentage = Math.round((matchData.score / 115) * 100);
  const yourItem = matchData.yourItem;
  const matchedItem = matchData.matchedItem;
  
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };
  
  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 rounded-t-2xl">
          <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">🎯 Match Found!</h2>
              <p className="text-blue-100 text-sm">We found a potential match for your item</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Score Card */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold">Match Confidence</span>
              <span className={`text-2xl font-bold ${getScoreColor(scorePercentage)}`}>
                {scorePercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className={`${getScoreBgColor(scorePercentage)} h-3 rounded-full transition-all`} 
                   style={{ width: `${scorePercentage}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Based on location, date, description, and visual similarity
            </p>
          </div>

          {/* Items Comparison */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-xl p-4">
              <h3 className="font-bold text-gray-900 mb-2">Your {yourItem.type === 'lost' ? 'Lost' : 'Found'} Item</h3>
              {yourItem.image && (
                <img src={yourItem.image} alt={yourItem.title} className="w-full h-32 object-cover rounded-lg mb-2" />
              )}
              <p className="font-semibold">{yourItem.title}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <MapPin className="w-3 h-3" /> {yourItem.location}
                <Calendar className="w-3 h-3 ml-2" /> {new Date(yourItem.date).toLocaleDateString()}
              </div>
            </div>
            
            <div className="border border-green-200 bg-green-50 rounded-xl p-4">
              <h3 className="font-bold text-green-700 mb-2">Matched Item</h3>
              {matchedItem.image && (
                <img src={matchedItem.image} alt={matchedItem.title} className="w-full h-32 object-cover rounded-lg mb-2" />
              )}
              <p className="font-semibold">{matchedItem.title}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <MapPin className="w-3 h-3" /> {matchedItem.location}
                <Calendar className="w-3 h-3 ml-2" /> {matchedItem.date ? new Date(matchedItem.date).toLocaleDateString() : 'Date not specified'}
              </div>
            </div>
          </div>

          {/* Common Features */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-sm font-semibold mb-2">✅ Matching Features:</p>
            <div className="flex flex-wrap gap-2">
              {matchData.commonFeatures?.locationMatch && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">📍 Same Location</span>
              )}
              {matchData.commonFeatures?.dateMatch && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">📅 Within 7 Days</span>
              )}
              {matchData.commonFeatures?.commonAITags?.slice(0, 3).map((tag, i) => (
                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">🏷️ #{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* 🔥 YES/NO BUTTONS */}
        <div className="border-t p-5 flex gap-3">
          <button
            onClick={onReject}
            className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5" /> No, it's not correct 😔
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" /> Yes, it's correct! 🎉
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 pb-5">
          Chat is anonymous — only your nickname will be visible
        </p>
      </div>
    </div>
  );
};

export default MatchConfirmationModal;