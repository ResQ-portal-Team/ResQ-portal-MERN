import React, { useState, useEffect, useRef } from 'react';
import { Send, Shield, Lock, CheckCircle, ArrowLeft, Loader, MessageCircle, Wifi, WifiOff } from 'lucide-react';
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
  const [generatedOTP, setGeneratedOTP] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const avatarGradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
    'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  ];

  const getAvatarGradient = (name) => {
    const index = (name?.length || 0) % avatarGradients.length;
    return avatarGradients[index];
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  useEffect(() => {
    const userStr = localStorage.getItem('resqUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (chatRoomId && currentUser) {
      fetchMessages();
      connectSocket();
    }
    return () => {
      if (socket) socket.disconnect();
    };
  }, [chatRoomId, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('resqToken');
      const response = await fetch(`/api/chat/room/${chatRoomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setMessages(data.messages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectSocket = () => {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });
    
    newSocket.on('connect', () => {
      console.log('✅ Socket connected!');
      setSocketConnected(true);
      newSocket.emit('user-online', { chatRoomId, userId: currentUser?.id });
      newSocket.emit('join-room', chatRoomId);
    });
    
    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
      setSocketConnected(false);
    });
    
    // 🆕 Handle validation errors from server
    newSocket.on('error', (error) => {
      console.error('❌ Server error:', error);
      alert(error.message);
    });
    
    newSocket.on('receive-message', (message) => {
      console.log('📨 Received message:', message);
      setMessages(prev => [...prev, message]);
    });
    
    newSocket.on('user-typing', () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 1000);
    });

    // Other user came online in this room
    newSocket.on('user-joined', ({ userId }) => {
      if (userId !== currentUser?.id) {
        setOtherUserOnline(true);
      }
    });

    // Other user left / disconnected
    newSocket.on('user-left', ({ userId }) => {
      if (userId !== currentUser?.id) {
        setOtherUserOnline(false);
      }
    });
    
    setSocket(newSocket);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    if (!socket || !socketConnected) {
      alert('Chat not connected. Please refresh the page.');
      return;
    }
    if (!currentUser) {
      alert('Please login again.');
      return;
    }
    const messageData = {
      chatRoomId,
      senderId: currentUser.id,
      senderNickname: currentUser.nickname || currentUser.realName || 'User',
      text: newMessage.trim(),
    };
    socket.emit('send-message', messageData);
    setNewMessage('');
  };

  const handleTyping = () => {
    if (!socket || !socketConnected) return;
    socket.emit('typing', { chatRoomId, userId: currentUser?.id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { chatRoomId });
    }, 1000);
  };

  const generateOTP = async () => {
    setGeneratingOTP(true);
    try {
      const token = localStorage.getItem('resqToken');
      const response = await fetch(`/api/chat/room/${chatRoomId}/otp`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.success) {
        setGeneratedOTP(data.otp);
        setShowOTPModal(true);
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
      const token = localStorage.getItem('resqToken');
      const response = await fetch(`/api/chat/room/${chatRoomId}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpCode }),
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setShowOTPModal(false);
        setOtpCode('');
        setGeneratedOTP(null);
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
      <div style={styles.loadingScreen}>
        <div style={styles.loadingInner}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Loading chat...</p>
        </div>
        <style>{spinnerKeyframes}</style>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      <style>{globalStyles}</style>

      {/* Background */}
      <div style={styles.bgImage}></div>
      <div style={styles.bgOverlay}></div>

      {/* Chat Container */}
      <div style={styles.chatContainer}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <button
              onClick={() => navigate('/chats', { replace: true })}
              style={styles.backBtn}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            >
              <ArrowLeft size={18} color="#fff" />
            </button>

            <div
              style={{
                ...styles.avatar,
                background: getAvatarGradient(otherUser?.nickname),
              }}
            >
              {getInitials(otherUser?.nickname)}
            </div>

            <div>
              <h2 style={styles.headerName}>{otherUser?.nickname || 'User'}</h2>
              <div style={styles.statusRow}>
                <span style={otherUserOnline ? styles.dotOnline : styles.dotOffline}></span>
                <span style={styles.statusText}>{otherUserOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>

          <div style={styles.headerRight}>
            <div style={styles.shieldBadge}>
              <Shield size={14} color="#4ade80" />
              <span style={styles.shieldText}>Secured</span>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div style={styles.messagesArea} className="chat-scroll">
          {messages.length === 0 && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                <MessageCircle size={32} color="rgba(255,255,255,0.4)" />
              </div>
              <p style={styles.emptyTitle}>No messages yet</p>
              <p style={styles.emptySubtitle}>Say hello to start the conversation 👋</p>
            </div>
          )}

          <div style={styles.messageList}>
            {messages.map((msg, idx) => {
              const isOwn = msg.senderId === currentUser?.id;
              const isSystem = msg.senderNickname === 'System';

              if (isSystem) {
                return (
                  <div key={idx} style={styles.systemMsgWrap}>
                    <span style={styles.systemMsg}>{msg.text}</span>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  style={{
                    ...styles.messageRow,
                    justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  }}
                  className="msg-entry"
                >
                  {!isOwn && (
                    <div
                      style={{
                        ...styles.smallAvatar,
                        background: getAvatarGradient(msg.senderNickname),
                      }}
                    >
                      {getInitials(msg.senderNickname)}
                    </div>
                  )}

                  <div style={{ maxWidth: '65%' }}>
                    {!isOwn && (
                      <div style={styles.senderName}>{msg.senderNickname}</div>
                    )}
                    <div
                      style={isOwn ? styles.ownBubble : styles.otherBubble}
                    >
                      <div style={styles.msgText}>{msg.text}</div>
                      <div style={isOwn ? styles.timeOwn : styles.timeOther}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
                <div
                  style={{
                    ...styles.smallAvatar,
                    background: getAvatarGradient(otherUser?.nickname),
                  }}
                >
                  {getInitials(otherUser?.nickname)}
                </div>
                <div style={styles.typingBubble}>
                  <span style={styles.typingDot} className="dot1"></span>
                  <span style={styles.typingDot} className="dot2"></span>
                  <span style={styles.typingDot} className="dot3"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div style={styles.inputArea}>
          <div style={styles.inputRow}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              onKeyUp={handleTyping}
              placeholder="Type a message..."
              style={styles.input}
              className="chat-input"
            />
            <button
              onClick={sendMessage}
              style={styles.sendBtn}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(74, 222, 128, 0.5)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(74, 222, 128, 0.3)';
              }}
            >
              <Send size={18} color="#fff" />
            </button>
          </div>

          <div style={styles.footerRow}>
            <div style={styles.anonBadge}>
              <Lock size={11} color="rgba(255,255,255,0.5)" />
              <span style={styles.anonText}>Anonymous chat · Identity hidden</span>
            </div>
            <button
              onClick={generateOTP}
              disabled={generatingOTP}
              style={styles.handoverBtn}
              onMouseEnter={e => !generatingOTP && (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <CheckCircle size={12} color="#fff" />
              <span>{generatingOTP ? 'Generating...' : 'Ready to Handover'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOTPModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Verify Handover</h3>
            <p style={styles.modalSubtitle}>Enter the 6-digit OTP shared by the other person</p>

            {generatedOTP && (
              <div style={styles.otpDisplayBox}>
                <p style={styles.otpDisplayLabel}>Your OTP (share this)</p>
                <div style={styles.otpDisplayCode}>{generatedOTP}</div>
                <p style={styles.otpDisplayHint}>⏱ Expires in 15 minutes</p>
              </div>
            )}
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="• • • • • •"
              style={styles.otpInput}
              maxLength={6}
            />
            <div style={styles.modalBtns}>
              <button
                onClick={() => { setShowOTPModal(false); setGeneratedOTP(null); }}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button onClick={verifyOTP} style={styles.verifyBtn}>
                Verify & Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Styles ─────────────────────────────────────────────── */

const styles = {
  pageWrapper: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    overflow: 'hidden',
  },
  bgImage: {
    position: 'fixed',
    inset: 0,
    backgroundImage: "url('/chatpagemodel.png')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    zIndex: 0,
  },
  bgOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'linear-gradient(135deg, rgba(10,10,30,0.55) 0%, rgba(5,20,40,0.45) 100%)',
    backdropFilter: 'blur(2px)',
    zIndex: 1,
  },
  chatContainer: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: '860px',
    height: '88vh',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '24px',
    overflow: 'hidden',
    background: 'rgba(255, 255, 255, 0.07)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: '0 32px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
  },

  /* Header */
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 22px',
    background: 'rgba(255,255,255,0.06)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  backBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255,255,255,0.08)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },
  avatar: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: '16px',
    flexShrink: 0,
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
    border: '2px solid rgba(255,255,255,0.2)',
  },
  headerName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: '15px',
    margin: 0,
    letterSpacing: '-0.2px',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginTop: '2px',
  },
  dotOnline: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#4ade80',
    boxShadow: '0 0 6px #4ade80',
    display: 'inline-block',
  },
  dotOffline: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#94a3b8',
    display: 'inline-block',
  },
  statusText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: '11px',
    fontWeight: '500',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
  },
  shieldBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    background: 'rgba(74, 222, 128, 0.1)',
    border: '1px solid rgba(74, 222, 128, 0.25)',
    borderRadius: '20px',
    padding: '5px 12px',
  },
  shieldText: {
    color: '#4ade80',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.3px',
  },

  /* Messages */
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 22px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '10px',
    paddingTop: '80px',
  },
  emptyIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '6px',
  },
  emptyTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: '13px',
    margin: 0,
  },
  messageList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  systemMsgWrap: {
    display: 'flex',
    justifyContent: 'center',
  },
  systemMsg: {
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(8px)',
    color: 'rgba(255,255,255,0.55)',
    fontSize: '11px',
    padding: '5px 14px',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '9px',
  },
  smallAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: '12px',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
  },
  senderName: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '11px',
    fontWeight: '600',
    marginBottom: '4px',
    paddingLeft: '4px',
    letterSpacing: '0.2px',
  },
  ownBubble: {
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    color: '#fff',
    padding: '11px 16px',
    borderRadius: '18px 18px 4px 18px',
    boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)',
  },
  otherBubble: {
    background: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(10px)',
    color: '#fff',
    padding: '11px 16px',
    borderRadius: '18px 18px 18px 4px',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
  },
  msgText: {
    fontSize: '14px',
    lineHeight: '1.5',
    wordBreak: 'break-word',
  },
  timeOwn: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.6)',
    marginTop: '4px',
    textAlign: 'right',
  },
  timeOther: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.4)',
    marginTop: '4px',
  },
  typingBubble: {
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '18px 18px 18px 4px',
    padding: '12px 18px',
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  typingDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.55)',
    display: 'inline-block',
  },

  /* Input */
  inputArea: {
    padding: '14px 22px 18px',
    background: 'rgba(255,255,255,0.05)',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(10px)',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  input: {
    flex: 1,
    padding: '13px 20px',
    borderRadius: '50px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(10px)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  sendBtn: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    border: 'none',
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 15px rgba(74, 222, 128, 0.3)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  footerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '10px',
    paddingLeft: '4px',
  },
  anonBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  anonText: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: '11px',
    fontWeight: '500',
  },
  handoverBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '7px 14px',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    border: 'none',
    borderRadius: '20px',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    letterSpacing: '0.3px',
    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },

  otpDisplayBox: {
    background: 'rgba(74, 222, 128, 0.08)',
    border: '1px solid rgba(74, 222, 128, 0.25)',
    borderRadius: '12px',
    padding: '14px 16px',
    marginBottom: '18px',
    textAlign: 'center',
  },
  otpDisplayLabel: {
    color: 'rgba(74, 222, 128, 0.8)',
    fontSize: '11px',
    fontWeight: '600',
    margin: '0 0 8px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  otpDisplayCode: {
    color: '#4ade80',
    fontSize: '28px',
    fontWeight: '700',
    letterSpacing: '10px',
    fontFamily: 'monospace',
    margin: '0 0 6px',
  },
  otpDisplayHint: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: '11px',
    margin: 0,
  },

  /* OTP Modal */
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '16px',
  },
  modal: {
    background: 'rgba(20, 25, 40, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '20px',
    padding: '32px',
    width: '100%',
    maxWidth: '380px',
    boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
  },
  modalTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: '20px',
    margin: '0 0 8px',
  },
  modalSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '13px',
    margin: '0 0 20px',
    lineHeight: '1.5',
  },
  otpInput: {
    width: '100%',
    padding: '14px 18px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.07)',
    color: '#fff',
    fontSize: '22px',
    letterSpacing: '10px',
    textAlign: 'center',
    outline: 'none',
    marginBottom: '20px',
    boxSizing: 'border-box',
    fontFamily: 'monospace',
  },
  modalBtns: {
    display: 'flex',
    gap: '10px',
  },
  cancelBtn: {
    flex: 1,
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '500',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'background 0.2s',
  },
  verifyBtn: {
    flex: 1,
    padding: '12px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '600',
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: '0 4px 15px rgba(34, 197, 94, 0.35)',
    transition: 'transform 0.2s',
  },

  /* Loading */
  loadingScreen: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a1e 0%, #050c1e 100%)',
    flexDirection: 'column',
    gap: '16px',
  },
  loadingInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '3px solid rgba(74, 222, 128, 0.2)',
    borderTopColor: '#4ade80',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '14px',
    fontWeight: '500',
    margin: 0,
    letterSpacing: '0.3px',
  },
};

const spinnerKeyframes = `
@keyframes spin {
  to { transform: rotate(360deg); }
}
`;

const globalStyles = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

* { box-sizing: border-box; }

.chat-scroll::-webkit-scrollbar { width: 4px; }
.chat-scroll::-webkit-scrollbar-track { background: transparent; }
.chat-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
.chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }

.chat-input::placeholder { color: rgba(255,255,255,0.35); }
.chat-input:focus {
  border-color: rgba(74, 222, 128, 0.5) !important;
  box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.1) !important;
}

.msg-entry {
  animation: msgIn 0.25s ease-out both;
}
@keyframes msgIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.dot1 { animation: bounce 1.2s infinite 0s; }
.dot2 { animation: bounce 1.2s infinite 0.2s; }
.dot3 { animation: bounce 1.2s infinite 0.4s; }
@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
  30% { transform: translateY(-5px); opacity: 1; }
}
`;

export default ChatWindow;