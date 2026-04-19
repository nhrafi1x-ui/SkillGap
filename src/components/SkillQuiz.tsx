import React, { useState } from 'react';
import { Award, Code, CheckCircle2, ArrowRight, Sparkles, BrainCircuit, Loader2, Clock } from 'lucide-react';
import { View, UserProfile, OperationType } from '../types';
import { SKILL_QUIZZES } from '../data/quizzes';
import { db, doc, updateDoc } from '../firebase';
import { handleFirestoreError } from '../utils/error';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';

export function SkillQuizView({ navigate, user, profile, setProfile }: { navigate: (v: View) => void, user: any, profile: UserProfile | null, setProfile: any }) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [isAiMode, setIsAiMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [categoryScores, setCategoryScores] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const allSkills = Object.keys(SKILL_QUIZZES);

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const generateAiRecommendation = async (finalScore: number, finalCategoryScores: Record<string, number>) => {
    setIsAiLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      
      const skillBreakdown = Object.entries(finalCategoryScores)
        .map(([skill, s]) => `${skill}: ${s} correct`)
        .join(', ');

      const prompt = `Based on a technical skill assessment of 30 questions, the user scored ${finalScore}/30.
      Skill Breakdown: ${skillBreakdown}.
      Please provide a personalized career path suggestion for this user. 
      Analyze their strengths based on the skill breakdown and suggest 1-2 career paths from the following list (Frontend Developer, Backend Developer, Fullstack Developer, Data Scientist, AI/ML Engineer, DevOps Engineer, Cloud Architect, Cybersecurity Specialist) that would suit them best.
      Explain why these paths are a good fit. Use a professional, encouraging tone.
      Format the response in clear Markdown with a header. Keep it concise.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      setAiRecommendation(result.text || "AI suggestion unavailable at the moment.");
    } catch (error) {
      console.error("AI Recommendation error:", error);
      setAiRecommendation("I encountered an error while generating your personalized career recommendation. Based on your score, you have a solid foundation in several areas!");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleStartAiQuiz = () => {
    if (!user) {
      navigate('auth');
      return;
    }
    
    let allQuestions: any[] = [];
    allSkills.forEach(skill => {
      allQuestions = [...allQuestions, ...SKILL_QUIZZES[skill as keyof typeof SKILL_QUIZZES].map(q => ({ ...q, skill }))];
    });
    
    // Pick 30 random questions
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 30);
    
    setQuizQuestions(selected);
    setIsQuizActive(true);
    setIsAiMode(true);
    setCurrentQuestion(0);
    setScore(0);
    setCategoryScores({});
    setShowResult(false);
    setAiRecommendation(null);
  };

  const handleStartQuiz = (skillsToUse?: string[]) => {
    if (!user) {
      navigate('auth');
      return;
    }
    
    const activeSkills = skillsToUse || (selectedSkills.length > 0 ? selectedSkills : allSkills);
    let questions: any[] = [];
    activeSkills.forEach(skill => {
      questions = [...questions, ...SKILL_QUIZZES[skill as keyof typeof SKILL_QUIZZES].map(q => ({ ...q, skill }))];
    });
    
    setQuizQuestions(questions.sort(() => Math.random() - 0.5));
    setIsQuizActive(true);
    setIsAiMode(false);
    setCurrentQuestion(0);
    setScore(0);
    setCategoryScores({});
    setShowResult(false);
    setAiRecommendation(null);
  };

  const handleAnswer = async (index: number) => {
    const question = quizQuestions[currentQuestion];
    const isCorrect = index === question.a;
    let newScore = score;
    const newCategoryScores = { ...categoryScores };
    
    if (isCorrect) {
      newScore = score + 1;
      setScore(newScore);
      newCategoryScores[question.skill] = (newCategoryScores[question.skill] || 0) + 1;
      setCategoryScores(newCategoryScores);
    }

    if (currentQuestion + 1 < quizQuestions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResult(true);
      
      if (isAiMode) {
        generateAiRecommendation(newScore, newCategoryScores);
      }
      
      if (user && profile) {
        try {
          const skillKey = isAiMode ? 'AI Career Assessment' : (quizQuestions.every(q => q.skill === quizQuestions[0].skill) 
            ? quizQuestions[0].skill 
            : 'Custom Assessment');
          const normalizedScore = Math.round((newScore / quizQuestions.length) * 10);
          const pointsReward = isAiMode ? 100 : 30; // More points for the long AI assessment
          const newQuizResults = { ...profile.quizResults, [skillKey]: normalizedScore };
          const updatedProfile = { ...profile, quizResults: newQuizResults, points: (profile.points || 0) + pointsReward };
          setProfile(updatedProfile);
          await updateDoc(doc(db, 'users', user.uid), { 
            [`quizResults.${skillKey}`]: normalizedScore,
            points: (profile.points || 0) + pointsReward
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`, user);
        }
      }
    }
  };

  if (showResult) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-200 relative text-center"
        >
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white p-4 rounded-full shadow-lg border border-slate-100">
            <Award className="h-12 w-12 text-emerald-500" />
          </div>
          
          <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-4 uppercase mt-4">Assessment Completed!</h2>
          <p className="text-xl text-slate-600 mb-12">
            You scored <span className="text-3xl font-black text-emerald-600 px-3 py-1 bg-emerald-50 rounded-xl mx-1">{score}</span> 
            out of <span className="font-bold text-slate-900">{quizQuestions.length}</span>
          </p>

          {isAiMode && (
            <div className="mt-4 text-left border-t border-slate-100 pt-10 mb-12">
              <div className="bg-sky-50 p-8 rounded-[2rem] border border-sky-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <BrainCircuit className="h-24 w-24 text-emerald-600" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center uppercase tracking-tight relative z-10">
                  <div className="bg-emerald-600 p-2 rounded-lg mr-4 shadow-lg shadow-emerald-200">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  AI Career Guidance Report
                </h3>
                
                {isAiLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-emerald-600/70 font-serif italic bg-white/50 rounded-2xl border border-emerald-200/50">
                    <Loader2 className="h-10 w-10 animate-spin mb-4 text-emerald-600" />
                    <span className="text-lg animate-pulse tracking-wide">Analyzing your technical trajectory...</span>
                  </div>
                ) : (
                  <div className="prose prose-emerald max-w-none text-slate-700 leading-relaxed font-sans text-lg bg-white/80 p-8 rounded-2xl border border-white shadow-sm [&>h2]:text-slate-900 [&>h2]:font-black [&>h2]:uppercase [&>h2]:text-xl [&>h2]:mb-4">
                    <Markdown>{aiRecommendation || ""}</Markdown>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setIsQuizActive(false); setShowResult(false); }} 
              className="px-10 py-4 bg-sky-50 text-slate-900 font-bold rounded-2xl border-2 border-sky-100 hover:bg-sky-100 transition-all uppercase tracking-[0.2em] text-xs shadow-sm"
            >
              Take Another Assessment
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('profile')} 
              className="px-10 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all uppercase tracking-[0.2em] text-xs shadow-xl"
            >
              View My Progress
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isQuizActive && quizQuestions.length > 0) {
    const question = quizQuestions[currentQuestion];
    return (
      <div className="max-w-3xl mx-auto px-4 py-20">
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase font-serif">Skill Assessment</h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Question {currentQuestion + 1} of {quizQuestions.length}</span>
        </div>
        <motion.div 
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-8 md:p-14 rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden relative"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
          <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full uppercase tracking-[0.2em] mb-6 inline-block border border-emerald-100">Topic: {question.skill}</div>
          <h3 className="text-2xl font-bold text-slate-900 mb-10 leading-snug font-serif italic border-l-4 border-emerald-500 pl-6">{question.q}</h3>
          <div className="space-y-4">
            {question.options.map((opt: string, i: number) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.01, x: 8 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleAnswer(i)}
                className="w-full text-left p-6 rounded-2xl border border-slate-100 bg-sky-50/50 hover:bg-white hover:border-emerald-500 hover:shadow-xl transition-all font-bold text-slate-700 flex items-center group relative overflow-hidden"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mr-5 group-hover:bg-emerald-600 group-hover:border-emerald-600 transition-all text-sm font-mono text-slate-400 group-hover:text-white shadow-sm">
                  {String.fromCharCode(65 + i)}
                </div>
                <span className="font-serif italic text-lg">{opt}</span>
                <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/[0.02] transition-colors pointer-events-none"></div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold tracking-tight text-slate-900 mb-6 uppercase font-serif"
        >
          Technical <span className="text-emerald-600 italic">Mastery Exams</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-slate-600 max-w-2xl mx-auto text-xl font-serif italic"
        >
          Validate your technical trajectory or let our AI manifest your ideal career path.
        </motion.p>
      </div>

      {/* Featured AI Assessment */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        className="mb-16 bg-gradient-to-br from-sky-900 to-indigo-950 p-8 md:p-20 rounded-[3.5rem] shadow-2xl border border-white/10 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[150px] rounded-full -mr-40 -mt-40 group-hover:bg-emerald-500/20 transition-all duration-1000"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[150px] rounded-full -ml-60 -mb-60"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
          <div className="max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center px-6 py-2.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-[0.4em] mb-10 border border-emerald-500/40 shadow-inner">
              <Sparkles className="h-4 w-4 mr-3 animate-pulse" />
              Autonomous Path Selection
            </div>
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-10 uppercase tracking-tight leading-[0.9] font-serif">
              AI Career <br />
              <span className="text-emerald-500 italic">Pathfinder</span>
            </h2>
            <p className="text-slate-400 text-xl mb-12 font-serif italic leading-relaxed opacity-90 max-w-xl">
              A holistic 30-question assessment. Our proprietary model analyzes your technical gestalt to synthesize the perfect career trajectory.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 50px rgba(16, 185, 129, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartAiQuiz}
                className="px-12 py-6 bg-emerald-600 text-white font-bold rounded-2xl transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center shadow-xl shadow-emerald-900/40"
              >
                Start Synapse Sync
                <BrainCircuit className="ml-4 h-5 w-5" />
              </motion.button>
              <div className="flex items-center px-8 py-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                <Clock className="h-4 w-4 mr-3 text-emerald-500" />
                DUR: 20 MIN
              </div>
            </div>
          </div>
          <div className="hidden lg:block relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-[120px] animate-pulse rounded-full"></div>
            <div className="bg-white shadow-2xl border border-white/10 p-12 rounded-[3rem] relative z-10 rotate-6 group-hover:rotate-0 transition-all duration-1000 w-96 h-[500px] flex flex-col justify-between overflow-hidden">
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
                <div className="flex gap-3 mb-12">
                  <div className="w-4 h-4 rounded-full bg-rose-400"></div>
                  <div className="w-4 h-4 rounded-full bg-emerald-400"></div>
                  <div className="w-4 h-4 rounded-full bg-sky-400"></div>
                </div>
                <div className="space-y-8 flex-1">
                  <div className="h-4 w-5/6 bg-sky-50 rounded-full"></div>
                  <div className="h-4 w-full bg-sky-50 rounded-full"></div>
                  <div className="h-4 w-4/6 bg-sky-50 rounded-full"></div>
                  <div className="h-40 w-full bg-sky-50 rounded-[2rem] border border-sky-100 flex items-center justify-center">
                    <Sparkles className="h-16 w-16 text-emerald-600 animate-pulse" />
                  </div>
                </div>
                <div className="mt-8 flex justify-end">
                   <div className="h-10 w-32 bg-emerald-600 rounded-full"></div>
                </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-16 bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 relative overflow-hidden"
      >
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-sky-500/20 to-transparent"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 uppercase font-serif underline decoration-emerald-500/20 underline-offset-8">Domain Specifics</h2>
            <p className="text-slate-500 text-lg font-serif italic mt-2">Select your vector of choice for localized assessment.</p>
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] bg-sky-50 px-6 py-2.5 rounded-full border border-sky-100 shadow-sm">
            {selectedSkills.length === 0 ? 'Universal Selection' : `${selectedSkills.length} Vector Active`}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-12">
          {allSkills.map(skill => (
            <motion.button
              key={skill}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleSkill(skill)}
              className={`px-6 py-3.5 rounded-2xl border font-bold text-[10px] uppercase tracking-[0.2em] transition-all duration-500 ${
                selectedSkills.includes(skill) 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-500/30' 
                  : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-500/40 hover:bg-sky-50/50'
              }`}
            >
              {skill}
            </motion.button>
          ))}
        </div>
        
        <div className="flex items-center justify-end border-t border-sky-50 pt-10">
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 15px 35px -5px rgba(5, 150, 105, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleStartQuiz()}
            className="px-12 py-5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all uppercase tracking-[0.25em] text-xs shadow-2xl shadow-emerald-500/20 flex items-center group/start"
          >
            Saturate Vector
            <ArrowRight className="ml-4 h-5 w-5 transition-transform group-hover/start:translate-x-1" />
          </motion.button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {allSkills.filter(skill => selectedSkills.length === 0 || selectedSkills.includes(skill)).map((skill, index) => (
          <motion.div 
            key={skill} 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 hover:shadow-2xl hover:border-emerald-500 transition-all text-center group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-sky-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <div className="w-20 h-20 bg-sky-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-600 group-hover:shadow-xl group-hover:shadow-emerald-500/30 transition-all duration-500">
              <Code className="h-9 w-9 text-emerald-600 group-hover:text-white transition-colors duration-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight mb-3 font-serif italic">{skill}</h3>
            {profile?.quizResults?.[skill] !== undefined && (
              <div className="text-[10px] font-bold text-emerald-700 mb-6 uppercase tracking-[0.2em] bg-emerald-50 py-2 rounded-full border border-emerald-100 font-mono">
                Index: {profile.quizResults[skill]} / 10
              </div>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleStartQuiz([skill])}
              className="w-full py-4 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all uppercase tracking-[0.2em] text-[10px] shadow-sm relative z-10"
            >
              {profile?.quizResults?.[skill] !== undefined ? 'Re-Sync' : 'Engage'}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
