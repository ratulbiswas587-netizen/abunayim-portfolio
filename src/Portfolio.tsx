import { Play } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { CATEGORIES } from './constants';
import { Link } from 'react-router-dom';

export default function Portfolio() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  // Profile status
  const [profileName, setProfileName] = useState('CreativeStudio');
  const [profileBio, setProfileBio] = useState('I create cinematic videos, stunning thumbnails, social media designs, branding, and premium visual content that helps your business stand out.');
  const [profileImageUrl, setProfileImageUrl] = useState('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const q = query(collection(db, 'projects'));
      const snap = await getDocs(q);
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // sort by newest
      data.sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setProjects(data);

      const userQ = query(collection(db, 'users'));
      const userSnap = await getDocs(userQ);
      if (!userSnap.empty) {
        const uData = userSnap.docs[0].data();
        if (uData.name) setProfileName(uData.name);
        if (uData.bio) setProfileBio(uData.bio);
        if (uData.imageUrl) setProfileImageUrl(uData.imageUrl);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProjects(false);
    }
  };

  const filteredProjects = activeCategoryId 
    ? projects.filter(p => p.categoryId === activeCategoryId)
    : projects;

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-sky-500/30">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full bg-slate-900/90 backdrop-blur-md z-50 border-b border-white/5">
        <nav className="max-w-[1200px] mx-auto px-5 py-4 flex justify-between items-center w-full">
          <div className="text-[28px] font-extrabold text-sky-400 tracking-tight">
            {profileName}
          </div>
          <div className="hidden md:flex gap-7 items-center text-sm font-medium">
            <a href="#home" className="hover:text-sky-400 transition-colors">Home</a>
            <a href="#about" className="hover:text-sky-400 transition-colors">About</a>
            <a href="#services" className="hover:text-sky-400 transition-colors">Services</a>
            <a href="#portfolio" className="hover:text-sky-400 transition-colors">Portfolio</a>
            <a href="#contact" className="hover:text-sky-400 transition-colors">Contact</a>
            
            <Link to="/admin" className="ml-4 border border-sky-400 text-sky-400 px-4 py-1.5 rounded-full hover:bg-sky-400 hover:text-slate-900 transition-all font-semibold">
              Admin Access
            </Link>
          </div>
          {/* Mobile menu could be added here, but keep it simple as per template */}
        </nav>
      </header>

      {/* Hero */}
      <section 
        id="home" 
        className="min-h-screen flex items-center justify-center text-center px-5 pt-[120px] pb-[60px] relative bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(15,23,42,0.75), rgba(15,23,42,0.95)), url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=80')`
        }}
      >
        <div className="max-w-[850px] relative z-10 w-full">
          <h1 className="text-4xl md:text-[58px] font-extrabold leading-[1.2] mb-5 tracking-tight">
            Professional <span className="text-sky-400">Video Editing</span> & Graphic Design
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-9 max-w-3xl mx-auto leading-relaxed">
            I create cinematic videos, stunning thumbnails, social media designs,
            branding, and premium visual content that helps your business stand out.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <a href="#portfolio" className="inline-block px-8 py-3.5 rounded-full font-semibold transition-all bg-sky-400 text-slate-900 hover:bg-sky-500 hover:-translate-y-0.5 w-full sm:w-auto">
              View My Work
            </a>
            <a href="#contact" className="inline-block px-8 py-3.5 rounded-full font-semibold transition-all border-2 border-sky-400 text-sky-400 hover:bg-sky-400 hover:text-slate-900 w-full sm:w-auto">
              Hire Me
            </a>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-[90px] px-5 max-w-[1200px] mx-auto w-full">
        <h2 className="text-center text-[40px] font-bold mb-12 text-sky-400 tracking-tight">About Me</h2>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-10 items-center">
          <img
            src={profileImageUrl}
            alt="Profile Photo"
            className="w-full max-w-[350px] rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.4)] mx-auto md:mx-0 object-cover aspect-square"
          />
          <div className="text-center md:text-left">
            <h3 className="text-[30px] font-semibold mb-4 text-white">Hello, I'm Your Creative Partner</h3>
            <p className="text-slate-300 text-lg leading-relaxed whitespace-pre-line">
              {profileBio}
            </p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-[90px] px-5 max-w-[1200px] mx-auto w-full">
        <h2 className="text-center text-[40px] font-bold mb-12 text-sky-400 tracking-tight">My Services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-slate-800 p-[35px] px-[30px] rounded-[20px] transition-all duration-300 border border-white/5 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
            <h3 className="text-2xl mb-[15px] font-semibold text-green-500">Video Editing</h3>
            <p className="text-slate-300 leading-relaxed text-sm lg:text-base">
              YouTube videos, reels, shorts, ads, color grading, transitions,
              subtitles, and cinematic storytelling.
            </p>
          </div>
          <div className="bg-slate-800 p-[35px] px-[30px] rounded-[20px] transition-all duration-300 border border-white/5 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
            <h3 className="text-2xl mb-[15px] font-semibold text-green-500">Graphic Design</h3>
            <p className="text-slate-300 leading-relaxed text-sm lg:text-base">
              Thumbnails, posters, social media posts, banners, flyers,
              and brand visuals.
            </p>
          </div>
          <div className="bg-slate-800 p-[35px] px-[30px] rounded-[20px] transition-all duration-300 border border-white/5 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
            <h3 className="text-2xl mb-[15px] font-semibold text-green-500">Motion Graphics</h3>
            <p className="text-slate-300 leading-relaxed text-sm lg:text-base">
              Animated titles, logo reveals, intro videos, and promotional content.
            </p>
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <section id="portfolio" className="py-[90px] px-5 max-w-[1200px] mx-auto w-full">
        <h2 className="text-center text-[40px] font-bold mb-8 text-sky-400 tracking-tight">Portfolio</h2>
        
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <button 
            onClick={() => setActiveCategoryId(null)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              activeCategoryId === null 
                ? 'bg-sky-400 text-slate-900 border border-sky-400' 
                : 'border border-slate-700 text-slate-300 hover:border-sky-400 hover:text-sky-400'
            }`}
          >
            All Projects
          </button>
          {CATEGORIES.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                activeCategoryId === cat.id 
                  ? 'bg-sky-400 text-slate-900 border border-sky-400' 
                  : 'border border-slate-700 text-slate-300 hover:border-sky-400 hover:text-sky-400'
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>

        {loadingProjects ? (
          <div className="text-center py-20 text-slate-400">Loading portfolio...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20 bg-slate-800 rounded-2xl border border-white/5">
            <p className="text-slate-400 text-lg">No projects to show yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[25px]">
            {filteredProjects.map((item) => (
              <a 
                href={item.videoUrl || item.imageUrl}
                target="_blank"
                rel="noreferrer"
                key={item.id} 
                className="relative overflow-hidden rounded-[20px] group bg-slate-800 border border-white/5 aspect-video flex flex-col cursor-pointer"
              >
                <div className="w-full h-full relative overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full block object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90 group-hover:opacity-70 transition-opacity"></div>
                  
                  {item.videoUrl && (
                    <div className="absolute inset-0 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="w-14 h-14 bg-sky-400/90 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.5)] transform scale-75 group-hover:scale-100 transition-transform duration-300">
                         <Play fill="white" className="text-white ml-1" size={20} />
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-5 left-5 right-5 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-white font-bold text-lg mb-0.5 truncate">{item.title}</h3>
                    <p className="text-sky-400 text-xs font-semibold uppercase tracking-wider">
                      {CATEGORIES.find(c => c.id === item.categoryId)?.title}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Contact */}
      <section id="contact" className="py-[90px] px-5 max-w-[1200px] mx-auto w-full">
        <h2 className="text-center text-[40px] font-bold mb-12 text-sky-400 tracking-tight">Let's Work Together</h2>
        <div className="text-center bg-slate-800 p-10 md:p-[50px_30px] rounded-[20px] border border-white/5">
          <p className="text-slate-300 mb-[25px] text-lg">
            Ready to create amazing visual content for your brand?
            Contact me today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <a href="mailto:ratulbiswas587@gmail.com" className="inline-block px-8 py-3.5 rounded-full font-semibold transition-all bg-sky-400 text-slate-900 hover:bg-sky-500 hover:-translate-y-0.5 w-full sm:w-auto">
              Email Me
            </a>
            <a href="https://www.behance.net/" target="_blank" rel="noreferrer" className="inline-block px-8 py-3.5 rounded-full font-semibold transition-all border-2 border-sky-400 text-sky-400 hover:bg-sky-400 hover:text-slate-900 w-full sm:w-auto">
              Behance
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center p-[25px] bg-slate-950 text-slate-400 text-sm">
        © {new Date().getFullYear()} {profileName}. All Rights Reserved.
      </footer>
    </div>
  );
}
