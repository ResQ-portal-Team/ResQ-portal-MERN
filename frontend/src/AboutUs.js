import React from 'react';
import { useNavigate } from 'react-router-dom';

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white shadow-sm p-4 flex flex-wrap justify-between items-center gap-3 px-8">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-blue-600 p-2 rounded-lg text-white font-bold text-sm">ResQ</div>
          <span className="text-xl font-bold text-gray-800 tracking-tight text-center">Portal</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/contact')}
            className="text-gray-600 font-medium hover:text-blue-600 transition"
          >
            Contact Us
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 font-medium hover:text-blue-600 transition"
          >
            Dashboard
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        <p className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2">About</p>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">ResQ Portal</h1>
        <p className="text-lg text-gray-600 leading-relaxed mb-10">
          We are the SLIIT community hub for lost and found—built so students and staff can report items, browse matches,
          and get belongings back with less friction.
        </p>

        <div className="space-y-8">
          <section className="bg-white rounded-2xl shadow border border-gray-100 p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Our mission</h2>
            <p className="text-gray-600 leading-relaxed">
              Campus life moves fast. When something goes missing, clear reporting and a single place to look make all
              the difference. ResQ Portal keeps active and returned listings organized so the community can help itself.
            </p>
          </section>

          <section className="bg-white rounded-2xl shadow border border-gray-100 p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">What you can do here</h2>
            <ul className="text-gray-600 space-y-3 list-disc list-inside leading-relaxed">
              <li>Report lost or found items with details and optional photos.</li>
              <li>Browse the board for items that might be yours—or someone else&apos;s.</li>
              <li>Use the Community Hub for events and shared updates.</li>
              <li>Reach the admin team anytime via Contact Us.</li>
            </ul>
          </section>

          <section className="bg-blue-900 text-white rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-bold mb-3">Built for SLIIT</h2>
            <p className="text-blue-100 leading-relaxed mb-6">
              ResQ Portal is designed for the SLIIT community: simple sign-in, a focused dashboard, and tools that stay
              out of your way when you just need to find or return something.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="bg-white text-blue-900 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition"
              >
                Go to dashboard
              </button>
              <button
                type="button"
                onClick={() => navigate('/contact')}
                className="border border-white/40 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/10 transition"
              >
                Contact us
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AboutUs;
