import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LearningSummary, Polyline, Resource } from '../types';
import { nlpApi } from '../services/nlpApi';
import { X, BookOpen, Activity, Map, PlayCircle, HelpCircle, Sparkles, CheckCircle, TrendingUp, Search, Bookmark, Mic, MicOff, Brain, FileText, RefreshCw, Check } from 'lucide-react';

interface ControlPanelProps {
  onSummarizeLearning: (title: string, summary: string) => void;
  onShowPolyline: (polylineId: string) => void;
  onToggleSimulation: () => void;
  onPlayPath: () => void;
  learningData: LearningSummary;
  polylines: Polyline[];
  isSimulationRunning: boolean;
  isLoading: boolean;
  learningPath: any[];
  bookmarks: string[];
  toggleBookmark: (id: string) => void;
  resources: Resource[];
  onResourceClick: (resource: Resource) => void;
  onStartTutorial: () => void;
  agent: any;
  onRestartJourney: () => Promise<any>;
  nextRecommendation?: Polyline['next_recommendation'];
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
  onRestartJourney,
  nextRecommendation
}) => {
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showPolylineModal, setShowPolylineModal] = useState(false);
  const [showPolylineListModal, setShowPolylineListModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [agentTab, setAgentTab] = useState<'coach' | 'notes' | 'flashcards' | 'quiz'>('notes');
  const [agentModule, setAgentModule] = useState<string>('Pre training objectives');
  const [agentLoading, setAgentLoading] = useState(false);
  const [orchestratedData, setOrchestratedData] = useState<Awaited<ReturnType<typeof nlpApi.orchestrateStudyAgents>> | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [noteSaved, setNoteSaved] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [selectedPolyline, setSelectedPolyline] = useState<Polyline | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showPersonaTooltip, setShowPersonaTooltip] = useState(false);
  const recognitionRef = useRef<any>(null);

  const runOrchestrator = async (targetModule: string) => {
    setAgentLoading(true);
    setNoteSaved(false);
    setSelectedAnswers({});
    setFlippedCards({});
    try {
      const visitedMods = resources.filter(r => r.visited).map(r => r.module);
      const res = await nlpApi.orchestrateStudyAgents(
        targetModule,
        visitedMods,
        learningData.currentLevel || 1
      );
      setOrchestratedData(res);
      if (res.orchestrator?.primaryAgent) {
        setAgentTab(res.orchestrator.primaryAgent);
      }
    } catch (err) {
      console.error('Failed to run Multi-Agent Orchestrator:', err);
    } finally {
      setAgentLoading(false);
    }
  };

  const handleOpenStudyAgent = () => {
    const defaultMod = nextRecommendation?.module || nextRecommendation?.title || resources.find(r => !r.visited)?.module || 'Pre training objectives';
    setAgentModule(defaultMod);
    setShowAgentModal(true);
    runOrchestrator(defaultMod);
  };

  const handleSaveStudyNoteToHub = async () => {
    const notesOut = orchestratedData?.outputs?.notes;
    if (!notesOut) return;
    try {
      await nlpApi.addNote('default', {
        section: 'nlp',
        title: notesOut.title,
        content: notesOut.formattedNote
      });
      setNoteSaved(true);
    } catch (err) {
      console.error('Failed to save note to Knowledge Hub:', err);
    }
  };

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
    return Array.from({ length: 19 }, (_, i) => ({
      x: i + 1,
      y: 0
    }));
  };

  // 19 topics matching backend ORDERED_MODULES
  const topicLegendItems = [
    "Pre training objectives", "Pre trained models", "Tutorial: Introduction to huggingface",
    "Fine tuning LLM", "Instruction tuning", "Prompt based learning",
    "Parameter efficient fine tuning", "Incontext Learning", "Prompting methods",
    "Multiprompt Learning", "Prompt aware training methods",
    "Retrieval Methods", "Retrieval Augmented Generation",
    "Model Distillation", "Model Quantization", "Model Pruning",
    "Mixture of Experts Model", "Agentic AI", "Multimodal LLMs"
  ];

  // Chart X-axis step: 600px / 19 topics
  const xStep = 600 / 19;

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
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand hover:bg-brand-dark disabled:bg-gray-400 text-white text-sm rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
          >
            <BookOpen className="w-4 h-4" />
            Summarize Learning
          </button>

          <button
            onClick={handleOpenStudyAgent}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 hover:border-brand/40 text-gray-700 text-sm rounded-xl font-medium transition-all shadow-xs"
          >
            <Brain className="w-4 h-4 text-brand" />
            AI Study Agent (Quiz & Notes)
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
        {(nextRecommendation || learningData.strengths.length > 0 || learningData.recommendations.length > 0 || learningData.ai_analysis) && (
          <div className="px-6 py-4 bg-white border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Insights</h3>

            {nextRecommendation && (
              <div className="mb-4 p-4 bg-blue-50/40 border border-blue-100 rounded-xl shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 text-brand">
                    <Sparkles className="w-3.5 h-3.5 text-brand fill-brand" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Next Recommended Lesson</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    nextRecommendation.reason === 'dqn'
                      ? 'bg-blue-100 text-brand'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {nextRecommendation.reason === 'dqn' ? '🧠 RL / DQN' : '⚡ Next Step'}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-900 leading-snug mb-1">
                  {nextRecommendation.title}
                </p>
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium mb-3">
                  <span className="truncate">{nextRecommendation.module}</span>
                  {nextRecommendation.position && (
                    <span className="font-mono bg-white text-brand px-2 py-0.5 rounded border border-blue-100 shrink-0 ml-2">
                      📍 ({Math.round(nextRecommendation.position.x)}, {Math.round(nextRecommendation.position.y)})
                    </span>
                  )}
                </div>
                {(() => {
                  const recResource = resources.find(r => r.id === nextRecommendation.id || r.title === nextRecommendation.title);
                  return recResource ? (
                    <button
                      onClick={() => onResourceClick(recResource)}
                      className="w-full py-2 px-3 bg-brand hover:bg-brand-dark text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      Open Recommended Lesson
                    </button>
                  ) : null;
                })()}
              </div>
            )}

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

              {learningData.recommendations.length > 0 && (
                <div className="flex-1 min-w-[120px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Recommended Queue</span>
                  <div className="flex flex-wrap gap-1">
                    {learningData.recommendations.slice(0, 3).map((rec, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold rounded border border-amber-200">
                        {rec}
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
                className="px-6 py-2 bg-brand hover:bg-brand-dark disabled:bg-brand-light disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-sm shadow-brand/20 transition-all transform active:scale-95"
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
                    <span className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-brand"></div> Current Score</span>
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
                    {Array.from({ length: 19 }, (_, i) => i + 1).map(i => (
                      <text key={i} x={xStep * i - xStep / 2} y="315" fontSize="10" fill="#9ca3af" textAnchor="middle">{i}</text>
                    ))}

                    {/* Chart area */}
                    <path
                      d={`M 0 300 ${generateChartData(selectedPolyline).map((point, i) =>
                        `L ${xStep * (i + 1)} ${280 - point.y * 250}`
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
                        `${xStep * (i + 1)},${280 - point.y * 250}`
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
                        `${xStep * (i + 1)},${280 - point.y * 250}`
                      ).join(' ')}
                      className="opacity-70"
                    />

                    {/* Data points */}
                    {generateChartData(selectedPolyline).map((point, i) => (
                      <circle
                        key={i}
                        cx={xStep * (i + 1)}
                        cy={280 - point.y * 250}
                        r="4"
                        className="fill-white stroke-blue-600 stroke-2 hover:r-6 hover:stroke-4 transition-all cursor-pointer"
                      />
                    ))}

                    {/* High Line Data points */}
                    {highLineChartData.map((point, i) => (
                      <circle
                        key={`hl-${i}`}
                        cx={xStep * (i + 1)}
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
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      // Delegate reset to parent so it refreshes state correctly
                      await onRestartJourney();
                      setShowPolylineListModal(false);
                    } catch (e) {
                      console.error('Failed to clear history', e);
                      alert('Failed to clear history');
                    }
                  }}
                  className="px-3 py-1 text-xs text-red-600 bg-red-50 border border-red-100 rounded-md hover:bg-red-100"
                >
                  Clear History
                </button>

                <button
                  onClick={() => setShowPolylineListModal(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Timeline Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {(() => {
                const filteredPolylines = polylines.filter(p => !['high_line', 'current_average', 'dqn-simulation', 'learning-path-1'].includes(p.id));

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
                                        d={`M 0 50 ${chartData.map((p, i) => `L ${(280 / 19) * (i + 1)} ${46 - p.y * 40}`).join(' ')} L 280 50 Z`}
                                        fill={`url(#sg-${polyline.id})`}
                                      />
                                      <polyline
                                        fill="none"
                                        stroke={index === polylines.length - 1 ? '#6366f1' : '#94a3b8'}
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        points={chartData.map((p, i) =>
                                          `${(280 / 19) * (i + 1)},${46 - p.y * 40}`
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
                                          `${(280 / 19) * (i + 1)},${46 - p.y * 40}`
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

      {/* Hierarchical Multi-Agent Study Modal (Main Orchestrator + 4 Specialized Subagents) */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand/10 rounded-xl text-brand">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">Multi-Agent Learning Orchestrator</h3>
                    {orchestratedData?.orchestrator?.source && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-brand border border-blue-100">
                        {orchestratedData.orchestrator.source.includes('groq')
                          ? `⚡ ${orchestratedData.orchestrator.source.replace('groq-', 'Groq • ')}`
                          : 'Local Multi-Agent'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Hierarchical Orchestrator dynamically allocates tasks to specialized subagents for the active lesson
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAgentModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lesson Selector Bar */}
            <div className="px-6 py-3 bg-gray-50/70 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0">Active Lesson:</span>
                <select
                  value={agentModule}
                  onChange={(e) => {
                    const mod = e.target.value;
                    setAgentModule(mod);
                    runOrchestrator(mod);
                  }}
                  className="flex-1 min-w-0 text-xs font-medium text-gray-800 bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                >
                  {(resources.length > 0 ? resources.map(r => r.module) : topicLegendItems).map((mod, idx) => (
                    <option key={idx} value={mod}>{mod}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => runOrchestrator(agentModule)}
                disabled={agentLoading}
                className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-brand ${agentLoading ? 'animate-spin' : ''}`} />
                Re-Orchestrate
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {agentLoading ? (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <RefreshCw className="w-8 h-8 text-brand animate-spin mb-3" />
                  <p className="text-sm font-bold text-gray-800">Main Orchestrator is analyzing "{agentModule}"...</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Selecting optimal primary subagent and dispatching Coach, Smart Notes, Flashcard, and Quiz subagents
                  </p>
                </div>
              ) : orchestratedData ? (
                <>
                  {/* Main Orchestrator Decision & Task Allocation Card */}
                  <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/80 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          Main Orchestrator Decision
                        </span>
                        <span className="text-[11px] font-semibold text-gray-600">
                          {orchestratedData.orchestrator.lessonProfile.nature} • Difficulty {orchestratedData.orchestrator.lessonProfile.difficulty}/7
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        orchestratedData.orchestrator.lessonProfile.isVisited
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {orchestratedData.orchestrator.lessonProfile.isVisited ? '✓ Visited Lesson' : 'New / Active Lesson'}
                      </span>
                    </div>

                    <p className="text-xs text-gray-700 leading-relaxed">
                      {orchestratedData.orchestrator.reasoning}
                    </p>

                    {/* Subagent Hierarchy Selector Tabs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {([
                        { id: 'coach', label: 'Concept Coach', icon: TrendingUp },
                        { id: 'notes', label: 'Smart Notes', icon: FileText },
                        { id: 'flashcards', label: 'Flashcards', icon: BookOpen },
                        { id: 'quiz', label: 'Concept Quiz', icon: Sparkles },
                      ] as const).map(tab => {
                        const isPrimary = orchestratedData.orchestrator.primaryAgent === tab.id;
                        const isActive = agentTab === tab.id;
                        const IconComp = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setAgentTab(tab.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 ${
                              isActive
                                ? 'bg-white border-brand ring-2 ring-brand/15 shadow-xs'
                                : 'bg-white/70 border-gray-200 hover:border-gray-300 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 w-full">
                              <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-brand' : 'text-gray-400'}`} />
                              {isPrimary && (
                                <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand text-white">
                                  Primary
                                </span>
                              )}
                            </div>
                            <span className={`text-xs font-bold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                              {tab.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Subagent Directive Header */}
                  {(() => {
                    const activeSubInfo = orchestratedData.orchestrator.subagents.find(s => s.id === agentTab);
                    return activeSubInfo ? (
                      <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-blue-50/40 border border-blue-100 text-xs">
                        <div className="min-w-0">
                          <span className="font-bold text-brand mr-1.5">{activeSubInfo.name} Directive:</span>
                          <span className="text-gray-600">{activeSubInfo.directive}</span>
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* SUBAGENT 1: CONCEPT COACH */}
                  {agentTab === 'coach' && orchestratedData.outputs.coach && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand block mb-1">Core Mental Model & Intuition</span>
                        <p className="text-xs text-gray-800 leading-relaxed font-medium">
                          {orchestratedData.outputs.coach.intuition}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Prerequisite Bridge</span>
                          <p className="text-xs text-gray-700 leading-relaxed">
                            {orchestratedData.outputs.coach.prerequisiteBridge}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Practical Analogy / Example</span>
                          <p className="text-xs text-gray-700 leading-relaxed">
                            {orchestratedData.outputs.coach.realWorldAnalogy}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Step-by-Step Conceptual Breakdown</h4>
                        <div className="space-y-2">
                          {orchestratedData.outputs.coach.stepByStepBreakdown.map((step, i) => (
                            <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-gray-200 text-xs text-gray-700 leading-relaxed">
                              <span className="w-5 h-5 rounded-full bg-brand/10 text-brand font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUBAGENT 2: SMART NOTES */}
                  {agentTab === 'notes' && orchestratedData.outputs.notes && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-100">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand">Executive Overview</span>
                          <button
                            onClick={handleSaveStudyNoteToHub}
                            disabled={noteSaved}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                              noteSaved
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-brand hover:bg-brand-dark text-white shadow-xs'
                            }`}
                          >
                            {noteSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                            {noteSaved ? 'Saved to Knowledge Hub' : 'Save to Study Notes'}
                          </button>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed font-medium">{orchestratedData.outputs.notes.overview}</p>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2.5">Key Lecture Takeaways</h4>
                        <div className="space-y-2">
                          {orchestratedData.outputs.notes.takeaways.map((item, i) => (
                            <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-700 leading-relaxed">
                              <span className="w-5 h-5 rounded-full bg-brand/10 text-brand font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {orchestratedData.outputs.notes.examTip && (
                        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                          <span className="font-bold uppercase text-[10px] block mb-0.5">💡 Key Mastery Focus</span>
                          {orchestratedData.outputs.notes.examTip}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUBAGENT 3: FLASHCARDS */}
                  {agentTab === 'flashcards' && orchestratedData.outputs.flashcards && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Active-Recall Flashcards (Click any card to flip)
                        </h4>
                        <span className="text-[11px] text-gray-400 font-medium">
                          {orchestratedData.outputs.flashcards.flashcards.length} cards generated
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {orchestratedData.outputs.flashcards.flashcards.map((fc, i) => {
                          const isFlipped = Boolean(flippedCards[i]);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setFlippedCards(prev => ({ ...prev, [i]: !prev[i] }))}
                              className={`text-left p-4 rounded-xl border transition-all min-h-[115px] flex flex-col justify-between ${
                                isFlipped
                                  ? 'bg-blue-50/40 border-brand/50 shadow-xs'
                                  : 'bg-white border-gray-200 hover:border-brand/40 shadow-xs'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1.5 w-full">
                                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                  {fc.tag || 'Concept'}
                                </span>
                                <span className="text-[10px] font-semibold text-brand">
                                  {isFlipped ? 'Answer (Flip)' : 'Prompt (Flip)'}
                                </span>
                              </div>
                              {isFlipped ? (
                                <p className="text-xs text-gray-700 leading-relaxed font-medium">{fc.back}</p>
                              ) : (
                                <p className="text-xs font-bold text-gray-900 leading-snug">{fc.front}</p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SUBAGENT 4: ADAPTIVE QUIZ */}
                  {agentTab === 'quiz' && orchestratedData.outputs.quiz && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-blue-50/50 border border-blue-100 px-4 py-3 rounded-xl">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand block">Diagnostic Concept Assessment</span>
                          <h4 className="text-sm font-bold text-gray-900">{orchestratedData.outputs.quiz.title}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-brand bg-white px-3 py-1 rounded-lg border border-blue-100 shadow-xs">
                            Score: {orchestratedData.outputs.quiz.questions.filter(q => selectedAnswers[q.id] === q.correctIndex).length} / {orchestratedData.outputs.quiz.questions.length}
                          </span>
                        </div>
                      </div>

                      {orchestratedData.outputs.quiz.questions.map((q, qIdx) => {
                        const picked = selectedAnswers[q.id];
                        const isAnswered = picked !== undefined;
                        return (
                          <div key={q.id} className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs space-y-3">
                            <p className="text-sm font-bold text-gray-900 leading-snug">
                              <span className="text-brand mr-1.5">Q{qIdx + 1}.</span>
                              {q.question}
                            </p>
                            <div className="space-y-2">
                              {q.options.map((opt, optIdx) => {
                                const isThisPicked = picked === optIdx;
                                const isThisCorrect = q.correctIndex === optIdx;
                                let btnStyle = 'border-gray-200 hover:border-brand/40 hover:bg-gray-50 text-gray-700';
                                if (isAnswered) {
                                  if (isThisCorrect) {
                                    btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                                  } else if (isThisPicked) {
                                    btnStyle = 'border-rose-300 bg-rose-50 text-rose-800';
                                  } else {
                                    btnStyle = 'border-gray-100 bg-gray-50/50 text-gray-400';
                                  }
                                }
                                return (
                                  <button
                                    key={optIdx}
                                    onClick={() => setSelectedAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                                    className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs leading-relaxed transition-all flex items-start gap-2.5 ${btnStyle}`}
                                  >
                                    <span className="font-bold text-[10px] uppercase w-4 h-4 rounded border border-gray-300 flex items-center justify-center shrink-0 mt-0.5">
                                      {String.fromCharCode(65 + optIdx)}
                                    </span>
                                    <span className="flex-1">{opt}</span>
                                  </button>
                                );
                              })}
                            </div>
                            {isAnswered && (
                              <div className={`p-3 rounded-xl text-xs leading-relaxed border ${
                                picked === q.correctIndex
                                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                                  : 'bg-amber-50 border border-amber-200 text-amber-900'
                              }`}>
                                <span className="font-bold uppercase text-[10px] block mb-0.5">
                                  {picked === q.correctIndex ? '✓ Correct' : '💡 Concept Explanation'}
                                </span>
                                {q.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};