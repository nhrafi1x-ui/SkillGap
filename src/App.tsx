/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Layout, 
  Search, 
  User, 
  BookOpen, 
  Target, 
  Briefcase, 
  Info, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight, 
  Github, 
  Linkedin, 
  Twitter, 
  Instagram,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ExternalLink,
  MapPin,
  Mail,
  Send,
  ArrowRight,
  Award,
  Clock,
  TrendingUp,
  FileText,
  MessageSquare,
  Shield,
  Database,
  Code,
  Globe,
  Smartphone,
  Cpu,
  Cloud,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  onSnapshot,
  getDocFromServer,
  addDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { CAREER_DIRECTORY, QUIZ_QUESTIONS, BLOG_POSTS, JobProfile } from './data';
import { SKILL_QUIZZES } from './data/quizzes';
import { GoogleGenAI, Type } from "@google/genai";
import Markdown from 'react-markdown';

import { HomeView } from './components/Home';
import { CareersView as DirectoryView } from './components/Careers';
import { DashboardView } from './components/Dashboard';
import { ProfileView } from './components/Profile';
import { BlogView } from './components/Blog';
import { SkillQuizView } from './components/SkillQuiz';
import { AboutView } from './components/About';
import { LazyImage } from './components/LazyImage';
import { handleFirestoreError } from './utils/error';

// --- Types ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}





// Test connection to Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

type View = 'home' | 'auth' | 'quiz' | 'results' | 'dashboard' | 'directory' | 'profile' | 'blog' | 'about' | 'skillQuiz';

interface UserProfile {
  fullName: string;
  username: string;
  education: string;
  country: string;
  currentRole?: string;
  interests?: string;
  careerPlan?: string;
  matchedJobId?: string | null;
  milestones: Record<string, boolean>;
  cvLink?: string;
  socialLinks?: { platform: string; url: string }[];
  documents?: { title: string; url: string }[];
  points?: number;
  badges?: string[];
  quizResults?: Record<string, number>;
  profileImage?: string;
  role?: 'admin' | 'user';
}

interface Todo {
  id: string;
  text: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  createdAt: any;
}

interface Application {
  id: string;
  company: string;
  role: string;
  date?: string;
  status: 'Applied' | 'Interview' | 'Offer' | 'Rejected';
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

// --- Components ---

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error.message || String(this.state.error);

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7] p-4">
          <div className="bg-[#1a3636] text-[#fdfbf7] p-8 border-2 border-[#1a3636] shadow-[8px_8px_0px_0px_rgba(13,27,27,1)] max-w-md w-full">
            <h2 className="text-2xl font-bold font-serif mb-4 uppercase tracking-widest">Application Error</h2>
            <p className="text-sm font-serif italic mb-6">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-[#fdfbf7] text-[#1a3636] py-3 px-4 text-sm font-bold uppercase tracking-widest hover:bg-[#fdfbf7] transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}



function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', parts: [{ text: "Hello! I'm your Your SkillGAP Career Advisor. How can I help you bridge the gap to your dream tech career today?" }] }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<'gemini-3.1-pro-preview' | 'gemini-3-flash-preview' | 'gemini-3.1-flash-lite-preview'>('gemini-3-flash-preview');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });
      const chat = ai.chats.create({
        model: model,
        config: {
          systemInstruction: "You are a helpful Career Advisor for Your SkillGAP. Your goal is to help users bridge the gap between their current skills and their dream tech job. Be encouraging, professional, and provide actionable advice. You can help with roadmap questions, interview prep, and general tech career guidance.",
        },
        history: messages,
      });

      const response = await chat.sendMessage({ message: input });
      const modelMessage: ChatMessage = { role: 'model', parts: [{ text: response.text || '' }] };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: "Sorry, I encountered an error. Please try again." }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      { role: 'model', parts: [{ text: "Hello! I'm your Your SkillGAP Career Advisor. How can I help you bridge the gap to your dream tech career today?" }] }
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="bg-[#fdfbf7] border-4 border-[#1a3636] shadow-[12px_12px_0px_0px_rgba(13,27,27,1)] w-80 md:w-96 h-[500px] flex flex-col mb-4 overflow-hidden relative"
          >
            {/* Vintage noise overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

            {/* Header */}
            <div className="bg-[#1a3636] text-[#fdfbf7] p-4 flex justify-between items-center border-b-2 border-[#1a3636] relative z-10">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                <span className="font-bold uppercase tracking-widest text-xs">Career Advisor</span>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={clearChat} className="hover:text-[#fdfbf7] transition-colors p-1" title="Clear Chat">
                  <Trash2 className="h-4 w-4" />
                </button>
                <button onClick={() => setIsOpen(false)} className="hover:text-[#fdfbf7] transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Model Selector */}
            <div className="bg-[#fdfbf7] p-2 border-b-2 border-[#1a3636] flex justify-between items-center relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#1a3636]/70">Model:</span>
              <select 
                value={model} 
                onChange={(e) => setModel(e.target.value as any)}
                className="bg-transparent text-[10px] font-bold uppercase tracking-widest focus:outline-none cursor-pointer rounded-none border-none"
              >
                <option value="gemini-3-flash-preview">General (Flash)</option>
                <option value="gemini-3.1-pro-preview">Complex (Pro)</option>
                <option value="gemini-3.1-flash-lite-preview">Fast (Lite)</option>
              </select>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fdfbf7] relative z-10">
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <Target className="h-10 w-10 mx-auto text-[#1a3636]/20 mb-4" />
                  <p className="text-xs font-serif italic text-[#1a3636]/50">Ask me anything about your career roadmap!</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 border-2 border-[#1a3636] shadow-[4px_4px_0px_0px_rgba(13,27,27,1)] ${msg.role === 'user' ? 'bg-[#1a3636] text-[#fdfbf7]' : 'bg-[#fdfbf7] text-[#1a3636]'}`}>
                    <div className="text-xs font-serif leading-relaxed whitespace-pre-wrap prose prose-invert prose-xs">
                      <Markdown>{msg.parts[0].text}</Markdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#fdfbf7] p-3 border-2 border-[#1a3636] shadow-[4px_4px_0px_0px_rgba(13,27,27,1)]">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-[#1a3636] rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-[#1a3636] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-[#1a3636] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t-2 border-[#1a3636] bg-[#fdfbf7] relative z-10">
              <form 
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="flex space-x-2"
              >
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-[#fdfbf7] border-2 border-[#1a3636] px-3 py-2 text-xs font-bold uppercase tracking-wider focus:outline-none placeholder-[#1a3636]/30 rounded-none"
                  disabled={isLoading}
                />
                <button 
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-[#1a3636] text-[#fdfbf7] p-2 border-2 border-[#1a3636] hover:bg-[#fdfbf7] hover:text-[#1a3636] transition-colors disabled:opacity-50 rounded-none"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#1a3636] text-[#fdfbf7] p-4 border-4 border-[#1a3636] shadow-[8px_8px_0px_0px_rgba(13,27,27,1)] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(13,27,27,1)] transition-all active:translate-y-0 active:shadow-none relative z-[201]"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>('home');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            // Check if we have a pending job ID from local storage
            const pendingJobId = localStorage.getItem('pendingJobId');
            
            const initialProfile: UserProfile = {
              fullName: u.displayName || 'User',
              username: u.email?.split('@')[0] || 'user',
              education: '',
              country: '',
              matchedJobId: pendingJobId || null,
              role: 'user',
              milestones: {
                discovery: !!pendingJobId,
                skills: false,
                projects: false,
                docs: false,
                apply: false,
                hired: false
              }
            };
            await setDoc(doc(db, 'users', u.uid), initialProfile);
            setProfile(initialProfile);
            if (pendingJobId) localStorage.removeItem('pendingJobId');
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${u.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const navigate = (newView: View) => {
    setView(newView);
    setIsMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
        <div className="animate-spin rounded-none h-12 w-12 border-t-4 border-b-4 border-[#1a3636]"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col font-sans bg-[#fdfbf7] text-[#1a3636] selection:bg-[#1a3636] selection:text-[#fdfbf7]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#fdfbf7] border-b-4 border-[#1a3636]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('home')}>
              <div className="bg-[#1a3636] p-2 border-2 border-[#1a3636] shadow-[2px_2px_0px_0px_rgba(13,27,27,1)] mr-3">
                <Target className="text-[#fdfbf7] h-6 w-6" />
              </div>
              <span className="text-2xl font-bold font-serif text-[#1a3636] uppercase tracking-widest">Your SkillGAP</span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-8 items-center">
              <button onClick={() => navigate('home')} className={`text-sm font-bold uppercase tracking-wider ${view === 'home' ? 'text-[#1a3636] underline decoration-2 underline-offset-4' : 'text-[#1a3636]/80 hover:text-[#1a3636] hover:underline decoration-2 underline-offset-4'}`}>Home</button>
              <button onClick={() => navigate('directory')} className={`text-sm font-bold uppercase tracking-wider ${view === 'directory' ? 'text-[#1a3636] underline decoration-2 underline-offset-4' : 'text-[#1a3636]/80 hover:text-[#1a3636] hover:underline decoration-2 underline-offset-4'}`}>Careers</button>
              <button onClick={() => navigate('skillQuiz')} className={`text-sm font-bold uppercase tracking-wider ${view === 'skillQuiz' ? 'text-[#1a3636] underline decoration-2 underline-offset-4' : 'text-[#1a3636]/80 hover:text-[#1a3636] hover:underline decoration-2 underline-offset-4'}`}>Skill Quiz</button>
              <button onClick={() => navigate('blog')} className={`text-sm font-bold uppercase tracking-wider ${view === 'blog' ? 'text-[#1a3636] underline decoration-2 underline-offset-4' : 'text-[#1a3636]/80 hover:text-[#1a3636] hover:underline decoration-2 underline-offset-4'}`}>Blog</button>
              <button onClick={() => navigate('about')} className={`text-sm font-bold uppercase tracking-wider ${view === 'about' ? 'text-[#1a3636] underline decoration-2 underline-offset-4' : 'text-[#1a3636]/80 hover:text-[#1a3636] hover:underline decoration-2 underline-offset-4'}`}>About</button>
              
              {user ? (
                <div className="flex items-center space-x-3">
                  <button onClick={() => navigate('dashboard')} className="bg-[#1a3636] text-[#fdfbf7] px-4 py-2 border-2 border-[#1a3636] shadow-[4px_4px_0px_0px_rgba(13,27,27,1)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-wider font-bold text-xs">Dashboard</button>
                  <button onClick={() => navigate('profile')} className="flex items-center space-x-2 px-3 py-2 text-[#1a3636] hover:bg-[#1a3636]/10 border-2 border-transparent hover:border-[#1a3636] transition-all font-bold uppercase tracking-wider text-xs">
                    {profile?.profileImage ? (
                      <img src={profile.profileImage} alt="Profile" className="h-6 w-6 object-cover border-2 border-[#1a3636]" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                    <span>Profile</span>
                  </button>
                  <button onClick={handleLogout} className="flex items-center space-x-2 px-3 py-2 text-[#1a3636] hover:bg-[#1a3636]/10 border-2 border-transparent hover:border-[#1a3636] transition-all font-bold uppercase tracking-wider text-xs">
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button onClick={() => navigate('auth')} className="bg-[#fdfbf7] text-[#1a3636] px-6 py-2 border-2 border-[#1a3636] shadow-[4px_4px_0px_0px_rgba(13,27,27,1)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-wider font-bold text-xs">Login</button>
              )}
            </nav>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-[#1a3636] p-2 border-2 border-transparent hover:border-[#1a3636]">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#fdfbf7] border-t-4 border-[#1a3636] overflow-hidden"
            >
              <div className="px-4 pt-4 pb-6 space-y-3">
                <button onClick={() => navigate('home')} className="block w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wider text-[#1a3636] border-2 border-transparent hover:border-[#1a3636] hover:bg-[#1a3636]/5">Home</button>
                <button onClick={() => navigate('directory')} className="block w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wider text-[#1a3636] border-2 border-transparent hover:border-[#1a3636] hover:bg-[#1a3636]/5">Careers</button>
                <button onClick={() => navigate('skillQuiz')} className="block w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wider text-[#1a3636] border-2 border-transparent hover:border-[#1a3636] hover:bg-[#1a3636]/5">Skill Quiz</button>
                <button onClick={() => navigate('blog')} className="block w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wider text-[#1a3636] border-2 border-transparent hover:border-[#1a3636] hover:bg-[#1a3636]/5">Blog</button>
                <button onClick={() => navigate('about')} className="block w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wider text-[#1a3636] border-2 border-transparent hover:border-[#1a3636] hover:bg-[#1a3636]/5">About</button>
                {user ? (
                  <>
                    <button onClick={() => navigate('dashboard')} className="block w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wider text-[#1a3636] border-2 border-transparent hover:border-[#1a3636] hover:bg-[#1a3636]/5">Dashboard</button>
                    <button onClick={() => navigate('profile')} className="flex items-center w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wider text-[#1a3636] border-2 border-transparent hover:border-[#1a3636] hover:bg-[#1a3636]/5">
                      {profile?.profileImage ? (
                        <img src={profile.profileImage} alt="Profile" className="h-5 w-5 object-cover border-2 border-[#1a3636] mr-3" />
                      ) : (
                        <User className="h-5 w-5 mr-3" />
                      )}
                      Profile
                    </button>
                    <button onClick={handleLogout} className="flex items-center w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wider text-[#1a3636] border-2 border-transparent hover:border-[#1a3636] hover:bg-[#1a3636]/5">
                      <LogOut className="h-5 w-5 mr-3" />
                      Logout
                    </button>
                  </>
                ) : (
                  <button onClick={() => navigate('auth')} className="block w-full text-center px-4 py-3 text-sm font-bold uppercase tracking-wider bg-[#1a3636] text-[#fdfbf7] border-2 border-[#1a3636] shadow-[4px_4px_0px_0px_rgba(13,27,27,1)] active:translate-y-1 active:shadow-none transition-all mt-4">Login / Register</button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {view === 'home' && <HomeView key="home" navigate={navigate} user={user} />}
          {view === 'auth' && <AuthView key="auth" navigate={navigate} />}
          {view === 'quiz' && <QuizView key="quiz" navigate={navigate} user={user} profile={profile} setProfile={setProfile} />}
          {view === 'results' && <ResultsView key="results" navigate={navigate} profile={profile} />}
          {view === 'dashboard' && <DashboardView key="dashboard" navigate={navigate} user={user} profile={profile} setProfile={setProfile} />}
          {view === 'directory' && <DirectoryView key="directory" navigate={navigate} user={user} profile={profile} setProfile={setProfile} />}
          {view === 'skillQuiz' && <SkillQuizView key="skillQuiz" navigate={navigate} user={user} profile={profile} setProfile={setProfile} />}
          {view === 'profile' && <ProfileView key="profile" navigate={navigate} user={user} profile={profile} setProfile={setProfile} handleLogout={handleLogout} />}
          {view === 'blog' && <BlogView key="blog" />}
          {view === 'about' && <AboutView key="about" />}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-[#1a3636] text-[#fdfbf7] pt-20 pb-10 border-t-4 border-[#1a3636] relative overflow-hidden">
        {/* Vintage noise overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center mb-6">
                <div className="bg-[#fdfbf7] p-2 border-2 border-[#fdfbf7] mr-3">
                  <Target className="text-[#1a3636] h-6 w-6" />
                </div>
                <span className="text-2xl font-bold font-serif uppercase tracking-widest">Your SkillGAP</span>
              </div>
              <p className="text-[#fdfbf7]/80 text-sm leading-relaxed mb-8 font-serif italic">
                Empowering the next generation of tech leaders by bridging the gap between education and industry through personalized roadmaps.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="p-3 bg-[#fdfbf7] text-[#1a3636] hover:bg-[#fdfbf7] border-2 border-[#fdfbf7] transition-colors"><Linkedin className="h-5 w-5" /></a>
                <a href="#" className="p-3 bg-[#fdfbf7] text-[#1a3636] hover:bg-[#fdfbf7] border-2 border-[#fdfbf7] transition-colors"><Twitter className="h-5 w-5" /></a>
                <a href="#" className="p-3 bg-[#fdfbf7] text-[#1a3636] hover:bg-[#fdfbf7] border-2 border-[#fdfbf7] transition-colors"><Instagram className="h-5 w-5" /></a>
                <a href="#" className="p-3 bg-[#fdfbf7] text-[#1a3636] hover:bg-[#fdfbf7] border-2 border-[#fdfbf7] transition-colors"><Github className="h-5 w-5" /></a>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6 font-serif uppercase tracking-widest border-b-2 border-[#fdfbf7]/20 pb-2 inline-block">Quick Links</h4>
              <ul className="space-y-4 text-[#fdfbf7]/80 text-sm font-bold uppercase tracking-wider">
                <li><button onClick={() => navigate('home')} className="hover:text-[#fdfbf7] hover:underline decoration-2 underline-offset-4 transition-all">Home</button></li>
                <li><button onClick={() => navigate('directory')} className="hover:text-[#fdfbf7] hover:underline decoration-2 underline-offset-4 transition-all">Career Directory</button></li>
                <li><button onClick={() => navigate('blog')} className="hover:text-[#fdfbf7] hover:underline decoration-2 underline-offset-4 transition-all">Career Blog</button></li>
                <li><button onClick={() => navigate('about')} className="hover:text-[#fdfbf7] hover:underline decoration-2 underline-offset-4 transition-all">About Us</button></li>
                <li><button onClick={() => navigate('auth')} className="hover:text-[#fdfbf7] hover:underline decoration-2 underline-offset-4 transition-all">Join Now</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6 font-serif uppercase tracking-widest border-b-2 border-[#fdfbf7]/20 pb-2 inline-block">Our Office</h4>
              <div className="overflow-hidden h-40 mb-4 border-2 border-[#fdfbf7]">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.835434509374!2d-122.4194155!3d37.7749295!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085809c6c8f4459%3A0xb10ed6d9b5050fa5!2sTwitter%20HQ!5e0!3m2!1sen!2sus!4v1633000000000!5m2!1sen!2sus" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy"
                ></iframe>
              </div>
              <div className="flex items-center text-[#fdfbf7]/80 text-xs font-bold uppercase tracking-wider">
                <MapPin className="h-4 w-4 mr-2 text-[#fdfbf7]" />
                <span>1355 Market St, San Francisco, CA 94103</span>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6 font-serif uppercase tracking-widest border-b-2 border-[#fdfbf7]/20 pb-2 inline-block">Newsletter</h4>
              <p className="text-[#fdfbf7]/80 text-sm mb-6 font-serif italic">Get the latest career tips and roadmap updates.</p>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="relative">
                  <input 
                    type="email" 
                    placeholder="YOUR EMAIL" 
                    className="w-full bg-[#fdfbf7] text-[#1a3636] border-2 border-[#fdfbf7] py-3 px-4 text-sm font-bold uppercase tracking-wider focus:outline-none focus:bg-[#fdfbf7] placeholder-[#1a3636]/50 transition-colors"
                    required
                  />
                  <button type="submit" className="absolute right-2 top-2 bottom-2 px-4 bg-[#1a3636] text-[#fdfbf7] border-2 border-[#1a3636] hover:bg-[#fdfbf7] hover:text-[#1a3636] transition-colors flex items-center justify-center">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-[10px] text-[#fdfbf7]/60 font-bold uppercase tracking-widest">We respect your privacy. Unsubscribe at any time.</p>
              </form>
            </div>
          </div>

          <div className="pt-8 border-t-2 border-[#fdfbf7]/20 flex flex-col md:flex-row justify-between items-center text-[#fdfbf7]/60 text-xs font-bold uppercase tracking-widest">
            <p>© 2024 Your SkillGAP. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-[#fdfbf7] hover:underline decoration-2 underline-offset-4">Privacy Policy</a>
              <a href="#" className="hover:text-[#fdfbf7] hover:underline decoration-2 underline-offset-4">Terms of Service</a>
              <a href="#" className="hover:text-[#fdfbf7] hover:underline decoration-2 underline-offset-4">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
      <ChatBot />
    </div>
    </ErrorBoundary>
  );
}

// --- View Components ---

function AuthView({ navigate }: { navigate: (v: View) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [education, setEducation] = useState('BSc');
  const [country, setCountry] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address to reset your password.");
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError("No account found with this email.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("Password reset is not enabled. Please enable 'Email/Password' in the Firebase Console.");
      } else {
        setError(err.message.replace('Firebase: ', ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const pendingJobId = localStorage.getItem('pendingJobId');
        
        const initialProfile: UserProfile = {
          fullName,
          username,
          education,
          country,
          matchedJobId: pendingJobId || null,
          role: 'user',
          milestones: {
            discovery: !!pendingJobId,
            skills: false,
            projects: false,
            docs: false,
            apply: false,
            hired: false
          }
        };
        
        try {
          await setDoc(doc(db, 'users', user.uid), initialProfile);
          if (pendingJobId) localStorage.removeItem('pendingJobId');
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
        }
      }
      navigate('dashboard');
    } catch (err: any) {
      if (isLogin && (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-email')) {
        setError("Invalid email or password. Please check your credentials or register if you don't have an account.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please login instead.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("Email/Password authentication is not enabled in the Firebase Console. Please enable it in the Authentication > Sign-in method tab.");
      } else if (err.code === 'auth/admin-restricted-operation') {
        setError("User registration is currently restricted. Please check the Firebase Console Authentication settings or contact the administrator.");
      } else {
        setError(err.message.replace('Firebase: ', ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
      navigate('dashboard');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError("Anonymous sign-in is not enabled in the Firebase Console. Please enable it in the Authentication > Sign-in method tab.");
      } else if (err.code === 'auth/admin-restricted-operation') {
        setError("Anonymous sign-in is currently restricted by administrative settings in the Firebase Console.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      // Add custom parameters to force account selection and improve reliability in iframes
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, provider);
      navigate('dashboard');
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        setError("This domain is not authorized for Google login. Please add '" + window.location.hostname + "' to the Authorized Domains in your Firebase Console (Authentication > Settings).");
      } else if (err.message.includes('invalid request') || err.code === 'auth/popup-closed-by-user') {
        setError("Google login was cancelled or failed. Please try again or use email/password.");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("Google sign-in is not enabled in the Firebase Console. Please enable it in the Authentication > Sign-in method tab.");
      } else if (err.code === 'auth/admin-restricted-operation') {
        setError("Google sign-in is currently restricted by administrative settings in the Firebase Console.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="max-w-md mx-auto my-20 px-4 relative z-10"
    >
      <div className="bg-[#fdfbf7] p-8 border-4 border-[#1a3636] shadow-[8px_8px_0px_0px_rgba(13,27,27,1)] relative overflow-hidden">
        {/* Vintage noise overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        
        <div className="text-center mb-8 relative z-10">
          <h2 className="text-3xl font-bold font-serif text-[#1a3636] mb-2 uppercase tracking-widest">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <div className="h-1 w-16 bg-[#1a3636] mx-auto mb-4"></div>
          <p className="text-[#1a3636]/80 text-sm font-serif italic">{isLogin ? 'Login to track your progress' : 'Start your career journey today'}</p>
        </div>

        {error && <div className="bg-[#fdfbf7] text-[#1a3636] p-3 text-xs mb-6 border-2 border-[#1a3636] font-bold tracking-wide shadow-[4px_4px_0px_0px_rgba(13,27,27,1)]">{error}</div>}
        {message && <div className="bg-[#fdfbf7] text-[#1a3636] p-3 text-xs mb-6 border-2 border-[#1a3636] font-bold tracking-wide shadow-[4px_4px_0px_0px_rgba(13,27,27,1)]">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  className="w-full bg-[#fdfbf7] border-2 border-[#1a3636]/50 py-3 px-4 text-sm focus:outline-none focus:border-[#1a3636] transition-colors text-[#1a3636] placeholder-[#1a3636]/30 font-mono"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <input 
                  type="text" 
                  placeholder="Username" 
                  className="w-full bg-[#fdfbf7] border-2 border-[#1a3636]/50 py-3 px-4 text-sm focus:outline-none focus:border-[#1a3636] transition-colors text-[#1a3636] placeholder-[#1a3636]/30 font-mono"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select 
                  className="w-full bg-[#fdfbf7] border-2 border-[#1a3636]/50 py-3 px-4 text-sm focus:outline-none focus:border-[#1a3636] transition-colors text-[#1a3636] font-mono appearance-none rounded-none"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                >
                  <option value="12th">12th Grade</option>
                  <option value="BSc">BSc</option>
                  <option value="MSc">MSc</option>
                  <option value="PhD">PhD</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Country" 
                  className="w-full bg-[#fdfbf7] border-2 border-[#1a3636]/50 py-3 px-4 text-sm focus:outline-none focus:border-[#1a3636] transition-colors text-[#1a3636] placeholder-[#1a3636]/30 font-mono"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                />
              </div>
            </>
          )}
          <input 
            type="email" 
            placeholder="Email Address" 
            className="w-full bg-[#fdfbf7] border-2 border-[#1a3636]/50 py-3 px-4 text-sm focus:outline-none focus:border-[#1a3636] transition-colors text-[#1a3636] placeholder-[#1a3636]/30 font-mono"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full bg-[#fdfbf7] border-2 border-[#1a3636]/50 py-3 px-4 text-sm focus:outline-none focus:border-[#1a3636] transition-colors text-[#1a3636] placeholder-[#1a3636]/30 font-mono"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {isLogin && (
            <div className="flex justify-end">
              <button type="button" onClick={handleResetPassword} className="text-xs font-bold text-[#1a3636]/50 hover:text-[#1a3636] hover:underline uppercase tracking-wider">
                Forgot Password?
              </button>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#1a3636] text-[#fdfbf7] py-4 border-2 border-[#1a3636] font-bold hover:bg-transparent hover:text-[#1a3636] transition-all shadow-[6px_6px_0px_0px_rgba(13,27,27,1)] disabled:opacity-50 uppercase tracking-widest mt-4"
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-[#1a3636]/50 font-bold uppercase tracking-wider relative z-10">
          <span>{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
          <button onClick={() => setIsLogin(!isLogin)} className="text-[#1a3636] font-bold hover:underline">
            {isLogin ? 'Register Now' : 'Login Now'}
          </button>
        </div>

        <div className="relative my-8 z-10">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-[#1a3636]/20 border-dashed"></div></div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold"><span className="bg-[#fdfbf7] px-4 text-[#1a3636]/40">Or</span></div>
        </div>

        <div className="space-y-4 relative z-10">
          <button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-transparent text-[#1a3636] border-2 border-[#1a3636] py-3 font-bold hover:bg-[#1a3636] hover:text-[#fdfbf7] transition-all flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(13,27,27,1)] uppercase tracking-wider text-sm"
          >
            <svg className="w-5 h-5 mr-3 grayscale brightness-0" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <button 
            onClick={handleGuest}
            disabled={loading}
            className="w-full bg-transparent text-[#1a3636] border-2 border-[#1a3636] py-3 font-bold hover:bg-[#1a3636] hover:text-[#fdfbf7] transition-all flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(13,27,27,1)] uppercase tracking-wider text-sm"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// --- Quiz, Results, Directory Views ---

function QuizView({ navigate, user, profile, setProfile }: { navigate: (v: View) => void, user: any, profile: UserProfile | null, setProfile: any }) {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({ dev: 0, data: 0, ops: 0 });

  const handleAnswer = async (category: string) => {
    const newScores = { ...scores, [category]: scores[category as keyof typeof scores] + 1 };
    setScores(newScores);

    if (step < QUIZ_QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // Calculate result
      let matchedId = 'frontend-dev';
      if (newScores.data > newScores.dev && newScores.data > newScores.ops) matchedId = 'data-analyst';
      if (newScores.ops > newScores.dev && newScores.ops > newScores.data) matchedId = 'devops-engineer';
      
      if (user && setProfile) {
        try {
          const updatedProfile = { ...profile, matchedJobId: matchedId };
          setProfile(updatedProfile);
          await updateDoc(doc(db, 'users', user.uid), { matchedJobId: matchedId });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
        }
      }
      navigate('results');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="max-w-2xl mx-auto my-20 px-4 relative z-10"
    >
      <div className="bg-[#fdfbf7] p-10 border-2 border-[#1a3636] shadow-[8px_8px_0px_0px_rgba(13,27,27,1)] relative overflow-hidden">
        {/* Vintage noise overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        
        <div className="mb-8 relative z-10">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-[#1a3636] uppercase tracking-widest">Step {step + 1} of {QUIZ_QUESTIONS.length}</span>
            <span className="text-xs font-bold text-[#1a3636]/70 uppercase tracking-widest">{Math.round(((step + 1) / QUIZ_QUESTIONS.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-[#fdfbf7] h-3 border-2 border-[#1a3636] overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
              className="bg-[#1a3636] h-full border-r-2 border-[#1a3636]"
            ></motion.div>
          </div>
        </div>

        <h2 className="text-3xl font-bold font-serif text-[#1a3636] mb-8 relative z-10">{QUIZ_QUESTIONS[step].question}</h2>

        <div className="space-y-4 relative z-10">
          {QUIZ_QUESTIONS[step].options.map((option, i) => (
            <button 
              key={i}
              onClick={() => handleAnswer(option.category)}
              className="w-full text-left p-6 bg-[#fdfbf7] border-2 border-[#1a3636] hover:bg-[#1a3636] hover:text-[#fdfbf7] transition-all group flex justify-between items-center shadow-[4px_4px_0px_0px_rgba(13,27,27,1)] hover:shadow-[2px_2px_0px_0px_rgba(13,27,27,1)] hover:translate-y-[2px] hover:translate-x-[2px]"
            >
              <span className="text-lg font-bold font-serif group-hover:text-[#fdfbf7] text-[#1a3636]">{option.text}</span>
              <ChevronRight className="h-5 w-5 text-[#1a3636] group-hover:text-[#fdfbf7] group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ResultsView({ navigate, profile }: { navigate: (v: View) => void, profile: UserProfile | null }) {
  const job = useMemo(() => {
    return CAREER_DIRECTORY.find(j => j.id === profile?.matchedJobId) || CAREER_DIRECTORY[0];
  }, [profile]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-4xl mx-auto my-20 px-4 text-center relative z-10"
    >
      <div className="bg-[#fdfbf7] p-12 border-2 border-[#1a3636] shadow-[12px_12px_0px_0px_rgba(13,27,27,1)] relative overflow-hidden">
        {/* Vintage noise overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        
        <div className="absolute top-0 left-0 w-full h-3 bg-[#1a3636] border-b-2 border-[#1a3636]"></div>
        
        <div className="mb-8 inline-flex items-center justify-center w-24 h-24 bg-[#fdfbf7] border-2 border-[#1a3636] rounded-full shadow-[4px_4px_0px_0px_rgba(13,27,27,1)] relative z-10">
          <Award className="h-12 w-12 text-[#1a3636]" />
        </div>
        
        <h2 className="text-sm font-bold text-[#1a3636] uppercase tracking-[0.2em] mb-4 relative z-10">Your Perfect Match</h2>
        <h1 className="text-5xl font-bold font-serif text-[#1a3636] mb-6 relative z-10 uppercase tracking-wide">{job.title}</h1>
        <p className="text-xl text-[#1a3636]/80 max-w-2xl mx-auto mb-10 leading-relaxed font-serif italic relative z-10">
          {job.description}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative z-10">
          <div className="p-6 bg-[#fdfbf7] border-2 border-[#1a3636] shadow-[4px_4px_0px_0px_rgba(13,27,27,1)]">
            <TrendingUp className="h-8 w-8 text-[#1a3636] mx-auto mb-4" />
            <div className="text-xs font-bold text-[#1a3636]/70 uppercase tracking-widest mb-2">Salary Range</div>
            <div className="font-bold text-xl text-[#1a3636] font-serif">{job.salary}</div>
          </div>
          <div className="p-6 bg-[#fdfbf7] border-2 border-[#1a3636] shadow-[4px_4px_0px_0px_rgba(13,27,27,1)]">
            <BarChart3 className="h-8 w-8 text-[#1a3636] mx-auto mb-4" />
            <div className="text-xs font-bold text-[#1a3636]/70 uppercase tracking-widest mb-2">Market Demand</div>
            <div className="font-bold text-xl text-[#1a3636] font-serif">High Growth</div>
          </div>
          <div className="p-6 bg-[#fdfbf7] border-2 border-[#1a3636] shadow-[4px_4px_0px_0px_rgba(13,27,27,1)]">
            <Clock className="h-8 w-8 text-[#1a3636] mx-auto mb-4" />
            <div className="text-xs font-bold text-[#1a3636]/70 uppercase tracking-widest mb-2">Time to Hire</div>
            <div className="font-bold text-xl text-[#1a3636] font-serif">6 Months</div>
          </div>
        </div>

        <button 
          onClick={() => navigate('dashboard')}
          className="bg-[#1a3636] text-[#fdfbf7] px-12 py-5 border-2 border-[#1a3636] text-lg font-bold hover:bg-[#1a3636]/90 transition-all shadow-[6px_6px_0px_0px_rgba(13,27,27,1)] flex items-center justify-center mx-auto group uppercase tracking-widest relative z-10"
        >
          View Your Roadmap <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}

// --- Profile, Blog, About Views ---

