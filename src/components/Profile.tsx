import React, { useState, useEffect } from 'react';
import { User, LogOut, Plus, Trash2, ArrowRight, FileText, ExternalLink, Target, Linkedin, Github, Twitter, Globe, Award, Layout, CheckCircle2, Circle } from 'lucide-react';
import { motion } from 'motion/react';
import { View, UserProfile, OperationType, Todo } from '../types';
import { CAREER_DIRECTORY } from '../data';
import { db, doc, setDoc, updateDoc, collection, onSnapshot, addDoc, deleteDoc, serverTimestamp } from '../firebase';
import { handleFirestoreError } from '../utils/error';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';

export function ProfileView({ navigate, user, profile, setProfile, handleLogout }: { navigate: (v: View) => void, user: any, profile: UserProfile | null, setProfile: any, handleLogout: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || '',
    username: profile?.username || '',
    education: profile?.education || 'BSc',
    country: profile?.country || '',
    currentRole: profile?.currentRole || '',
    interests: profile?.interests || '',
    cvLink: profile?.cvLink || '',
    socialLinks: profile?.socialLinks || [],
    documents: profile?.documents || [],
    profileImage: profile?.profileImage || ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        username: profile.username || '',
        education: profile.education || 'BSc',
        country: profile.country || '',
        currentRole: profile.currentRole || '',
        interests: profile.interests || '',
        cvLink: profile.cvLink || '',
        socialLinks: profile.socialLinks || [],
        documents: profile.documents || [],
        profileImage: profile.profileImage || ''
      });
    }
  }, [profile]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const size = Math.min(img.width, img.height);
          const startX = (img.width - size) / 2;
          const startY = (img.height - size) / 2;
          ctx.drawImage(img, startX, startY, size, size, 0, 0, 100, 100);
          
          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          const sizeInBytes = (base64.length * 3) / 4;
          
          if (sizeInBytes > 51200) {
            const lowerQualityBase64 = canvas.toDataURL('image/jpeg', 0.5);
            if ((lowerQualityBase64.length * 3) / 4 > 51200) {
              alert("Image is too large even after resizing. Please choose a smaller image.");
              return;
            }
            setFormData(prev => ({ ...prev, profileImage: lowerQualityBase64 }));
            return;
          }
          
          setFormData(prev => ({ ...prev, profileImage: base64 }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Load Firestore data for todos
  useEffect(() => {
    if (!user) return;
    
    const unsubscribeTodos = onSnapshot(collection(db, 'users', user.uid, 'todos'), (snapshot) => {
      const loadedTodos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Todo));
      setTodos(loadedTodos.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || (a.createdAt ? new Date(a.createdAt) : new Date());
        const dateB = b.createdAt?.toDate?.() || (b.createdAt ? new Date(b.createdAt) : new Date());
        return dateB.getTime() - dateA.getTime();
      }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/todos`, user));

    return () => {
      unsubscribeTodos();
    };
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      console.warn("Profile update failed: User or Profile is null", { user, profile });
      return;
    }
    
    setIsSaving(true);
    console.log("Starting profile update with data:", formData);
    
    try {
      const userRef = doc(db, 'users', user.uid);
      
      // Sanitizing data to ensure compliance with Firestore rules
      const sanitizedData = {
        fullName: String(formData.fullName || '').trim().slice(0, 100),
        username: String(formData.username || '').trim().slice(0, 100),
        education: String(formData.education || '').trim().slice(0, 500),
        country: String(formData.country || '').trim().slice(0, 100),
        currentRole: String(formData.currentRole || '').trim().slice(0, 200),
        interests: String(formData.interests || '').trim().slice(0, 1000),
        cvLink: String(formData.cvLink || '').trim().slice(0, 2000),
        socialLinks: Array.isArray(formData.socialLinks) ? formData.socialLinks.slice(0, 20) : [],
        documents: Array.isArray(formData.documents) ? formData.documents.slice(0, 20) : [],
        profileImage: String(formData.profileImage || '').slice(0, 200000)
      };

      console.log("Saving sanitized profile online:", sanitizedData);
      
      await updateDoc(userRef, sanitizedData);
      
      console.log("Profile updated successfully in Firestore");
      
      const updatedProfile = { ...profile, ...sanitizedData };
      setProfile(updatedProfile);
      setIsEditing(false);
      alert("Profile saved online successfully!");
    } catch (error) {
      console.error("Profile update failed catch:", error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`, user);
    } finally {
      setIsSaving(false);
    }
  };

  const generateCareerPlan = async (retryCount = 0) => {
    if (!user || !profile?.currentRole || !profile?.interests) {
      alert("Please set your Current Role and Interests in the Edit Profile section first.");
      return;
    }
    setIsGeneratingPlan(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'undefined') {
        throw new Error("Gemini API Key is missing. If you're using Netlify, add VITE_GEMINI_API_KEY to environment variables.");
      }
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Generate a tailored career path and skill development plan for someone currently working as a "${profile.currentRole}" with interests in "${profile.interests}". The plan should be structured, actionable, and formatted in Markdown. Include short-term and long-term goals, recommended skills to learn, and potential job roles. Keep it concise but informative.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      const newPlan = response.text;
      if (!newPlan) throw new Error("Empty response from AI.");
      
      const updatedProfile = { ...profile, careerPlan: newPlan };
      setProfile(updatedProfile);
      await updateDoc(doc(db, 'users', user.uid), { careerPlan: newPlan });
    } catch (error) {
      console.error("Error generating career plan:", error);
      if (retryCount < 2) {
        console.log(`Retrying career plan generation... (${retryCount + 1})`);
        setTimeout(() => generateCareerPlan(retryCount + 1), 1000);
        return;
      }
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`, user);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const addSocialLink = () => {
    setFormData({
      ...formData,
      socialLinks: [...formData.socialLinks, { platform: 'LinkedIn', url: '' }]
    });
  };

  const updateSocialLink = (index: number, field: string, value: string) => {
    const newLinks = [...formData.socialLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setFormData({ ...formData, socialLinks: newLinks });
  };

  const removeSocialLink = (index: number) => {
    const newLinks = formData.socialLinks.filter((_, i) => i !== index);
    setFormData({ ...formData, socialLinks: newLinks });
  };

  const addDocument = () => {
    setFormData({
      ...formData,
      documents: [...formData.documents, { title: 'New Document', url: '' }]
    });
  };

  const updateDocument = (index: number, field: string, value: string) => {
    const newDocs = [...formData.documents];
    newDocs[index] = { ...newDocs[index], [field]: value };
    setFormData({ ...formData, documents: newDocs });
  };

  const removeDocument = (index: number) => {
    const newDocs = formData.documents.filter((_, i) => i !== index);
    setFormData({ ...formData, documents: newDocs });
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim() || !user) return;
    
    try {
      const todoData = {
        text: newTodo,
        priority: newTodoPriority,
        completed: false,
        createdAt: serverTimestamp()
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

  const job = CAREER_DIRECTORY.find(j => j.id === profile?.matchedJobId) || CAREER_DIRECTORY[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative text-slate-900"
      >
        <div className="h-32 bg-sky-50 relative border-b border-sky-100">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 bg-white rounded-2xl border-4 border-white flex items-center justify-center shadow-lg overflow-hidden relative group">
              {formData.profileImage ? (
                <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="text-slate-400 h-12 w-12" />
              )}
              {isEditing && (
                <label className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <span className="text-white text-xs font-bold">Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </div>
        </div>
        
        <div className="pt-16 pb-8 px-8 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-serif uppercase">{profile?.fullName || 'Explorer'}</h1>
              <p className="text-slate-500 font-mono text-sm tracking-widest uppercase">@{profile?.username || 'explorer'}</p>
            </div>
            <div className="flex space-x-3 w-full sm:w-auto">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsEditing(!isEditing)}
                className="flex-1 sm:flex-none px-6 py-2 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-600 transition-all text-slate-500"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="flex-1 sm:flex-none px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center"
              >
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </motion.button>
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                <input 
                  type="text" 
                  className="w-full bg-sky-50 border border-sky-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-slate-700 font-serif italic"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Education</label>
                <select 
                  className="w-full bg-sky-50 border border-sky-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-slate-700 font-serif"
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                >
                  <option value="12th">12th Grade</option>
                  <option value="BSc">BSc</option>
                  <option value="MSc">MSc</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Country</label>
                <input 
                  type="text" 
                  className="w-full bg-sky-50 border border-sky-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-slate-700 font-serif italic"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Role</label>
                <input 
                  type="text" 
                  className="w-full bg-sky-50 border border-sky-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-slate-700 font-serif italic"
                  value={formData.currentRole}
                  onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                  placeholder="e.g., Student, Junior Developer"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Interests</label>
                <input 
                  type="text" 
                  className="w-full bg-sky-50 border border-sky-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-slate-700 font-serif italic"
                  value={formData.interests}
                  onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                  placeholder="e.g., AI, Web Development, Data Science"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">CV Link (Google Drive)</label>
                <input 
                  type="url" 
                  className="w-full bg-sky-50 border border-sky-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-slate-700 font-mono"
                  value={formData.cvLink}
                  onChange={(e) => setFormData({ ...formData, cvLink: e.target.value })}
                  placeholder="https://drive.google.com/..."
                />
              </div>

              {/* Additional Documents */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Additional Documents</label>
                  <button type="button" onClick={addDocument} className="text-xs font-bold text-emerald-600 hover:underline flex items-center transition-all uppercase tracking-widest">
                    <Plus className="h-3 w-3 mr-1" /> Add Document
                  </button>
                </div>
                {formData.documents.map((doc, index) => (
                  <div key={index} className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="Title (e.g., Portfolio)" 
                      className="w-1/3 bg-sky-50 border border-sky-100 rounded-xl py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-slate-700"
                      value={doc.title}
                      onChange={(e) => updateDocument(index, 'title', e.target.value)}
                    />
                    <input 
                      type="url" 
                      placeholder="URL" 
                      className="flex-1 bg-sky-50 border border-sky-100 rounded-xl py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-slate-700 font-mono"
                      value={doc.url}
                      onChange={(e) => updateDocument(index, 'url', e.target.value)}
                    />
                    <button type="button" onClick={() => removeDocument(index)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Social Links */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Social Links</label>
                  <button type="button" onClick={addSocialLink} className="text-xs font-bold text-emerald-600 hover:underline flex items-center transition-all uppercase tracking-widest">
                    <Plus className="h-3 w-3 mr-1" /> Add Link
                  </button>
                </div>
                {formData.socialLinks.map((link, index) => (
                  <div key={index} className="flex gap-3">
                    <select 
                      className="w-1/3 bg-sky-50 border border-sky-100 rounded-xl py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-slate-700 font-mono"
                      value={link.platform}
                      onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                    >
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="GitHub">GitHub</option>
                      <option value="Twitter">Twitter / X</option>
                      <option value="Portfolio">Portfolio</option>
                      <option value="Other">Other</option>
                    </select>
                    <input 
                      type="url" 
                      placeholder="URL" 
                      className="flex-1 bg-sky-50 border border-sky-100 rounded-xl py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-slate-700 font-mono"
                      value={link.url}
                      onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                    />
                    <button type="button" onClick={() => removeSocialLink(index)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="md:col-span-2">
                <motion.button 
                  whileHover={{ scale: isSaving ? 1 : 1.01 }}
                  whileTap={{ scale: isSaving ? 1 : 0.99 }}
                  type="submit" 
                  disabled={isSaving}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      Saving Changes...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </motion.button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-sky-50 rounded-2xl border border-sky-100 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Education</div>
                    <div className="font-bold text-slate-700 font-serif italic">{profile?.education || 'Not Set'}</div>
                  </div>
                  <div className="p-6 bg-sky-50 rounded-2xl border border-sky-100 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Country</div>
                    <div className="font-bold text-slate-700 font-serif italic">{profile?.country || 'Not Set'}</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4 text-slate-900 uppercase font-serif tracking-tight">Career Goal</h3>
                  <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden group">
                    <div className="absolute inset-0 bg-emerald-50/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Role</div>
                      <div className="text-2xl font-bold text-slate-900 uppercase font-serif tracking-tight underline decoration-emerald-500/30 underline-offset-4">{job.title}</div>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.1, x: 5 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => navigate('directory')} 
                      className="relative z-10 p-3 bg-emerald-600 rounded-xl text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-slate-900 uppercase font-serif tracking-tight">Documents</h3>
                    <button onClick={() => setIsEditing(true)} className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center transition-all uppercase tracking-widest">
                      <Plus className="h-3 w-3 mr-1" /> Add More
                    </button>
                  </div>
                  <div className="space-y-4">
                    {profile?.cvLink && (
                      <motion.a 
                        whileHover={{ x: 5 }}
                        href={profile.cvLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center p-5 bg-sky-50 border border-sky-100 rounded-2xl hover:border-emerald-500 transition-all group shadow-sm"
                      >
                        <div className="p-3 bg-white rounded-xl border border-slate-200 mr-4 group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-colors">
                          <FileText className="h-6 w-6 text-slate-300 group-hover:text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-slate-700 uppercase group-hover:text-slate-900 transition-colors">Curriculum Vitae</div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Google Drive Link</div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                      </motion.a>
                    )}
                    
                    {profile?.documents?.map((doc, i) => (
                      <motion.a 
                        key={i}
                        whileHover={{ x: 5 }}
                        href={doc.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center p-5 bg-sky-50 border border-sky-100 rounded-2xl hover:border-emerald-500 transition-all group shadow-sm"
                      >
                        <div className="p-3 bg-white rounded-xl border border-slate-200 mr-4 group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-colors">
                          <FileText className="h-6 w-6 text-slate-300 group-hover:text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-slate-700 uppercase group-hover:text-slate-900 transition-colors">{doc.title}</div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">External Link</div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                      </motion.a>
                    ))}

                    {!profile?.cvLink && (!profile?.documents || profile.documents.length === 0) && (
                      <div className="p-12 border-2 border-dashed border-sky-100 rounded-3xl text-center bg-sky-50/30">
                        <FileText className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                        <p className="text-sm text-slate-500 mb-4 font-serif italic">No documents uploaded yet.</p>
                        <button onClick={() => setIsEditing(true)} className="text-[10px] font-bold text-emerald-600 hover:underline uppercase tracking-widest">Add Documents</button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-slate-900 uppercase font-serif tracking-tight">Personalized Plan</h3>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => generateCareerPlan()} 
                      disabled={isGeneratingPlan}
                      className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center transition-all disabled:opacity-50 uppercase tracking-widest"
                    >
                      {isGeneratingPlan ? (
                        <span className="flex items-center"><div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-2"></div> Generating...</span>
                      ) : (
                        <span className="flex items-center"><Plus className="h-3 w-3 mr-1" /> Generate Plan</span>
                      )}
                    </motion.button>
                  </div>
                  
                  {profile?.careerPlan ? (
                    <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm markdown-body text-slate-700 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
                      <div className="relative z-10">
                        <Markdown>{profile.careerPlan}</Markdown>
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 border-2 border-dashed border-sky-100 rounded-3xl text-center bg-sky-50/30">
                      <Target className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                      <p className="text-sm text-slate-500 mb-4 font-serif italic">No career plan generated yet.</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest max-w-xs mx-auto">Set your role and interests in Edit Profile to unlock AI insights.</p>
                    </div>
                  )}
                </div>
              </div>

                <div className="space-y-8">
                <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-sky-500 opacity-50"></div>
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <h4 className="font-bold text-slate-900 uppercase font-serif tracking-tight">Social Links</h4>
                    <button onClick={() => setIsEditing(true)} className="text-[10px] font-bold text-emerald-600 hover:underline uppercase tracking-widest transition-all">Edit</button>
                  </div>
                  <div className="space-y-3 relative z-10">
                    {profile?.socialLinks && profile.socialLinks.length > 0 ? (
                      profile.socialLinks.map((link, i) => (
                        <motion.a 
                          key={i}
                          whileHover={{ x: 5 }}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full flex items-center p-3.5 bg-sky-50 border border-sky-100 rounded-xl text-xs font-bold text-slate-700 hover:border-emerald-500 transition-all group shadow-sm"
                        >
                          {link.platform === 'LinkedIn' ? <Linkedin className="h-4 w-4 mr-3 text-slate-300 group-hover:text-emerald-600 transition-colors" /> :
                           link.platform === 'GitHub' ? <Github className="h-4 w-4 mr-3 text-slate-300 group-hover:text-emerald-600 transition-colors" /> :
                           link.platform === 'Twitter' ? <Twitter className="h-4 w-4 mr-3 text-slate-300 group-hover:text-emerald-600 transition-colors" /> :
                           <Globe className="h-4 w-4 mr-3 text-slate-300 group-hover:text-emerald-600 transition-colors" />}
                          <span className="uppercase tracking-tight">{link.platform}</span>
                          <ExternalLink className="h-3 w-3 ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                        </motion.a>
                      ))
                    ) : (
                      <div className="text-center py-6 text-xs text-slate-400 font-serif italic border border-dashed border-sky-100 rounded-xl">No social links added yet.</div>
                    )}
                  </div>
                </div>

                <div className="p-8 bg-sky-900 text-white rounded-3xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-sky-400/10 rounded-full -ml-16 -mb-16 blur-3xl"></div>
                  <div className="relative z-10">
                    <div className="text-[10px] font-bold text-sky-400 uppercase tracking-[0.2em] mb-3">Milestone Progress</div>
                    <div className="text-4xl font-bold mb-4 font-serif italic">{Math.round((Object.values(profile?.milestones || {}).filter(Boolean).length / 6) * 100)}%</div>
                    <div className="w-full bg-slate-800/50 h-2.5 rounded-full overflow-hidden mb-8 border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(Object.values(profile?.milestones || {}).filter(Boolean).length / 6) * 100}%` }}
                        className="bg-emerald-500 h-full relative" 
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </motion.div>
                    </div>
                    
                    <div className="text-[10px] font-bold text-sky-400 uppercase tracking-[0.2em] mb-4">Gamification</div>
                    <div className="flex justify-between items-center mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                      <span className="text-xs font-bold text-sky-200 uppercase tracking-widest">Total Points</span>
                      <span className="text-2xl font-bold text-emerald-400">{profile?.points || 0} XP</span>
                    </div>
                    <div className="space-y-4">
                      <span className="text-[10px] font-bold text-sky-400 uppercase tracking-[0.2em] block">Earned Badges</span>
                      {profile?.badges && profile.badges.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profile.badges.map((badge, i) => (
                            <span key={i} className="px-3 py-1.5 bg-emerald-500 text-white rounded-full text-[10px] font-bold flex items-center uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                              <Award className="h-3 w-3 mr-1" /> {badge}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-sky-500/60 font-serif italic border border-dashed border-sky-400/20 rounded-xl p-4 text-center">Complete tasks to earn badges!</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm group relative overflow-hidden">
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <h4 className="font-bold text-slate-900 uppercase font-serif tracking-tight">Skill Quizzes</h4>
                    <button onClick={() => navigate('skillQuiz')} className="text-[10px] font-bold text-emerald-600 hover:underline uppercase tracking-widest transition-all">Take Quiz</button>
                  </div>
                  <div className="space-y-3 relative z-10">
                    {profile?.quizResults && Object.keys(profile.quizResults).length > 0 ? (
                      Object.entries(profile.quizResults).map(([skill, score]) => (
                        <div key={skill} className="flex items-center justify-between p-4 bg-sky-50 border border-sky-100 rounded-xl shadow-sm transition-all hover:border-emerald-500 group/item">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-tight group-hover/item:text-slate-900 transition-colors">{skill}</span>
                          <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${score >= 7 ? 'bg-emerald-100 text-emerald-700' : score >= 4 ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-400'}`}>
                            {score} / 10
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-xs text-slate-400 font-serif italic border border-dashed border-sky-100 rounded-xl">No quizzes taken yet.</div>
                    )}
                  </div>
                </div>

                <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-xl relative text-slate-900 group">
                  <div className="absolute inset-0 bg-sky-50/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <h2 className="text-2xl font-bold font-serif tracking-tight mb-8 flex items-center text-slate-900 uppercase relative z-10">
                    <Layout className="h-6 w-6 mr-2 text-emerald-600" /> Daily Tasks
                  </h2>
                  
                  <form onSubmit={addTodo} className="mb-6 space-y-4 relative z-10">
                    <input 
                      type="text" 
                      placeholder="Next goal..." 
                      className="w-full bg-sky-50 border border-sky-100 rounded-xl py-3.5 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-slate-700 placeholder:text-slate-400 font-serif italic"
                      value={newTodo}
                      onChange={(e) => setNewTodo(e.target.value)}
                    />
                    <div className="flex gap-2">
                      {(['High', 'Medium', 'Low'] as const).map((p) => (
                        <button 
                          key={p}
                          type="button"
                          onClick={() => setNewTodoPriority(p)}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                            newTodoPriority === p ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-emerald-500 hover:text-emerald-600'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit" 
                      className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center shadow-xl shadow-emerald-500/20 uppercase tracking-widest"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Task
                    </motion.button>
                  </form>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 relative z-10 custom-scrollbar">
                    {todos.length > 0 ? todos.map((todo) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={todo.id} 
                        className="group flex items-center p-4 bg-white rounded-2xl border border-slate-100 hover:border-emerald-500 hover:shadow-md transition-all sm:p-5"
                      >
                        <button onClick={() => toggleTodo(todo.id, todo.completed)} className="mr-3 shrink-0">
                          {todo.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5 text-slate-200 group-hover:text-emerald-300" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium truncate ${todo.completed ? 'text-slate-300 line-through opacity-60 italic' : 'text-slate-700 font-serif'}`}>{todo.text}</div>
                          <div className={`text-[8px] font-bold uppercase tracking-[0.2em] mt-1.5 ${
                            todo.priority === 'High' ? 'text-rose-500' : todo.priority === 'Medium' ? 'text-emerald-600' : 'text-slate-400'
                          }`}>
                            {todo.priority} Priority
                          </div>
                        </div>
                        <button onClick={() => deleteTodo(todo.id)} className="ml-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </motion.div>
                    )) : (
                      <div className="text-center py-10 text-slate-400 text-xs font-serif italic border border-dashed border-sky-100 rounded-2xl">All caught up! Start your marathon.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
