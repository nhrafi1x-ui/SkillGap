import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Award, BookOpen, Briefcase, Plus, Trash2, Layout, CheckCircle2, Circle, Cpu, Globe, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { View, UserProfile, Todo, Application, OperationType } from '../types';
import { CAREER_DIRECTORY } from '../data';
import { db } from '../firebase';
import { collection, doc, query, where, onSnapshot, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError } from '../utils/error';

export function DashboardView({ navigate, user, profile, setProfile }: { navigate: (v: View) => void, user: any, profile: UserProfile | null, setProfile: any }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [showAppForm, setShowAppForm] = useState(false);
  const [newAppCompany, setNewAppCompany] = useState('');
  const [newAppRole, setNewAppRole] = useState('');
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
      setTodos(loadedTodos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
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
        createdAt: new Date().toISOString()
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
        date: newAppDate,
        status: 'Applied'
      };
      
      await addDoc(collection(db, 'users', user.uid, 'applications'), appData);
      
      setNewAppCompany('');
      setNewAppRole('');
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
          <h1 className="text-4xl font-bold font-serif tracking-tight text-[#141414] mb-2 uppercase">Welcome back, {profile?.fullName || 'Explorer'}</h1>
          <p className="text-[#141414]/70 font-serif italic">You're on your way to becoming a <span className="text-[#141414] font-bold not-italic underline decoration-2 underline-offset-4">{job.title}</span>.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-[#141414]/50 uppercase tracking-widest mb-1">Points</div>
            <div className="text-lg font-bold text-[#141414]">{profile?.points || 0} XP</div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-[#141414]/50 uppercase tracking-widest mb-1">Overall Progress</div>
            <div className="text-lg font-bold text-[#141414]">{Math.round((Object.values(profile?.milestones || {}).filter(Boolean).length / 6) * 100)}%</div>
          </div>
          <div className="w-16 h-16 rounded-none bg-white flex items-center justify-center border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] relative">
            <TrendingUp className="text-[#141414] h-8 w-8" />
            {profile?.badges && profile.badges.length > 0 && (
              <div className="absolute -top-2 -right-2 bg-[#141414] text-white text-[10px] font-bold px-2 py-1 rounded-none border border-[#141414]">
                {profile.badges.length}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Heartbeat Roadmap */}
      <section className="bg-white p-8 md:p-12 rounded-none shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] border-4 border-[#141414] mb-12 overflow-hidden relative text-[#141414]">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        <h2 className="text-2xl font-bold font-serif tracking-tight mb-8 flex items-center text-[#141414] uppercase">
          <Award className="h-6 w-6 mr-2 text-[#141414]" /> 6-Month Heartbeat Roadmap
        </h2>
        
        <div className="relative h-64 md:h-80 w-full mb-12">
          <svg viewBox="0 0 1000 300" className="w-full h-full overflow-visible">
            {/* Heartbeat Line */}
            <motion.path 
              d="M0,250 L100,250 L130,100 L160,280 L190,250 L300,200 L330,50 L360,230 L390,200 L500,150 L530,20 L560,200 L590,150 L700,100 L730,10 L760,150 L790,100 L900,50 L1000,50"
              fill="none"
              stroke="#141414"
              strokeOpacity="0.2"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <motion.path 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
              d="M0,250 L100,250 L130,100 L160,280 L190,250 L300,200 L330,50 L360,230 L390,200 L500,150 L530,20 L560,200 L590,150 L700,100 L730,10 L760,150 L790,100 L900,50 L1000,50"
              fill="none"
              stroke="#141414"
              strokeWidth="4"
              strokeLinecap="round"
              className="opacity-50"
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
                    fill={isDone ? "#141414" : "white"}
                    stroke="#141414"
                    strokeWidth="4"
                    whileHover={{ scale: 1.2 }}
                  />
                  {isDone && (
                    <motion.path 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      d={`M${x-4},${y} L${x-1},${y+3} L${x+4},${y-3}`}
                      fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"
                    />
                  )}
                  <text x={x} y={y + 35} textAnchor="middle" className="text-[10px] font-bold fill-[#141414]/70 uppercase tracking-widest">{m.time}</text>
                  <text x={x} y={y - 25} textAnchor="middle" className={`text-xs font-bold ${isDone ? 'fill-[#141414]' : 'fill-[#141414]/50'}`}>{m.label}</text>
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
              className={`p-4 rounded-none border-2 transition-all cursor-pointer ${profile?.milestones[m.key] ? 'bg-[#141414] border-[#141414] text-white shadow-[2px_2px_0px_0px_rgba(20,20,20,0.5)]' : 'bg-transparent border-[#141414]/30 text-[#141414] hover:border-[#141414] hover:shadow-[2px_2px_0px_0px_rgba(20,20,20,0.2)]'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest">{m.time}</span>
                {profile?.milestones[m.key] ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4 opacity-30" />}
              </div>
              <div className="font-bold text-sm mb-1 uppercase tracking-tight">{m.label}</div>
              <div className="text-[10px] opacity-80 leading-tight font-serif italic">{m.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Resources & Tracker */}
        <div className="lg:col-span-2 space-y-12">
          {/* Skill Marathon */}
          <section className="bg-white p-8 rounded-none shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] border-4 border-[#141414] mb-12 relative overflow-hidden text-[#141414]">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h2 className="text-2xl font-bold font-serif tracking-tight flex items-center text-[#141414] uppercase"><BookOpen className="h-6 w-6 mr-2 text-[#141414]" /> Skill Marathon</h2>
              <button onClick={() => navigate('directory')} className="text-xs font-bold text-[#141414] hover:underline uppercase tracking-widest">View All Resources</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
              {job.resources.map((res, i) => (
                <a 
                  key={i} 
                  href={res.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-5 bg-white rounded-none border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] transition-all flex items-center group relative overflow-hidden text-[#141414]"
                >
                  <div className="bg-[#141414] p-3 rounded-none border border-[#141414]/30 mr-4 group-hover:bg-white transition-colors">
                    <Globe className="h-5 w-5 text-white group-hover:text-[#141414]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate uppercase">{res.title}</div>
                    <div className="text-[10px] opacity-70 uppercase tracking-widest mt-1">Free Resource</div>
                  </div>
                  <ExternalLink className="h-4 w-4 opacity-30 group-hover:opacity-100 ml-2" />
                </a>
              ))}
            </div>
          </section>

          {/* Application Tracker */}
          <section className="bg-white p-8 rounded-none shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] border-4 border-[#141414] mb-12 relative overflow-hidden text-[#141414]">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h2 className="text-2xl font-bold font-serif tracking-tight flex items-center text-[#141414] uppercase"><Briefcase className="h-6 w-6 mr-2 text-[#141414]" /> Application Tracker</h2>
              <button onClick={() => setShowAppForm(!showAppForm)} className="flex items-center text-xs font-bold bg-[#141414] text-white px-4 py-2 rounded-none border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-all uppercase tracking-widest">
                {showAppForm ? 'Cancel' : <><Plus className="h-4 w-4 mr-1" /> Add Job</>}
              </button>
            </div>
            
            {showAppForm && (
              <form onSubmit={addApplication} className="mb-6 bg-white p-4 rounded-none border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] flex flex-col sm:flex-row gap-3 relative z-10">
                <input 
                  type="text" 
                  placeholder="Company Name" 
                  className="flex-1 bg-white border-2 border-[#141414]/30 rounded-none py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#141414] font-mono text-[#141414]"
                  value={newAppCompany}
                  onChange={(e) => setNewAppCompany(e.target.value)}
                  required
                />
                <input 
                  type="text" 
                  placeholder="Role" 
                  className="flex-1 bg-white border-2 border-[#141414]/30 rounded-none py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#141414] font-mono text-[#141414]"
                  value={newAppRole}
                  onChange={(e) => setNewAppRole(e.target.value)}
                  required
                />
                <input 
                  type="date" 
                  className="w-full sm:w-auto bg-white border-2 border-[#141414]/30 rounded-none py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#141414] font-mono text-[#141414]"
                  value={newAppDate}
                  onChange={(e) => setNewAppDate(e.target.value)}
                  required
                />
                <button type="submit" className="bg-[#141414] text-white px-6 py-2 rounded-none font-bold text-sm border-2 border-[#141414] hover:bg-[#1A1A1A] transition-colors uppercase tracking-widest">
                  Save
                </button>
              </form>
            )}

            <div className="bg-white rounded-none border-2 border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] overflow-hidden relative z-10">
              <table className="w-full text-left border-collapse relative z-10">
                <thead>
                  <tr className="bg-white border-b-2 border-[#141414]">
                    <th className="px-6 py-4 text-[10px] font-bold text-[#141414]/70 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#141414]/70 uppercase tracking-widest">Company</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#141414]/70 uppercase tracking-widest">Role</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#141414]/70 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#141414]/70 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-[#141414]/10">
                  {applications.length > 0 ? applications.map((app) => (
                    <tr key={app.id} className="hover:bg-[#141414]/5 transition-colors">
                      <td className="px-6 py-4 text-[#141414]/70 text-sm font-mono">{app.date || 'N/A'}</td>
                      <td className="px-6 py-4 font-bold text-[#141414] text-sm uppercase">{app.company}</td>
                      <td className="px-6 py-4 text-[#141414]/70 text-sm font-serif italic">{app.role}</td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => cycleStatus(app.id, app.status)}
                          className={`px-3 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider border-2 ${
                            app.status === 'Offer' ? 'bg-[#141414] text-white border-[#141414]' :
                            app.status === 'Interview' ? 'bg-white text-[#141414] border-[#141414]' :
                            app.status === 'Rejected' ? 'bg-transparent text-[#141414]/50 border-[#141414] border-dashed' :
                            'bg-transparent text-[#141414]/50 border-[#141414]/20'
                          }`}
                        >
                          {app.status}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => deleteApplication(app.id)} className="text-[#141414]/30 hover:text-[#141414] transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#141414]/50 text-sm font-serif italic">No applications tracked yet. Start applying!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column: Todo List */}
        <div className="space-y-12">
          <section className="bg-white p-8 rounded-none shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] border-4 border-[#141414] relative text-[#141414]">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
            <h2 className="text-2xl font-bold font-serif tracking-tight mb-6 flex items-center text-[#141414] uppercase relative z-10"><Layout className="h-6 w-6 mr-2 text-[#141414]" /> Daily Tasks</h2>
            
            <form onSubmit={addTodo} className="mb-6 space-y-3 relative z-10">
              <input 
                type="text" 
                placeholder="What needs to be done?" 
                className="w-full bg-white border-2 border-[#141414]/30 rounded-none py-3 px-4 text-sm focus:outline-none focus:border-[#141414] font-mono text-[#141414] placeholder:text-[#141414]/30"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
              />
              <div className="flex gap-2">
                {(['High', 'Medium', 'Low'] as const).map((p) => (
                  <button 
                    key={p}
                    type="button"
                    onClick={() => setNewTodoPriority(p)}
                    className={`flex-1 py-2 rounded-none text-[10px] font-bold uppercase tracking-widest border-2 transition-all ${
                      newTodoPriority === p ? 'bg-[#141414] text-white border-[#141414]' : 'bg-transparent text-[#141414]/50 border-[#141414]/20 hover:border-[#141414]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button type="submit" className="w-full bg-[#141414] text-white py-3 rounded-none font-bold border-2 border-[#141414] hover:bg-transparent hover:text-[#141414] transition-all flex items-center justify-center uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
                <Plus className="h-4 w-4 mr-1" /> Add Task
              </button>
            </form>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 relative z-10">
              {todos.length > 0 ? todos.map((todo) => (
                <div key={todo.id} className="group flex items-center p-4 bg-white rounded-none border-2 border-[#141414]/20 hover:border-[#141414] hover:shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] transition-all">
                  <button onClick={() => toggleTodo(todo.id, todo.completed)} className="mr-3 shrink-0">
                    {todo.completed ? <CheckCircle2 className="h-5 w-5 text-[#141414]" /> : <Circle className="h-5 w-5 text-[#141414]/30" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${todo.completed ? 'text-[#141414]/40 line-through italic' : 'text-[#141414] font-serif'}`}>{todo.text}</div>
                    <div className={`text-[8px] font-bold uppercase tracking-widest mt-1 text-[#141414]/50`}>
                      {todo.priority} Priority
                    </div>
                  </div>
                  <button onClick={() => deleteTodo(todo.id)} className="ml-2 text-[#141414]/30 hover:text-[#141414] opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )) : (
                <div className="text-center py-8 text-[#141414]/50 text-xs font-serif italic">All caught up! Add a task to stay productive.</div>
              )}
            </div>
          </section>

          {/* Project Ideas */}
          <section className="bg-white text-[#141414] p-8 rounded-none shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] border-4 border-[#141414] relative">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
            <h2 className="text-xl font-bold font-serif tracking-tight mb-6 flex items-center uppercase relative z-10 text-[#141414]"><Cpu className="h-5 w-5 mr-2 text-[#141414]" /> Suggested Projects</h2>
            <div className="space-y-6 relative z-10">
              {job.projects.map((proj, i) => (
                <div key={i} className="relative pl-6 border-l-2 border-[#141414]/30">
                  <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-none bg-[#141414]"></div>
                  <h4 className="text-sm font-bold mb-1 uppercase tracking-tight text-[#141414]">{proj.title}</h4>
                  <p className="text-xs text-[#141414]/80 mb-3 leading-relaxed font-serif italic">{proj.description}</p>
                  <a href={proj.url} target="_blank" rel="noreferrer" className="inline-flex items-center text-[10px] font-bold text-[#141414] hover:text-[#141414]/70 underline decoration-1 underline-offset-2 uppercase tracking-widest">
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
