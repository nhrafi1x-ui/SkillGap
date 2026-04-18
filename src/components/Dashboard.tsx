import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Award, BookOpen, Briefcase, Plus, Trash2, Layout, CheckCircle2, Circle, Cpu, Globe, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { View, UserProfile, Todo, Application, OperationType } from '../types';
import { CAREER_DIRECTORY } from '../data';
import { db, collection, doc, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp } from '../firebase';
import { handleFirestoreError } from '../utils/error';

export function DashboardView({ navigate, user, profile, setProfile }: { navigate: (v: View) => void, user: any, profile: UserProfile | null, setProfile: any }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [showAppForm, setShowAppForm] = useState(false);
  const [newAppCompany, setNewAppCompany] = useState('');
  const [newAppRole, setNewAppRole] = useState('');
  const [newAppLink, setNewAppLink] = useState('');
  const [newAppDate, setNewAppDate] = useState(new Date().toISOString().split('T')[0]);

  const job = useMemo(() => {
    return CAREER_DIRECTORY.find(j => j.id === profile?.matchedJobId) || CAREER_DIRECTORY[0];
  }, [profile]);

  // Load Firestore data
  useEffect(() => {
    if (!user) return;
    
    const todosQuery = query(collection(db, 'users', user.uid, 'todos'), where('text', '!=', '')); // Dummy where to satisfy query if needed, or just collection
      const unsubscribeTodos = onSnapshot(collection(db, 'users', user.uid, 'todos'), (snapshot) => {
      const loadedTodos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Todo));
      setTodos(loadedTodos.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || (a.createdAt ? new Date(a.createdAt) : new Date());
        const dateB = b.createdAt?.toDate?.() || (b.createdAt ? new Date(b.createdAt) : new Date());
        return dateB.getTime() - dateA.getTime();
      }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/todos`, user));

    const unsubscribeApps = onSnapshot(collection(db, 'users', user.uid, 'applications'), (snapshot) => {
      const loadedApps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
      setApplications(loadedApps.sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime()));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/applications`, user));

    return () => {
      unsubscribeTodos();
      unsubscribeApps();
    };
  }, [user]);

  // Check badges
  useEffect(() => {
    if (!user || !profile) return;
    
    const checkBadges = async () => {
      const newBadges = [...(profile.badges || [])];
      let changed = false;

      if (profile.milestones.projects && !newBadges.includes('Project Master')) {
        newBadges.push('Project Master');
        changed = true;
      }

      if (applications.length >= 10 && !newBadges.includes('Application Ace')) {
        newBadges.push('Application Ace');
        changed = true;
      }

      const completedTodos = todos.filter(t => t.completed).length;
      if (completedTodos >= 5 && !newBadges.includes('Task Ninja')) {
        newBadges.push('Task Ninja');
        changed = true;
      }

      if (changed) {
        try {
          const updatedProfile = { ...profile, badges: newBadges };
          setProfile(updatedProfile);
          await updateDoc(doc(db, 'users', user.uid), { badges: newBadges });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`, user);
        }
      }
    };

    checkBadges();
  }, [profile?.milestones, applications.length, todos, user]);

  const toggleMilestone = async (key: string) => {
    if (!user || !profile) return;
    try {
      const newValue = !profile.milestones[key];
      const newMilestones = { ...profile.milestones, [key]: newValue };
      const newPoints = (profile.points || 0) + (newValue ? 50 : -50);
      const updatedProfile = { ...profile, milestones: newMilestones, points: newPoints };
      setProfile(updatedProfile);
      await updateDoc(doc(db, 'users', user.uid), { 
        [`milestones.${key}`]: newValue,
        points: newPoints
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`, user);
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim() || !user) return;
    
    try {
      const todoData = {
        text: newTodo,
        priority: newTodoPriority,
        completed: false,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'users', user.uid, 'todos'), todoData);
      setNewTodo('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/todos`, user);
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    if (!user || !profile) return;
    try {
      const newValue = !completed;
      await updateDoc(doc(db, 'users', user.uid, 'todos', id), { completed: newValue });
      
      const newPoints = (profile.points || 0) + (newValue ? 10 : -10);
      const updatedProfile = { ...profile, points: newPoints };
      setProfile(updatedProfile);
      await updateDoc(doc(db, 'users', user.uid), { points: newPoints });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/todos/${id}`, user);
    }
  };

  const deleteTodo = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'todos', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/todos/${id}`, user);
    }
  };

  const addApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !newAppCompany.trim() || !newAppRole.trim()) return;
    
    try {
      const appData = {
        company: newAppCompany,
        role: newAppRole,
        link: newAppLink,
        date: newAppDate,
        status: 'Applied'
      };
      
      await addDoc(collection(db, 'users', user.uid, 'applications'), appData);
      
      setNewAppCompany('');
      setNewAppRole('');
      setNewAppLink('');
      setNewAppDate(new Date().toISOString().split('T')[0]);
      setShowAppForm(false);
      
      const newPoints = (profile.points || 0) + 20;
      const updatedProfile = { ...profile, points: newPoints };
      setProfile(updatedProfile);
      await updateDoc(doc(db, 'users', user.uid), { points: newPoints });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/applications`, user);
    }
  };

  const cycleStatus = async (id: string, current: string) => {
    if (!user) return;
    try {
      const statuses: Application['status'][] = ['Applied', 'Interview', 'Offer', 'Rejected'];
      const next = statuses[(statuses.indexOf(current as any) + 1) % statuses.length];
      await updateDoc(doc(db, 'users', user.uid, 'applications', id), { status: next });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/applications/${id}`, user);
    }
  };

  const deleteApplication = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'applications', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/applications/${id}`, user);
    }
  };

  const milestones = [
    { key: 'discovery', label: 'Discovery', time: 'Day 1', desc: 'Find your career goal' },
    { key: 'skills', label: 'Skills', time: 'Month 1-3', desc: 'Core skill acquisition' },
    { key: 'projects', label: 'Projects', time: 'Month 2-4', desc: 'Build your portfolio' },
    { key: 'docs', label: 'Docs', time: 'Month 4-5', desc: 'CV & Portfolio prep' },
    { key: 'apply', label: 'Apply', time: 'Month 5-6', desc: 'Start job applications' },
    { key: 'hired', label: 'Hired', time: 'Goal', desc: 'Land your dream job' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold font-serif tracking-tight text-slate-900 mb-2 uppercase">Welcome back, {profile?.fullName || 'Explorer'}</h1>
          <p className="text-slate-600 font-serif italic">You're on your way to becoming a <span className="text-emerald-600 font-bold not-italic underline decoration-2 underline-offset-4 decoration-emerald-500/30">{job.title}</span>.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Points</div>
            <div className="text-lg font-bold text-slate-900">{profile?.points || 0} XP</div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Overall Progress</div>
            <div className="text-lg font-bold text-slate-900">{Math.round((Object.values(profile?.milestones || {}).filter(Boolean).length / 6) * 100)}%</div>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border border-slate-200 shadow-md relative">
            <TrendingUp className="text-emerald-600 h-8 w-8" />
            {profile?.badges && profile.badges.length > 0 && (
              <div className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-full border-2 border-white shadow-sm">
                {profile.badges.length}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Heartbeat Roadmap */}
      <section className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl border border-slate-200 mb-12 overflow-hidden relative text-slate-900">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        <h2 className="text-2xl font-bold font-serif tracking-tight mb-8 flex items-center text-slate-900 uppercase">
          <Award className="h-6 w-6 mr-2 text-emerald-600" /> 6-Month Heartbeat Roadmap
        </h2>
        
        <div className="relative h-64 md:h-80 w-full mb-12">
          <svg viewBox="0 0 1000 300" className="w-full h-full overflow-visible">
            {/* Heartbeat Line */}
            <motion.path 
              d="M0,250 L100,250 L130,100 L160,280 L190,250 L300,200 L330,50 L360,230 L390,200 L500,150 L530,20 L560,200 L590,150 L700,100 L730,10 L760,150 L790,100 L900,50 L1000,50"
              fill="none"
              stroke="currentColor"
              className="text-slate-200"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <motion.path 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
              d="M0,250 L100,250 L130,100 L160,280 L190,250 L300,200 L330,50 L360,230 L390,200 L500,150 L530,20 L560,200 L590,150 L700,100 L730,10 L760,150 L790,100 L900,50 L1000,50"
              fill="none"
              stroke="currentColor"
              className="text-emerald-500 opacity-60"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Milestone Nodes */}
            {milestones.map((m, i) => {
              const x = 100 + (i * 160);
              const y = 250 - (i * 40);
              const isDone = profile?.milestones[m.key];
              
              return (
                <g key={m.key} className="cursor-pointer" onClick={() => toggleMilestone(m.key)}>
                  <motion.circle 
                    cx={x} cy={y} r="12"
                    fill={isDone ? "#059669" : "#ffffff"}
                    stroke={isDone ? "#059669" : "#e2e8f0"}
                    strokeWidth="4"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className={isDone ? "animate-gentleBounce" : ""}
                  />
                  {isDone && (
                    <motion.path 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      d={`M${x-4},${y} L${x-1},${y+3} L${x+4},${y-3}`}
                      fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"
                    />
                  )}
                  <text x={x} y={y + 35} textAnchor="middle" className="text-[10px] font-bold fill-slate-400 uppercase tracking-widest">{m.time}</text>
                  <text x={x} y={y - 25} textAnchor="middle" className={`text-xs font-bold ${isDone ? 'fill-slate-900' : 'fill-slate-400'}`}>{m.label}</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative z-10">
          {milestones.map((m) => (
            <div 
              key={m.key} 
              onClick={() => toggleMilestone(m.key)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${profile?.milestones[m.key] ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-sky-50 border-sky-100 text-slate-700 hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${profile?.milestones[m.key] ? 'text-emerald-100' : 'text-slate-400'}`}>{m.time}</span>
                {profile?.milestones[m.key] ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4 text-slate-300" />}
              </div>
              <div className="font-bold text-sm mb-1 uppercase tracking-tight">{m.label}</div>
              <div className={`text-[10px] leading-tight font-serif italic ${profile?.milestones[m.key] ? 'text-emerald-50' : 'text-slate-500'}`}>{m.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Resources & Tracker */}
        <div className="lg:col-span-2 space-y-12">
          {/* Skill Marathon */}
          <section className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-200 mb-12 relative overflow-hidden text-slate-900">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h2 className="text-2xl font-bold font-serif tracking-tight flex items-center text-slate-900 uppercase"><BookOpen className="h-6 w-6 mr-2 text-emerald-600" /> Skill Marathon</h2>
              <button onClick={() => navigate('directory')} className="text-xs font-bold text-emerald-600 hover:underline uppercase tracking-widest transition-all">View All Resources</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
              {job.resources.map((res, i) => (
                <a 
                  key={i} 
                  href={res.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-5 bg-sky-50 rounded-2xl border border-sky-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center group relative overflow-hidden text-slate-700 hover:border-emerald-500"
                >
                  <div className="bg-white p-3 rounded-xl border border-slate-200 mr-4 group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-colors">
                    <Globe className="h-5 w-5 text-slate-400 group-hover:text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate uppercase group-hover:text-slate-900 transition-colors">{res.title}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Free Resource</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all ml-2" />
                </a>
              ))}
            </div>
          </section>

          {/* Application Tracker */}
          <section className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-200 mb-12 relative overflow-hidden text-slate-900">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h2 className="text-2xl font-bold font-serif tracking-tight flex items-center text-slate-900 uppercase"><Briefcase className="h-6 w-6 mr-2 text-emerald-600" /> Application Tracker</h2>
              <button onClick={() => setShowAppForm(!showAppForm)} className="flex items-center text-xs font-bold bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-md hover:bg-emerald-700 hover:-translate-y-0.5 active:scale-95 transition-all uppercase tracking-widest">
                {showAppForm ? 'Cancel' : <><Plus className="h-4 w-4 mr-1" /> Add Job</>}
              </button>
            </div>
            
            {showAppForm && (
              <form onSubmit={addApplication} className="mb-6 bg-sky-50 p-6 rounded-2xl border border-sky-100 shadow-inner flex flex-col sm:flex-row flex-wrap gap-3 relative z-10">
                <input 
                  type="text" 
                  placeholder="Company Name" 
                  className="flex-1 min-w-[150px] bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 font-mono text-slate-700 placeholder:text-slate-400 transition-all"
                  value={newAppCompany}
                  onChange={(e) => setNewAppCompany(e.target.value)}
                  required
                />
                <input 
                  type="text" 
                  placeholder="Role" 
                  className="flex-1 min-w-[150px] bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 font-mono text-slate-700 placeholder:text-slate-400 transition-all"
                  value={newAppRole}
                  onChange={(e) => setNewAppRole(e.target.value)}
                  required
                />
                <input 
                  type="url" 
                  placeholder="Link (LinkedIn/Website)" 
                  className="flex-1 min-w-[150px] bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 font-mono text-slate-700 placeholder:text-slate-400 transition-all"
                  value={newAppLink}
                  onChange={(e) => setNewAppLink(e.target.value)}
                />
                <input 
                  type="date" 
                  className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 font-mono text-slate-700 transition-all"
                  value={newAppDate}
                  onChange={(e) => setNewAppDate(e.target.value)}
                  required
                />
                <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-sm active:scale-95 uppercase tracking-widest">
                  Save
                </button>
              </form>
            )}

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden relative z-10">
              <table className="w-full text-left border-collapse relative z-10">
                <thead>
                  <tr className="bg-sky-50 border-b border-sky-100">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Company</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Link</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100">
                  {applications.length > 0 ? applications.map((app) => (
                    <tr key={app.id} className="hover:bg-sky-50 transition-colors group">
                      <td className="px-6 py-4 text-slate-400 text-sm font-mono">{app.date || 'N/A'}</td>
                      <td className="px-6 py-4 font-bold text-slate-700 text-sm uppercase">{app.company}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm font-serif italic">{app.role}</td>
                      <td className="px-6 py-4">
                        {app.link ? (
                          <a 
                            href={app.link} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-emerald-600 hover:text-emerald-700 transition-colors flex items-center"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">View</span>
                          </a>
                        ) : (
                          <span className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">No Link</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => cycleStatus(app.id, app.status)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                            app.status === 'Offer' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' :
                            app.status === 'Interview' ? 'bg-sky-50 text-sky-700 border-sky-100 shadow-sm' :
                            app.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {app.status}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => deleteApplication(app.id)} className="text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm font-serif italic">No applications tracked yet. Start applying!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column: Todo List */}
        <div className="space-y-12">
          <section className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-200 relative text-slate-900">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
            <h2 className="text-2xl font-bold font-serif tracking-tight mb-6 flex items-center text-slate-900 uppercase relative z-10"><Layout className="h-6 w-6 mr-2 text-emerald-600" /> Daily Tasks</h2>
            
            <form onSubmit={addTodo} className="mb-6 space-y-3 relative z-10">
              <input 
                type="text" 
                placeholder="What needs to be done?" 
                className="w-full bg-sky-50 border border-sky-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 font-mono text-slate-700 placeholder:text-slate-400 transition-all font-serif italic"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
              />
              <div className="flex gap-2">
                {(['High', 'Medium', 'Low'] as const).map((p) => (
                  <button 
                    key={p}
                    type="button"
                    onClick={() => setNewTodoPriority(p)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                      newTodoPriority === p ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-emerald-500 hover:text-emerald-600'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center uppercase tracking-widest shadow-md hover:-translate-y-0.5 active:scale-95">
                <Plus className="h-4 w-4 mr-1" /> Add Task
              </button>
            </form>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 relative z-10 custom-scrollbar">
              {todos.length > 0 ? todos.map((todo) => (
                <div key={todo.id} className="group flex items-center p-4 bg-white rounded-2xl border border-slate-100 hover:border-emerald-500 hover:shadow-md transition-all">
                  <button onClick={() => toggleTodo(todo.id, todo.completed)} className="mr-3 shrink-0">
                    {todo.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5 text-slate-200 group-hover:text-emerald-300" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${todo.completed ? 'text-slate-300 line-through italic' : 'text-slate-700 font-serif'}`}>{todo.text}</div>
                    <div className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${todo.priority === 'High' ? 'text-rose-500' : todo.priority === 'Medium' ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {todo.priority} Priority
                    </div>
                  </div>
                  <button onClick={() => deleteTodo(todo.id)} className="ml-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )) : (
                <div className="text-center py-8 text-slate-400 text-xs font-serif italic">All caught up! Add a task to stay productive.</div>
              )}
            </div>
          </section>

          {/* Project Ideas */}
          <section className="bg-white text-slate-900 p-8 rounded-[2rem] shadow-xl border border-slate-200 relative">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
            <h2 className="text-xl font-bold font-serif tracking-tight mb-6 flex items-center uppercase relative z-10 text-slate-900"><Cpu className="h-5 w-5 mr-2 text-emerald-600" /> Suggested Projects</h2>
            <div className="space-y-6 relative z-10">
              {job.projects.map((proj, i) => (
                <div key={i} className="relative pl-6 border-l border-slate-200">
                  <div className="absolute left-[-4.5px] top-0 w-2 h-2 rounded-full bg-emerald-500"></div>
                  <h4 className="text-sm font-bold mb-1 uppercase tracking-tight text-slate-900">{proj.title}</h4>
                  <p className="text-xs text-slate-500 mb-3 leading-relaxed font-serif italic">{proj.description}</p>
                  <a href={proj.url} target="_blank" rel="noreferrer" className="inline-flex items-center text-[10px] font-bold text-emerald-600 hover:text-emerald-700 underline decoration-emerald-500/30 underline-offset-4 uppercase tracking-widest transition-all">
                    View Guide <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
