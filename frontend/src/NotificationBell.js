import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, TrendingUp, MessageCircle, BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });
    
    socket.on('connect', () => {
      console.log('✅ Socket connected for notifications!');
      const user = JSON.parse(localStorage.getItem('resqUser'));
      if (user && user.id) {
        socket.emit('user-online', { chatRoomId: 'global', userId: user.id });
      }
    });
    
    socket.on('new-notification', (data) => {
      console.log('🔔 New notification received:', data);
      fetchNotifications();
    });
    
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
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

  // 🔥 Mark all as read function
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('resqToken');
      await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotifications(); // Refresh
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // 🔥 Toggle dropdown - mark all as read when opening
  const toggleDropdown = async () => {
    if (!isOpen) {
      // Opening dropdown - mark all as read
      await markAllAsRead();
    }
    setIsOpen(!isOpen);
  };

  const markAsRead = async (notificationId, notification) => {
    try {
      const token = localStorage.getItem('resqToken');
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => prev - 1);
      
      // Handle different notification types
      if (notification.type === 'match_found') {
        const matchDataFromNotification = notification.matchData;
        const matchedItemId = matchDataFromNotification?.matchedItemId;
        
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
        
        localStorage.setItem('pendingMatchConfirmation', JSON.stringify(matchData));
        localStorage.setItem('pendingMatchNotificationId', notificationId);
        
        if (matchedItemId) {
          navigate(`/items/${matchedItemId}?confirmMatch=true`);
        } else {
          navigate(`/items/${notification.itemId}?confirmMatch=true`);
        }
      } else if (notification.type === 'new_message') {
        if (notification.chatRoomId) {
          navigate(`/chat/${notification.chatRoomId}`);
        }
      } else if (notification.type === 'new_post') {
        if (notification.itemId) {
          navigate(`/items/${notification.itemId}`);
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
      case 'new_message':
        return <MessageCircle className="w-5 h-5 text-purple-500" />;
      case 'new_post':
        return <BellRing className="w-5 h-5 text-orange-500" />;
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
    if (notification.type === 'new_message') {
      return notification.message || '📩 New message received!';
    }
    if (notification.type === 'new_post') {
      return notification.message || '📢 New post that might interest you!';
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
        onClick={toggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full animate-pulse">
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
                    When someone posts an item, matches with you, or sends a message, you'll see it here
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
                          {notification.itemTitle && notification.type !== 'new_post' && (
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
                    await markAllAsRead();
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