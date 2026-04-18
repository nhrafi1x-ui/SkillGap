import React, { useState, useMemo } from 'react';
import { Search, Code, Database, Shield, X, Target, Award, CheckCircle2, BookOpen, ExternalLink, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { View, UserProfile, OperationType } from '../types';
import { CAREER_DIRECTORY, JobProfile } from '../data';
import { db, doc, updateDoc } from '../firebase';
import { handleFirestoreError } from '../utils/error';
import { CareerMatchQuiz } from './CareerMatchQuiz';

export function CareersView({ navigate, user, profile, setProfile }: { navigate: (v: View) => void, user: any, profile: UserProfile | null, setProfile: any }) {
  const [selectedJob, setSelectedJob] = useState<JobProfile | null>(null);
  const [search, setSearch] = useState('');

  const filteredJobs = useMemo(() => {
    return CAREER_DIRECTORY.filter(j => 
      j.title.toLowerCase().includes(search.toLowerCase()) || 
      j.skills.some(s => s.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search]);

  const handleSaveRoadmap = async () => {
    if (!selectedJob) return;
    if (!user || user.isAnonymous) {
      localStorage.setItem('pendingJobId', selectedJob.id);
      navigate('auth');
      return;
    }
    
    if (profile && user) {
      try {
        const updatedProfile = { 
          ...profile, 
          matchedJobId: selectedJob.id,
          milestones: { ...profile.milestones, discovery: true }
        };
        setProfile(updatedProfile);
        await updateDoc(doc(db, 'users', user.uid), { 
          matchedJobId: selectedJob.id,
          'milestones.discovery': true
        });
        navigate('dashboard');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`, user);
      }
    }
  };

  const handleMatch = (jobId: string) => {
    const job = CAREER_DIRECTORY.find(j => j.id === jobId);
    if (job) {
      setSelectedJob(job);
      // Wait a moment for the scroll/transition if needed, or just select
    }
  };

  return (
    <div className="bg-sky-50 min-h-screen relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        
        {/* Career Match Quiz Section */}
        <CareerMatchQuiz onMatch={handleMatch} />

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-4 uppercase">Career Directory</h1>
            <div className="h-1 w-16 bg-emerald-500 mb-4 rounded-full"></div>
            <p className="text-slate-600 font-serif italic">Explore the most in-demand roles in the tech industry today.</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative w-full md:w-96"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input 
              type="text" 
              placeholder="Search roles or skills..." 
              className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 placeholder-slate-400 font-bold uppercase tracking-widest text-xs transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredJobs.map((job, index) => (
            <motion.div 
              key={job.id}
              layoutId={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedJob(job)}
              className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-500/50 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="p-3 bg-sky-50 rounded-2xl text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                  {job.id.includes('dev') ? <Code className="h-6 w-6" /> : job.id.includes('data') ? <Database className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-widest">{job.salary}</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{job.title}</h3>
              <p className="text-slate-600 text-sm line-clamp-3 mb-6 leading-relaxed font-serif italic">{job.description}</p>
              <div className="flex flex-wrap gap-2 relative z-10">
                {job.skills.slice(0, 3).map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-sky-50 text-slate-600 text-[10px] font-bold rounded-lg uppercase tracking-wider">{skill}</span>
                ))}
                {job.skills.length > 3 && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest self-center">+{job.skills.length - 3} more</span>}
              </div>
            </motion.div>
          ))}
        </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedJob && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedJob(null)}
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
            ></motion.div>
            <motion.div 
              layoutId={selectedJob.id}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 shadow-2xl custom-scrollbar"
            >
              <button onClick={() => setSelectedJob(null)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors z-20">
                <X className="h-5 w-5" />
              </button>

              <div className="p-8 md:p-12 relative z-10">
                <div className="flex flex-col md:flex-row gap-12">
                  <div className="flex-1">
                    <span className="inline-block py-1 px-3 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest mb-6 rounded-lg shadow-sm border border-emerald-100">Career Profile</span>
                    <h2 className="text-4xl font-bold text-slate-900 mb-6 uppercase tracking-tight">{selectedJob.title}</h2>
                    <p className="text-slate-600 mb-8 leading-relaxed font-serif italic text-lg">{selectedJob.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Salary Range</div>
                        <div className="font-bold text-slate-900">{selectedJob.salary}</div>
                      </div>
                      <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Industry Demand</div>
                        <div className="font-bold text-slate-900">High Growth</div>
                      </div>
                    </div>

                    <h4 className="text-lg font-bold mb-4 text-slate-900 uppercase tracking-wide">Skill Breakdown</h4>
                    <div className="space-y-4 mb-8">
                      {selectedJob.skillBreakdown?.map((skill, i) => (
                        <div key={i} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-emerald-500/30 transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-slate-900 uppercase tracking-tight">{skill.name}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${
                              skill.level === 'Core' ? 'bg-emerald-600 text-white' :
                              skill.level === 'Intermediate' ? 'bg-sky-50 text-sky-700' :
                              'bg-emerald-600 text-white'
                            }`}>{skill.level}</span>
                          </div>
                          <p className="text-xs text-slate-500 mb-3 leading-relaxed font-serif italic">{skill.importance}</p>
                          <a href={skill.resource.url} target="_blank" rel="noreferrer" className="inline-flex items-center text-[10px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-widest">
                            {skill.resource.title} <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </div>
                      ))}
                    </div>

                    <h4 className="text-lg font-bold mb-4 text-slate-900 uppercase tracking-wide">Job Portals</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                      {[
                        { name: 'Fiverr', url: `https://www.google.com/search?q=freelance+${selectedJob.title.replace(/ /g, '+')}+gigs+fiverr` },
                        { name: 'Glassdoor', url: `https://www.google.com/search?q=${selectedJob.title.replace(/ /g, '+')}+salary+glassdoor` },
                        { name: 'Indeed', url: `https://www.google.com/search?q=${selectedJob.title.replace(/ /g, '+')}+jobs+indeed+remote` },
                        { name: 'LinkedIn', url: `https://www.google.com/search?q=${selectedJob.title.replace(/ /g, '+')}+jobs+linkedin` },
                      ].map((portal) => (
                        <motion.a 
                          key={portal.name}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          href={portal.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center justify-center p-3 bg-sky-50 rounded-xl text-[10px] font-bold text-slate-700 hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest border border-slate-200"
                        >
                          {portal.name}
                        </motion.a>
                      ))}
                    </div>
                  </div>

                  <div className="w-full md:w-80 space-y-8">
                    <div className="space-y-4">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSaveRoadmap}
                        className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center uppercase tracking-widest"
                      >
                        <Target className="h-5 w-5 mr-2" /> Save Roadmap
                      </motion.button>
                      
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setSelectedJob(null); navigate('skillQuiz'); }}
                        className="w-full bg-sky-900 text-white py-4 rounded-2xl font-bold hover:bg-sky-800 transition-all flex items-center justify-center uppercase tracking-widest shadow-lg"
                      >
                        <Code className="h-5 w-5 mr-2" /> Take Skill Quiz
                      </motion.button>
                    </div>

                    <div className="p-6 bg-sky-50 rounded-[2rem] border border-sky-100">
                      <h4 className="font-bold mb-4 flex items-center uppercase tracking-widest text-slate-900"><Award className="h-5 w-5 mr-2 text-emerald-600" /> Interview Prep</h4>
                      <ul className="space-y-3 text-sm text-slate-600 font-serif italic">
                        {selectedJob.interviewPrep.map((tip, i) => (
                          <li key={i} className="flex items-start">
                            <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold mb-4 text-slate-900 uppercase tracking-wide">Learning Resources</h4>
                      <div className="space-y-3">
                        {selectedJob.resources.map((res, i) => (
                          <motion.a 
                            key={i} 
                            whileHover={{ x: 5 }}
                            href={res.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center p-3 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 transition-all group shadow-sm"
                          >
                            <div className="p-2 bg-sky-50 rounded-xl mr-3 group-hover:bg-emerald-50 transition-colors">
                              <BookOpen className="h-4 w-4 text-slate-400 group-hover:text-emerald-500" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 group-hover:text-emerald-600 truncate uppercase tracking-widest">{res.title}</span>
                          </motion.a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
