import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, BookOpen, ChevronRight, User, Briefcase, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { View } from '../types';
import { SKILL_QUIZZES } from '../data/quizzes';

export function HomeView({ navigate, user }: { navigate: (v: View) => void, user: any }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    { title: 'The Quiz', desc: 'Our intelligent assessment matches your personality and interests with high-demand tech roles.', icon: Target },
    { title: 'The Roadmap', desc: 'Get a personalized 6-month "Heartbeat" roadmap with clear milestones and progress tracking.', icon: TrendingUp },
    { title: 'The Resources', desc: 'Access curated free learning paths, project ideas, and interview guides for your specific role.', icon: BookOpen },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="relative"
    >
      {/* Hero Section */}
      <section className="relative py-20 lg:py-40 overflow-hidden bg-sky-50/50 border-b border-sky-100">
        {/* Vintage noise overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="inline-block py-1.5 px-5 border border-emerald-500/20 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-[0.3em] mb-8 rounded-full shadow-sm">
              Your Career, Personalized
            </span>
            <h1 className="text-6xl lg:text-8xl font-bold font-serif text-slate-900 mb-8 leading-[1.1] uppercase tracking-tight">
              Bridge the Gap <br />
              <span className="italic text-emerald-600 underline decoration-emerald-500/20 underline-offset-12">to Your Future</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-14 leading-relaxed font-serif italic">
              Identify your strengths, find your perfect role, and follow a data-driven path to mastery.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8">
              <button 
                onClick={() => navigate(user ? 'quiz' : 'auth')}
                className="w-full sm:w-auto bg-emerald-600 text-white px-12 py-5 border border-emerald-600 text-lg font-bold hover:bg-emerald-700 hover:-translate-y-1 transition-all shadow-2xl shadow-emerald-500/30 flex items-center justify-center group uppercase tracking-[0.2em] rounded-3xl active:scale-95"
              >
                Find Your Gap <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => navigate('directory')}
                className="w-full sm:w-auto bg-white text-slate-700 border border-slate-200 px-12 py-5 text-lg font-bold hover:bg-sky-50 hover:border-emerald-500 hover:-translate-y-1 transition-all flex items-center justify-center shadow-lg uppercase tracking-[0.2em] rounded-3xl active:scale-95"
              >
                Explore Careers
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mt-32">
            {[
              { label: 'Active Learners', value: '10k+', icon: User },
              { label: 'Job Profiles', value: '50+', icon: Briefcase },
              { label: 'Success Rate', value: '94%', icon: Award },
              { label: 'Free Resources', value: '500+', icon: BookOpen },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
                className="p-8 bg-white border border-slate-100 shadow-xl rounded-[2.5rem] hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 group"
              >
                <div className="bg-sky-50 border border-sky-100 w-16 h-16 flex items-center justify-center mx-auto mb-6 rounded-[1.5rem] shadow-inner transition-colors group-hover:bg-emerald-50 group-hover:border-emerald-100">
                  <stat.icon className="text-emerald-600 h-7 w-7" />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-2 font-mono">{stat.value}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-sky-50 text-slate-900 overflow-hidden relative border-y border-sky-100">
        {/* Vintage noise overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold font-serif mb-6 uppercase tracking-widest text-slate-900">The Methodology</h2>
            <div className="h-1 w-24 bg-emerald-500 mx-auto mb-8 rounded-full shadow-sm shadow-emerald-500/50"></div>
            <p className="text-slate-600 max-w-2xl mx-auto text-xl font-serif italic leading-relaxed">Our platform guides you through every step of your career transition with clinical precision and holistic care.</p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="overflow-hidden bg-white border border-slate-100 p-12 md:p-20 shadow-2xl rounded-[3.5rem] relative">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 0.98, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 1.02, x: -20 }}
                  transition={{ duration: 0.5, ease: "circOut" }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="mb-10 p-8 border border-emerald-100 w-32 h-32 rounded-full flex items-center justify-center bg-sky-50 shadow-inner group transition-all duration-700 hover:shadow-emerald-500/10 hover:bg-emerald-50">
                    {React.createElement(slides[currentSlide].icon, { className: "h-12 w-12 text-emerald-600 transition-transform duration-500" })}
                  </div>
                  <h3 className="text-4xl font-bold mb-6 font-serif uppercase tracking-[0.2em] text-slate-900">{slides[currentSlide].title}</h3>
                  <p className="text-slate-500 leading-relaxed text-xl font-serif italic max-w-xl mx-auto">{slides[currentSlide].desc}</p>
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Navigation Dots */}
            <div className="flex justify-center mt-12 space-x-6">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-700 ${
                    currentSlide === idx ? 'bg-emerald-600 w-12 shadow-sm' : 'bg-sky-200 w-4 hover:bg-emerald-300'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Skill Assessments Section */}
      <section className="py-32 bg-sky-50 text-slate-900 relative border-t border-sky-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-5xl font-bold font-serif text-slate-900 mb-8 uppercase tracking-widest">Mastery Exams</h2>
          <div className="h-1 w-24 bg-emerald-500 mx-auto mb-10 rounded-full"></div>
          <p className="text-2xl text-slate-600 max-w-2xl mx-auto mb-16 font-serif italic leading-relaxed">
            Validate your expertise through rigorous assessments and manifest your growth on your profile.
          </p>
          <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto mb-20">
            {Object.keys(SKILL_QUIZZES).slice(0, 5).map(skill => (
              <span key={skill} className="px-8 py-4 bg-white border border-slate-100 text-slate-900 font-bold capitalize shadow-lg tracking-widest text-sm rounded-[1.5rem] hover:border-emerald-500 hover:-translate-y-1 transition-all duration-300 font-serif">
                {skill}
              </span>
            ))}
            <span className="px-8 py-4 bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold shadow-md tracking-widest text-sm rounded-[1.5rem] font-serif">
              + 25 MORE
            </span>
          </div>
          <div className="">
            <button 
              onClick={() => navigate('skillQuiz')}
              className="bg-emerald-600 text-white px-14 py-6 border border-emerald-600 text-xl font-bold hover:bg-emerald-700 hover:-translate-y-1 transition-all shadow-2xl shadow-emerald-500/40 uppercase tracking-[0.3em] rounded-[2rem] active:scale-95 group"
            >
              Start Your Assessment <ChevronRight className="inline ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
