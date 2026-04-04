import React, { useState } from 'react';
import { User, LogOut, Plus, Trash2, ArrowRight, FileText, ExternalLink, Target, Linkedin, Github, Twitter, Globe, Award } from 'lucide-react';
import { View, UserProfile, OperationType } from '../types';
import { CAREER_DIRECTORY } from '../data';
import { db } from '../firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError } from '../utils/error';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';

export function ProfileView({ navigate, user, profile, setProfile, handleLogout }: { navigate: (v: View) => void, user: any, profile: UserProfile | null, setProfile: any, handleLogout: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    try {
      const updatedProfile = { ...profile, ...formData };
      setProfile(updatedProfile);
      await setDoc(doc(db, 'users', user.uid), updatedProfile);
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`, user);
    }
  };

  const generateCareerPlan = async () => {
    if (!user || !profile?.currentRole || !profile?.interests) {
      alert("Please set your Current Role and Interests in the Edit Profile section first.");
      return;
    }
    setIsGeneratingPlan(true);
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });
      const prompt = `Generate a tailored career path and skill development plan for someone currently working as a "${profile.currentRole}" with interests in "${profile.interests}". The plan should be structured, actionable, and formatted in Markdown. Include short-term and long-term goals, recommended skills to learn, and potential job roles. Keep it concise but informative.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      const newPlan = response.text;
      const updatedProfile = { ...profile, careerPlan: newPlan };
      setProfile(updatedProfile);
      await updateDoc(doc(db, 'users', user.uid), { careerPlan: newPlan });
    } catch (error) {
      console.error("Error generating career plan:", error);
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

  const job = CAREER_DIRECTORY.find(j => j.id === profile?.matchedJobId) || CAREER_DIRECTORY[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <div className="bg-white rounded-none shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] border-2 border-[#141414] overflow-hidden relative text-[#141414]">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        <div className="h-32 bg-white relative border-b-2 border-[#141414]/20">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 bg-white rounded-none border-4 border-[#141414] flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(20,20,20,0.2)] overflow-hidden relative group">
              {formData.profileImage ? (
                <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="text-[#141414] h-12 w-12" />
              )}
              {isEditing && (
                <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <span className="text-white text-xs font-bold">Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </div>
        </div>
        
        <div className="pt-16 pb-8 px-8 relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold font-serif tracking-tight text-[#141414] uppercase">{profile?.fullName || 'Guest User'}</h1>
              <p className="text-[#141414]/70 font-serif italic">@{profile?.username || 'guest'}</p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="px-6 py-2 border-2 border-[#141414] rounded-none text-sm font-bold hover:bg-[#141414] hover:text-white transition-all uppercase tracking-widest bg-transparent text-[#141414] shadow-[2px_2px_0px_0px_rgba(20,20,20,0.2)] hover:translate-y-[2px] hover:shadow-none"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
              <button 
                onClick={handleLogout}
                className="px-6 py-2 bg-transparent border-2 border-[#141414] border-dashed text-[#141414] rounded-none text-sm font-bold hover:bg-[#141414] hover:text-white transition-all flex items-center uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(20,20,20,0.2)] hover:translate-y-[2px] hover:shadow-none"
              >
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </button>
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#141414]/70 uppercase tracking-widest">Full Name</label>
                <input 
                  type="text" 
                  className="w-full bg-white border-2 border-[#141414] rounded-none py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#141414] font-mono text-[#141414]"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#141414]/70 uppercase tracking-widest">Education</label>
                <select 
                  className="w-full bg-white border-2 border-[#141414] rounded-none py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#141414] font-mono text-[#141414]"
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
                <label className="text-xs font-bold text-[#141414]/70 uppercase tracking-widest">Country</label>
                <input 
                  type="text" 
                  className="w-full bg-white border-2 border-[#141414] rounded-none py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#141414] font-mono text-[#141414]"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#141414]/70 uppercase tracking-widest">Current Role</label>
                <input 
                  type="text" 
                  className="w-full bg-white border-2 border-[#141414] rounded-none py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#141414] font-mono text-[#141414]"
                  value={formData.currentRole}
                  onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                  placeholder="e.g., Student, Junior Developer"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-[#141414]/70 uppercase tracking-widest">Interests</label>
                <input 
                  type="text" 
                  className="w-full bg-white border-2 border-[#141414] rounded-none py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#141414] font-mono text-[#141414]"
                  value={formData.interests}
                  onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                  placeholder="e.g., AI, Web Development, Data Science"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-[#141414]/70 uppercase tracking-widest">CV Link (Google Drive)</label>
                <input 
                  type="url" 
                  className="w-full bg-white border-2 border-[#141414] rounded-none py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#141414] font-mono text-[#141414]"
                  value={formData.cvLink}
                  onChange={(e) => setFormData({ ...formData, cvLink: e.target.value })}
                  placeholder="https://drive.google.com/..."
                />
              </div>

              {/* Additional Documents */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#141414]/70 uppercase tracking-widest">Additional Documents</label>
                  <button type="button" onClick={addDocument} className="text-xs font-bold text-[#141414] hover:underline flex items-center uppercase tracking-widest">
                    <Plus className="h-3 w-3 mr-1" /> Add Document
                  </button>
                </div>
                {formData.documents.map((doc, index) => (
                  <div key={index} className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="Title (e.g., Portfolio)" 
                      className="w-1/3 bg-white border-2 border-[#141414] rounded-none py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#141414] font-mono text-[#141414]"
                      value={doc.title}
                      onChange={(e) => updateDocument(index, 'title', e.target.value)}
                    />
                    <input 
                      type="url" 
                      placeholder="URL" 
                      className="flex-1 bg-white border-2 border-[#141414] rounded-none py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#141414] font-mono text-[#141414]"
                      value={doc.url}
                      onChange={(e) => updateDocument(index, 'url', e.target.value)}
                    />
                    <button type="button" onClick={() => removeDocument(index)} className="p-2 text-[#141414]/50 hover:text-[#141414] transition-colors">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Social Links */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#141414]/70 uppercase tracking-widest">Social Links</label>
                  <button type="button" onClick={addSocialLink} className="text-xs font-bold text-[#141414] hover:underline flex items-center uppercase tracking-widest">
                    <Plus className="h-3 w-3 mr-1" /> Add Link
                  </button>
                </div>
                {formData.socialLinks.map((link, index) => (
                  <div key={index} className="flex gap-3">
                    <select 
                      className="w-1/3 bg-white border-2 border-[#141414] rounded-none py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#141414] font-mono text-[#141414]"
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
                      className="flex-1 bg-white border-2 border-[#141414] rounded-none py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#141414] font-mono text-[#141414]"
                      value={link.url}
                      onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                    />
                    <button type="button" onClick={() => removeSocialLink(index)} className="p-2 text-[#141414]/50 hover:text-[#141414] transition-colors">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="md:col-span-2">
                <button type="submit" className="w-full bg-[#141414] text-white py-4 rounded-none font-bold border-2 border-[#141414] hover:bg-transparent hover:text-[#141414] transition-all uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">Save Changes</button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-none border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                    <div className="text-[10px] font-bold text-[#141414]/50 uppercase tracking-widest mb-1">Education</div>
                    <div className="font-bold text-[#141414] uppercase">{profile?.education || 'Not Set'}</div>
                  </div>
                  <div className="p-4 bg-white rounded-none border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                    <div className="text-[10px] font-bold text-[#141414]/50 uppercase tracking-widest mb-1">Country</div>
                    <div className="font-bold text-[#141414] uppercase">{profile?.country || 'Not Set'}</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold font-serif tracking-tight mb-4 text-[#141414] uppercase">Career Goal</h3>
                  <div className="p-6 bg-white rounded-none border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#141414]/50 uppercase tracking-widest mb-1">Target Role</div>
                      <div className="text-xl font-bold text-[#141414] uppercase">{job.title}</div>
                    </div>
                    <button onClick={() => navigate('directory')} className="p-2 bg-[#141414] rounded-none text-white hover:bg-transparent hover:text-[#141414] border-2 border-[#141414] transition-all shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] hover:translate-y-[2px] hover:shadow-none">
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold font-serif tracking-tight text-[#141414] uppercase">Documents</h3>
                    <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-[#141414] hover:underline flex items-center uppercase tracking-widest">
                      <Plus className="h-3 w-3 mr-1" /> Add More
                    </button>
                  </div>
                  <div className="space-y-3">
                    {profile?.cvLink && (
                      <a 
                        href={profile.cvLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center p-4 bg-white border-2 border-[#141414] rounded-none hover:shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] transition-all group"
                      >
                        <FileText className="h-6 w-6 mr-4 text-[#141414]/50 group-hover:text-[#141414]" />
                        <div className="flex-1">
                          <div className="text-sm font-bold text-[#141414] uppercase">Curriculum Vitae</div>
                          <div className="text-xs text-[#141414]/70 font-serif italic">Google Drive Link</div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-[#141414]/30 group-hover:text-[#141414]" />
                      </a>
                    )}
                    
                    {profile?.documents?.map((doc, i) => (
                      <a 
                        key={i}
                        href={doc.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center p-4 bg-white border-2 border-[#141414] rounded-none hover:shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] transition-all group"
                      >
                        <FileText className="h-6 w-6 mr-4 text-[#141414]/50 group-hover:text-[#141414]" />
                        <div className="flex-1">
                          <div className="text-sm font-bold text-[#141414] uppercase">{doc.title}</div>
                          <div className="text-xs text-[#141414]/70 font-serif italic">External Link</div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-[#141414]/30 group-hover:text-[#141414]" />
                      </a>
                    ))}

                    {!profile?.cvLink && (!profile?.documents || profile.documents.length === 0) && (
                      <div className="p-8 border-2 border-dashed border-[#141414]/30 rounded-none text-center bg-white">
                        <FileText className="h-8 w-8 text-[#141414]/30 mx-auto mb-3" />
                        <p className="text-sm text-[#141414]/70 mb-4 font-serif italic">No documents uploaded yet.</p>
                        <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-[#141414] hover:underline uppercase tracking-widest">Add Documents</button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold font-serif tracking-tight text-[#141414] uppercase">Personalized Career Path</h3>
                    <button 
                      onClick={generateCareerPlan} 
                      disabled={isGeneratingPlan}
                      className="text-xs font-bold text-[#141414] hover:underline flex items-center uppercase tracking-widest disabled:opacity-50"
                    >
                      {isGeneratingPlan ? (
                        <span className="flex items-center"><div className="w-3 h-3 border-2 border-[#141414] border-t-transparent rounded-full animate-spin mr-2"></div> Generating...</span>
                      ) : (
                        <span className="flex items-center"><Plus className="h-3 w-3 mr-1" /> Generate Plan</span>
                      )}
                    </button>
                  </div>
                  
                  {profile?.careerPlan ? (
                    <div className="p-6 bg-white border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] markdown-body text-[#141414]">
                      <Markdown>{profile.careerPlan}</Markdown>
                    </div>
                  ) : (
                    <div className="p-8 border-2 border-dashed border-[#141414]/30 rounded-none text-center bg-white">
                      <Target className="h-8 w-8 text-[#141414]/30 mx-auto mb-3" />
                      <p className="text-sm text-[#141414]/70 mb-4 font-serif italic">No career plan generated yet.</p>
                      <p className="text-xs text-[#141414]/50 font-serif italic">Make sure to set your Current Role and Interests in Edit Profile first.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-white rounded-none border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold font-serif tracking-tight text-[#141414] uppercase">Social Links</h4>
                    <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-[#141414] hover:underline uppercase tracking-widest">Edit</button>
                  </div>
                  <div className="space-y-3">
                    {profile?.socialLinks && profile.socialLinks.length > 0 ? (
                      profile.socialLinks.map((link, i) => (
                        <a 
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full flex items-center p-3 bg-white border-2 border-[#141414] rounded-none text-xs font-bold text-[#141414] hover:shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] transition-all group uppercase tracking-widest"
                        >
                          {link.platform === 'LinkedIn' ? <Linkedin className="h-4 w-4 mr-3 text-[#141414]/50 group-hover:text-[#141414]" /> :
                           link.platform === 'GitHub' ? <Github className="h-4 w-4 mr-3 text-[#141414]/50 group-hover:text-[#141414]" /> :
                           link.platform === 'Twitter' ? <Twitter className="h-4 w-4 mr-3 text-[#141414]/50 group-hover:text-[#141414]" /> :
                           <Globe className="h-4 w-4 mr-3 text-[#141414]/50 group-hover:text-[#141414]" />}
                          {link.platform}
                          <ExternalLink className="h-3 w-3 ml-auto text-[#141414]/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ))
                    ) : (
                      <div className="text-center py-4 text-xs text-[#141414]/50 font-serif italic">No social links added yet.</div>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-white text-[#141414] rounded-none shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] border-2 border-[#141414] relative">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
                  <div className="relative z-10">
                    <div className="text-xs font-bold text-[#141414]/70 uppercase tracking-widest mb-2">Milestone Progress</div>
                    <div className="text-3xl font-bold mb-4 font-serif tracking-tight">{Math.round((Object.values(profile?.milestones || {}).filter(Boolean).length / 6) * 100)}%</div>
                    <div className="w-full bg-[#141414]/20 h-2 rounded-none overflow-hidden mb-6 border border-[#141414]/30">
                      <div 
                        className="bg-[#141414] h-full" 
                        style={{ width: `${(Object.values(profile?.milestones || {}).filter(Boolean).length / 6) * 100}%` }}
                      ></div>
                    </div>
                    
                    <div className="text-xs font-bold text-[#141414]/70 uppercase tracking-widest mb-2">Gamification</div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-[#141414]/70 font-serif italic">Total Points</span>
                      <span className="text-xl font-bold text-[#141414]">{profile?.points || 0} XP</span>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm text-[#141414]/70 block mb-2 font-serif italic">Earned Badges</span>
                      {profile?.badges && profile.badges.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profile.badges.map((badge, i) => (
                            <span key={i} className="px-3 py-1 bg-transparent text-[#141414] border-2 border-[#141414] rounded-none text-xs font-bold flex items-center uppercase tracking-widest">
                              <Award className="h-3 w-3 mr-1" /> {badge}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-[#141414]/50 font-serif italic">Complete tasks to earn badges!</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-none border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold font-serif tracking-tight text-[#141414] uppercase">Skill Assessments</h4>
                    <button onClick={() => navigate('skillQuiz')} className="text-xs font-bold text-[#141414] hover:underline uppercase tracking-widest">Take Quiz</button>
                  </div>
                  <div className="space-y-3">
                    {profile?.quizResults && Object.keys(profile.quizResults).length > 0 ? (
                      Object.entries(profile.quizResults).map(([skill, score]) => (
                        <div key={skill} className="flex items-center justify-between p-3 bg-white border-2 border-[#141414] rounded-none">
                          <span className="text-sm font-bold text-[#141414] uppercase tracking-tight">{skill}</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded-none border-2 ${score >= 7 ? 'bg-[#141414] text-white border-[#141414]' : score >= 4 ? 'bg-white text-[#141414] border-[#141414]' : 'bg-transparent text-[#141414] border-[#141414] border-dashed'}`}>
                            {score} / 10
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-xs text-[#141414]/50 font-serif italic">No quizzes taken yet.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
