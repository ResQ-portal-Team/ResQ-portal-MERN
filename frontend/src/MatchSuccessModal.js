import React, { useState } from 'react';
import { X, MapPin, Calendar, CheckCircle, MessageCircle, ExternalLink } from 'lucide-react';

const MatchSuccessModal = ({ matchData, onClose, onViewDetails, onStartChat }) => {
  const selectedMatch = matchData?.matches?.[0] || null;
  
  if (!selectedMatch || !matchData) return null;
  
  const scorePercentage = Math.round((selectedMatch.score / 115) * 100);
  
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
  
  const getScoreText = (score) => {
    if (score >= 80) return 'Excellent Match! 🎯';
    if (score >= 60) return 'Good Match 👍';
    return 'Potential Match 🤔';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header with Celebration */}
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">🎉 Match Found!</h2>
              <p className="text-green-100 mt-1">
                {matchData.yourItem?.type === 'lost' 
                  ? "Your lost item may have been found!" 
                  : "Someone might be looking for this item!"}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Score Card */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Match Confidence</span>
              <div className="text-right">
                <span className={`text-2xl font-bold ${getScoreColor(scorePercentage)}`}>
                  {scorePercentage}%
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{getScoreText(scorePercentage)}</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4">
              <div
                className={`${getScoreBgColor(scorePercentage)} h-4 rounded-full transition-all duration-700`}
                style={{ width: `${scorePercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Based on location, date, description, and visual similarity
            </p>
          </div>

          {/* Items Comparison */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Your Item */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300">
                  Your {matchData.yourItem?.type === 'lost' ? 'Lost' : 'Found'} Item
                </h3>
              </div>
              <div className="p-4">
                {matchData.yourItem?.image && (
                  <img 
                    src={matchData.yourItem.image} 
                    alt={matchData.yourItem.title} 
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                )}
                <h4 className="font-bold text-gray-900 dark:text-white">{matchData.yourItem?.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {matchData.yourItem?.description}
                </p>
                <div className="mt-3 flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{matchData.yourItem?.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(matchData.yourItem?.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Matched Item */}
            <div className="border border-green-200 dark:border-green-700 rounded-xl overflow-hidden shadow-lg ring-2 ring-green-200 dark:ring-green-800">
              <div className="bg-green-50 dark:bg-green-900/30 p-3 border-b border-green-200 dark:border-green-700">
                <h3 className="font-semibold text-green-900 dark:text-green-300">
                  Potential {selectedMatch.item?.type === 'lost' ? 'Lost' : 'Found'} Item
                </h3>
              </div>
              <div className="p-4">
                {selectedMatch.item?.image && (
                  <img 
                    src={selectedMatch.item.image} 
                    alt={selectedMatch.item.title} 
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                )}
                <h4 className="font-bold text-gray-900 dark:text-white">{selectedMatch.item?.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {selectedMatch.item?.description}
                </p>
                <div className="mt-3 flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{selectedMatch.item?.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(selectedMatch.item?.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Common Features */}
          {(selectedMatch.commonFeatures?.commonAITags?.length > 0 || 
            selectedMatch.commonFeatures?.commonWords?.length > 0 ||
            selectedMatch.commonFeatures?.locationMatch ||
            selectedMatch.commonFeatures?.dateMatch) && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">✅ Matching Features:</p>
              <div className="flex flex-wrap gap-2">
                {selectedMatch.commonFeatures?.locationMatch && (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm rounded-full">
                    📍 Same Location
                  </span>
                )}
                {selectedMatch.commonFeatures?.dateMatch && (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm rounded-full">
                    📅 Within 7 Days
                  </span>
                )}
                {selectedMatch.commonFeatures?.commonAITags?.slice(0, 3).map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm rounded-full">
                    🏷️ #{tag}
                  </span>
                ))}
                {selectedMatch.commonFeatures?.commonWords?.slice(0, 3).map((word, idx) => (
                  <span key={idx} className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-sm rounded-full">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Score Breakdown */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
              <div className="font-bold text-gray-700 dark:text-gray-300">Date</div>
              <div className="text-green-600 dark:text-green-400 font-semibold">
                {selectedMatch.commonFeatures?.dateMatch ? '25' : '0'}/25
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
              <div className="font-bold text-gray-700 dark:text-gray-300">Location</div>
              <div className="text-green-600 dark:text-green-400 font-semibold">
                {selectedMatch.commonFeatures?.locationMatch ? '25' : '0'}/25
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
              <div className="font-bold text-gray-700 dark:text-gray-300">Text</div>
              <div className="text-green-600 dark:text-green-400 font-semibold">
                {Math.min((selectedMatch.commonFeatures?.commonWords?.length || 0) * 8, 30)}/30
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
              <div className="font-bold text-gray-700 dark:text-gray-300">AI Tags</div>
              <div className="text-green-600 dark:text-green-400 font-semibold">
                {Math.min((selectedMatch.commonFeatures?.commonAITags?.length || 0) * 15, 35)}/35
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => onViewDetails(selectedMatch.item?._id)}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Full Details</span>
            </button>
            <button
              onClick={() => onStartChat(selectedMatch.item?._id, selectedMatch.item?.postedBy)}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition flex items-center justify-center space-x-2 shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Start Anonymous Chat</span>
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
            🔒 Your identity is protected. You'll chat using your nickname only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MatchSuccessModal;