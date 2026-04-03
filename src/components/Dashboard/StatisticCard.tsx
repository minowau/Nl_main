import React from 'react';
import { motion } from 'framer-motion';
import { Target, Clock, TrendingUp, MoreHorizontal } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export const StatisticCard: React.FC = () => {
  const { agent, resources } = useAppContext();

  // Dynamic Telemetry Calculations
  const tasksCompleted = agent.visitedResources.length;
  const timeSpent = `${(tasksCompleted * 45 / 60).toFixed(1)}h`; // 45 mins per module
  const progressPercent = agent.totalReward % 100;
  const stageFormatted = `STAGE ${(agent.level || 0).toString().padStart(2, '0')}`;
  
  // Find Active Objective (Next Unvisited Module)
  const unvisitedNodes = resources.filter(r => !agent.visitedResources.includes(r.id));
  const currentObjective = unvisitedNodes.length > 0 ? unvisitedNodes[0].title : "Matrix Complete";



  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 w-full flex flex-col gap-8 relative overflow-hidden group"
    >
      {/* Complex Background Accents */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-brand/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 opacity-60" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2 opacity-40" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.015] pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-center relative z-10 px-1">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-brand/10 rounded-2xl blur-lg animate-pulse opacity-40" />
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm relative z-10 p-0.5">
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=f1f5f9" 
                alt="Avatar" 
                className="w-full h-full object-cover rounded-[14px]"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
                <div className="w-1.5 h-1.5 bg-brand rounded-full shadow-[0_0_8px_rgba(108,99,255,0.6)]" />
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Intelligence Hub</h3>
            </div>
            <p className="text-sm font-bold text-slate-900">Analysis: Learner</p>
          </div>
        </div>
        <button className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Analytical Metrics Section */}
      <div className="flex flex-col gap-6 relative z-10 px-1">
        {/* Tasks Analytics */}
        <div className="flex flex-col gap-3 group transition-all">
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50/80 border border-slate-100/50 rounded-full">
               <div className="text-emerald-500">
                 <Target size={14} />
               </div>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Summaries</span>
            </div>
            <div className="flex items-baseline gap-1.5">
               <span className="text-2xl font-black text-slate-900 tracking-tighter">{tasksCompleted}</span>
               <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">+12%</span>
            </div>
          </div>
        </div>

        {/* Objective Progress */}
        <div className="p-5 bg-gradient-to-br from-slate-50/80 to-white rounded-3xl border border-slate-100 hover:border-brand/20 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.01)] group/objective">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-brand/5 rounded-lg">
                        <Target size={14} className="text-brand shadow-[0_0_10px_rgba(108,99,255,0.2)]" />
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Objective</span>
                </div>
                <div className="px-2 py-1 bg-white border border-slate-100 rounded-lg shadow-sm">
                    <span className="text-[10px] font-black text-brand tracking-tight">{stageFormatted}</span>
                </div>
            </div>
            <h4 className="text-xs font-bold text-slate-700 leading-tight group-hover/objective:text-slate-900 transition-colors uppercase tracking-tight">{currentObjective}</h4>
            <div className="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden p-[1px] shadow-inner">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${progressPercent}%` }}
                   transition={{ duration: 1.2, delay: 0.5 }}
                   className="bg-brand h-full rounded-full shadow-[0_0_12px_rgba(108,99,255,0.3)] relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </motion.div>
            </div>
          </div>
        </div>

        {/* Time Multi-Metric */}
        <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-4">
                <div className="w-11 h-11 flex items-center justify-center bg-indigo-50/50 border border-indigo-100/50 text-indigo-500 rounded-2xl shadow-sm">
                    <Clock size={18} />
                </div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Time Invested</p>
                   <p className="text-base font-black text-slate-900 leading-none">{timeSpent}</p>
                </div>
            </div>
            <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 text-emerald-500 mb-2 px-2 py-1 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                    <TrendingUp size={12} />
                    <span className="text-[10px] font-black tracking-tighter">Sync: {progressPercent}%</span>
                </div>
                <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden p-[1px]">
                    <div className="w-full h-full bg-emerald-500/20 rounded-full" />
                </div>
            </div>
        </div>
      </div>

      {/* High-Fidelity Footer */}
      <div className="pt-4 border-t border-slate-50 mt-2">
        <div className="flex items-center justify-center gap-2">
            <div className="w-1 h-1 bg-emerald-400 rounded-full" />
            <p className="text-[8px] text-slate-300 font-bold uppercase tracking-[0.4em]">
              Security Matrix : Operational
            </p>
        </div>
      </div>
    </motion.div>
  );
};
