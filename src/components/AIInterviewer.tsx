
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, User, Sparkles, Loader2, Pause, Play, Brain, MessageSquare } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';

const MODEL_NAME = "gemini-3.1-flash-live-preview";

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export function AIInterviewer({ onClose }: { onClose: () => void }) {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isActivePaused, setIsActivePaused] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentTranscription, setCurrentTranscription] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentUserTranscription, setCurrentUserTranscription] = useState("");
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const modelTranscriptionRef = useRef("");
  const userTranscriptionRef = useRef("");
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentTranscription]);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  const addMessage = (role: 'user' | 'model', text: string) => {
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role,
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const startSession = async () => {
    try {
      setIsConnecting(true);
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });

      // Initialize Audio Context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });

      sessionPromiseRef.current = ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
          },
          systemInstruction: "You are the SkillGAP AI Interviewer. Your goal is to conduct a professional mock interview with the user. Ask relevant technical and behavioral questions based on their target career. Be formal yet supportive. Provide feedback after each answer if appropriate. Keep questions clear and concise.",
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            setIsActivePaused(false);
            startMicrophone();
          },
          onmessage: async (message: LiveServerMessage) => {
            if (isActivePaused) return;

            // Model Audio & Transcription
            const modelTurn = message.serverContent?.modelTurn;
            const part = modelTurn?.parts[0];
            
            if (part?.inlineData?.data) {
              const base64Data = part.inlineData.data;
              const arrayBuffer = base64ToArrayBuffer(base64Data);
              const pcmData = new Int16Array(arrayBuffer);
              audioQueueRef.current.push(pcmData);
              if (!isPlayingRef.current) {
                playNextInQueue();
              }
            }

            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
              setIsSpeaking(false);
              isPlayingRef.current = false;
            }

            // Model Text Transcription
            if (part?.text) {
                modelTranscriptionRef.current += part.text;
                setCurrentTranscription(modelTranscriptionRef.current);
            }

            // Model Turn Complete - commit to history
            if (message.serverContent?.turnComplete) {
                const finalModelText = modelTranscriptionRef.current.trim();
                if (finalModelText) {
                    addMessage('model', finalModelText);
                }
                modelTranscriptionRef.current = "";
                setCurrentTranscription("");
            }

            // User Transcription
            const userTrans = (message.serverContent as any)?.inputTranscription;
            if (userTrans?.text) {
                userTranscriptionRef.current += userTrans.text;
                setCurrentUserTranscription(userTranscriptionRef.current);
            }

            // User Turn Complete (often inferred when model starts speaking or explicitly sent)
            // ModelTurn parts suggest the user finished speaking or model is interrupting
            if (modelTurn && userTranscriptionRef.current.trim()) {
                addMessage('user', userTranscriptionRef.current.trim());
                userTranscriptionRef.current = "";
                setCurrentUserTranscription("");
            }
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            stopSession();
          },
          onclose: () => {
            stopSession();
          }
        }
      });
    } catch (error) {
      console.error("Failed to start session:", error);
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    setIsActive(false);
    setIsConnecting(false);
    setIsActivePaused(false);
    
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close());
      sessionPromiseRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsSpeaking(false);
  };

  const togglePause = () => {
    setIsActivePaused(!isActivePaused);
    // In a real implementation, we might want to tell the model we are pausing 
    // or just silence the mic stream.
  };

  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const source = audioContextRef.current!.createMediaStreamSource(stream);
      const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        // Only send audio if not paused
        if (isActivePaused) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = floatTo16BitPCM(inputData);
        const base64Data = arrayBufferToBase64(pcmData.buffer);
        
        if (sessionPromiseRef.current) {
          sessionPromiseRef.current.then(session => {
            session.sendRealtimeInput({
              audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
            });
          });
        }
      };

      source.connect(processor);
      processor.connect(audioContextRef.current!.destination);
    } catch (error) {
      console.error("Mic access denied:", error);
      stopSession();
    }
  };

  const playNextInQueue = async () => {
    if (audioQueueRef.current.length === 0 || isActivePaused) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);
    const pcmData = audioQueueRef.current.shift()!;
    
    const audioBuffer = audioContextRef.current!.createBuffer(1, pcmData.length, 16000);
    const channelData = audioBuffer.getChannelData(0);
    
    for (let i = 0; i < pcmData.length; i++) {
        channelData[i] = pcmData[i] / 32768;
    }

    const source = audioContextRef.current!.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current!.destination);
    source.onended = () => {
      playNextInQueue();
    };
    source.start();
  };

  // Helper functions
  const floatTo16BitPCM = (input: Float32Array) => {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const base64ToArrayBuffer = (base64: string) => {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl"
    >
      <div className="bg-slate-900 border-2 border-slate-700/50 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-[0_0_80px_rgba(16,185,129,0.15)] relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-800/80 p-6 flex justify-between items-center border-b border-slate-700 backdrop-blur-md">
          <div className="flex items-center space-x-4">
            <div className="bg-emerald-500 p-2.5 rounded-2xl shadow-lg shadow-emerald-500/20">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white !text-white tracking-tight uppercase drop-shadow-sm">AI Interviewer</h2>
              <p className="text-emerald-400 text-[10px] uppercase font-black tracking-[0.3em]">Live Audio Feed • Real-time Sync</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-red-500 hover:text-white rounded-2xl text-slate-400 transition-all duration-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-grow overflow-y-auto p-6 space-y-8 scroll-smooth" ref={scrollRef}>
          
          {/* Visualizer Section */}
          <div className="flex flex-col items-center py-6">
            <div className="relative mb-8">
                {/* Pulsing Visualizer */}
                <AnimatePresence>
                {(isActive || isConnecting) && !isActivePaused && (
                    <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                        scale: [1, 1.3, 1],
                        opacity: [0.1, 0.4, 0.1]
                    }}
                    transition={{ 
                        repeat: Infinity, 
                        duration: 2.5,
                        ease: "easeInOut" 
                    }}
                    className={`absolute inset-0 rounded-full blur-3xl ${
                        isSpeaking ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                    />
                )}
                </AnimatePresence>
                
                <div className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center border-4 transition-all duration-700 shadow-2xl ${
                isActive ? (isActivePaused ? 'bg-slate-800 border-amber-500' : 'bg-slate-800 border-emerald-500 shadow-emerald-500/10') : 'bg-slate-800 border-slate-700'
                }`}>
                {isConnecting ? (
                    <Loader2 className="h-12 w-12 text-emerald-400 animate-spin" />
                ) : isActive ? (
                    isActivePaused ? (
                        <Pause className="h-12 w-12 text-amber-500 fill-current" />
                    ) : (
                        <div className="flex items-center space-x-1.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        height: isSpeaking ? [16, 48, 16] : [16, 24, 16],
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 0.4 + i * 0.1,
                                    }}
                                    className={`w-1.5 rounded-full ${isSpeaking ? 'bg-emerald-500' : 'bg-blue-400'}`}
                                />
                            ))}
                        </div>
                    )
                ) : (
                    <MicOff className="h-12 w-12 text-slate-500" />
                )}
                </div>
            </div>

            <div className="text-center">
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
                {isConnecting ? "ESTABLISHING LINK..." : isActive ? (isActivePaused ? "SESSION PAUSED" : (isSpeaking ? "INTERVIEWER SPEAKING" : "LISTENING...")) : "READY TO START?"}
                </h3>
                <div className="flex items-center justify-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isActive && !isActivePaused ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
                    <p className="text-white text-xs font-bold uppercase tracking-widest leading-relaxed">
                    {isActive ? "Audio Modality Active" : "Prepare for a professional session"}
                    </p>
                </div>
            </div>
          </div>

          {/* Chat History Segment */}
          <div className="space-y-6 px-2">
            {messages.length === 0 && !currentTranscription && !isConnecting && (
                <div className="text-center py-10 opacity-40">
                    <MessageSquare className="h-10 w-10 text-white mx-auto mb-4" />
                    <p className="text-white text-sm font-bold uppercase tracking-widest">No conversation yet</p>
                </div>
            )}

            {messages.map((m) => (
                <motion.div 
                    key={m.id}
                    initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    <div className={`max-w-[85%] rounded-[2rem] p-5 shadow-lg ${
                        m.role === 'user' 
                        ? 'bg-emerald-600 text-white rounded-br-none' 
                        : 'bg-slate-800 text-white rounded-bl-none border border-slate-700/50'
                    }`}>
                        <div className="flex items-center space-x-2 mb-2 text-white opacity-60 text-[10px] font-black uppercase tracking-widest">
                            {m.role === 'user' ? <User className="h-3 w-3" /> : <Brain className="h-3 w-3" />}
                            <span>{m.role === 'user' ? 'You' : 'AI Interviewer'}</span>
                        </div>
                        <p className="text-sm font-bold leading-relaxed text-white">{m.text}</p>
                    </div>
                </motion.div>
            ))}

            {/* Live Model Transcription (Current) */}
            {currentTranscription && (
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-start"
                >
                    <div className="max-w-[85%] rounded-[2rem] p-5 bg-slate-800 text-white rounded-bl-none border-2 border-emerald-400 shadow-xl shadow-emerald-500/10 transition-all duration-300">
                        <div className="flex items-center space-x-2 mb-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                            <Brain className="h-3 w-3 animate-pulse" />
                            <span>AI Speaking...</span>
                        </div>
                        <p className="text-sm font-bold leading-relaxed italic drop-shadow-sm leading-relaxed text-white">"{currentTranscription}"</p>
                    </div>
                </motion.div>
            )}

            {/* User Active Transcription */}
            {currentUserTranscription && (
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-end"
                >
                    <div className="max-w-[85%] rounded-[2rem] p-5 bg-emerald-700/80 text-white rounded-br-none border-2 border-emerald-400/30 shadow-xl shadow-emerald-500/10">
                        <div className="flex items-center space-x-2 mb-2 text-white/70 text-[10px] font-black uppercase tracking-widest">
                            <User className="h-3 w-3 animate-pulse" />
                            <span>Listening...</span>
                        </div>
                        <p className="text-sm font-bold leading-relaxed text-white">{currentUserTranscription}</p>
                    </div>
                </motion.div>
            )}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="bg-slate-800/50 p-8 border-t border-slate-700 flex flex-col items-center backdrop-blur-md">
            <div className="flex items-center space-x-6">
                {!isActive && !isConnecting ? (
                    <button
                        onClick={startSession}
                        className="group flex flex-col items-center justify-center"
                    >
                        <div className="bg-emerald-600 hover:bg-emerald-500 text-white p-6 rounded-3xl shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all duration-300 transform hover:scale-105 active:scale-95 mb-3">
                            <Mic className="h-10 w-10" />
                        </div>
                        <span className="text-white text-[10px] font-black uppercase tracking-[0.3em]">Ignite Session</span>
                    </button>
                ) : (
                    <>
                        <div className="flex flex-col items-center">
                            <button
                                onClick={togglePause}
                                disabled={isConnecting}
                                className={`flex items-center justify-center p-6 rounded-3xl transition-all duration-300 transform active:scale-95 shadow-lg ${
                                    isActivePaused ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-amber-900/40' : 'bg-slate-700 hover:bg-slate-600 text-white border-2 border-slate-600 shadow-black/40'
                                }`}
                            >
                                {isActivePaused ? <Play className="h-10 w-10 fill-current" /> : <Pause className="h-10 w-10 fill-current" />}
                            </button>
                            <span className="text-white text-[10px] font-black uppercase tracking-[0.3em] mt-3">
                                {isActivePaused ? "Resume" : "Pause"}
                            </span>
                        </div>
                        
                        <div className="flex flex-col items-center">
                            <button
                                onClick={stopSession}
                                className="flex items-center justify-center bg-red-500 hover:bg-red-400 text-white p-6 rounded-3xl shadow-[0_10px_30px_rgba(239,68,68,0.3)] transition-all duration-300 transform active:scale-95"
                            >
                                <X className="h-10 w-10" />
                            </button>
                            <span className="text-white text-[10px] font-black uppercase tracking-[0.3em] mt-3">Terminate</span>
                        </div>
                    </>
                )}
            </div>
            {isActive && !isActivePaused && (
                <div className="mt-6 flex items-center space-x-2 text-white/40 text-[9px] font-black uppercase tracking-[0.4em]">
                    <Sparkles className="h-3 w-3" />
                    <span>Processing High-Fidelity Audio</span>
                </div>
            )}
        </div>
      </div>
    </motion.div>
  );
}
