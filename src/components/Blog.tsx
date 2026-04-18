import React, { useState, useEffect } from 'react';
import { ChevronRight, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from '@google/genai';
import { BLOG_POSTS } from '../data';
import { LazyImage } from './LazyImage';

export function BlogView() {
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [dynamicPosts, setDynamicPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async (isRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      // Use process.env.GEMINI_API_KEY as per skill guidelines for React/Vite
      const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey || apiKey === 'undefined') {
        throw new Error("Gemini API Key is missing. Please check your environment variables.");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      // Using gemini-3-flash-preview for better reliability with tools and JSON
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Search for the 6 most recent and significant tech news articles from the last 24 hours. Focus on AI, software development, and major industry shifts. Return the results as a JSON array of objects with these properties: id (number), title (string), excerpt (string), content (3-4 paragraphs string), date (string), category (string), and sourceUrl (string).",
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.NUMBER },
                title: { type: Type.STRING },
                excerpt: { type: Type.STRING },
                content: { type: Type.STRING },
                date: { type: Type.STRING },
                category: { type: Type.STRING },
                sourceUrl: { type: Type.STRING }
              },
              required: ["title", "excerpt", "content", "date"]
            }
          }
        },
      });

      const text = response.text;
      if (!text) {
        // Log the full response for debugging if text is empty
        console.error("Full AI Response:", response);
        throw new Error("The AI returned an empty response. This can happen if the search results were blocked or unavailable.");
      }

      let newsText = text.trim();
      // Remove markdown code blocks if present (though responseMimeType: "application/json" should prevent them)
      newsText = newsText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      
      const news = JSON.parse(newsText);
      if (Array.isArray(news) && news.length > 0) {
        const processedNews = news.map((item, idx) => ({
          ...item,
          id: item.id || Date.now() + idx,
          category: item.category || 'Tech News'
        }));
        setDynamicPosts(processedNews);
      } else {
        throw new Error("The AI returned an empty or invalid news list.");
      }
    } catch (err) {
      console.error("Error fetching news:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to fetch latest news: ${errorMessage}. Showing archived articles.`);
      if (!isRefresh) setDynamicPosts(BLOG_POSTS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const postsToDisplay = dynamicPosts.length > 0 ? dynamicPosts : BLOG_POSTS;

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold tracking-tight text-slate-900 mb-4 font-serif uppercase"
        >
          Insights & Real-Time News
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-slate-600 max-w-2xl mx-auto mb-8 font-serif italic text-lg"
        >
          Expert advice and real-time industry trends powered by AI synchronization.
        </motion.p>
        
        <div className="flex flex-col items-center justify-center space-y-6">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchNews(true)}
            disabled={isLoading}
            className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-[0.2em] text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50"
          >
            {isLoading ? 'Syncing...' : 'Sync Latest Trends'}
          </motion.button>

          {isLoading && (
            <div className="flex items-center justify-center space-x-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-3 h-3 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce"></div>
            </div>
          )}
          
          {error && (
            <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-rose-50 p-3 border border-rose-200 rounded-xl max-w-md mx-auto">{error}</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {postsToDisplay.map((post, index) => (
          <motion.div 
            key={post.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -8 }}
            className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col relative group transition-all duration-500"
          >
            <div className="h-56 bg-sky-50 relative overflow-hidden">
              <LazyImage 
                src={`https://picsum.photos/seed/blog-${post.id || index}/800/600`} 
                alt={post.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm border border-slate-200 px-4 py-1.5 rounded-full text-[10px] font-bold text-slate-900 uppercase tracking-[0.2em] shadow-sm">
                {post.date}
              </div>
            </div>
            <div className="p-8 flex-1 flex flex-col relative z-20">
              <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.3em] mb-3">{post.category || 'Industry'}</div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-4 leading-tight group-hover:text-emerald-600 transition-colors font-serif uppercase">{post.title}</h3>
              <p className="text-slate-500 text-sm mb-6 flex-1 line-clamp-3 font-serif italic">{post.excerpt}</p>
              <button 
                onClick={() => setSelectedPost(post)}
                className="text-emerald-600 font-bold text-xs flex items-center hover:text-emerald-700 transition-colors uppercase tracking-[0.2em] group/btn"
              >
                Explore More <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="absolute inset-0 bg-sky-900/80 backdrop-blur-md"
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-[2.5rem] shadow-2xl border border-slate-200 p-8 md:p-14 custom-scrollbar"
            >
              <button onClick={() => setSelectedPost(null)} className="absolute top-8 right-8 p-2.5 bg-sky-50 rounded-full text-slate-400 hover:bg-sky-100 hover:text-slate-600 transition-all z-10 shadow-sm">
                <X className="h-5 w-5" />
              </button>
              <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.3em] mb-4">{selectedPost.date}</div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-8 font-serif uppercase border-l-4 border-emerald-500 pl-6">{selectedPost.title}</h2>
              <div className="prose prose-slate max-w-none">
                <div className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap font-serif italic">
                  {selectedPost.content}
                </div>
                {selectedPost.sourceUrl && (
                  <div className="mt-12 pt-8 border-t border-sky-100">
                    <a 
                      href={selectedPost.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-[0.3em] bg-emerald-50 px-5 py-2 rounded-full border border-emerald-100 transition-all hover:bg-emerald-100"
                    >
                      Article Source <ExternalLink className="h-3 w-3 ml-2" />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
