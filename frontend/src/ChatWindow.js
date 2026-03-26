import React, { useState, useEffect, useRef } from 'react';
import { Send, Shield, Lock, CheckCircle, ArrowLeft, Loader } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';

const ChatWindow = () => {
  const { chatRoomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { chatRoom: initialRoom, otherUser: initialOther, item: initialItem } = location.state || {};
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [chatRoom, setChatRoom] = useState(initialRoom);
  const [otherUser, setOtherUser] = useState(initialOther);
  const [item, setItem] = useState(initialItem);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatingOTP, setGeneratingOTP] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);
    
    if (!chatRoom || !otherUser) {
      fetchChatRoomDetails();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (chatRoomId && currentUser) {
      connectSocket();
      fetchMessages();
    }
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [chatRoomId, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatRoomDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/chat/rooms`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const room = data.chatRooms.find(r => r._id === chatRoomId);
        if (room) {
          setChatRoom(room);
          const currentUserId = currentUser?.id;
          const other = room.participants?.find(p => p.userId?._id !== currentUserId);
          setOtherUser(other?.userId);
          setItem(room.itemId);
        }
      }
    } catch (error) {
      console.error('Failed to fetch chat details:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectSocket = () => {
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');
    setSocket(newSocket);
    
    newSocket.emit('join-room', chatRoomId);
    
    newSocket.on('receive-message', (message) => {
      setMessages(prev => [...prev, message]);
    });
    
    newSocket.on('user-typing', () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 1000);
    });
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/chat/room/${chatRoomId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;
    
    socket.emit('send-message', {
      chatRoomId,
      senderId: currentUser?.id,
      senderNickname: currentUser?.nickname,
      text: newMessage
    });
    setNewMessage('');
  };

  const handleTyping = () => {
    if (!socket) return;
    socket.emit('typing', { chatRoomId, userId: currentUser?.id });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { chatRoomId });
    }, 1000);
  };

  const generateOTP = async () => {
    setGeneratingOTP(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/chat/room/${chatRoomId}/otp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        alert(`OTP Generated: ${data.otp}\n\nShare this with the other person.\nExpires in 15 minutes.`);
      }
    } catch (error) {
      console.error('Failed to generate OTP:', error);
      alert('Failed to generate OTP');
    } finally {
      setGeneratingOTP(false);
    }
  };

  const verifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/chat/room/${chatRoomId}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otp: otpCode })
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setShowOTPModal(false);
        setOtpCode('');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      alert('Failed to verify OTP');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-4 shadow flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/chats')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">{otherUser?.nickname || 'User'}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{item?.title}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-green-600" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Anonymous Chat</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.senderId === currentUser?.id ? 'text-right' : 'text-left'}>
            <div className={`inline-block max-w-xs px-4 py-2 rounded-lg ${
              msg.senderId === currentUser?.id 
                ? 'bg-green-600 text-white' 
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
            }`}>
              <div className="text-xs opacity-75 mb-1">{msg.senderNickname}</div>
              <div>{msg.text}</div>
              <div className="text-xs opacity-50 mt-1">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="text-left">
            <div className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg px-4 py-2 text-sm">
              {otherUser?.nickname} is typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            onKeyUp={handleTyping}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="flex justify-between items-center mt-3">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Lock className="w-3 h-3 mr-1" />
            Anonymous chat - real identity hidden
          </div>
          <button
            onClick={generateOTP}
            disabled={generatingOTP}
            className="px-3 py-1 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition disabled:opacity-50 flex items-center space-x-1"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{generatingOTP ? 'Generating...' : 'Ready to Handover'}</span>
          </button>
        </div>
      </div>

      {/* OTP Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Verify Handover</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Enter the 6-digit OTP code shared by the other person:
            </p>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="Enter 6-digit OTP"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 dark:bg-gray-700 dark:text-white"
              maxLength={6}
            />
            <div className="flex space-x-2">
              <button
                onClick={() => setShowOTPModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={verifyOTP}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Verify & Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;