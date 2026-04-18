import React from 'react';
import { LazyImage } from './LazyImage';
import { motion } from 'motion/react';

export function AboutView() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-32">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span className="inline-block py-1 px-3 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Our Mission</span>
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 mb-8 leading-tight font-serif uppercase underline decoration-emerald-500/20 underline-offset-8">We're here to help you <br /> <span className="text-emerald-500 underline decoration-6 underline-offset-12 decoration-emerald-500/40">find your gap.</span></h1>
          <p className="text-lg text-slate-600 leading-relaxed mb-8 font-serif italic">
            Your SkillGAP was founded with a simple goal: to make the transition into tech careers accessible, structured, and data-driven. We believe that everyone has a unique path, and our tools are designed to help you discover yours.
          </p>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="text-3xl font-bold text-slate-900 mb-2 font-mono">2024</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-bold">Founded</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-500 mb-2 font-mono">100%</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-bold">Free Forever</div>
            </div>
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <div className="absolute -top-6 -left-6 w-full h-full bg-sky-50 rounded-[2.5rem] border border-sky-100"></div>
          <LazyImage 
            src="https://picsum.photos/seed/abstract_tech_network/1200/800" 
            alt="About Your SkillGAP" 
            className="rounded-[2.5rem] border border-slate-200 relative z-10 w-full aspect-video shadow-2xl grayscale hover:grayscale-0 transition-all duration-700"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-[3rem] border border-slate-200 p-12 md:p-20 text-slate-900 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        <div className="max-w-3xl mx-auto text-center mb-16 relative z-10">
          <h2 className="text-4xl font-bold tracking-tight mb-6 uppercase font-serif">Get In Touch</h2>
          <p className="text-slate-600 mb-8 font-serif italic text-lg">Have questions or want to collaborate? We'd love to hear from you.</p>
          <a 
            href="mailto:nhrafi.business@gmail.com" 
            className="inline-flex items-center text-emerald-600 font-bold hover:text-emerald-700 transition-all uppercase tracking-[0.2em] text-sm bg-emerald-50 px-8 py-3 rounded-full border border-emerald-100 shadow-sm"
          >
            nhrafi.business@gmail.com
          </a>
        </div>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-2">Full Name</label>
            <input type="text" className="w-full bg-sky-50/50 border border-sky-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-slate-700 font-serif italic placeholder:opacity-50 transition-all" placeholder="John Doe" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-2">Email Address</label>
            <input type="email" className="w-full bg-sky-50/50 border border-sky-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-slate-700 font-mono placeholder:opacity-50 transition-all" placeholder="john@example.com" />
          </div>
          <div className="md:col-span-2 space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-2">Message</label>
            <textarea className="w-full bg-sky-50/50 border border-sky-100 rounded-2xl py-4 px-6 h-48 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-slate-700 font-serif italic placeholder:opacity-50 transition-all" placeholder="How can we help?"></textarea>
          </div>
          <div className="md:col-span-2 pt-4">
            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold hover:bg-emerald-700 transition-all uppercase tracking-[0.3em] shadow-xl shadow-emerald-500/20"
            >
              Send Message
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
