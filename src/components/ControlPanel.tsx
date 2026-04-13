import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LearningSummary, Polyline, Resource } from '../types';
import { X, BookOpen, Activity, Map, PlayCircle, HelpCircle, Sparkles, CheckCircle, TrendingUp, Search, Bookmark, Mic, MicOff } from 'lucide-react';

interface ControlPanelProps {
  onSummarizeLearning: (title: string, summary: string) => void;
  onShowPolyline: (polylineId: string) => void;
  onToggleSimulation: () => void;
  onPlayPath: () => void;
  learningData: LearningSummary;
  polylines: Polyline[];
  isSimulationRunning: boolean;
  isLoading: boolean;
  learningPath: string[];
  bookmarks: string[];
  toggleBookmark: (id: string) => void;
  resources: Resource[];
  onResourceClick: (resource: Resource) => void;
  onStartTutorial: () => void;
  agent: any;
  onRestartJourney: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onSummarizeLearning,
  onShowPolyline,
  onToggleSimulation,
  onPlayPath,
  learningData,
  polylines,
  isSimulationRunning,
  isLoading,
  learningPath,
  bookmarks,
  toggleBookmark,
  resources,
  onResourceClick,
  onStartTutorial,
  agent,
  onRestartJourney
}) => {
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showPolylineModal, setShowPolylineModal] = useState(false);
  const [showPolylineListModal, setShowPolylineListModal] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [selectedPolyline, setSelectedPolyline] = useState<Polyline | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showPersonaTooltip, setShowPersonaTooltip] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setSummary(prev => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' ' : '') + finalTranscript);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleSummarySubmit = () => {
    if (title.trim() && summary.trim()) {
      onSummarizeLearning(title, summary);
      setTitle('');
      setSummary('');
      setShowSummaryModal(false);
    }
  };

  const handleShowPolyline = () => {
    // Prioritize the average polyline
    const avgPolyline = polylines.find(p => p.id === 'current_average');
    const activePolyline = avgPolyline || polylines.find(p => p.isActive);
    
    if (activePolyline) {
      setSelectedPolyline(activePolyline);
      setShowPolylineModal(true);
    }
  };

  // Generate chart data for polyline visualization
  const generateChartData = (polyline: Polyline) => {
    if (polyline.module_scores && polyline.module_scores.length > 0) {
      return polyline.module_scores.map((score, index) => ({
        x: index + 1,
        y: score
      }));
    }

    // Default to zero if no data exists, don't show mock random data
    return Array.from({ length: 18 }, (_, i) => ({
      x: i + 1,
      y: 0
    }));
  };

  const topicLegendItems = [
    "Pre training objectives", "Pre trained models", "Tutorial: Introduction to huggingface",
    "Fine tuning LLM", "Instruction tuning", "Prompt based learning",
    "Parameter efficient fine tuning", "Incontext Learning", "Prompting methods",
    "Retrieval Methods", "Retrieval Augmented Generation", "Quantization",
    "Mixture of Experts Model", "Agentic AI", "Multimodal LLMs",
    "Vision Language Models", "Policy learning using DQN", "RLHF"
  ];

  const generateHighLineData = () => {
    return topicLegendItems.map((topic, i) => {
        const res = resources.find(r => r.module === topic);
        return { x: i + 1, y: res?.high_line || 0.8 };
    });
  };
  const highLineChartData = generateHighLineData();


  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">Control <span className="text-brand">Center</span></h2>
          <button 
            onClick={onStartTutorial}
            className="text-slate-300 hover:text-brand transition-all hover:scale-110 active:scale-95"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Manage your neural sync and analysis</p>
      </div>

      {/* Profile Section */}
      <div className="px-6 py-6 border-b border-gray-100 bg-slate-50/30 flex items-center gap-6">
        <div className="relative w-16 h-16 shrink-0">
            <svg className="w-full h-full transform -rotate-90 overflow-visible">
                <circle cx="32" cy="32" r="28" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                <motion.circle 
                    cx="32" cy="32" r="28" fill="none" stroke="#6366F1" strokeWidth="4"
                    strokeDasharray={2 * Math.PI * 28}
                    initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                    animate={{ strokeDashoffset: (2 * Math.PI * 28) * (1 - (agent.exp || 0) / 100) }}
                    transition={{ duration: 1.5 }}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-2 rounded-full overflow-hidden bg-white border-2 border-white shadow-sm">
                <img 
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=f1f5f9" 
                    alt="Agent Avatar" 
                    className="w-full h-full object-cover"
                />
            </div>
        </div>
        <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
                <h4 className="text-[10px] font-black text-brand tracking-[0.2em]">STUDENT</h4>
                
                {/* Educational Persona Tag */}
                {learningData?.persona && (
                    <div className="relative">
                        <motion.div 
                            onMouseEnter={() => setShowPersonaTooltip(true)}
                            onMouseLeave={() => setShowPersonaTooltip(false)}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg border cursor-help transition-all hover:shadow-md"
                            style={{ 
                                backgroundColor: `${learningData.persona.color}10`, 
                                borderColor: `${learningData.persona.color}20` 
                            }}
                        >
                            <div 
                                className="w-1.5 h-1.5 rounded-full" 
                                style={{ 
                                    backgroundColor: learningData.persona.color,
                                    boxShadow: `0 0 6px ${learningData.persona.color}60`
                                }}
                            />
                            <span 
                                className="text-[9px] font-black uppercase tracking-wider"
                                style={{ color: learningData.persona.color }}
                            >
                                {learningData.persona.name}
                            </span>
                        </motion.div>

                        <AnimatePresence>
                            {showPersonaTooltip && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                    className="absolute bottom-full right-0 mb-3 w-56 p-3 rounded-xl bg-white border border-slate-200 shadow-2xl z-[100] text-left"
                                >
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div 
                                            className="w-1 h-3 rounded-full" 
                                            style={{ backgroundColor: learningData.persona.color }} 
                                        />
                                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                            {learningData.persona.name}
                                        </h4>
                                    </div>
                                    <p className="text-[10px] font-medium text-slate-600 leading-relaxed">
                                        {learningData.persona.description}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-3">
                <motion.div 
                    animate={{ scale: [1, 1.05, 1], filter: ["drop-shadow(0 0 0px rgba(99,102,241,0))", "drop-shadow(0 0 8px rgba(99,102,241,0.5))", "drop-shadow(0 0 0px rgba(99,102,241,0))"] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-lg bg-brand text-white px-3 py-1 rounded-xl font-black shadow-lg shadow-brand/20 border border-brand/20"
                >
                    LVL {agent.level}
                </motion.div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-[14px] text-slate-900 font-black tracking-tight">{agent.totalReward} pts</span>
                        {(learningData.xp_earned ?? 0) > 0 && (
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                                +{learningData.xp_earned}
                            </span>
                        )}
                    </div>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">STUDY POINTS</span>
                </div>
            </div>
        </div>
      </div>
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {/* Control Actions */}
        <div className="p-6 space-y-3 bg-gray-50/50 border-b border-gray-100">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Actions</label>
          <button
            onClick={() => setShowSummaryModal(true)}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
          >
            <BookOpen className="w-4 h-4" />
            Summarize Learning
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleShowPolyline}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm rounded-xl font-medium transition-all"
            >
              <Activity className="w-4 h-4 text-blue-500" />
              Current Polyline
            </button>

            <button
              onClick={() => setShowPolylineListModal(true)}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm rounded-xl font-medium transition-all"
            >
              <Map className="w-4 h-4 text-purple-500" />
              History
            </button>

            <button
              onClick={onPlayPath}
              disabled={learningPath.length < 2 || isLoading}
              className="col-span-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 text-sm rounded-xl font-medium transition-all"
            >
              <PlayCircle className="w-4 h-4 text-green-500" />
              Play Path Animation
            </button>
          </div>

          <button
            onClick={onToggleSimulation}
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 border text-sm rounded-xl font-medium transition-all ${isSimulationRunning
              ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
              : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'
              }`}
          >
            <PlayCircle className="w-4 h-4" />
            {isSimulationRunning ? 'Stop DQN Simulation' : 'Start DQN Simulation'}
          </button>

          <div className="pt-2 border-t border-gray-200/60">
            <button
              onClick={onRestartJourney}
              disabled={isLoading || learningData.visitedResources < (learningData.totalResources || 19)}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm rounded-xl font-medium transition-all shadow-sm ${
                learningData.visitedResources >= (learningData.totalResources || 19)
                  ? "bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 shadow-rose-100 hover:shadow-md"
                  : "bg-gray-50 border border-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              title={learningData.visitedResources < (learningData.totalResources || 19) ? `Visit all ${learningData.totalResources || 19} resources to unlock reset` : "Restart your intelligence journey"}
            >
              <TrendingUp size={16} className={learningData.visitedResources < (learningData.totalResources || 19) ? "opacity-30" : "animate-bounce"} />
              <span className="uppercase tracking-[0.2em] text-[9px] font-black underline-offset-4">Restart Journey</span>
            </button>
            {learningData.visitedResources < (learningData.totalResources || 19) && (
              <p className="text-[8px] text-center text-gray-400 mt-2 font-bold uppercase tracking-widest">
                Locked: {learningData.visitedResources}/{learningData.totalResources || 19} Modules Visited
              </p>
            )}
          </div>
        </div>

        {/* Learning Stats / Insights */}
        {(learningData.strengths.length > 0 || learningData.recommendations.length > 0 || learningData.ai_analysis) && (
          <div className="px-6 py-4 bg-white border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Insights</h3>

            {learningData.ai_analysis && (
              <div className="mb-4 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <div className="flex items-center gap-2 mb-1.5 text-indigo-600">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">AI feedback</span>
                </div>
                <p className="text-xs text-indigo-900 leading-relaxed font-medium italic">
                  "{learningData.ai_analysis}"
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-4 mb-3">
              {learningData.strengths.length > 0 && (
                <div className="flex-1 min-w-[120px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Strengths</span>
                  <div className="flex flex-wrap gap-1">
                    {learningData.strengths.slice(0, 2).map((strength, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-green-50 text-green-700 text-[9px] font-bold rounded border border-green-100">
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bookmarks Section */}
        <div className="px-6 py-4 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-blue-600 fill-blue-600" />
              Bookmarks
            </h3>
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">{bookmarks.length}</span>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {bookmarks.length > 0 ? (
              bookmarks.map(id => {
                const resource = resources.find(r => r.id === id);
                if (!resource) return null;
                return (
                  <div 
                    key={id} 
                    className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group shadow-sm bg-white"
                  >
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => onResourceClick(resource)}
                    >
                      <h4 className="text-xs font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                        {resource.title}
                      </h4>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black">
                        {resource.module || 'Resource'}
                      </p>
                    </div>
                    <button 
                      onClick={() => toggleBookmark(id)}
                      className="text-blue-600 hover:text-blue-700 p-1.5 rounded-lg hover:bg-white transition-all ml-2"
                      title="Remove Bookmark"
                    >
                      <Bookmark className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-[10px] text-gray-400 text-center py-4 italic font-medium">No bookmarks saved yet.</p>
            )}
          </div>
        </div>

        {/* Learning Timeline */}
        <div className="p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">Activity Log</h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{learningPath.length} items</span>
          </div>

          <div className="space-y-0">
            <div className="relative pl-4 border-l-2 border-gray-100 space-y-6 py-2">
              {learningData.activityLog && learningData.activityLog.length > 0 ? (
                learningData.activityLog.slice(0, 15).map((log) => (
                  <div key={log.id} className="relative group">
                    <div className={`absolute -left-[21px] top-1.5 w-4 h-4 bg-white border-2 rounded-full group-hover:scale-110 transition-transform duration-200 flex items-center justify-center p-0.5
                      ${log.type === 'visit' ? 'border-green-500 text-green-500' : 
                        log.type === 'summary' ? 'border-purple-500 text-purple-500' : 
                        log.type === 'optimal' ? 'border-amber-500 text-amber-500' : 
                        log.type === 'search' ? 'border-blue-500 text-blue-500' : 'border-blue-400 text-blue-400'}`}>
                      {log.type === 'visit' && <CheckCircle className="w-full h-full" />}
                      {log.type === 'summary' && <Sparkles className="w-full h-full" />}
                      {log.type === 'optimal' && <TrendingUp className="w-full h-full" />}
                      {log.type === 'search' && <Search className="w-full h-full" />}
                      {log.type === 'start' && <PlayCircle className="w-full h-full" />}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{log.timestamp}</span>
                        {log.type === 'optimal' && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">AI Optimized</span>}
                      </div>
                      <span className="text-sm font-semibold text-gray-800 leading-tight group-hover:text-blue-600 transition-colors">
                        {log.title}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="relative">
                  <div className="absolute -left-[21px] top-1.5 w-3 h-3 bg-gray-200 rounded-full"></div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400">Environment Ready</span>
                    <span className="text-sm text-gray-500">Initialized learning grid</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Summarize Learning</h3>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Introduction to Transformers"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex justify-between items-center">
                  Key Takeaways
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase transition-all duration-300 ${isListening ? 'text-blue-500 opacity-100' : 'text-slate-400 opacity-0'}`}>
                      {isListening ? 'Listening...' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`p-1.5 rounded-lg transition-all duration-300 ${
                        isListening 
                          ? 'bg-blue-100 text-blue-600 ring-4 ring-blue-50 scale-110 active:scale-95' 
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-95'
                      }`}
                      title={isListening ? "Stop Voice Input" : "Start Voice Input"}
                    >
                      {isListening ? (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          <MicOff className="w-4 h-4" />
                        </motion.div>
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Describe what you learned..."
                  className={`w-full h-32 px-4 py-3 bg-gray-50 border rounded-xl resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 ${
                    isListening ? 'border-blue-400 ring-2 ring-blue-500/10' : 'border-gray-200'
                  }`}
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200/50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSummarySubmit}
                disabled={!title.trim() || !summary.trim() || isLoading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-sm shadow-blue-200 transition-all transform active:scale-95"
              >
                {isLoading ? 'Processing...' : 'Save Summary'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Polyline Chart Modal */}
      {showPolylineModal && selectedPolyline && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Learning Analysis</h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-1">
                  <p className="text-sm text-gray-500">Polyline visualization of your learning path</p>
                  <div className="flex items-center gap-3 text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
                    <span className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-blue-600"></div> Current Score</span>
                    <span className="flex items-center gap-1.5"><div className="w-3 h-0.5 border-t-2 border-dashed border-red-500"></div> Highline Target</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowPolylineModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Keywords Detected */}
              {selectedPolyline.keywords_found && selectedPolyline.keywords_found.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Detected Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPolyline.keywords_found.map((keyword: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-100">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Analysis Section */}
              {(selectedPolyline.ai_analysis || (selectedPolyline.dominant_topics && selectedPolyline.dominant_topics.length > 0)) && (
                <div className="mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-white rounded-lg shadow-sm text-indigo-600 shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1">AI Path Analysis</h4>
                      {selectedPolyline.ai_analysis && (
                        <p className="text-sm text-gray-700 leading-relaxed max-w-2xl mb-3">
                          {selectedPolyline.ai_analysis}
                        </p>
                      )}

                      {selectedPolyline.dominant_topics && selectedPolyline.dominant_topics.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Key Focus:</span>
                          {selectedPolyline.dominant_topics.map((topic: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-white/60 text-indigo-700 text-xs font-semibold rounded border border-indigo-100 shadow-sm">
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Chart Container */}
              <div className="bg-gray-50/50 border border-gray-200 rounded-2xl p-6 mb-6">
                <div className="relative h-80 w-full">
                  <svg width="100%" height="100%" viewBox="0 0 600 300" className="overflow-visible">
                    {/* Grid lines */}
                    <defs>
                      <pattern id="grid" width="33.33" height="50" patternUnits="userSpaceOnUse">
                        <path d="M 33.33 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,3" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" opacity="0.6" />

                    {/* Y-axis labels */}
                    <g className="text-[10px] fill-gray-400">
                      <text x="-10" y="30" textAnchor="end">1.0</text>
                      <text x="-10" y="155" textAnchor="end">0.5</text>
                      <text x="-10" y="280" textAnchor="end">0.0</text>
                    </g>

                    {/* X-axis labels */}
                    {Array.from({ length: 18 }, (_, i) => i + 1).map(i => (
                      <text key={i} x={33.33 * i - 16} y="315" fontSize="10" fill="#9ca3af" textAnchor="middle">{i}</text>
                    ))}

                    {/* Chart area */}
                    <path
                      d={`M 0 300 ${generateChartData(selectedPolyline).map((point, i) =>
                        `L ${33.33 * (i + 1)} ${280 - point.y * 250}`
                      ).join(' ')} L 600 300 Z`}
                      fill="url(#gradient)"
                      opacity="0.1"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    <polyline
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={generateChartData(selectedPolyline).map((point, i) =>
                        `${33.33 * (i + 1)},${280 - point.y * 250}`
                      ).join(' ')}
                      className="drop-shadow-sm"
                    />

                    {/* High Line Overlay */}
                    <polyline
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="4 4"
                      points={highLineChartData.map((point, i) =>
                        `${33.33 * (i + 1)},${280 - point.y * 250}`
                      ).join(' ')}
                      className="opacity-70"
                    />

                    {/* Data points */}
                    {generateChartData(selectedPolyline).map((point, i) => (
                      <circle
                        key={i}
                        cx={33.33 * (i + 1)}
                        cy={280 - point.y * 250}
                        r="4"
                        className="fill-white stroke-blue-600 stroke-2 hover:r-6 hover:stroke-4 transition-all cursor-pointer"
                      />
                    ))}

                    {/* High Line Data points */}
                    {highLineChartData.map((point, i) => (
                      <circle
                        key={`hl-${i}`}
                        cx={33.33 * (i + 1)}
                        cy={280 - point.y * 250}
                        r="3"
                        className="fill-white stroke-red-500 stroke-2 opacity-80"
                      />
                    ))}
                  </svg>

                  {/* Axis titles */}
                  <div className="absolute -left-12 top-1/2 transform -rotate-90 -translate-y-1/2 text-xs font-semibold text-gray-400 tracking-wider">
                    ASSIMILATION SCORE
                  </div>
                  <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-400 tracking-wider">
                    TOPIC INDEX
                  </div>
                </div>
              </div>

              {/* Topic Legend */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {topicLegendItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 bg-gray-100 rounded text-[10px] font-bold text-gray-600">
                      {index + 1}
                    </span>
                    <span className="text-xs text-gray-600 leading-tight" title={item}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Polylines List Modal — Journey History (Revamped Timeline) */}
      {showPolylineListModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Journey History</h3>
                <p className="text-sm text-gray-400 mt-0.5">Your learning assimilation over time</p>
              </div>
              <button
                onClick={() => setShowPolylineListModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Timeline Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {(() => {
                const filteredPolylines = polylines.filter(p => !['learning-path-1', 'dqn-simulation', 'high_line', 'current_average'].includes(p.id));

                if (filteredPolylines.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center mb-4">
                        <BookOpen className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">No history yet</p>
                      <p className="text-sm text-gray-400 mt-1">Submit a learning summary to start tracking your journey.</p>
                    </div>
                  );
                }

                return (
                  <div className="relative">
                    {/* Vertical spine */}
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-gray-100" />

                    <div className="space-y-8">
                      {filteredPolylines.map((polyline, index) => {
                        const chartData = generateChartData(polyline);
                        const peakScore = chartData.length ? Math.max(...chartData.map(d => d.y)) : 0;

                        return (
                          <div key={polyline.id} className="relative flex gap-5 group">
                            {/* Numbered bubble */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm z-10
                            bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-2 border-white">
                              {index + 1}
                            </div>

                            {/* Card */}
                            <div className="flex-1 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">

                              {/* Card top bar */}
                              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-2 min-w-0">
                                  <h4 className="font-semibold text-gray-900 text-sm truncate max-w-[200px]">
                                    {polyline.name || `Summary #${index + 1}`}
                                  </h4>
                                  {polyline.next_recommendation && (
                                    <span className={`flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider
                                    ${polyline.next_recommendation.reason === 'dqn'
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'bg-amber-100 text-amber-700'
                                      }`}>
                                      {polyline.next_recommendation.reason === 'dqn' ? '🧠 DQN' : '⚡ Fallback'}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {polyline.assimilation_position && (
                                    <span className="text-[10px] font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg border border-blue-100">
                                      📍 ({polyline.assimilation_position.x}, {polyline.assimilation_position.y})
                                    </span>
                                  )}
                                  {polyline.confidence && (
                                    <span className="text-[10px] text-gray-400 font-medium">
                                      {(polyline.confidence * 100).toFixed(0)}%
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="p-4 space-y-3">
                                {/* Keywords */}
                                {polyline.keywords_found && polyline.keywords_found.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {polyline.keywords_found.slice(0, 5).map((kw, i) => (
                                      <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-medium rounded-full border border-blue-100">
                                        {kw}
                                      </span>
                                    ))}
                                    {polyline.keywords_found.length > 5 && (
                                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full">
                                        +{polyline.keywords_found.length - 5}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Dominant topics */}
                                {polyline.dominant_topics && polyline.dominant_topics.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {polyline.dominant_topics.map((topic, i) => (
                                      <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-semibold rounded-full border border-purple-100">
                                        ★ {topic}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Next recommendation from navigator */}
                                {polyline.next_recommendation && (
                                  <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block leading-none mb-0.5">Next Recommended</span>
                                      <span className="text-xs font-medium text-indigo-800 truncate block">{polyline.next_recommendation.title}</span>
                                    </div>
                                    {polyline.next_recommendation.module && (
                                      <span className="flex-shrink-0 ml-auto text-[9px] text-indigo-400 font-medium max-w-[80px] text-right truncate">
                                        {polyline.next_recommendation.module}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Mini sparkline + peak */}
                                <div className="flex items-end gap-3">
                                  <div className="flex-1 bg-gray-50 rounded-xl p-2 border border-gray-100">
                                    <svg width="100%" height="50" viewBox="0 0 280 50" preserveAspectRatio="none">
                                      <defs>
                                        <linearGradient id={`sg-${polyline.id}`} x1="0" x2="0" y1="0" y2="1">
                                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                        </linearGradient>
                                      </defs>
                                      <path
                                        d={`M 0 50 ${chartData.map((p, i) => `L ${(280 / 18) * (i + 1)} ${46 - p.y * 40}`).join(' ')} L 280 50 Z`}
                                        fill={`url(#sg-${polyline.id})`}
                                      />
                                      <polyline
                                        fill="none"
                                        stroke={index === polylines.length - 1 ? '#6366f1' : '#94a3b8'}
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        points={chartData.map((p, i) =>
                                          `${(280 / 18) * (i + 1)},${46 - p.y * 40}`
                                        ).join(' ')}
                                      />
                                      <polyline
                                        fill="none"
                                        stroke="#ef4444"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeDasharray="2 3"
                                        points={highLineChartData.map((p, i) =>
                                          `${(280 / 18) * (i + 1)},${46 - p.y * 40}`
                                        ).join(' ')}
                                        className="opacity-70"
                                      />
                                    </svg>
                                  </div>
                                  <div className="text-right flex-shrink-0 w-12">
                                    <span className="text-sm font-bold text-gray-800 block">{(peakScore * 100).toFixed(0)}%</span>
                                    <span className="text-[10px] text-gray-400">peak</span>
                                  </div>
                                </div>

                                {/* View details */}
                                <button
                                  onClick={() => {
                                    onShowPolyline(polyline.id);
                                    setSelectedPolyline(polyline);
                                    setShowPolylineListModal(false);
                                    setShowPolylineModal(true);
                                  }}
                                  className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 py-2 rounded-lg transition-colors border border-blue-100"
                                >
                                  View Full Analysis →
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};