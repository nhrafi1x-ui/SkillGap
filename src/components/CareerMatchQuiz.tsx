import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Sparkles, ChevronRight, RefreshCw, CheckCircle2, Loader2, Brain } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { View, UserProfile } from '../types';

const ai = new GoogleGenAI({ 
  get apiKey() { return import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY; } 
});

interface QuizQuestion {
  question: string;
  options: string[];
}

interface CareerMatchQuizProps {
  onMatch: (jobId: string) => void;
}

const ROLES = [
  "Frontend Developer (frontend-dev)",
  "Data Analyst (data-analyst)",
  "DevOps Engineer (devops-engineer)",
  "Security Expert (security-expert)",
  "Backend Developer (backend-dev)",
  "Full Stack Developer (fullstack-dev)",
  "Machine Learning Engineer (ml-engineer)",
  "Cloud Architect (cloud-architect)",
  "Mobile Developer (mobile-developer)"
];

export function CareerMatchQuiz({ onMatch }: CareerMatchQuizProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const startQuiz = async () => {
    setIsActive(true);
    setIsLoading(true);
    setError(null);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate 20 career assessment questions (multiple choice with 4 options each) aimed at identifying which of these 9 tech roles best fits a candidate. 
        Roles: ${ROLES.join(', ')}.
        Return the result as a JSON array of objects with 'question' (string) and 'options' (array of 4 strings).
        Ensure the questions are diverse, covering personality, technical interests, work style, and problem-solving preferences.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["question", "options"]
            }
          }
        }
      });

      const data = JSON.parse(response.text);
      setQuestions(data);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to generate the AI quiz. Please try again.");
      setIsLoading(false);
    }
  };

  const handleAnswer = (option: string) => {
    const newAnswers = [...answers, option];
    setAnswers(newAnswers);
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      getFinalRecommendation(newAnswers);
    }
  };

  const getFinalRecommendation = async (finalAnswers: string[]) => {
    setIsLoading(true);
    try {
      const quizHistory = questions.map((q, i) => ({
        question: q.question,
        answer: finalAnswers[i]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze these quiz answers and recommend one of the following 9 roles. 
        Roles: ${ROLES.join(', ')}.
        Quiz History: ${JSON.stringify(quizHistory)}.
        Return ONLY the role ID from the parentheses (e.g., 'frontend-dev').`,
      });

      const jobId = response.text.trim().toLowerCase().replace(/['"]/g, '');
      const validId = ROLES.find(r => r.includes(jobId)) ? jobId : 'fullstack-dev';
      setRecommendation(validId);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze your results. Let's try one last time.");
      setIsLoading(false);
    }
  };

  if (!isActive) {
    return (
      <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 mb-16 relative overflow-hidden group">
        {/* Animated Background Details */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#059669_0%,transparent_50%)] animate-pulse"></div>
            <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] animate-gentleBounce"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-sky-500/20 rounded-full blur-[80px] animate-pulse"></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl text-center md:text-left">
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                    <Sparkles className="h-3 w-3" />
                    <span>AI-Powered Career Matching</span>
                </div>
                <h2 className="text-5xl lg:text-6xl font-black text-white !text-white mb-8 tracking-tighter leading-[0.9] uppercase italic drop-shadow-2xl">
                    NOT SURE WHERE <br />
                    <span className="text-emerald-500 underline decoration-white/20 underline-offset-8">TO BEGIN?</span>
                </h2>
                <p className="text-white/80 text-lg font-serif italic mb-10 leading-relaxed max-w-xl">
                    Take our 20-question deep-dive assessment. Our AI will analyze your personality, preferences, and logic to find your perfect technical calling.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center md:justify-start">
                    <button 
                        onClick={startQuiz}
                        className="px-10 py-5 bg-emerald-600 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:bg-emerald-500 hover:-translate-y-1 transition-all active:scale-95 group flex items-center justify-center"
                    >
                        Start AI Assessment <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center space-x-4 text-white/50 justify-center">
                        <div className="flex -space-x-2">
                            {[1,2,3].map(i => (
                                <img key={i} src={`https://picsum.photos/seed/user${i}/100/100`} className="w-8 h-8 rounded-full border-2 border-slate-900 shadow-sm" referrerPolicy="no-referrer" alt="user" />
                            ))}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest"> +2.5k Matches This Week</span>
                    </div>
                </div>
            </div>
            
            <div className="relative hidden lg:block">
                <div className="w-[450px] h-[450px] relative">
                    <div className="absolute inset-0 border-[1px] border-emerald-500/20 rounded-full animate-spin-slow"></div>
                    <div className="absolute inset-10 border-[1px] border-emerald-500/10 rounded-full animate-reverse-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-80 h-80 bg-slate-800 rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative group-hover:scale-105 transition-transform duration-700">
                             <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"></div>
                             <div className="p-8 h-full flex flex-col justify-between relative z-10">
                                <div className="space-y-4">
                                    <div className="h-2 w-12 bg-emerald-500 rounded-full"></div>
                                    <div className="h-4 w-3/4 bg-slate-700 rounded-lg"></div>
                                    <div className="h-4 w-1/2 bg-slate-700/50 rounded-lg"></div>
                                </div>
                                <div className="space-y-3">
                                    {[1,2,3,4].map(i => (
                                        <div key={i} className="h-10 w-full border border-slate-700 rounded-xl flex items-center px-4">
                                            <div className="h-2 w-2 rounded-full bg-slate-700 mr-3"></div>
                                            <div className="h-2 w-1/3 bg-slate-700/50 rounded-full"></div>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 mb-16 relative min-h-[600px] flex flex-col shadow-2xl">
      <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/10">
        <motion.div 
            className="h-full bg-emerald-500" 
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / (questions.length || 1)) * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between mb-12 relative z-10">
        <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Brain className="text-white h-5 w-5" />
            </div>
            <div>
                <h3 className="text-white !text-white font-black uppercase text-xs tracking-[0.2em]">Quiz Analysis</h3>
                <p className="text-slate-500 text-[9px] uppercase tracking-widest font-bold">Step {currentStep + 1} of {questions.length}</p>
            </div>
        </div>
        <button 
            onClick={() => setIsActive(false)}
            className="text-slate-500 hover:text-white transition-colors text-[10px] uppercase font-black tracking-widest"
        >
            Quit Quiz
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full relative z-10" ref={scrollRef}>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center justify-center text-center py-20"
            >
              <div className="relative mb-8">
                 <Loader2 className="h-16 w-16 text-emerald-500 animate-spin" />
                 <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20"></div>
              </div>
              <h4 className="text-white !text-white text-2xl font-black uppercase tracking-tighter mb-4 italic">
                {recommendation ? "Mapping Your Neural Patterns..." : "Consulting the Oracle..."}
              </h4>
              <p className="text-slate-500 font-serif italic">Our AI is processing your responses across 9 dimensions of expertise.</p>
            </motion.div>
          ) : recommendation ? (
            <motion.div 
              key="recommendation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-full inline-flex items-center mb-10">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mr-2" />
                <span className="text-emerald-500 text-xs font-black uppercase tracking-widest">Analysis Complete</span>
              </div>
              <h4 className="text-white !text-white text-6xl font-black uppercase tracking-tighter mb-8 leading-[0.9]">
                Your Path is Clear: <br />
                <span className="text-emerald-500 underline decoration-white/20 underline-offset-12">
                   {ROLES.find(r => r.includes(recommendation))?.split(' (')[0] || recommendation}
                </span>
              </h4>
              <div className="flex flex-col sm:flex-row gap-6 justify-center mt-12">
                  <button 
                    onClick={() => onMatch(recommendation)}
                    className="px-10 py-5 bg-emerald-600 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:bg-emerald-500 hover:-translate-y-1 transition-all active:scale-95"
                  >
                    View Your Roadmap
                  </button>
                  <button 
                    onClick={() => {
                        setIsActive(false);
                        setQuestions([]);
                        setAnswers([]);
                        setCurrentStep(0);
                        setRecommendation(null);
                    }}
                    className="px-10 py-5 bg-slate-800 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] hover:bg-slate-700 transition-all active:scale-95"
                  >
                    Back to Directory
                  </button>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div 
               key="error"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="text-center py-20"
            >
                <div className="text-rose-500 mb-8 font-black text-4xl uppercase tracking-tighter italic">Oops! Something went wrong.</div>
                <button 
                    onClick={startQuiz}
                    className="flex items-center space-x-2 mx-auto bg-emerald-600 px-8 py-4 rounded-2xl text-white font-bold hover:bg-emerald-500 transition-all uppercase tracking-widest text-xs"
                >
                    <RefreshCw className="h-4 w-4" />
                    <span>Try Again</span>
                </button>
            </motion.div>
          ) : questions.length > 0 && (
            <motion.div 
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "circOut" }}
              className="space-y-10"
            >
              <h4 className="text-white !text-white text-3xl md:text-5xl font-black tracking-tighter uppercase leading-[0.9] italic drop-shadow-sm">
                 {questions[currentStep].question}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
                {questions[currentStep].options.map((option, i) => (
                  <button 
                    key={i}
                    onClick={() => handleAnswer(option)}
                    className="p-8 text-left bg-slate-800/50 border border-slate-700 rounded-[2rem] hover:bg-emerald-600/10 hover:border-emerald-500 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="w-6 h-6 rounded-full border border-emerald-500 flex items-center justify-center">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                         </div>
                    </div>
                    <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3 group-hover:text-emerald-500 transition-colors">Option {String.fromCharCode(65 + i)}</div>
                    <div className="text-white text-lg font-serif italic group-hover:text-white transition-colors leading-snug">{option}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Retro HUD Accents */}
      <div className="absolute bottom-10 left-10 hidden md:block opacity-20 group">
         <div className="flex space-x-1">
            {[1,2,3,4,5].map(i => (
                <div key={i} className="w-1 h-{i*2} bg-emerald-500 animate-pulse" style={{ height: `${i*4}px`, animationDelay: `${i*0.2}s` }}></div>
            ))}
         </div>
      </div>
      <div className="absolute bottom-10 right-10 hidden md:block opacity-20">
         <div className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest">
            Neural Processing Active <br />
            Mode: High Precision
         </div>
      </div>
    </div>
  );
}
