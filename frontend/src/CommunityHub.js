import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CommunityHub = () => {
  const navigate = useNavigate();
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postMessage, setPostMessage] = useState('');

  const handleClear = () => {
    setPostTitle('');
    setPostContent('');
    setPostMessage('');
  };

  const handlePost = () => {
    if (!postTitle.trim() || !postContent.trim()) {
      setPostMessage('Please enter both title and details before posting.');
      return;
    }

    // Placeholder behavior until backend post endpoint is added.
    setPostMessage('Post submitted in UI. Connect this to backend to save it.');
    setPostTitle('');
    setPostContent('');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top Bar */}
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center px-8 sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-blue-600 p-2 rounded-lg text-white font-bold text-sm">ResQ</div>
          <span className="text-xl font-bold text-gray-800 tracking-tight text-center">Portal</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-600 font-medium hover:text-blue-600 transition"
        >
          Back to Dashboard
        </button>
      </nav>

      {/* Header */}
      <header className="bg-blue-900 text-white py-14 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-black mb-4">Community Hub</h1>
        <p className="max-w-2xl mx-auto text-blue-100 text-lg">
          Share updates, tips, and stories with other students around lost and found items, events, and campus life.
        </p>
      </header>

      {/* Content Layout */}
      <main className="max-w-6xl mx-auto py-10 px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Post Card */}
        <section className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Create a Social Post</h2>
          <p className="text-sm text-gray-500 mb-4">
            This ties in with your upcoming social post feature. You can hook this form to your backend later.
          </p>
          <div className="space-y-4">
            <input
              type="text"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="Post title (e.g. Found headphones near library)"
              className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <textarea
              rows="4"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Share more details with the community..."
              className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            {postMessage && (
              <p className="text-sm text-gray-600">{postMessage}</p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleClear}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition"
              >
                Clear
              </button>
              <button
                onClick={handlePost}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-md shadow-blue-200"
              >
                Post to Hub
              </button>
            </div>
          </div>
        </section>

        {/* Side Panel */}
        <aside className="space-y-6">
          <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Tips</h3>
            <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
              <li>Don’t share sensitive personal information.</li>
              <li>Add clear locations and times.</li>
              <li>Be respectful to other community members.</li>
            </ul>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-sm text-blue-900">
            <h3 className="font-bold mb-2">Coming Soon</h3>
            <p>
              This hub will later show a live feed of social posts, comments, and reactions once your backend is wired up.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default CommunityHub;

