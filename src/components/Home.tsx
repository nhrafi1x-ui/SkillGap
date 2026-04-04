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
      <section className="relative py-20 lg:py-32 overflow-hidden bg-[#fdfbf7] border-b-2 border-[#1a3636]">
        {/* Vintage noise overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="inline-block py-1 px-4 border-2 border-[#1a3636] bg-[#fdfbf7] text-[#1a3636] text-xs font-bold uppercase tracking-widest mb-6 shadow-[2px_2px_0px_0px_rgba(13,27,27,1)]">
              Your Career, Personalized
            </span>
            <h1 className="text-5xl lg:text-7xl font-bold font-serif text-[#1a3636] mb-8 leading-tight uppercase tracking-wide">
              Bridge the Gap to Your <br />
              <span className="italic">Dream Tech Career</span>
            </h1>
            <p className="text-xl text-[#1a3636]/80 max-w-2xl mx-auto mb-12 leading-relaxed font-serif">
              Identify your strengths, find your perfect role, and follow a data-driven 6-month roadmap to get hired.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button 
                onClick={() => navigate(user ? 'quiz' : 'auth')}
                className="w-full sm:w-auto bg-[#1a3636] text-[#fdfbf7] px-10 py-4 border-2 border-[#1a3636] text-lg font-bold hover:bg-[#1a3636]/90 transition-all shadow-[6px_6px_0px_0px_rgba(13,27,27,1)] flex items-center justify-center group uppercase tracking-widest"
              >
                Find Your Gap <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => navigate('directory')}
                className="w-full sm:w-auto bg-[#fdfbf7] text-[#1a3636] border-2 border-[#1a3636] px-10 py-4 text-lg font-bold hover:bg-[#fdfbf7] transition-all flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(13,27,27,1)] uppercase tracking-widest"
              >
                Explore Careers
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24">
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
                className="p-6 bg-[#fdfbf7] border-2 border-[#1a3636] shadow-[4px_4px_0px_0px_rgba(13,27,27,1)]"
              >
                <div className="bg-[#fdfbf7] border-2 border-[#1a3636] w-12 h-12 flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0px_0px_rgba(13,27,27,1)]">
                  <stat.icon className="text-[#1a3636] h-6 w-6" />
                </div>
                <div className="text-2xl font-bold text-[#1a3636] mb-1 font-serif">{stat.value}</div>
                <div className="text-xs text-[#1a3636]/70 font-bold uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-[#fdfbf7] text-[#1a3636] overflow-hidden relative border-y-2 border-[#1a3636]">
        {/* Vintage noise overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold font-serif mb-6 uppercase tracking-widest text-[#1a3636]">How It Works</h2>
            <div className="h-1 w-24 bg-[#1a3636] mx-auto mb-6"></div>
            <p className="text-[#1a3636]/80 max-w-2xl mx-auto text-xl font-serif italic">Our platform guides you through every step of your career transition with precision and care.</p>
          </div>

          <div className="relative max-w-3xl mx-auto">
            <div className="overflow-hidden bg-[#fdfbf7] border-2 border-[#1a3636] p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(13,27,27,1)]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, filter: 'sepia(100%) blur(2px)' }}
                  animate={{ opacity: 1, filter: 'sepia(0%) blur(0px)' }}
                  exit={{ opacity: 0, filter: 'sepia(100%) blur(2px)' }}
                  transition={{ duration: 0.6 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="mb-8 border-2 border-[#1a3636] w-24 h-24 rounded-full flex items-center justify-center bg-[#fdfbf7] shadow-[4px_4px_0px_0px_rgba(13,27,27,1)]">
                    {React.createElement(slides[currentSlide].icon, { className: "h-10 w-10 text-[#1a3636]" })}
                  </div>
                  <h3 className="text-3xl font-bold mb-4 font-serif uppercase tracking-widest text-[#1a3636]">{slides[currentSlide].title}</h3>
                  <p className="text-[#1a3636]/80 leading-relaxed text-lg font-serif">{slides[currentSlide].desc}</p>
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Navigation Dots */}
            <div className="flex justify-center mt-12 space-x-4">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-4 h-4 border-2 border-[#1a3636] transition-all duration-300 ${
                    currentSlide === idx ? 'bg-[#1a3636] shadow-[2px_2px_0px_0px_rgba(13,27,27,1)]' : 'bg-transparent hover:bg-[#1a3636]/20'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Skill Assessments Section */}
      <section className="py-24 bg-[#fdfbf7] text-[#1a3636] relative border-t-2 border-[#1a3636]">
        {/* Vintage noise overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl font-bold font-serif text-[#1a3636] mb-6 uppercase tracking-widest">Test Your Skills</h2>
          <div className="h-1 w-24 bg-[#1a3636] mx-auto mb-6"></div>
          <p className="text-xl text-[#1a3636]/80 max-w-2xl mx-auto mb-12 font-serif italic">
            Take our skill assessments to prove your knowledge and earn badges on your profile.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {Object.keys(SKILL_QUIZZES).slice(0, 5).map(skill => (
              <span key={skill} className="px-6 py-3 bg-[#fdfbf7] border-2 border-[#1a3636] text-[#1a3636] font-bold capitalize shadow-[4px_4px_0px_0px_rgba(13,27,27,1)] tracking-wide">
                {skill}
              </span>
            ))}
            <span className="px-6 py-3 bg-[#1a3636] border-2 border-[#1a3636] text-[#fdfbf7] font-bold shadow-[4px_4px_0px_0px_rgba(13,27,27,0.5)] tracking-wide">
              + More
            </span>
          </div>
          <div className="mt-16">
            <button 
              onClick={() => navigate('skillQuiz')}
              className="bg-[#1a3636] text-[#fdfbf7] px-10 py-4 border-2 border-[#1a3636] text-lg font-bold hover:bg-[#1a3636]/90 transition-all shadow-[6px_6px_0px_0px_rgba(13,27,27,0.5)] uppercase tracking-widest"
            >
              Take a Quiz Now
            </button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
