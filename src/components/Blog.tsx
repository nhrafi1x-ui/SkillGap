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

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "AIzaSyCUSWpBFTDFzNZCw120_Gu6UYHqSfKdIGU";
        if (!apiKey || apiKey === 'undefined') {
          throw new Error("Gemini API Key is missing. Please set VITE_GEMINI_API_KEY or GEMINI_API_KEY in your environment variables (e.g., in Vercel project settings).");
        }
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: "Search for the latest tech and industry news from today. Provide a list of 6 interesting news articles with titles, short excerpts, full content (a few paragraphs), and the date. Focus on innovation, AI, and global tech trends.",
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
                required: ["id", "title", "excerpt", "content", "date"]
              }
            }
          },
        });

        if (!response.text) {
          throw new Error("No response text from Gemini API.");
        }

        let newsText = response.text.trim();
        // Handle potential markdown formatting in response
        if (newsText.startsWith('```json')) {
          newsText = newsText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        }

        const news = JSON.parse(newsText);
        if (Array.isArray(news) && news.length > 0) {
          setDynamicPosts(news);
        } else {
          setDynamicPosts(BLOG_POSTS);
        }
      } catch (err) {
        console.error("Error fetching news:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`Failed to fetch latest news: ${errorMessage}. Showing archived articles.`);
        setDynamicPosts(BLOG_POSTS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  const postsToDisplay = dynamicPosts.length > 0 ? dynamicPosts : BLOG_POSTS;

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold font-serif tracking-tight text-[#1a3636] mb-4 uppercase">Career Insights & Tech News</h1>
        <p className="text-[#1a3636]/70 max-w-2xl mx-auto font-serif italic">Expert advice and real-time industry trends powered by Google Search.</p>
        {isLoading && (
          <div className="mt-8 flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-[#1a3636] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-[#1a3636] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-[#1a3636] rounded-full animate-bounce"></div>
            <span className="text-xs font-bold uppercase tracking-widest ml-2">Fetching Latest News...</span>
          </div>
        )}
        {error && (
          <div className="mt-4 text-xs font-bold text-red-500 uppercase tracking-widest">{error}</div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {postsToDisplay.map((post, index) => (
          <motion.div 
            key={post.id || index}
            whileHover={{ y: -5 }}
            className="bg-[#fdfbf7] rounded-none shadow-[4px_4px_0px_0px_rgba(13,27,27,1)] border-2 border-[#1a3636] overflow-hidden flex flex-col relative"
          >
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
            <div className="h-48 bg-[#fdfbf7] relative border-b-2 border-[#1a3636] grayscale sepia-[.3]">
              <LazyImage 
                src={`https://picsum.photos/seed/blog-${post.id || index}/800/600`} 
                alt={post.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4 bg-[#fdfbf7] border-2 border-[#1a3636] px-3 py-1 rounded-none text-[10px] font-bold text-[#1a3636] uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(13,27,27,1)]">
                {post.date}
              </div>
            </div>
            <div className="p-8 flex-1 flex flex-col relative z-20">
              <h3 className="text-xl font-bold font-serif tracking-tight text-[#1a3636] mb-4 leading-tight uppercase">{post.title}</h3>
              <p className="text-[#1a3636]/70 text-sm mb-6 flex-1 font-serif italic">{post.excerpt}</p>
              <button 
                onClick={() => setSelectedPost(post)}
                className="text-[#1a3636] font-bold text-sm flex items-center hover:underline transition-colors uppercase tracking-widest"
              >
                Read Article <ChevronRight className="ml-1 h-4 w-4" />
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
              className="absolute inset-0 bg-[#1a3636]/80 backdrop-blur-sm"
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-[#fdfbf7] w-full max-w-3xl max-h-[80vh] overflow-y-auto rounded-none shadow-[12px_12px_0px_0px_rgba(13,27,27,1)] border-4 border-[#1a3636] p-8 md:p-12"
            >
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
              <button onClick={() => setSelectedPost(null)} className="absolute top-6 right-6 p-2 bg-[#fdfbf7] rounded-none border-2 border-[#1a3636] hover:bg-[#1a3636] hover:text-[#fdfbf7] transition-colors shadow-[2px_2px_0px_0px_rgba(13,27,27,1)] hover:translate-y-[2px] hover:shadow-none group z-10">
                <X className="h-5 w-5 text-[#1a3636] group-hover:text-[#fdfbf7]" />
              </button>
              <div className="text-xs font-bold text-[#1a3636]/50 uppercase tracking-widest mb-4 relative z-10">{selectedPost.date}</div>
              <h2 className="text-3xl font-bold font-serif tracking-tight text-[#1a3636] mb-8 uppercase relative z-10">{selectedPost.title}</h2>
              <div className="prose prose-slate max-w-none relative z-10">
                <div className="text-[#1a3636]/80 leading-relaxed text-lg font-serif whitespace-pre-wrap">
                  {selectedPost.content}
                </div>
                {selectedPost.sourceUrl && (
                  <div className="mt-8 pt-8 border-t border-[#1a3636]/10">
                    <a 
                      href={selectedPost.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs font-bold text-[#1a3636] hover:underline uppercase tracking-widest"
                    >
                      Source <ExternalLink className="h-3 w-3 ml-1" />
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
