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
  BarChart3,
  Mic,
  Brain
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
  serverTimestamp,
  auth, 
  db,
  getIsDemoMode,
  setDemoMode,
  hasRealFirebase,
  enableNetwork
} from './firebase';
import type { User as FirebaseUser } from 'firebase/auth';
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
import { AIInterviewer } from './components/AIInterviewer';
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






// Types for connection status
type ConnectionStatus = 'connected' | 'connecting' | 'offline' | 'error';
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
  link?: string;
  status: 'Applied' | 'Interview' | 'Offer' | 'Rejected';
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

import { formatAiError } from './utils/ai';

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

  const sendMessage = async (retryCount = 0) => {
    if (!input.trim() && retryCount === 0) return;

    const messageText = input.trim() || (messages[messages.length - 1]?.role === 'user' ? messages[messages.length - 1].parts[0].text : '');
    if (!messageText) return;

    if (retryCount === 0) {
      const userMessage: ChatMessage = { role: 'user', parts: [{ text: messageText }] };
      setMessages(prev => [...prev, userMessage]);
      setInput('');
    }
    
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'undefined' || !apiKey.trim()) {
        throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your environment variables.");
      }
      const ai = new GoogleGenAI({ apiKey });
      
      // History should exclude the last message we just added if we are sending it now
      const history = messages.filter((_, i) => i < messages.length); 

      const chat = ai.chats.create({
        model: model,
        config: {
          systemInstruction: "You are a helpful Career Advisor for Your SkillGAP. Your goal is to help users bridge the gap between their current skills and their dream tech job. Be encouraging, professional, and provide actionable advice. Keep your responses concise and formatted with markdown.",
        },
        history: history,
      });

      const result = await chat.sendMessage({ message: messageText });
      if (!result || !result.text) {
        throw new Error("Empty response from AI.");
      }
      
      const modelMessage: ChatMessage = { role: 'model', parts: [{ text: result.text }] };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      if (retryCount < 2) {
        console.log(`Retrying chat... (${retryCount + 1})`);
        setTimeout(() => sendMessage(retryCount + 1), 1000);
        return;
      }
      const errorMessage = formatAiError(error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        parts: [{ text: `**Error:** ${errorMessage}\n\nPlease follow the instructions above if it's a key or quota issue.` }] 
      }]);
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
            className="bg-white border-2 border-slate-200 shadow-xl w-80 md:w-96 h-[500px] flex flex-col mb-4 overflow-hidden relative rounded-xl"
          >
            {/* Vintage noise overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

            {/* Header */}
            <div className="bg-sky-900 text-slate-200 p-4 flex justify-between items-center border-b border-emerald-500/20 relative z-10">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-emerald-400" />
                <span className="font-bold uppercase tracking-widest text-xs">Career Advisor</span>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={clearChat} className="hover:text-emerald-400 transition-colors p-1" title="Clear Chat">
                  <Trash2 className="h-4 w-4" />
                </button>
                <button onClick={() => setIsOpen(false)} className="hover:text-emerald-400 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Model Selector */}
            <div className="bg-sky-50 p-2 border-b border-slate-200 flex justify-between items-center relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Model:</span>
              <select 
                value={model} 
                onChange={(e) => setModel(e.target.value as any)}
                className="bg-transparent text-[10px] font-bold uppercase tracking-widest focus:outline-none cursor-pointer rounded-none border-none text-slate-700"
              >
                <option value="gemini-3-flash-preview">General (Flash)</option>
                <option value="gemini-3.1-pro-preview">Complex (Pro)</option>
                <option value="gemini-3.1-flash-lite-preview">Fast (Lite)</option>
              </select>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-white relative z-10">
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <Target className="h-10 w-10 mx-auto text-sky-200 mb-4" />
                  <p className="text-xs font-serif italic text-slate-400">Ask me anything about your career roadmap!</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 border border-slate-200 shadow-sm rounded-2xl ${msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-sky-50 text-slate-700'}`}>
                    <div className={`text-xs font-serif leading-relaxed whitespace-pre-wrap markdown-body ${msg.role === 'user' ? 'text-white' : 'text-slate-700'}`}>
                      <Markdown>{msg.parts[0].text}</Markdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-sky-50 p-3 border border-slate-200 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 bg-white relative z-10">
              <form 
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="flex space-x-2"
              >
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-sky-50 border border-sky-100 px-3 py-2 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 placeholder-slate-400 rounded-xl transition-all"
                  disabled={isLoading}
                />
                <button 
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-emerald-600 text-white p-2 border border-emerald-600 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 rounded-lg"
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
        className="bg-amber-600 text-white p-4 border-2 border-amber-600 shadow-lg hover:bg-amber-700 hover:-translate-y-1 hover:shadow-xl transition-all active:scale-95 relative z-[201] rounded-full"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>('home');
  const [showAIInterviewer, setShowAIInterviewer] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    console.log("Profile state changed in App.tsx:", profile);
  }, [profile]);

  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [lastConnectionError, setLastConnectionError] = useState<string | null>(null);

  // Connection Test logic inside component
  const checkConnection = async (retryArg: any = 0) => {
    const retryCount = typeof retryArg === 'number' ? retryArg : 0;
    try {
      setConnectionStatus('connecting');
      setLastConnectionError(null);
      
      const hasReal = hasRealFirebase();
      if (!hasReal) {
        throw new Error("Local Demo Mode Active: No online database configured.");
      }
      
      console.log(`🛠️ Diagnostic: Testing Firestore connection (Attempt ${retryCount + 1})...`);
      
      // We explicitly enable network in case it was toggled
      await enableNetwork(db);
      
      // Diagnostic document fetch
      const testRef = doc(db, 'test', 'connection');
      const connectionPromise = getDocFromServer(testRef);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timed out')), 8000));
      
      await Promise.race([connectionPromise, timeoutPromise]);
      
      console.log("✅ Firestore connection: ONLINE");
      setConnectionStatus('connected');
      setLastConnectionError(null);
    } catch (error: any) {
      console.error("❌ Firestore connection diagnostic failed:", error);
      
      if ((error?.message?.includes('offline') || error?.message?.includes('timeout')) && retryCount < 1) {
        console.log("🔄 Retrying connection check...");
        await new Promise(r => setTimeout(r, 2000));
        return checkConnection(retryCount + 1);
      }

      if(error?.message?.includes('offline')) {
        setConnectionStatus('offline');
        setLastConnectionError("The browser cannot reach Google Cloud. Check your internet connection.");
      } else if (error?.message?.includes('Demo Mode')) {
        setConnectionStatus('offline');
        setLastConnectionError("Running in local storage mode. Configure Firebase in the AI Studio menu to go online.");
      } else {
        setConnectionStatus('error');
        setLastConnectionError(`${error?.message || "Connectivity error"}. Verify your Firebase setup.`);
      }
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  // Auth Listener
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (u) {
        try {
          const userRef = doc(db, 'users', u.uid);
          
          // Initial check/creation
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            const pendingJobId = localStorage.getItem('pendingJobId');
            const initialProfile: UserProfile = {
              fullName: u.displayName || 'User',
              username: u.email?.split('@')[0] || 'user',
              education: '',
              country: '',
              matchedJobId: pendingJobId || null,
              role: 'user',
              milestones: { discovery: !!pendingJobId, skills: false, projects: false, docs: false, apply: false, hired: false },
              points: pendingJobId ? 50 : 0,
              badges: [],
              quizResults: {},
              socialLinks: [],
              documents: []
            };
            await setDoc(userRef, initialProfile);
            if (pendingJobId) localStorage.removeItem('pendingJobId');
          }

          // Real-time listener
          unsubscribeProfile = onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
              setProfile(snapshot.data() as UserProfile);
            }
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${u.uid}`);
          });

        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${u.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-amber-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col font-sans bg-sky-50 text-slate-700 selection:bg-emerald-500 selection:text-white">
      {/* Connection Notification */}
      {connectionStatus !== 'connected' && (
        <div className={`p-2 text-center text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
          connectionStatus === 'offline' ? 'bg-rose-600 text-white' : 
          connectionStatus === 'connecting' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center justify-center space-x-4">
            <span>
              {connectionStatus === 'offline' ? '⚠️ DATABASE OFFLINE' : 
               connectionStatus === 'connecting' ? '⌛ Connecting to Secure Backend...' : '❌ Connection Error'}
            </span>
            <button 
              onClick={checkConnection}
              className="bg-white/20 hover:bg-white/40 px-3 py-1 rounded-sm transition-colors border border-white/30"
            >
              Retry Sync
            </button>
          </div>
          {lastConnectionError && (
            <div className="mt-1 normal-case font-serif italic font-medium text-white/80">
              {lastConnectionError}
            </div>
          )}
        </div>
      )}
      {/* Header */}
      <header className="sticky top-0 z-50 bg-sky-900 border-b border-emerald-500/20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center cursor-pointer group" onClick={() => navigate('home')}>
              <div className="bg-emerald-600 p-2 border border-emerald-500 shadow-sm mr-3 transition-transform group-hover:scale-110">
                <Target className="text-white h-6 w-6" />
              </div>
              <span className="text-2xl font-bold font-serif text-emerald-400 uppercase tracking-widest">SkillGAP Navigator</span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-8 items-center">
              <button onClick={() => navigate('home')} className={`text-sm font-bold uppercase tracking-wider transition-all hover:text-emerald-400 relative after:absolute after:bottom-[-4px] after:left-0 after:h-0.5 after:bg-emerald-400 after:transition-all after:duration-300 ${view === 'home' ? 'text-emerald-400 after:w-full' : 'text-sky-100 after:w-0 hover:after:w-full'}`}>Home</button>
              <button onClick={() => navigate('directory')} className={`text-sm font-bold uppercase tracking-wider transition-all hover:text-emerald-400 relative after:absolute after:bottom-[-4px] after:left-0 after:h-0.5 after:bg-emerald-400 after:transition-all after:duration-300 ${view === 'directory' ? 'text-emerald-400 after:w-full' : 'text-sky-100 after:w-0 hover:after:w-full'}`}>Careers</button>
              <button onClick={() => navigate('skillQuiz')} className={`text-sm font-bold uppercase tracking-wider transition-all hover:text-emerald-400 relative after:absolute after:bottom-[-4px] after:left-0 after:h-0.5 after:bg-emerald-400 after:transition-all after:duration-300 ${view === 'skillQuiz' ? 'text-emerald-400 after:w-full' : 'text-sky-100 after:w-0 hover:after:w-full'}`}>Skill Quiz</button>
              <button onClick={() => navigate('blog')} className={`text-sm font-bold uppercase tracking-wider transition-all hover:text-emerald-400 relative after:absolute after:bottom-[-4px] after:left-0 after:h-0.5 after:bg-emerald-400 after:transition-all after:duration-300 ${view === 'blog' ? 'text-emerald-400 after:w-full' : 'text-sky-100 after:w-0 hover:after:w-full'}`}>Blog</button>
              <button onClick={() => navigate('about')} className={`text-sm font-bold uppercase tracking-wider transition-all hover:text-emerald-400 relative after:absolute after:bottom-[-4px] after:left-0 after:h-0.5 after:bg-emerald-400 after:transition-all after:duration-300 ${view === 'about' ? 'text-emerald-400 after:w-full' : 'text-sky-100 after:w-0 hover:after:w-full'}`}>About</button>
              
              {user ? (
                <div className="flex items-center space-x-3">
                  <button onClick={() => navigate('dashboard')} className="bg-emerald-600 text-white px-4 py-2 border border-emerald-600 shadow-sm hover:bg-emerald-700 hover:-translate-y-0.5 transition-all active:scale-95 uppercase tracking-wider font-bold text-xs rounded-lg">Dashboard</button>
                  <button onClick={() => navigate('profile')} className="flex items-center space-x-2 px-3 py-2 text-sky-100 hover:text-emerald-400 transition-all font-bold uppercase tracking-wider text-xs group">
                    {profile?.profileImage ? (
                      <img src={profile.profileImage} alt="Profile" className="h-6 w-6 object-cover border border-emerald-500 transition-transform group-hover:scale-110 rounded-full" />
                    ) : (
                      <User className="h-5 w-5 transition-transform group-hover:scale-110" />
                    )}
                    <span>Profile</span>
                  </button>
                  <button onClick={handleLogout} className="flex items-center space-x-2 px-3 py-2 text-sky-100 hover:text-emerald-400 transition-all font-bold uppercase tracking-wider text-xs group">
                    <LogOut className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => navigate('auth')} 
                  className="bg-emerald-600 text-white px-8 py-2.5 border border-emerald-600 shadow-lg hover:bg-emerald-700 hover:-translate-y-0.5 transition-all active:scale-95 uppercase tracking-widest font-black text-[10px] rounded-xl flex items-center group"
                >
                  <User className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  Login / Register
                </button>
              )}
            </nav>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-200 p-2 hover:text-amber-500 transition-colors">
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
              className="md:hidden bg-slate-800 border-t border-slate-700 overflow-hidden"
            >
              <div className="px-4 pt-4 pb-6 space-y-3">
                <button onClick={() => navigate('home')} className="block w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wider text-slate-200 hover:text-amber-500 hover:bg-slate-700 transition-all">Home</button>
                <button onClick={() => navigate('directory')} className="block w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wider text-slate-200 hover:text-amber-500 hover:bg-slate-700 transition-all">Careers</button>
                <button onClick={() => navigate('skillQuiz')} className="block w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wider text-slate-200 hover:text-amber-500 hover:bg-slate-700 transition-all">Skill Quiz</button>
                <button onClick={() => navigate('blog')} className="block w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wider text-slate-200 hover:text-amber-500 hover:bg-slate-700 transition-all">Blog</button>
                <button onClick={() => navigate('about')} className="block w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wider text-slate-200 hover:text-amber-500 hover:bg-slate-700 transition-all">About</button>
                {user ? (
                  <>
                    <button onClick={() => navigate('dashboard')} className="block w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wider text-slate-200 hover:text-amber-500 hover:bg-slate-700 transition-all">Dashboard</button>
                    <button onClick={() => navigate('profile')} className="flex items-center w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wider text-slate-200 hover:text-amber-500 hover:bg-slate-700 transition-all">
                      {profile?.profileImage ? (
                        <img src={profile.profileImage} alt="Profile" className="h-5 w-5 object-cover border border-amber-500 mr-3" />
                      ) : (
                        <User className="h-5 w-5 mr-3" />
                      )}
                      Profile
                    </button>
                    <button onClick={handleLogout} className="flex items-center w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wider text-slate-200 hover:text-amber-500 hover:bg-slate-700 transition-all">
                      <LogOut className="h-5 w-5 mr-3" />
                      Logout
                    </button>
                  </>
                ) : (
                  <button onClick={() => navigate('auth')} className="block w-full text-center px-4 py-3 text-sm font-bold uppercase tracking-wider bg-amber-600 text-white border border-amber-600 shadow-sm hover:bg-amber-700 transition-all mt-4">Login / Register</button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow relative z-10">
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
      <footer className="bg-sky-900 text-white pt-20 pb-10 border-t border-emerald-500/20 relative overflow-hidden z-0">
        {/* Vintage noise overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center mb-6">
                <div className="bg-emerald-600 p-2 border border-emerald-500 shadow-sm mr-3 rounded-lg">
                  <Target className="text-white h-6 w-6" />
                </div>
                <span className="text-2xl font-bold font-serif uppercase tracking-widest text-emerald-400">SkillGAP Navigator</span>
              </div>
              <p className="text-sky-100 text-sm leading-relaxed mb-8 font-serif italic">
                Empowering the next generation of tech leaders by bridging the gap between education and industry through personalized roadmaps.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="p-3 bg-white/10 text-white hover:bg-emerald-600 hover:-translate-y-1 border border-white/20 transition-all rounded-full"><Linkedin className="h-5 w-5" /></a>
                <a href="#" className="p-3 bg-white/10 text-white hover:bg-emerald-600 hover:-translate-y-1 border border-white/20 transition-all rounded-full"><Twitter className="h-5 w-5" /></a>
                <a href="#" className="p-3 bg-white/10 text-white hover:bg-emerald-600 hover:-translate-y-1 border border-white/20 transition-all rounded-full"><Instagram className="h-5 w-5" /></a>
                <a href="#" className="p-3 bg-white/10 text-white hover:bg-emerald-600 hover:-translate-y-1 border border-white/20 transition-all rounded-full"><Github className="h-5 w-5" /></a>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6 font-serif uppercase tracking-widest border-b border-emerald-500/20 pb-2 inline-block text-emerald-400">Quick Links</h4>
              <ul className="space-y-4 text-sky-100 text-sm font-bold uppercase tracking-wider">
                <li><button onClick={() => navigate('home')} className="hover:text-emerald-400 transition-colors">Home</button></li>
                <li><button onClick={() => navigate('directory')} className="hover:text-emerald-400 transition-colors">Career Directory</button></li>
                <li><button onClick={() => navigate('blog')} className="hover:text-emerald-400 transition-colors">Career Blog</button></li>
                <li><button onClick={() => navigate('about')} className="hover:text-emerald-400 transition-colors">About Us</button></li>
                <li><button onClick={() => navigate('auth')} className="hover:text-emerald-400 transition-colors">Join Now</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6 font-serif uppercase tracking-widest border-b border-emerald-500/20 pb-2 inline-block text-emerald-400">Our Office</h4>
              <div className="overflow-hidden h-40 mb-4 border border-emerald-500/20 rounded-2xl grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.835434509374!2d-122.4194155!3d37.7749295!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085809c6c8f4459%3A0xb10ed6d9b5050fa5!2sTwitter%20HQ!5e0!3m2!1sen!2sus!4v1633000000000!5m2!1sen!2sus" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy"
                ></iframe>
              </div>
              <div className="flex items-center text-sky-100 text-xs font-bold uppercase tracking-wider">
                <MapPin className="h-4 w-4 mr-2 text-emerald-400" />
                <span>1355 Market St, San Francisco, CA 94103</span>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6 font-serif uppercase tracking-widest border-b border-emerald-500/20 pb-2 inline-block text-emerald-400">Newsletter</h4>
              <p className="text-sky-100 text-sm mb-6 font-serif italic">Get the latest career tips and roadmap updates.</p>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="relative">
                  <input 
                    type="email" 
                    placeholder="YOUR EMAIL" 
                    className="w-full bg-white/10 text-white border border-white/20 py-3 px-4 text-sm font-bold uppercase tracking-wider focus:outline-none focus:border-emerald-500 placeholder-white/40 transition-colors rounded-xl"
                    required
                  />
                  <button type="submit" className="absolute right-2 top-2 bottom-2 px-4 bg-emerald-600 text-white hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center rounded-lg">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-[10px] text-sky-200 font-bold uppercase tracking-widest">We respect your privacy. Unsubscribe at any time.</p>
              </form>
            </div>
          </div>

          <div className="pt-8 border-t border-emerald-500/10 flex flex-col md:flex-row justify-between items-center text-sky-200 text-xs font-bold uppercase tracking-widest">
            <p>© 2024 SkillGAP Navigator. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
      <ChatBot />
      
      {/* AI Interviewer FAB */}
      <button 
        onClick={() => setShowAIInterviewer(true)}
        className="fixed bottom-24 right-6 p-4 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all hover:scale-110 z-50 group flex items-center space-x-2 w-auto px-6"
      >
        <Brain className="h-6 w-6 shrink-0 text-white" />
        <span className="whitespace-nowrap font-bold text-sm text-white !text-white">AI Interviewer</span>
      </button>

      <AnimatePresence>
        {showAIInterviewer && (
          <AIInterviewer onClose={() => setShowAIInterviewer(false)} />
        )}
      </AnimatePresence>
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
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Ensure profile exists for new Google users
      try {
        const profileSnap = await getDoc(doc(db, 'users', user.uid));
        if (!profileSnap.exists()) {
          const userProfile: UserProfile = {
            fullName: user.displayName || 'Explorer',
            username: user.email?.split('@')[0] || `user_${user.uid.slice(0, 5)}`,
            education: '',
            country: '',
            milestones: { discovery: true, skills: false, projects: false, docs: false, apply: false, hired: false },
            points: 100,
            profileImage: user.photoURL || undefined
          };
          await setDoc(doc(db, 'users', user.uid), userProfile);
        }
      } catch (profileErr) {
        console.warn("Failed to check/create Google user profile, dashboard will handle it:", profileErr);
      }

      navigate('dashboard');
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        setError("domain_config"); // Special flag for the UI to show copy button
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
      <div className="bg-white p-8 border border-slate-200 shadow-xl relative overflow-hidden rounded-2xl">
        {/* Vintage noise overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        
        <div className="text-center mb-8 relative z-10">
          <h2 className="text-3xl font-bold font-serif text-slate-900 mb-2 uppercase tracking-widest">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <div className="h-1 w-16 bg-emerald-500 mx-auto mb-4 rounded-full"></div>
          <p className="text-slate-500 text-sm font-serif italic">{isLogin ? 'Login to track your progress' : 'Start your career journey today'}</p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 text-xs mb-6 border border-rose-200 font-bold tracking-wide rounded-2xl relative overflow-hidden group">
            {error === 'domain_config' ? (
              <div className="space-y-4">
                <div className="flex items-center text-rose-700">
                  <Shield className="h-4 w-4 mr-2" />
                  <span className="uppercase tracking-widest">Security Configuration Update Required</span>
                </div>
                <p className="font-serif italic text-slate-600 font-medium normal-case">
                  This domain isn't authorized for login. You need to add it to your Firebase Console settings to enable authentication.
                </p>
                <div className="flex flex-col space-y-2">
                  <div className="bg-white border border-rose-200 p-2 rounded-lg flex items-center justify-between font-mono text-[10px] break-all select-all">
                    {window.location.hostname}
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.hostname);
                        alert("Domain copied to clipboard!");
                      }}
                      className="ml-2 bg-rose-100 p-1 rounded hover:bg-rose-200 transition-colors"
                      title="Copy Domain"
                    >
                      <User className="h-3 w-3" />
                    </button>
                  </div>
                  <a 
                    href={`https://console.firebase.google.com/project/${import.meta.env.VITE_FIREBASE_PROJECT_ID || 'missing'}/authentication/settings`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center bg-rose-600 text-white py-2 rounded-lg hover:bg-rose-700 transition-colors uppercase tracking-[0.2em] font-black text-[9px]"
                  >
                    Open Firebase Console
                  </a>
                </div>
              </div>
            ) : (
              error
            )}
          </div>
        )}
        {message && <div className="bg-emerald-50 text-emerald-600 p-3 text-xs mb-6 border border-emerald-200 font-bold tracking-wide rounded-lg">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  className="w-full bg-sky-50 border border-sky-100 py-3 px-4 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 transition-all text-slate-700 placeholder-slate-400 font-serif italic rounded-xl"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <input 
                  type="text" 
                  placeholder="Username" 
                  className="w-full bg-sky-50 border border-sky-100 py-3 px-4 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 transition-all text-slate-700 placeholder-slate-400 font-serif italic rounded-xl"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select 
                  className="w-full bg-sky-50 border border-sky-100 py-3 px-4 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 transition-all text-slate-700 font-bold uppercase tracking-widest appearance-none rounded-xl"
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
                  className="w-full bg-sky-50 border border-sky-100 py-3 px-4 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 transition-all text-slate-700 placeholder-slate-400 font-serif italic rounded-xl"
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
            className="w-full bg-sky-50 border border-sky-100 py-3 px-4 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 transition-all text-slate-700 placeholder-slate-400 font-serif italic rounded-xl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full bg-sky-50 border border-sky-100 py-3 px-4 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 transition-all text-slate-700 placeholder-slate-400 font-serif italic rounded-xl"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {isLogin && (
            <div className="flex justify-end">
              <button type="button" onClick={handleResetPassword} className="text-xs font-bold text-slate-400 hover:text-emerald-600 hover:underline uppercase tracking-wider transition-colors">
                Forgot Password?
              </button>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-4 border border-emerald-600 font-bold hover:bg-emerald-700 hover:-translate-y-0.5 transition-all shadow-md active:scale-95 disabled:opacity-50 uppercase tracking-widest mt-4 rounded-xl"
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-center space-x-2 text-xs text-slate-500 font-bold uppercase tracking-wider relative z-10">
          <span className="opacity-70">{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-emerald-600 font-black hover:text-emerald-700 hover:scale-105 transition-all underline underline-offset-4 decoration-emerald-200"
          >
            {isLogin ? 'Register Here' : 'Back to Login'}
          </button>
        </div>

        <div className="relative my-8 z-10">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 border-dashed"></div></div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold"><span className="bg-white px-4 text-slate-400">Or</span></div>
        </div>

        <div className="space-y-4 relative z-10">
          <button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white text-slate-700 border border-slate-200 py-3 font-bold hover:bg-sky-50 hover:border-emerald-500 hover:-translate-y-0.5 transition-all flex items-center justify-center shadow-sm active:scale-95 uppercase tracking-wider text-sm rounded-xl"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <button 
            onClick={handleGuest}
            disabled={loading}
            className="w-full bg-white text-slate-700 border border-slate-200 py-3 font-bold hover:bg-sky-50 hover:border-emerald-500 hover:-translate-y-0.5 transition-all flex items-center justify-center shadow-sm active:scale-95 uppercase tracking-wider text-sm rounded-xl"
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
  const [answers, setAnswers] = useState<string[]>([]);
  const [isMatching, setIsMatching] = useState(false);

  const handleAnswer = async (answerText: string) => {
    const newAnswers = [...answers, answerText];
    setAnswers(newAnswers);

    if (step < QUIZ_QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setIsMatching(true);
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const ai = new GoogleGenAI({ apiKey });
        
        const careerOptions = CAREER_DIRECTORY.map(j => `${j.id}: ${j.title}`).join(', ');
        const prompt = `Based on these quiz answers: "${newAnswers.join('; ')}", which of these career paths is the best match? Options: ${careerOptions}. Return ONLY the jobId (e.g., "frontend-dev").`;
        
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
        });
        
        const matchedId = response.text.trim();
        const finalId = CAREER_DIRECTORY.find(j => j.id === matchedId) ? matchedId : 'frontend-dev';
        
        if (user && setProfile) {
          const updatedProfile = { ...profile, matchedJobId: finalId };
          setProfile(updatedProfile);
          await updateDoc(doc(db, 'users', user.uid), { matchedJobId: finalId });
        }
        navigate('results');
      } catch (error) {
        console.error("Error matching career:", error);
        // Fallback logic
        navigate('results');
      } finally {
        setIsMatching(false);
      }
    }
  };

  if (isMatching) {
    return (
      <div className="max-w-2xl mx-auto my-20 px-4 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Analyzing Your Profile...</h2>
        <p className="text-slate-500 font-serif italic">Our AI is finding the perfect career match for you.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="max-w-2xl mx-auto my-20 px-4 relative z-10"
    >
      <div className="bg-white p-10 border border-slate-200 shadow-xl relative overflow-hidden rounded-2xl">
        {/* Vintage noise overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        
        <div className="mb-8 relative z-10">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Step {step + 1} of {QUIZ_QUESTIONS.length}</span>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">{Math.round(((step + 1) / QUIZ_QUESTIONS.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-slate-100 h-3 border border-slate-200 overflow-hidden rounded-full">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
              className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full"
            ></motion.div>
          </div>
        </div>

        <h2 className="text-3xl font-bold font-serif text-slate-900 mb-8 relative z-10">{QUIZ_QUESTIONS[step].question}</h2>

        <div className="space-y-4 relative z-10">
          {QUIZ_QUESTIONS[step].options.map((option, i) => (
            <button 
              key={i}
              onClick={() => handleAnswer(option.text)}
              className="w-full text-left p-6 bg-white border border-slate-200 hover:border-amber-500 hover:bg-amber-50 transition-all group flex justify-between items-center shadow-sm hover:shadow-md hover:-translate-y-0.5 rounded-xl"
            >
              <span className="text-lg font-bold font-serif group-hover:text-amber-700 text-slate-700">{option.text}</span>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
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
      <div className="bg-white p-12 border border-slate-200 shadow-2xl relative overflow-hidden rounded-3xl">
        {/* Vintage noise overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
        
        <div className="mb-8 inline-flex items-center justify-center w-24 h-24 bg-emerald-50 border border-emerald-100 rounded-full shadow-inner relative z-10">
          <Award className="h-12 w-12 text-emerald-600" />
        </div>
        
        <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-[0.2em] mb-4 relative z-10">Your Perfect Match</h2>
        <h1 className="text-5xl font-bold font-serif text-slate-900 mb-6 relative z-10 uppercase tracking-wide">{job.title}</h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-serif italic relative z-10">
          {job.description}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative z-10">
          <div className="p-6 bg-sky-50 border border-sky-100 shadow-sm rounded-2xl hover:shadow-md transition-all">
            <TrendingUp className="h-8 w-8 text-emerald-600 mx-auto mb-4" />
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Salary Range</div>
            <div className="font-bold text-xl text-slate-900 font-serif">{job.salary}</div>
          </div>
          <div className="p-6 bg-sky-50 border border-sky-100 shadow-sm rounded-2xl hover:shadow-md transition-all">
            <BarChart3 className="h-8 w-8 text-emerald-600 mx-auto mb-4" />
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Market Demand</div>
            <div className="font-bold text-xl text-slate-900 font-serif">High Growth</div>
          </div>
          <div className="p-6 bg-sky-50 border border-sky-100 shadow-sm rounded-2xl hover:shadow-md transition-all">
            <Clock className="h-8 w-8 text-emerald-600 mx-auto mb-4" />
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Time to Hire</div>
            <div className="font-bold text-xl text-slate-900 font-serif">6 Months</div>
          </div>
        </div>

        <button 
          onClick={() => navigate('dashboard')}
          className="bg-emerald-600 text-white px-12 py-5 border border-emerald-600 text-lg font-bold hover:bg-emerald-700 hover:-translate-y-1 transition-all shadow-lg flex items-center justify-center mx-auto group uppercase tracking-widest relative z-10 rounded-2xl active:scale-95"
        >
          View Your Roadmap <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}

// --- Profile, Blog, About Views ---

