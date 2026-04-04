import React, { useState, useMemo } from 'react';
import { Search, Code, Database, Shield, X, Target, Award, CheckCircle2, BookOpen, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { View, UserProfile, OperationType } from '../types';
import { CAREER_DIRECTORY, JobProfile } from '../data';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError } from '../utils/error';

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

  return (
    <div className="bg-white min-h-screen relative overflow-hidden">
      {/* Vintage noise overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold font-serif text-[#141414] mb-4 uppercase tracking-widest">Career Directory</h1>
            <div className="h-1 w-16 bg-[#141414] mb-4"></div>
            <p className="text-[#141414]/80 font-serif italic">Explore the most in-demand roles in the tech industry today.</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#141414] h-5 w-5" />
            <input 
              type="text" 
              placeholder="Search roles or skills..." 
              className="w-full bg-white border-2 border-[#141414] py-4 pl-12 pr-4 focus:outline-none focus:bg-white shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] text-[#141414] placeholder-[#141414]/50 font-medium transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredJobs.map((job) => (
            <motion.div 
              key={job.id}
              layoutId={job.id}
              onClick={() => setSelectedJob(job)}
              className="bg-white p-8 border-2 border-[#141414] shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] hover:shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] hover:translate-y-[4px] hover:translate-x-[4px] transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="p-3 bg-white border-2 border-[#141414] text-[#141414] group-hover:bg-[#141414] group-hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
                  {job.id.includes('dev') ? <Code className="h-6 w-6" /> : job.id.includes('data') ? <Database className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
                </div>
                <span className="text-xs font-bold text-[#141414]/70 uppercase tracking-widest">{job.salary}</span>
              </div>
              <h3 className="text-2xl font-bold font-serif text-[#141414] mb-4 uppercase tracking-wide relative z-10">{job.title}</h3>
              <p className="text-[#141414]/80 text-sm line-clamp-3 mb-6 leading-relaxed font-serif relative z-10">{job.description}</p>
              <div className="flex flex-wrap gap-2 relative z-10">
                {job.skills.slice(0, 3).map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-white text-[#141414] text-[10px] font-bold border-2 border-[#141414] uppercase tracking-wider">{skill}</span>
                ))}
                {job.skills.length > 3 && <span className="text-[10px] font-bold text-[#141414]/70 uppercase tracking-widest self-center">+{job.skills.length - 3} more</span>}
              </div>
            </motion.div>
          ))}
        </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedJob && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedJob(null)}
              className="absolute inset-0 bg-white/80 backdrop-blur-sm"
            ></motion.div>
            <motion.div 
              layoutId={selectedJob.id}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto border-4 border-[#141414] shadow-[16px_16px_0px_0px_rgba(20,20,20,1)]"
            >
              {/* Vintage noise overlay */}
              <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
              
              <button onClick={() => setSelectedJob(null)} className="absolute top-6 right-6 p-2 bg-white border-2 border-[#141414] hover:bg-[#141414] hover:text-white transition-colors z-20 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] text-[#141414]">
                <X className="h-5 w-5" />
              </button>

              <div className="p-8 md:p-12 relative z-10">
                <div className="flex flex-col md:flex-row gap-12">
                  <div className="flex-1">
                    <span className="inline-block py-1 px-3 border-2 border-[#141414] bg-white text-[#141414] text-[10px] font-bold uppercase tracking-widest mb-6 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">Career Profile</span>
                    <h2 className="text-4xl font-bold font-serif text-[#141414] mb-6 uppercase tracking-wide">{selectedJob.title}</h2>
                    <p className="text-[#141414]/80 mb-8 leading-relaxed font-serif">{selectedJob.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="p-4 bg-white border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                        <div className="text-xs text-[#141414]/70 font-bold uppercase tracking-widest mb-1">Salary Range</div>
                        <div className="font-bold text-[#141414] font-serif">{selectedJob.salary}</div>
                      </div>
                      <div className="p-4 bg-white border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                        <div className="text-xs text-[#141414]/70 font-bold uppercase tracking-widest mb-1">Industry Demand</div>
                        <div className="font-bold text-[#141414] font-serif">High Growth</div>
                      </div>
                    </div>

                    <h4 className="text-lg font-bold font-serif mb-4 text-[#141414] uppercase tracking-wide">Skill Breakdown</h4>
                    <div className="space-y-4 mb-8">
                      {selectedJob.skillBreakdown?.map((skill, i) => (
                        <div key={i} className="p-4 bg-white border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-[#141414]">{skill.name}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 border-2 border-[#141414] ${
                              skill.level === 'Core' ? 'bg-[#141414] text-white' :
                              skill.level === 'Intermediate' ? 'bg-white text-[#141414]' :
                              'bg-[#141414] text-white'
                            }`}>{skill.level}</span>
                          </div>
                          <p className="text-xs text-[#141414]/70 mb-3 leading-relaxed font-serif">{skill.importance}</p>
                          <a href={skill.resource.url} target="_blank" rel="noreferrer" className="inline-flex items-center text-[10px] font-bold text-[#141414] hover:underline uppercase tracking-widest">
                            {skill.resource.title} <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </div>
                      ))}
                    </div>

                    <h4 className="text-lg font-bold font-serif mb-4 text-[#141414] uppercase tracking-wide">Job Portals (Google Search)</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                      {[
                        { name: 'Fiverr', url: `https://www.google.com/search?q=freelance+${selectedJob.title.replace(/ /g, '+')}+gigs+fiverr` },
                        { name: 'Glassdoor', url: `https://www.google.com/search?q=${selectedJob.title.replace(/ /g, '+')}+salary+glassdoor` },
                        { name: 'Indeed', url: `https://www.google.com/search?q=${selectedJob.title.replace(/ /g, '+')}+jobs+indeed+remote` },
                        { name: 'LinkedIn', url: `https://www.google.com/search?q=${selectedJob.title.replace(/ /g, '+')}+jobs+linkedin` },
                      ].map((portal) => (
                        <a 
                          key={portal.name}
                          href={portal.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center justify-center p-3 bg-white border-2 border-[#141414] text-xs font-bold text-[#141414] hover:bg-[#141414] hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] uppercase tracking-widest"
                        >
                          {portal.name}
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="w-full md:w-80 space-y-8">
                    <div className="space-y-4">
                      <button 
                        onClick={handleSaveRoadmap}
                        className="w-full bg-[#141414] text-white py-4 border-2 border-[#141414] font-bold hover:bg-[#141414]/90 transition-all shadow-[6px_6px_0px_0px_rgba(20,20,20,0.5)] flex items-center justify-center uppercase tracking-widest"
                      >
                        <Target className="h-5 w-5 mr-2" /> Save Roadmap
                      </button>
                      
                      <button 
                        onClick={() => { setSelectedJob(null); navigate('skillQuiz'); }}
                        className="w-full bg-white text-[#141414] py-4 border-2 border-[#141414] font-bold hover:bg-[#141414] hover:text-white transition-all shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] flex items-center justify-center uppercase tracking-widest"
                      >
                        <Code className="h-5 w-5 mr-2" /> Take Skill Quiz
                      </button>
                    </div>

                    <div className="p-6 bg-white text-[#141414] border-2 border-[#141414] shadow-[6px_6px_0px_0px_rgba(20,20,20,0.5)]">
                      <h4 className="font-bold font-serif mb-4 flex items-center uppercase tracking-widest"><Award className="h-5 w-5 mr-2 text-[#141414]" /> Interview Prep</h4>
                      <ul className="space-y-3 text-sm text-[#141414]/80 font-serif">
                        {selectedJob.interviewPrep.map((tip, i) => (
                          <li key={i} className="flex items-start">
                            <CheckCircle2 className="h-4 w-4 mr-2 text-[#141414] shrink-0 mt-0.5" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold font-serif mb-4 text-[#141414] uppercase tracking-wide">Learning Resources</h4>
                      <div className="space-y-3">
                        {selectedJob.resources.map((res, i) => (
                          <a 
                            key={i} 
                            href={res.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center p-3 bg-white border-2 border-[#141414] hover:bg-[#141414] hover:text-white transition-all group shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]"
                          >
                            <BookOpen className="h-4 w-4 mr-3 text-[#141414] group-hover:text-white" />
                            <span className="text-xs font-bold text-[#141414] group-hover:text-white truncate uppercase tracking-widest">{res.title}</span>
                          </a>
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
