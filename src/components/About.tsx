import React from 'react';
import { LazyImage } from './LazyImage';

export function AboutView() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-32">
        <div>
          <span className="inline-block py-1 px-3 rounded-none border-2 border-[#141414] bg-white text-[#141414] text-[10px] font-bold uppercase tracking-widest mb-6 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">Our Mission</span>
          <h1 className="text-5xl font-bold font-serif tracking-tight text-[#141414] mb-8 leading-tight uppercase">We're here to help you <br /> <span className="text-[#141414] underline decoration-4 underline-offset-8">find your gap.</span></h1>
          <p className="text-lg text-[#141414]/80 leading-relaxed mb-8 font-serif italic">
            Your SkillGAP was founded with a simple goal: to make the transition into tech careers accessible, structured, and data-driven. We believe that everyone has a unique path, and our tools are designed to help you discover yours.
          </p>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="text-3xl font-bold text-[#141414] mb-2 font-serif">2024</div>
              <div className="text-sm text-[#141414]/50 uppercase tracking-widest font-bold">Founded</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#141414] mb-2 font-serif">100%</div>
              <div className="text-sm text-[#141414]/50 uppercase tracking-widest font-bold">Free Forever</div>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -top-4 -left-4 w-full h-full bg-[#141414] rounded-none"></div>
          <LazyImage 
            src="https://picsum.photos/seed/team/1200/800" 
            alt="Our Team" 
            className="rounded-none border-4 border-[#141414] relative z-10 w-full aspect-video grayscale sepia-[.3]"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <div className="bg-white rounded-none border-4 border-[#141414] p-12 md:p-20 text-[#141414] shadow-[16px_16px_0px_0px_rgba(20,20,20,1)] relative">
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        <div className="max-w-3xl mx-auto text-center mb-16 relative z-10">
          <h2 className="text-4xl font-bold font-serif tracking-tight mb-6 uppercase">Get In Touch</h2>
          <p className="text-[#141414]/70 font-serif italic">Have questions or want to collaborate? We'd love to hear from you.</p>
        </div>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#141414]/70 uppercase tracking-widest">Full Name</label>
            <input type="text" className="w-full bg-white border-2 border-[#141414]/30 rounded-none py-4 px-6 focus:outline-none focus:border-[#141414] text-[#141414] font-mono placeholder:text-[#141414]/30" placeholder="John Doe" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#141414]/70 uppercase tracking-widest">Email Address</label>
            <input type="email" className="w-full bg-white border-2 border-[#141414]/30 rounded-none py-4 px-6 focus:outline-none focus:border-[#141414] text-[#141414] font-mono placeholder:text-[#141414]/30" placeholder="john@example.com" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-[#141414]/70 uppercase tracking-widest">Message</label>
            <textarea className="w-full bg-white border-2 border-[#141414]/30 rounded-none py-4 px-6 h-40 focus:outline-none focus:border-[#141414] text-[#141414] font-mono placeholder:text-[#141414]/30" placeholder="How can we help?"></textarea>
          </div>
          <div className="md:col-span-2">
            <button className="w-full bg-[#141414] text-white py-5 rounded-none border-2 border-[#141414] font-bold hover:bg-transparent hover:text-[#141414] transition-all uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">Send Message</button>
          </div>
        </form>
      </div>
    </div>
  );
}
