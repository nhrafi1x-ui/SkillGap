import React, { useState } from 'react';
import { Award, Code } from 'lucide-react';
import { View, UserProfile, OperationType } from '../types';
import { SKILL_QUIZZES } from '../data/quizzes';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError } from '../utils/error';

export function SkillQuizView({ navigate, user, profile, setProfile }: { navigate: (v: View) => void, user: any, profile: UserProfile | null, setProfile: any }) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);

  const allSkills = Object.keys(SKILL_QUIZZES);

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
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
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
  };

  const handleAnswer = async (index: number) => {
    const question = quizQuestions[currentQuestion];
    const isCorrect = index === question.a;
    let newScore = score;
    if (isCorrect) {
      newScore = score + 1;
      setScore(newScore);
    }

    if (currentQuestion + 1 < quizQuestions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResult(true);
      
      if (user && profile) {
        try {
          const skillKey = quizQuestions.every(q => q.skill === quizQuestions[0].skill) 
            ? quizQuestions[0].skill 
            : 'Custom Assessment';
          const normalizedScore = Math.round((newScore / quizQuestions.length) * 10);
          const newQuizResults = { ...profile.quizResults, [skillKey]: normalizedScore };
          const updatedProfile = { ...profile, quizResults: newQuizResults };
          setProfile(updatedProfile);
          await updateDoc(doc(db, 'users', user.uid), { [`quizResults.${skillKey}`]: normalizedScore });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`, user);
        }
      }
    }
  };

  if (showResult) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="bg-white p-12 rounded-none shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] border-4 border-[#141414] relative">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
          <Award className="h-20 w-20 text-[#141414] mx-auto mb-6 relative z-10" />
          <h2 className="text-4xl font-bold font-serif tracking-tight text-[#141414] mb-4 uppercase relative z-10">Assessment Completed!</h2>
          <p className="text-xl text-[#141414]/80 mb-8 font-serif italic relative z-10">You scored <span className="font-bold text-[#141414] not-italic">{score}</span> out of {quizQuestions.length}.</p>
          <div className="flex justify-center space-x-4 relative z-10">
            <button onClick={() => { setIsQuizActive(false); setShowResult(false); }} className="px-8 py-3 bg-white text-[#141414] font-bold rounded-none border-2 border-[#141414] hover:bg-[#141414] hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] uppercase tracking-widest">Take Another Assessment</button>
            <button onClick={() => navigate('profile')} className="px-8 py-3 bg-[#141414] text-white font-bold rounded-none border-2 border-[#141414] hover:bg-white hover:text-[#141414] transition-colors shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] uppercase tracking-widest">View Profile</button>
          </div>
        </div>
      </div>
    );
  }

  if (isQuizActive && quizQuestions.length > 0) {
    const question = quizQuestions[currentQuestion];
    return (
      <div className="max-w-3xl mx-auto px-4 py-20">
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold font-serif tracking-tight text-[#141414] uppercase">Skill Assessment</h2>
          <span className="text-sm font-bold text-[#141414]/50 uppercase tracking-widest">Question {currentQuestion + 1} of {quizQuestions.length}</span>
        </div>
        <div className="bg-white p-8 md:p-12 rounded-none shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] border-4 border-[#141414] relative">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
          <div className="text-xs font-bold text-[#141414]/50 uppercase tracking-widest mb-4 relative z-10">Topic: {question.skill}</div>
          <h3 className="text-xl font-bold text-[#141414] mb-8 font-serif relative z-10">{question.q}</h3>
          <div className="space-y-4 relative z-10">
            {question.options.map((opt: string, i: number) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className="w-full text-left p-4 rounded-none border-2 border-[#141414] bg-white hover:bg-[#141414] hover:text-white transition-all font-bold text-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] font-mono"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold font-serif tracking-tight text-[#141414] mb-4 uppercase">Skill Assessments</h1>
        <p className="text-[#141414]/70 max-w-2xl mx-auto font-serif italic">Select one or multiple skills to focus your assessment. Test your knowledge and prove your skills.</p>
      </div>

      <div className="mb-12 bg-white p-8 rounded-none shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] border-4 border-[#141414] relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        <h2 className="text-xl font-bold font-serif tracking-tight text-[#141414] mb-6 uppercase relative z-10">Filter by Skills</h2>
        <div className="flex flex-wrap gap-3 mb-8 relative z-10">
          {allSkills.map(skill => (
            <button
              key={skill}
              onClick={() => toggleSkill(skill)}
              className={`px-4 py-2 rounded-none border-2 font-bold text-sm uppercase tracking-widest transition-all ${
                selectedSkills.includes(skill) 
                  ? 'bg-[#141414] text-white border-[#141414] shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]' 
                  : 'bg-white text-[#141414] border-[#141414] hover:bg-[#141414]/10'
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
        
        <div className="flex items-center justify-between border-t-2 border-[#141414]/10 pt-6 relative z-10">
          <div className="text-sm font-bold text-[#141414]/70 uppercase tracking-widest">
            {selectedSkills.length === 0 ? 'All skills selected by default' : `${selectedSkills.length} skill(s) selected`}
          </div>
          <button
            onClick={() => handleStartQuiz()}
            className="px-8 py-3 bg-[#141414] text-white font-bold rounded-none border-2 border-[#141414] hover:bg-white hover:text-[#141414] transition-colors shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] uppercase tracking-widest"
          >
            Start Assessment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {allSkills.filter(skill => selectedSkills.length === 0 || selectedSkills.includes(skill)).map(skill => (
          <div key={skill} className="bg-white p-6 rounded-none shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] border-2 border-[#141414] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-all text-center relative">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
            <div className="w-16 h-16 bg-white border-2 border-[#141414] flex items-center justify-center mx-auto mb-4 relative z-10">
              <Code className="h-8 w-8 text-[#141414]" />
            </div>
            <h3 className="text-lg font-bold text-[#141414] uppercase tracking-tight mb-2 relative z-10">{skill}</h3>
            {profile?.quizResults?.[skill] !== undefined && (
              <div className="text-xs font-bold text-[#141414] mb-4 uppercase tracking-widest relative z-10">Score: {profile.quizResults[skill]} / 10</div>
            )}
            <button
              onClick={() => handleStartQuiz([skill])}
              className="w-full py-2 bg-[#141414] text-white rounded-none border-2 border-[#141414] text-sm font-bold hover:bg-white hover:text-[#141414] transition-colors uppercase tracking-widest relative z-10"
            >
              {profile?.quizResults?.[skill] !== undefined ? 'Retake Quiz' : 'Start Quiz'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
