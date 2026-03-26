import React from 'react';
import { useNavigate } from 'react-router-dom';

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 dark:bg-slate-950 dark:text-slate-100">
      {/* NAVIGATION BAR - KEPT UNCHANGED */}
      <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-white p-4 px-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-blue-600 p-2 rounded-lg text-white font-bold text-sm">ResQ</div>
          <span className="text-xl font-bold text-gray-800 tracking-tight text-center dark:text-slate-100">Portal</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/contact')}
            className="font-medium text-gray-600 transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
          >
            Contact Us
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="font-medium text-gray-600 transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
          >
            Dashboard
          </button>
        </div>
      </nav>

      {/* HEADER SECTION WITH HERO HOLOGRAM BACKGROUND */}
      <section
        className="w-full bg-no-repeat bg-cover bg-center py-24 md:py-32"
        style={{ backgroundImage: "url('/hero-hologram.png.jpg')" }}
      >
        <div className="mx-auto max-w-3xl px-6 text-center text-gray-900 dark:text-white">
          <p className="mb-2 text-xl font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">ABOUT</p>
          <h1 className="mb-4 text-3xl font-black md:text-4xl">ResQ Portal</h1>
          <p className="text-lg leading-relaxed max-w-xl mx-auto">
            We are the SLIIT community hub for lost and found—built so students and staff can report items, browse matches,
            and get belongings back with less friction.
          </p>
        </div>
      </section>

      {/* Main Content Area Container */}
      <main className="mx-auto max-w-3xl px-6 py-12 md:py-16 space-y-12">
        <div className="space-y-12">
          {/* STAGGERED GRID for Mission and Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            {/* Mission Row - Card first, then Image */}
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-900 md:p-8">
              <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">Our mission</h2>
              <p className="leading-relaxed text-gray-600 dark:text-slate-400">
                Campus life moves fast. When something goes missing, clear reporting and a single place to look make all
                the difference. ResQ Portal keeps active and returned listings organized so the community can help itself.
              </p>
            </section>
            <div className="flex justify-center">
              <img src="/image1.jpg" alt="Mission" className="max-w-full h-auto rounded-3xl" />
            </div>

            {/* Vision Row - Image first, then Card */}
            <div className="flex justify-center">
              <img src="/image2.jpg" alt="Vision" className="max-w-full h-auto rounded-3xl" />
            </div>
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-900 md:p-8">
              <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">Our vision</h2>
              <p className="leading-relaxed text-gray-600 dark:text-slate-400">
                Bridging the gap between lost and found through innovation and community trust.
              </p>
            </section>
          </div>

          {/* WHAT YOU CAN DO HERE */}
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-900 md:p-8">
            <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">What you can do here</h2>
            <ul className="list-outside list-disc space-y-3 leading-relaxed text-gray-600 dark:text-slate-400 pl-5">
              <li>Report lost or found items with details and optional photos.</li>
              <li>Browse the board for items that might be yours—or someone else&apos;s.</li>
              <li>Use the Community Hub for events and shared updates.</li>
              <li>Reach the admin team anytime via Contact Us.</li>
            </ul>
          </section>

          {/* BUILT FOR SLIIT */}
          <section className="bg-blue-900 text-white rounded-2xl p-6 md:p-8 shadow-inner">
            <h2 className="text-xl font-bold mb-3">Built for SLIIT</h2>
            <p className="text-blue-100 leading-relaxed mb-6 max-w-2xl">
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