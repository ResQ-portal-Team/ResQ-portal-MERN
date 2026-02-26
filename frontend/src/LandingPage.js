import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  // Handle smooth scroll for navigation links
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-blue-100">
      
      {/* Fixed Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-lg border-b border-gray-100">
        <div className="p-5 flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white font-bold shadow-lg shadow-blue-200">ResQ</div>
            <span className="text-xl font-black tracking-tight text-gray-900 uppercase">Portal</span>
          </div>
          
          <div className="hidden md:flex gap-8 text-sm font-bold text-gray-500">
             <button onClick={() => scrollToSection('features')} className="hover:text-blue-600 transition-colors">Features</button>
             <button onClick={() => scrollToSection('how-it-works')} className="hover:text-blue-600 transition-colors">How It Works</button>
             <button onClick={() => scrollToSection('stats')} className="hover:text-blue-600 transition-colors">Stats</button>
          </div>

          <button 
            onClick={() => navigate('/login')} 
            className="bg-gray-900 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-600 transition-all shadow-md"
          >
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-40 pb-20 flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-[1.1] mb-8">
            Find what you <span className="text-blue-600 italic">lost</span>, <br />
            Return what you <span className="text-blue-600 italic">found</span>.
          </h1>
          <p className="text-lg md:text-xl text-gray-500 mb-10 leading-relaxed max-w-lg">
            The official SLIIT community portal for lost & found items. Join our smart assistant to secure your campus life.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center md:justify-start">
            <button 
              onClick={() => navigate('/onboarding')} 
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-blue-200 hover:scale-105 transition-all duration-300"
            >
              Join with AI Assistant
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="group flex items-center justify-center gap-2 border-2 border-gray-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white hover:border-blue-600 hover:text-blue-600 transition-all duration-300"
            >
              Explore Dashboard
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>

        {/* 3D Visual Section with Breathing Animation */}
        <div className="flex-1 relative flex justify-center items-center">
          {/* Decorative Glow */}
          <div className="absolute w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
          
          {/* Animated 3D Glass Container */}
          <div className="relative animate-breathing perspective-2000">
            <div className="overflow-hidden rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.15)] border border-white/50 rotate-3d-tilt">
              <img 
                src="/logo.png" 
                alt="ResQ Portal Visual" 
                className="w-full max-w-[500px] h-auto object-cover scale-105" 
              />
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-4">Powerful Features</h2>
          <p className="text-gray-500 mb-16">Smart technology for a safer campus environment.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'AI Smart Matching', desc: 'Our AI automatically matches lost reports with found items based on descriptions.', icon: '🤖' },
              { title: 'Secure Verification', desc: 'Ownership verification protocols to ensure items return to rightful owners.', icon: '🛡️' },
              { title: 'Instant Alerts', desc: 'Real-time notifications sent the moment a potential match is identified.', icon: '🔔' }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-2xl transition-all hover:-translate-y-2">
                <div className="text-4xl mb-6">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-16">How It Works</h2>
          <div className="flex flex-col md:flex-row justify-between gap-12">
             {[
               { step: '01', title: 'Report', desc: 'Provide details of your lost or found item via the portal.' },
               { step: '02', title: 'Process', desc: 'Our AI engine processes information to find a suitable match.' },
               { step: '03', title: 'Recover', desc: 'Follow verification steps and safely recover your item.' }
             ].map((item, i) => (
               <div key={i} className="flex-1">
                 <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-6 shadow-xl shadow-blue-200 rotate-3">{item.step}</div>
                 <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                 <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Real-time Statistics Section */}
      <section id="stats" className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
          <div><div className="text-4xl font-black mb-2">2,500+</div><div className="text-blue-100 text-sm font-medium">Items Recovered</div></div>
          <div><div className="text-4xl font-black mb-2">10,000+</div><div className="text-blue-100 text-sm font-medium">Active Community</div></div>
          <div><div className="text-4xl font-black mb-2">95%</div><div className="text-blue-100 text-sm font-medium">Success Rate</div></div>
          <div><div className="text-4xl font-black mb-2">&lt; 24h</div><div className="text-blue-100 text-sm font-medium">Avg. Match Time</div></div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="py-10 text-center text-gray-400 text-xs border-t border-gray-100">
        © 2026 ResQ Portal. Built for the SLIIT Community.
      </footer>
    </div>
  );
};

export default LandingPage;