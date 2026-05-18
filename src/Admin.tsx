import { useState, useEffect, useRef } from 'react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { CATEGORIES } from './constants';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id);
  const [subCategoryId, setSubCategoryId] = useState<number | null>(null);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Profile settings
  const [profileName, setProfileName] = useState('CreativeStudio');
  const [profileBio, setProfileBio] = useState('I create cinematic videos, stunning thumbnails, social media designs, branding, and premium visual content that helps your business stand out.');
  const [profileImageUrl, setProfileImageUrl] = useState('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const selectedCategory = CATEGORIES.find(c => c.id === categoryId);

  useEffect(() => {
    if (selectedCategory && selectedCategory.subcategories.length > 0) {
      setSubCategoryId(selectedCategory.subcategories[0].id);
    } else {
      setSubCategoryId(null);
    }
  }, [categoryId, selectedCategory]);

  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        fetchProjects();
        fetchProfile(u.uid);
      }
    });
    return unsub;
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      if (isSignUp) {
        alert("Sign Up Failed: " + err.message + "\n\n(Make sure your password is at least 6 characters)");
      } else {
        alert("Login Failed: " + err.message + "\n\n(If you don't have an account, click 'Create Account' below to sign up!)");
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err: any) {
      alert("Google Login Failed: " + err.message + "\n\nWe recommend using Email/Password if Google Popup is blocked by your browser.");
    }
  };

  const handlePhoneLoginClick = () => {
    alert("To use Phone authentication, you must complete the setup in your Firebase Console and implement reCAPTCHA. Please use Google or Email/Password for now.");
  };

  const fetchProfile = async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const d = snap.data();
        if (d.name) setProfileName(d.name);
        if (d.bio) setProfileBio(d.bio);
        if (d.imageUrl) setProfileImageUrl(d.imageUrl);
      }
    } catch(e) {
      console.error(e);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        name: profileName,
        bio: profileBio,
        imageUrl: profileImageUrl,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert("Profile updated successfully!");
    } catch (e: any) {
      console.error(e);
      alert("Error saving profile: " + e.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const q = collection(db, 'projects');
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProjects(data);
    } catch (e: any) {
      console.error(e);
      alert("Error fetching projects: " + e.message);
    }
  };

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
  
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
  
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        };
        img.onerror = (e) => reject(e);
      };
      reader.onerror = (e) => reject(e);
    });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!imageUrl && !imageFile) {
      alert("Please provide an image URL or upload an image file.");
      return;
    }

    if (videoFile) {
      alert("Direct video file uploads are not supported due to database limits. Please upload the video to YouTube or Vimeo and paste the URL here.");
      setVideoFile(null);
      if (videoInputRef.current) videoInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setUploadProgress(50);

    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        finalImageUrl = await compressImage(imageFile);
      }

      setUploadProgress(90);

      const payload: any = {
        title,
        clientName: clientName || null,
        categoryId: Number(categoryId),
        imageUrl: finalImageUrl,
        videoUrl: videoUrl || null,
        ownerId: user.uid,
        createdAt: serverTimestamp()
      };
      if (subCategoryId !== null && !isNaN(subCategoryId)) {
        payload.subCategoryId = Number(subCategoryId);
      }
      
      await addDoc(collection(db, 'projects'), payload);
      alert('Project uploaded successfully!');
      
      // Reset form
      setTitle('');
      setClientName('');
      setImageUrl('');
      setImageFile(null);
      setVideoUrl('');
      setVideoFile(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
      
      fetchProjects();
    } catch (e: any) {
      console.error(e);
      alert("Error uploading: " + e.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await deleteDoc(doc(db, 'projects', id));
      fetchProjects();
    } catch (e: any) {
      console.error(e);
      alert("Error deleting: " + e.message);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#050810] text-[#00d2ff] p-8">Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050810] text-white flex items-center justify-center p-6 font-sans relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00d2ff] opacity-[0.05] blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="w-full max-w-md bg-[#0B101D] p-8 rounded-3xl border border-gray-800 shadow-2xl relative z-10 overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
          
          <h2 className="text-3xl font-black mb-2 tracking-tight text-white"><span className="text-[#00d2ff]">ADMIN</span> {isSignUp ? "SIGN UP" : "LOGIN"}</h2>
          <p className="text-gray-400 text-sm mb-8">{isSignUp ? "Create a new admin account." : "Sign in to manage your portfolio applications."}</p>
          
          <div className="flex flex-col gap-4">
            {/* Google SignIn */}
            <button 
              onClick={handleGoogleLogin} 
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-bold py-3 px-4 rounded-xl hover:bg-gray-100 transition-all shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Phone SignIn */}
            <button 
              onClick={handlePhoneLoginClick} 
              className="w-full flex items-center justify-center gap-3 bg-[#12182b] border border-gray-700 text-white font-bold py-3 px-4 rounded-xl hover:bg-[#1a233a] transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Continue with Phone
            </button>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-gray-800"></div>
              <span className="flex-shrink-0 mx-4 text-gray-500 text-xs font-bold uppercase tracking-wider">Or email {isSignUp ? "sign up" : "login"}</span>
              <div className="flex-grow border-t border-gray-800"></div>
            </div>

            <form onSubmit={handleAuth} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-[#12182b] border border-gray-700 rounded-xl p-3 text-white focus:border-[#00d2ff] focus:outline-none focus:ring-1 focus:ring-[#00d2ff] transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-[#12182b] border border-gray-700 rounded-xl p-3 text-white focus:border-[#00d2ff] focus:outline-none focus:ring-1 focus:ring-[#00d2ff] transition-all" />
              </div>
              
              <button type="submit" className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 rounded-xl hover:shadow-[0_0_20px_rgba(0,210,255,0.4)] hover:-translate-y-0.5 transition-all uppercase tracking-widest text-sm">
                {isSignUp ? "Create Account" : "Login"}
              </button>
            </form>
            
            <div className="mt-4 text-center">
              <button 
                type="button" 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm font-medium text-[#00d2ff] hover:text-white transition-colors"
              >
                {isSignUp ? "Already have an account? Login here" : "Don't have an account? Create one here"}
              </button>
            </div>
            
            <button type="button" onClick={() => navigate('/')} className="w-full text-gray-500 hover:text-white mt-2 text-sm font-medium transition-colors">
              &larr; Back to site
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050810] text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-black tracking-tight"><span className="text-[#00d2ff]">ADMIN</span> DASHBOARD</h1>
          <div className="flex gap-4">
            <button onClick={() => navigate('/')} className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition">View Site</button>
            <button onClick={() => signOut(auth)} className="px-4 py-2 bg-red-600/20 text-red-500 border border-red-900 rounded-lg hover:bg-red-600/40 transition">Sign Out</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Settings */}
          <div className="bg-[#0B101D] p-6 rounded-2xl border border-gray-800 lg:col-span-1 h-fit">
            <h2 className="text-xl font-bold mb-6">Profile Settings</h2>
            <form onSubmit={saveProfile} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Your Name</label>
                <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Your Name" required className="w-full bg-[#12182b] border border-gray-700 rounded-lg p-3 text-white focus:border-[#00d2ff] focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Your Bio</label>
                <textarea value={profileBio} onChange={e => setProfileBio(e.target.value)} placeholder="Your Bio" className="w-full bg-[#12182b] border border-gray-700 rounded-lg p-3 text-white focus:border-[#00d2ff] focus:outline-none min-h-[100px]"></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Profile Image URL</label>
                <input type="url" value={profileImageUrl} onChange={e => setProfileImageUrl(e.target.value)} placeholder="https://..." className="w-full bg-[#12182b] border border-gray-700 rounded-lg p-3 text-white focus:border-[#00d2ff] focus:outline-none" />
              </div>
              <button 
                type="submit" 
                disabled={isSavingProfile}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all tracking-widest text-sm"
              >
                {isSavingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>

          {/* Upload Form */}
          <div className="bg-[#0B101D] p-6 rounded-2xl border border-gray-800 lg:col-span-1 h-fit">
            <h2 className="text-xl font-bold mb-6">Add New Project</h2>
            <form onSubmit={handleUpload} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Project Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-[#12182b] border border-gray-700 rounded-lg p-3 text-white focus:border-[#00d2ff] focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Client / Project Name (Optional)</label>
                <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="E.g. MrBeast, Nike" className="w-full bg-[#12182b] border border-gray-700 rounded-lg p-3 text-white focus:border-[#00d2ff] focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Category</label>
                <select value={categoryId} onChange={e => setCategoryId(Number(e.target.value))} className="w-full bg-[#12182b] border border-gray-700 rounded-lg p-3 text-white focus:border-[#00d2ff] focus:outline-none appearance-none">
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              {selectedCategory && selectedCategory.subcategories.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Subcategory</label>
                  <select value={subCategoryId || ''} onChange={e => setSubCategoryId(Number(e.target.value))} className="w-full bg-[#12182b] border border-gray-700 rounded-lg p-3 text-white focus:border-[#00d2ff] focus:outline-none appearance-none">
                    {selectedCategory.subcategories.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="border border-gray-700 rounded-xl p-4 bg-[#12182b]">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Project Main Image (Thumbnail)</label>
                
                <div className="flex flex-col gap-3">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Upload File</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      ref={imageInputRef}
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          setImageFile(e.target.files[0]);
                          setImageUrl('');
                        }
                      }} 
                      className="w-full block text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-gray-800 file:text-white hover:file:bg-gray-700 cursor-pointer mt-1" 
                    />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="h-[1px] bg-gray-800 flex-grow"></div>
                    <span className="text-[10px] text-gray-600 font-bold uppercase">OR</span>
                    <div className="h-[1px] bg-gray-800 flex-grow"></div>
                  </div>

                  <div>
                     <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Image URL</span>
                    <input 
                      type="url" 
                      value={imageUrl} 
                      onChange={e => {
                        setImageUrl(e.target.value);
                        setImageFile(null);
                        if (imageInputRef.current) imageInputRef.current.value = '';
                      }} 
                      placeholder="https://..." 
                      className="w-full bg-[#0B101D] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:border-[#00d2ff] focus:outline-none mt-1" 
                    />
                  </div>
                </div>
              </div>

              <div className="border border-gray-700 rounded-xl p-4 bg-[#12182b]">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Video Attachment (Optional)</label>
                
                <div className="flex flex-col gap-3">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Upload Video</span>
                    <input 
                      type="file" 
                      accept="video/*"
                      ref={videoInputRef}
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          setVideoFile(e.target.files[0]);
                          setVideoUrl('');
                        }
                      }} 
                      className="w-full block text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-gray-800 file:text-white hover:file:bg-gray-700 cursor-pointer mt-1" 
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="h-[1px] bg-gray-800 flex-grow"></div>
                    <span className="text-[10px] text-gray-600 font-bold uppercase">OR</span>
                    <div className="h-[1px] bg-gray-800 flex-grow"></div>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Video Link</span>
                    <input 
                      type="url" 
                      value={videoUrl} 
                      onChange={e => {
                        setVideoUrl(e.target.value);
                        setVideoFile(null);
                        if (videoInputRef.current) videoInputRef.current.value = '';
                      }} 
                      placeholder="YouTube/Vimeo link" 
                      className="w-full bg-[#0B101D] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:border-[#00d2ff] focus:outline-none mt-1" 
                    />
                  </div>
                </div>
              </div>

              {isUploading && (
                <div className="w-full bg-gray-800 rounded-full h-2.5 mt-2 overflow-hidden">
                  <div className="bg-[#00d2ff] h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  <p className="text-center text-xs text-gray-400 mt-2 font-medium">Uploading... {Math.round(uploadProgress)}%</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isUploading}
                className={`w-full ${isUploading ? 'opacity-50 cursor-not-allowed bg-gray-700' : 'bg-gradient-to-r from-emerald-400 to-teal-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]'} mt-2 text-white font-bold py-3 rounded-xl transition-all uppercase tracking-widest text-sm`}
              >
                {isUploading ? 'Processing...' : 'Upload Project'}
              </button>
            </form>
          </div>

          {/* Manage Projects Map */}
          <div className="bg-[#0B101D] p-6 rounded-2xl border border-gray-800 lg:col-span-1 h-fit">
            <h2 className="text-xl font-bold mb-6">Manage Projects</h2>
            {projects.length === 0 ? (
              <p className="text-gray-500">No projects uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map((p) => {
                  const cat = CATEGORIES.find(c => c.id === p.categoryId);
                  return (
                    <div key={p.id} className="relative bg-[#12182b] rounded-xl border border-gray-800 overflow-hidden flex flex-col">
                      <div className="aspect-video w-full relative">
                        <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur text-xs font-bold px-2 py-1 rounded text-white z-10">
                          {cat?.title}
                        </div>
                      </div>
                      <div className="p-4 flex-grow flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-lg mb-1">{p.title}</h3>
                          {p.videoUrl && <p className="text-xs text-blue-400 break-all mb-4">Video attached</p>}
                        </div>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="mt-4 w-full py-2 bg-red-900/50 hover:bg-red-600 text-white font-semibold rounded text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
