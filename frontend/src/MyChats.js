import React, { useState, useEffect } from 'react';
import { MessageCircle, MapPin, Calendar, ChevronRight, Loader, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SiteFooter from './SiteFooter';

const MyChats = () => {
  const navigate = useNavigate();
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('resqUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('📦 Current user loaded:', user);
        setCurrentUser(user);
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchChatRooms();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchChatRooms = async () => {
    try {
      const token = localStorage.getItem('resqToken');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      console.log('📡 Fetching chat rooms for user:', currentUser?.id);
      
      const response = await fetch('/api/chat/rooms', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('📡 Raw chat rooms:', data.chatRooms?.length);
      
      if (data.success && data.chatRooms) {
        const userRoomsMap = new Map();
        
        data.chatRooms.forEach(room => {
          const otherParticipant = room.participants?.find(p => {
            const userId = p.userId?._id || p.userId;
            return userId !== currentUser?.id;
          });
          
          if (otherParticipant) {
            const otherUserId = otherParticipant.userId?._id || otherParticipant.userId;
            
            if (!userRoomsMap.has(otherUserId) || 
                new Date(room.updatedAt) > new Date(userRoomsMap.get(otherUserId).updatedAt)) {
              userRoomsMap.set(otherUserId, room);
            }
          }
        });
        
        const groupedRooms = Array.from(userRoomsMap.values());
        
        const filteredRooms = groupedRooms.filter(room => {
          if (room.lastMessage && room.lastMessage.text) {
            if (room.lastMessage.text === 'Chat started. Your identity is protected!') {
              return false;
            }
            return true;
          }
          return false;
        });
        
        console.log(`✅ Final rooms to show: ${filteredRooms.length}`);
        setChatRooms(filteredRooms);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOtherParticipant = (room) => {
    if (!currentUser || !room.participants) return null;
    
    const other = room.participants.find(p => {
      const userId = p.userId?._id || p.userId;
      return userId !== currentUser.id;
    });
    
    return other?.userId;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-1 items-center justify-center p-6">
          <Loader className="h-8 w-8 animate-spin text-green-600" />
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto w-full max-w-4xl flex-1 p-6">
      {/* Back to Dashboard Button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 transition"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to dashboard
      </button>
      
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">My Conversations</h1>
      
      {chatRooms.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No conversations yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            When you match with someone and start chatting, conversations will appear here
          </p>
          <Link
            to="/dashboard"
            className="inline-block mt-6 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Browse Items
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {chatRooms.map((room) => {
            const otherUser = getOtherParticipant(room);
            const unreadBadge = room.unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {room.unreadCount}
              </span>
            );
            
            return (
              <Link
                key={room._id}
                to={`/chat/${room._id}`}
                state={{ chatRoom: room, otherUser, item: room.itemId }}
                className="block bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {otherUser?.nickname || otherUser?.realName || 'Anonymous'}
                          </h3>
                          {unreadBadge}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {room.itemId?.title || 'Item'}
                        </p>
                        {room.lastMessage && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-1">
                            {room.lastMessage.text}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" />
                        <span>{room.itemId?.location || 'Unknown'}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(room.updatedAt).toLocaleDateString()}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 mt-2" />
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      room.status === 'active' ? 'bg-green-100 text-green-700' :
                      room.status === 'handover' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {room.status === 'active' ? 'Active Chat' :
                       room.status === 'handover' ? 'Handover Ready' :
                       'Completed'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      </div>
      <SiteFooter />
    </div>
  );
};

export default MyChats;