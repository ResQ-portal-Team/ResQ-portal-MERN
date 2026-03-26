import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('resqToken');
      if (!token) return;
      
      const response = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setNotifications(result.notifications);
        const unread = result.notifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId, notification) => {
    try {
      console.log('🔔 1. Notification clicked:', notification);
      
      const token = localStorage.getItem('resqToken');
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => prev - 1);
      
      // Handle match_found notification
      if (notification.type === 'match_found') {
        // Get matchData from notification
        const matchDataFromNotification = notification.matchData;
        const matchedItemId = matchDataFromNotification?.matchedItemId;
        
        console.log('📦 matchDataFromNotification:', matchDataFromNotification);
        
        const matchData = {
          yourItem: {
            _id: notification.itemId,
            title: notification.itemTitle,
            type: notification.message?.includes('lost item') ? 'lost' : 'found',
            location: matchDataFromNotification?.yourItemLocation || '',
            date: matchDataFromNotification?.yourItemDate || new Date().toISOString(),
            image: matchDataFromNotification?.yourItemImage || null
          },
          matchedItem: matchedItemId ? {
            _id: matchDataFromNotification.matchedItemId,
            title: matchDataFromNotification.matchedItemTitle,
            image: matchDataFromNotification.matchedItemImage,
            location: matchDataFromNotification.matchedItemLocation,
            date: matchDataFromNotification.matchedItemDate,
            description: matchDataFromNotification.matchedItemDescription,
            type: matchDataFromNotification.matchedItemType,
            postedBy: matchDataFromNotification.matchedItemPostedBy
          } : null,
          score: matchDataFromNotification?.score || notification.matchScore || 0,
          commonFeatures: matchDataFromNotification?.commonFeatures || {}
        };
        
        console.log('📦 2. Storing match data:', matchData);
        localStorage.setItem('pendingMatchConfirmation', JSON.stringify(matchData));
        localStorage.setItem('pendingMatchNotificationId', notificationId);
        
        // Verify storage
        const stored = localStorage.getItem('pendingMatchConfirmation');
        console.log('✅ 3. Verification - stored data:', stored ? 'YES' : 'NO');
        
        if (matchedItemId) {
          console.log('🔗 4. Navigating to:', `/items/${matchedItemId}?confirmMatch=true`);
          navigate(`/items/${matchedItemId}?confirmMatch=true`);
        } else {
          console.log('🔗 4. Navigating to:', `/items/${notification.itemId}?confirmMatch=true`);
          navigate(`/items/${notification.itemId}?confirmMatch=true`);
        }
      } else if (notification.type === 'item_returned') {
        navigate(`/items/${notification.itemId}`);
      } else if (notification.chatRoomId) {
        navigate(`/chat/${notification.chatRoomId}`);
      } else if (notification.itemId) {
        navigate(`/items/${notification.itemId}`);
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'match_found':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'item_returned':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationMessage = (notification) => {
    if (notification.type === 'match_found') {
      return notification.message || '🎉 A potential match was found for your item!';
    }
    if (notification.type === 'item_returned') {
      return '✅ Item successfully returned! +50 trust points!';
    }
    return notification.message;
  };

  const getMatchPercentage = (notification) => {
    if (notification.matchScore) {
      return Math.round((notification.matchScore / 115) * 100);
    }
    return null;
  };

  const getScoreBarColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    When someone matches with your item, you'll see it here
                  </p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const matchPercentage = getMatchPercentage(notification);
                  const isMatchFound = notification.type === 'match_found';
                  
                  return (
                    <div
                      key={notification._id}
                      onClick={() => markAsRead(notification._id, notification)}
                      className={`p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-green-500' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                            {getNotificationMessage(notification)}
                          </p>
                          {notification.itemTitle && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Item: {notification.itemTitle}
                            </p>
                          )}
                          
                          {isMatchFound && matchPercentage !== null && (
                            <div className="mt-2">
                              <div className="flex justify-between items-center text-xs mb-1">
                                <span className="text-gray-500 dark:text-gray-400">Match confidence</span>
                                <span className={`font-semibold ${
                                  matchPercentage >= 80 ? 'text-green-600' : 
                                  matchPercentage >= 60 ? 'text-yellow-600' : 
                                  'text-orange-600'
                                }`}>
                                  {matchPercentage}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div 
                                  className={`${getScoreBarColor(matchPercentage)} h-1.5 rounded-full transition-all duration-300`}
                                  style={{ width: `${matchPercentage}%` }}
                                />
                              </div>
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-center">
                <button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('resqToken');
                      await fetch('/api/notifications/mark-all-read', {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      fetchNotifications();
                    } catch (error) {
                      console.error('Failed to mark all as read:', error);
                    }
                  }}
                  className="text-xs text-green-600 dark:text-green-400 hover:text-green-700"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;