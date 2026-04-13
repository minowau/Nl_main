import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, BookOpen, Clock, ChevronRight, Map, Cpu, Zap, Library, Layers, Trophy, Sparkles, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/Layout/DashboardLayout';
import { nlpApi } from '../../services/nlpApi';
import { Resource } from '../../types';
import { useAppContext } from '../../context/AppContext';

export const NavigatorDashboard: React.FC = () => {
  const { agent, learningData } = useAppContext();
  const navigate = useNavigate();
  const [fundamentalsResources, setFundamentalsResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPersonaTooltip, setShowPersonaTooltip] = useState(false);

  // Load the resources mapping to show videos in the Advances in NLP enrolled course
  useEffect(() => {
    const loadResources = async () => {
      try {
        const resourceData = await nlpApi.getResources();
        // Get the first 4 resources (Fundamentals)
        setFundamentalsResources(resourceData.slice(0, 4));
      } catch (error) {
        console.error('Failed to load resources for Dashboard previews:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadResources();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  const availableCourses = [
    { title: "Computer Vision Paradigms", icon: <Cpu />, status: "Upcoming", tags: ["CNNs", "Transformers"] },
    { title: "Generative Adversarial Nets", icon: <Layers />, status: "Upcoming", tags: ["GANs", "Diffusion"] },
    { title: "Deep Reinforcement Learning", icon: <Zap />, status: "Upcoming", tags: ["PPO", "DQN", "SAC"] },
    { title: "AI Agent Engineering", icon: <Library />, status: "Upcoming", tags: ["LLMOps", "Memory"] }
  ];

  return (
    <DashboardLayout>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12"
      >
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase mb-2">Navigator <span className="text-brand">Hub</span></h1>
          <p className="text-slate-500 font-medium">Select a dynamic map to enter the neural matrix or browse upcoming expansions.</p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
            <BookOpen className="text-brand" size={24} />
            <h2 className="text-xl font-bold text-slate-800">Enrolled Courses</h2>
          </div>

          <motion.div variants={itemVariants} className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-brand/10 transition-all duration-300">
            <div className="flex flex-col lg:flex-row justify-between gap-8">
              
              <div className="flex-1 space-y-6">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-brand text-white text-[10px] font-bold uppercase tracking-widest rounded-lg border border-brand/20 shadow-sm">Active Map</span>
                    <span className="text-xs font-semibold text-slate-400">19 Modules</span>
                    
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                    
                    {/* Level & Points Tags */}
                    <div className="flex items-center gap-2">
                       <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg shadow-sm">
                          <Trophy size={12} className="text-brand" />
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider">S{agent.level}</span>
                       </div>
                       <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg shadow-sm">
                          <Database size={12} className="text-emerald-500" />
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider">{agent.totalReward} XP</span>
                       </div>
                    </div>

                    <div className="w-px h-4 bg-slate-200 mx-1" />

                    {/* Educational Persona Tag */}
                    {learningData?.persona && (
                      <div className="relative">
                        <motion.div 
                          onMouseEnter={() => setShowPersonaTooltip(true)}
                          onMouseLeave={() => setShowPersonaTooltip(false)}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-2.5 px-3 py-1 bg-white rounded-lg shadow-sm border cursor-help transition-all hover:shadow-md"
                          style={{ 
                            backgroundColor: `${learningData.persona.color}10`, 
                            borderColor: `${learningData.persona.color}30` 
                          }}
                        >
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ 
                              backgroundColor: learningData.persona.color,
                              boxShadow: `0 0 8px ${learningData.persona.color}80`
                            }}
                          />
                          <span 
                            className="text-[10px] font-black uppercase tracking-[0.25em]"
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
                              className="absolute bottom-full left-0 mb-3 w-72 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xl z-[100] text-left"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <div 
                                  className="w-1.5 h-4 rounded-full" 
                                  style={{ backgroundColor: learningData.persona.color }} 
                                />
                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                                  {learningData.persona.name}
                                </h4>
                              </div>
                              <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                                {learningData.persona.description}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Advances in NLP</h3>
                  <p className="text-slate-600 leading-relaxed max-w-xl">
                    Master modern Natural Language Processing paradigms, from pre-trained architectures to Agentic LLMs and RLHF techniques. Traverse the grid dynamically using our DQN planner algorithm.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Included Video Modules</h4>
                  {isLoading ? (
                    <div className="w-full h-24 bg-slate-100 rounded-xl animate-pulse" />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {fundamentalsResources.map((res, idx) => (
                        <div key={idx} className="flex items-start gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors cursor-default group">
                          <div className="relative w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-200 shadow-sm">
                            {res.youtube_url ? (
                                <img 
                                    src={`https://img.youtube.com/vi/${res.youtube_url.split('v=')[1]?.split('&')[0] || res.youtube_url.split('/').pop()}/maxresdefault.jpg`} 
                                    alt={res.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                                    <PlayCircle className="text-slate-400 opacity-50" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <PlayCircle className="text-white drop-shadow-md" size={24} />
                            </div>
                          </div>
                          <div className="min-w-0 pr-2 pt-1">
                            <h5 className="font-bold text-slate-800 text-sm truncate">{res.title}</h5>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{res.module}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:w-72 flex-shrink-0 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
                 <button 
                    onClick={() => navigate('/navigator/course')}
                    className="w-full py-4 bg-brand hover:bg-brand-dark text-white rounded-2xl font-bold transition-all shadow-lg shadow-brand/30 hover:shadow-brand/50 flex flex-col items-center justify-center gap-2 group active:scale-95"
                 >
                    <Map size={24} className="group-hover:-translate-y-1 transition-transform" />
                    <span className="uppercase tracking-widest text-[11px]">Enter Neural Matrix</span>
                 </button>
                 <p className="text-center text-[10px] font-semibold text-slate-400 mt-4 uppercase tracking-widest">Connect to Network</p>
              </div>

            </div>
          </motion.div>
        </div>

        <div className="space-y-6 pt-6">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
            <Clock className="text-slate-400" size={24} />
            <h2 className="text-xl font-bold text-slate-800">Available Courses</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {availableCourses.map((course, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col opacity-60 grayscale hover:grayscale-0"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                  {course.icon}
                </div>
                <div className="flex-1">
                  <span className="inline-block px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-bold uppercase tracking-widest rounded mb-3">
                    {course.status}
                  </span>
                  <h3 className="font-bold text-slate-800 text-lg mb-2 leading-tight">{course.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-4">
                     {course.tags.map(t => <span key={t} className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">{t}</span>)}
                  </div>
                </div>
                <button className="w-full mt-6 py-2.5 border-2 border-slate-100 text-slate-400 font-bold rounded-xl text-sm uppercase tracking-wider cursor-not-allowed">
                  Locked
                </button>
              </motion.div>
            ))}
          </div>
        </div>

      </motion.div>
    </DashboardLayout>
  );
};

export default NavigatorDashboard;
