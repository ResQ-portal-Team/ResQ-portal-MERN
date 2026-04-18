import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import MatchConfirmationModal from './MatchConfirmationModal';
import SiteFooter from './SiteFooter';

const formatItemDate = (value) => {
  if (!value) return 'Not available';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const pageX = 'w-full px-5 sm:px-8 lg:px-12 xl:px-16 2xl:px-20';

const normalizeStatus = (status) => {
  const s = (status || 'active').toLowerCase();
  if (s === 'returned') return 'returned';
  if (s === 'pending') return 'pending';
  return 'active';
};

const ItemDetailPage = () => {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const location = useLocation();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [creatingChat, setCreatingChat] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [pendingMatchNotificationId, setPendingMatchNotificationId] = useState(null);
  
  const fetchIdRef = useRef(null);
  const hasOpenedModalRef = useRef(false);
  const initialLoadRef = useRef(true);

  // Reset state when itemId changes (but preserve modal if coming from notification)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const shouldConfirmMatch = queryParams.get('confirmMatch') === 'true';
    
    if (!shouldConfirmMatch && !hasOpenedModalRef.current) {
      setItem(null);
      setLoading(true);
      setError('');
      setShowConfirmModal(false);
      setMatchData(null);
    }
    fetchIdRef.current = itemId;
  }, [itemId, location.search]);

  useEffect(() => {
    const user = localStorage.getItem('resqUser');
    if (user) {
      try {
        setCurrentUser(JSON.parse(user));
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }
  }, []);

  // Handle pending match confirmation from notification
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const shouldConfirmMatch = queryParams.get('confirmMatch') === 'true';
    
    if (shouldConfirmMatch && !hasOpenedModalRef.current) {
      const storedMatchData = localStorage.getItem('pendingMatchConfirmation');
      const storedNotificationId = localStorage.getItem('pendingMatchNotificationId');
      
      if (storedMatchData) {
        try {
          const matchDataParsed = JSON.parse(storedMatchData);
          setMatchData(matchDataParsed);
          setPendingMatchNotificationId(storedNotificationId);
          setShowConfirmModal(true);
          hasOpenedModalRef.current = true;
          localStorage.removeItem('pendingMatchConfirmation');
          localStorage.removeItem('pendingMatchNotificationId');
          console.log('🎉 Modal opened!');
        } catch (e) {
          console.error('Failed to parse match data:', e);
        }
      }
    }
  }, [location.search]);

  useEffect(() => {
    const fetchItem = async () => {
      if (!itemId) return;
      if (item && item._id === itemId) return;
      
      setLoading(true);
      setError('');

      for (const baseUrl of ['', 'http://localhost:5000']) {
        try {
          const response = await fetch(`${baseUrl}/api/items/${itemId}`);
          const data = await response.json();
          if (response.ok && data.item) {
            setItem(data.item);
            setLoading(false);
            return;
          }
        } catch (fetchError) {
          // continue
        }
      }
      setError('Unable to load item details.');
      setLoading(false);
    };

    fetchItem();
  }, [itemId, item]);

  // 🔥 FIXED: Handle confirm match with fallback
  const handleConfirmMatch = async () => {
    console.log('🔍 handleConfirmMatch called with matchData:', matchData);
    
    if (!matchData || !matchData.matchedItem) {
      console.error('❌ No matchData or matchedItem');
      alert('No match data found. Please try again.');
      return;
    }
    
    let matchedUserId = matchData.matchedItem.postedBy;
    const itemIdToUse = matchData.matchedItem._id;
    
    console.log('📦 Initial matchedUserId:', matchedUserId);
    
    // 🔥 FALLBACK: If postedBy is missing, try to fetch from API
    if (!matchedUserId && itemIdToUse) {
      try {
        console.log('📦 Fetching item details to get postedBy for item:', itemIdToUse);
        const response = await fetch(`/api/items/${itemIdToUse}`);
        const data = await response.json();
        console.log('📦 Item API response:', data);
        if (data.item && data.item.postedBy) {
          matchedUserId = data.item.postedBy._id || data.item.postedBy;
          console.log('✅ Fetched postedBy from API:', matchedUserId);
        }
      } catch (err) {
        console.error('Failed to fetch postedBy:', err);
      }
    }
    
    console.log('📦 Final matchedUserId:', matchedUserId);
    
    if (!itemIdToUse || !matchedUserId) {
      console.error('❌ Invalid data:', { itemIdToUse, matchedUserId });
      alert('Invalid match data. Please try again.');
      return;
    }
    
    setShowConfirmModal(false);
    setCreatingChat(true);
    
    try {
      const token = localStorage.getItem('resqToken');
      if (!token) {
        alert('Please login first');
        navigate('/dashboard');
        return;
      }
      
      const requestBody = {
        itemId: itemIdToUse,
        matchedUserId: matchedUserId
      };
      
      console.log('📤 Sending request:', requestBody);
      
      const response = await fetch('/api/chat/room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log('📡 Chat room response:', data);
      
      if (response.ok && data.success && data.chatRoom) {
        if (pendingMatchNotificationId) {
          await fetch(`/api/notifications/${pendingMatchNotificationId}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
        navigate(`/chat/${data.chatRoom._id}`);
      } else {
        console.error('❌ Failed to create chat room:', data);
        alert(data.message || 'Unable to open chat. Please try again.');
      }
    } catch (error) {
      console.error('❌ Chat error:', error);
      alert('Failed to open chat. Please try again.');
    } finally {
      setCreatingChat(false);
    }
  };

  const handleRejectMatch = async () => {
    setShowConfirmModal(false);
    setMatchData(null);
    
    if (pendingMatchNotificationId) {
      try {
        const token = localStorage.getItem('resqToken');
        await fetch(`/api/notifications/${pendingMatchNotificationId}/read`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  };

  const handleOpenChat = async () => {
    if (!currentUser) {
      alert('Please login to chat');
      navigate('/dashboard');
      return;
    }

    const itemAuthorId = item?.postedBy?._id || item?.postedBy;
    if (currentUser.id === itemAuthorId) {
      alert('You cannot chat with yourself');
      return;
    }

    setCreatingChat(true);
    try {
      const token = localStorage.getItem('resqToken');
      const response = await fetch('/api/chat/room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          itemId: item._id,
          matchedUserId: itemAuthorId
        })
      });

      const data = await response.json();
      if (data.success && data.chatRoom) {
        navigate(`/chat/${data.chatRoom._id}`);
      } else {
        alert('Unable to open chat. Please try again.');
      }
    } catch (error) {
      console.error('Chat error:', error);
      alert('Failed to open chat. Please try again.');
    } finally {
      setCreatingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-slate-950">
        <div className="flex flex-1 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className={`flex min-h-screen flex-col bg-gray-50 py-8 dark:bg-slate-950 ${pageX}`}>
        <div className="flex-1">
          <button onClick={() => navigate('/dashboard')} className="mb-6 text-blue-600 hover:underline">
            ← Back to dashboard
          </button>
          <div className="rounded-2xl bg-red-50 p-6 text-red-800">{error || 'Item not found.'}</div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const status = normalizeStatus(item.status);
  const isLost = item.type === 'lost';
  const itemAuthorId = item.postedBy?._id || item.postedBy;
  const isAuthor = currentUser?.id === itemAuthorId;

  return (
    <>
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-slate-950 pb-12">
        <div className={`mx-auto w-full max-w-7xl flex-1 pt-6 ${pageX}`}>
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-6 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            ← Back to dashboard
          </button>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column - Item Details */}
            <div className="lg:col-span-2">
              <div className="overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-slate-800">
                <div className="relative h-64 bg-gray-100 dark:bg-slate-700">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-6xl font-bold text-gray-400">
                      {isLost ? 'L' : 'F'}
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase text-white ${isLost ? 'bg-red-500' : 'bg-green-500'}`}>
                      {isLost ? 'Lost' : 'Found'}
                    </span>
                    <span className="rounded-full bg-gray-800/80 px-3 py-1 text-xs font-bold uppercase text-white">
                      {status}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{item.title}</h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">{item.description}</p>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-700">
                      <p className="text-xs uppercase text-gray-400">Location</p>
                      <p className="font-semibold">{item.location}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-700">
                      <p className="text-xs uppercase text-gray-400">Date</p>
                      <p className="font-semibold">{item.date ? formatItemDate(item.date) : 'Not specified'}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-700">
                      <p className="text-xs uppercase text-gray-400">Category</p>
                      <p className="font-semibold">{item.category}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-700">
                      <p className="text-xs uppercase text-gray-400">Reported by</p>
                      <p className="font-semibold">{item.postedBy?.nickname || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Chat Section */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-slate-800">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                  <h2 className="text-xl font-bold">Contact Poster</h2>
                  <p className="mt-1 text-sm text-blue-100">Chat with the person who posted this item</p>
                </div>
                
                <div className="p-6">
                  <div className="mb-5 flex items-center gap-3 rounded-xl bg-gray-50 p-4 dark:bg-slate-700">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">
                      {(item.postedBy?.nickname || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{item.postedBy?.nickname || 'Unknown'}</p>
                      {item.postedBy?.email && (
                        <p className="text-xs text-gray-500">{item.postedBy.email}</p>
                      )}
                    </div>
                  </div>

                  {!isAuthor && status !== 'returned' && (
                    <button
                      onClick={handleOpenChat}
                      disabled={creatingChat}
                      className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {creatingChat ? 'Opening...' : '💬 Open Chat'}
                    </button>
                  )}
                  
                  {isAuthor && status === 'active' && (
                    <button
                      onClick={async () => {
                        const token = localStorage.getItem('resqToken');
                        await fetch(`/api/items/${item._id}/return`, {
                          method: 'PATCH',
                          headers: { 'Authorization': `Bearer ${token}` }
                        });
                        window.location.reload();
                      }}
                      className="w-full rounded-xl bg-yellow-500 py-3 font-bold text-white hover:bg-yellow-600"
                    >
                      Mark as Returned
                    </button>
                  )}
                  
                  {isAuthor && status === 'returned' && (
                    <button
                      onClick={async () => {
                        if (window.confirm('Delete this returned item?')) {
                          const token = localStorage.getItem('resqToken');
                          await fetch(`/api/items/${item._id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                          });
                          navigate('/dashboard');
                        }
                      }}
                      className="w-full rounded-xl bg-red-600 py-3 font-bold text-white hover:bg-red-700"
                    >
                      Delete Item
                    </button>
                  )}
                  
                  {!isAuthor && status === 'returned' && (
                    <p className="text-center text-sm text-gray-500">This item has been returned</p>
                  )}
                  
                  <p className="mt-4 text-center text-xs text-gray-400">
                    Chat is anonymous — only your nickname is visible
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <SiteFooter />
      </div>

      {showConfirmModal && matchData && (
        <MatchConfirmationModal
          matchData={matchData}
          onClose={() => {
            setShowConfirmModal(false);
            setMatchData(null);
          }}
          onConfirm={handleConfirmMatch}
          onReject={handleRejectMatch}
        />
      )}
    </>
  );
};

export default ItemDetailPage;