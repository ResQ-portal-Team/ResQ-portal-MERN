import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from './config';

const initialForm = { name: '', email: '', subject: '', message: '' };

const parseResponseBody = async (res) => {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_err) {
    // Some proxy/server errors return HTML (e.g., <!DOCTYPE ...>).
    return { message: 'Server returned a non-JSON response. Please check backend server and API route.' };
  }
};

const ContactUs = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('resqToken');
      const res = await fetch(`${API_BASE}/api/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      const data = await parseResponseBody(res);
      if (!res.ok) throw new Error(data.message || 'Failed to send message.');
      setNotice(data.message || 'Message sent.');
      setForm(initialForm);
      // Optional: redirect back after a short delay
      // setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center px-8">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-blue-600 p-2 rounded-lg text-white font-bold text-sm">ResQ</div>
          <span className="text-xl font-bold text-gray-800 tracking-tight text-center">Portal</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="text-gray-600 font-medium hover:text-blue-600 transition"
        >
          Back to Dashboard
        </button>
      </nav>

      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Contact us</h1>
        <p className="text-gray-500 mb-6">
          Have a question or feedback? Send us a message and the admin team will review it.
        </p>

        {notice && <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800 text-sm">{notice}</div>}
        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div>}

        <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow border border-gray-100 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Your name</label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-blue-600 outline-none"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-blue-600 outline-none"
                placeholder="you@my.sliit.lk"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
            <input
              name="subject"
              value={form.subject}
              onChange={onChange}
              className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-blue-600 outline-none"
              placeholder="How can we help?"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
            <textarea
              name="message"
              rows={5}
              value={form.message}
              onChange={onChange}
              className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-blue-600 outline-none resize-y"
              placeholder="Write your message here..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-70"
            >
              {submitting ? 'Sending…' : 'Send message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactUs;
