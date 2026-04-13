import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, LayoutDashboard, Sparkles, Database, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/Layout/DashboardLayout';

import DashboardTutorial from '../../components/Dashboard/DashboardTutorial';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { RobotAssistant } from '../../components/Dashboard/RobotAssistant';
import { StatisticCard } from '../../components/Dashboard/StatisticCard';
import { useAppContext } from '../../context/AppContext';

export const ResourcesDashboard: React.FC = () => {
  const { agent, learningData, notifications } = useAppContext();
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const completionScore = agent.totalReward % 100; // Study Points modulo 100
  const completionPercentage = Math.min(100, Math.floor((agent.visitedResources.length / 19) * 100)); // Total 19 Nodes in Advances in NLP
  const [showTutorial, setShowTutorial] = React.useState(false);
  const [showPersonaTooltip, setShowPersonaTooltip] = useState(false);
  const heatmapRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll heatmap to the right (most recent activity)
  useEffect(() => {
    if (heatmapRef.current) {
      heatmapRef.current.scrollLeft = heatmapRef.current.scrollWidth;
    }
  }, [learningData]);



  return (
    <DashboardLayout>
      {showTutorial && <DashboardTutorial onComplete={() => setShowTutorial(false)} />}
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-6 py-8 space-y-12"
      >
        {/* Study Dashboard Hero */}
        <motion.div variants={itemVariants} className="relative overflow-hidden group rounded-[32px] border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white">
          {/* Complex Background Layers */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(108,99,255,0.08),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_80%,rgba(64,196,99,0.05),transparent_50%)]" />
          <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] pointer-events-none" />
          
          <div className="relative p-10 lg:p-14 flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl text-center lg:text-left flex flex-col gap-8">
              {/* Refined Status Indicators */}
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                  {/* Educational Persona Tag */}
                  {learningData?.persona && (
                    <div className="relative">
                      <motion.div 
                        onMouseEnter={() => setShowPersonaTooltip(true)}
                        onMouseLeave={() => setShowPersonaTooltip(false)}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2.5 px-3 py-1.5 rounded-full shadow-sm border cursor-help transition-all hover:shadow-md"
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
                          Persona: {learningData.persona.name}
                        </span>
                      </motion.div>

                      <AnimatePresence>
                        {showPersonaTooltip && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                            className="absolute bottom-full left-0 mb-3 w-72 p-4 rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl z-[100] text-left"
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
                            <div className="mt-3 pt-2 border-t border-slate-100">
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                 Cluster Classification: Active
                               </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
              </div>

              <h1 id="hero-title" className="text-4xl lg:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight uppercase">
                Resources <br /><span className="text-brand">Command Center</span>
              </h1>
              
              <div className="flex flex-col gap-6 max-w-md mx-auto lg:mx-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 p-1">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-brand shadow-sm">
                            <Trophy size={18} />
                        </div>
                        <div>
                            <h3 className="text-slate-400 font-bold text-[9px] uppercase tracking-widest leading-none mb-1.5">Current Status</h3>
                            <p className="text-slate-900 text-xs font-black uppercase tracking-wider">Progress Stage {agent.level}</p>
                        </div>
                    </div>
                </div>

                <div id="progress-bar" className="flex flex-col gap-3">
                    <div className="flex justify-between items-end px-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Learning Progress</span>
                        <span className="text-xs font-black text-slate-900">{completionScore}%</span>
                    </div>
                    {/* Enhanced SaaS Progress Bar */}
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-[1px] shadow-inner">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${completionScore}%` }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="h-full bg-brand rounded-full relative shadow-[0_0_10px_rgba(108,99,255,0.3)]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        </motion.div>
                    </div>
                </div>
              </div>

                <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-6">
                <AnimatedButton 
                    onClick={() => document.getElementById('missions')?.scrollIntoView({ behavior: 'smooth' })}
                    className="shadow-sm"
                >
                  Start Learning
                </AnimatedButton>
                <AnimatedButton 
                    onClick={() => setShowTutorial(true)}
                    className="shadow-sm bg-brand hover:bg-brand-dark"
                >
                    Study Guide
                </AnimatedButton>
                <AnimatedButton 
                    onClick={() => navigate('/navigator')}
                    className="shadow-sm bg-brand hover:bg-brand-dark"
                >
                    Learning Path
                </AnimatedButton>
              </div>
            </div>
            
            {/* Robot with Enhanced Backdrop */}
            <div className="hidden lg:flex relative w-80 h-80 items-center justify-center">
                <div className="absolute inset-0 bg-brand/10 rounded-full blur-[60px] opacity-40 animate-pulse" />
                <div className="absolute inset-4 border border-brand/5 rounded-full" />
                <div className="absolute inset-12 border border-brand/5 rounded-full" />
                <div className="relative z-10 transition-transform hover:scale-110 duration-700">
                    <RobotAssistant size="xl" layoutId="robot-assistant" />
                </div>
            </div>
          </div>
        </motion.div>

         {/* Learning Activity + Contribution Breakdown Side-by-Side */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
          
          {/* Learning Contributions - 8 columns */}
          <div className="xl:col-span-8">
            <div className="p-8 bg-white rounded-[32px] border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.02)] h-full transition-all hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Learning Contributions
                  </h3>
                </div>
                <div className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Last 52 Weeks</span>
                </div>
              </div>

              {(() => {
                // Dynamic window: today is ALWAYS the last cell
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Normalize today to start of day
                
                // End of the grid is today. Start of the grid is 51 weeks ago starting from the same day of week.
                // We want exactly 52 weeks (364 days total)
                const totalDays = 52 * 7;
                const startDate = new Date(today);
                startDate.setDate(today.getDate() - totalDays + 1);
                startDate.setHours(0, 0, 0, 0);

                const weeks = 52;
                const data: number[][] = [];
                const activityHeatmap = learningData?.activityHeatmap || {};
                const totalSummaries = Object.values(activityHeatmap).reduce((sum, count) => Number(sum) + Number(count), 0);

                for (let w = 0; w < weeks; w++) {
                  const week: number[] = [];
                  for (let d = 0; d < 7; d++) {
                    const date = new Date(startDate);
                    date.setDate(startDate.getDate() + (w * 7 + d));
                    
                    const endOfToday = new Date(today);
                    endOfToday.setHours(23, 59, 59, 999);
                    
                    if (date > endOfToday) { 
                      week.push(0); 
                      continue; 
                    }
                    
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateKey = `${year}-${month}-${day}`;
                    
                    const count = Number(activityHeatmap[dateKey] || 0);
                    
                    let level = 0;
                    if (count >= 1) level = 1;
                    if (count >= 3) level = 2;
                    if (count >= 6) level = 3;
                    if (count >= 9) level = 4;
                    week.push(level);
                  }
                  data.push(week);
                }

                const colorMap: Record<number, string> = {
                  0: '#EBEDF0',
                  1: '#9BE9A8',
                  2: '#40C463',
                  3: '#30A14E',
                  4: '#216E39',
                };

                const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                const monthLabels: { label: string; col: number }[] = [];
                let lastMonth = -1;
                for (let w = 0; w < weeks; w++) {
                  // Check the 1st day of each week
                  const date = new Date(startDate);
                  date.setDate(startDate.getDate() + w * 7);
                  if (date.getMonth() !== lastMonth) {
                    monthLabels.push({ label: monthNames[date.getMonth()], col: w });
                    lastMonth = date.getMonth();
                  }
                }

                const flat = data.flat();
                // Streak logic: check backwards from today (last cell)
                let streak = 0;
                // Today's index is the last index in the flattened array
                // The grid is weeks * 7. Today is the last cell.
                const todayIndex = flat.length - 1;
                for (let i = todayIndex; i >= 0; i--) {
                  if (flat[i] > 0) streak++;
                  else if (i < todayIndex) break; // Allow today to be 0 for a moment, but if 0 in past, break
                }
                let longest = 0, cur = 0;
                for (const v of flat) {
                  if (v > 0) { cur++; longest = Math.max(longest, cur); }
                  else cur = 0;
                }
                const activeDays = flat.filter(v => v > 0).length;

                return (
                  <div>
                    <div className="relative ml-8 mb-1 h-3" style={{ width: `${weeks * 14}px` }}>
                      {monthLabels.map((m, i) => (
                        <span key={i} className="absolute text-[9px] font-bold text-slate-400 uppercase"
                          style={{ left: `${m.col * 14}px` }}>
                          {m.label}
                        </span>
                      ))}
                    </div>
                    <div ref={heatmapRef} className="flex overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                      <div className="flex flex-col justify-between mr-1 shrink-0 py-[2px]" style={{ height: `${7 * 14}px` }}>
                        {['','Mon','','Wed','','Fri',''].map((d, i) => (
                          <span key={i} className="text-[9px] font-bold text-slate-400 leading-none h-[12px] flex items-center">{d}</span>
                        ))}
                      </div>
                      <div className="flex gap-[3px]">
                        {data.map((week, wi) => (
                          <div key={wi} className="flex flex-col gap-[3px]">
                            {week.map((level, di) => {
                              const cellDate = new Date(startDate);
                              cellDate.setDate(startDate.getDate() + wi * 7 + di);
                              const yr = cellDate.getFullYear();
                              const mo = String(cellDate.getMonth() + 1).padStart(2, '0');
                              const dy = String(cellDate.getDate()).padStart(2, '0');
                              const dk = `${yr}-${mo}-${dy}`;
                              const cnt = activityHeatmap[dk] || 0;
                              
                              const isToday = cellDate.getFullYear() === today.getFullYear() 
                                && cellDate.getMonth() === today.getMonth() 
                                && cellDate.getDate() === today.getDate();
                              
                              return (
                                <div
                                  key={di}
                                  className="rounded-[3px] transition-all hover:scale-150 cursor-pointer hover:shadow-[0_0_8px_rgba(0,0,0,0.1)] active:scale-125"
                                  style={{
                                    width: '11px',
                                    height: '11px',
                                    backgroundColor: colorMap[level] || '#EBEDF0',
                                    outline: isToday ? '2px solid #6366f1' : 'none',
                                    outlineOffset: '2px',
                                  }}
                                  title={`${cnt} activities on ${cellDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}${isToday ? ' (Today)' : ''}`}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Legend + Stats */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
                          <span className="text-[9px] font-bold text-slate-400 pr-1">Less</span>
                          {[0,1,2,3,4].map(l => (
                            <div key={l} className="w-[10px] h-[10px] rounded-[2px]" style={{ backgroundColor: colorMap[l] }} />
                          ))}
                          <span className="text-[9px] font-bold text-slate-400 pl-1">More</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-8 px-1">
                        <div className="text-right">
                          <span className="text-xl font-black text-slate-900 tracking-tighter">{totalSummaries}</span>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1.5">Total Activities</p>
                        </div>
                        <div className="w-px h-8 bg-slate-100" />
                        <div className="text-right">
                          <span className="text-xl font-black text-emerald-600 tracking-tighter">{streak}</span>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1.5">Day Streak</p>
                        </div>
                        <div className="w-px h-8 bg-slate-100" />
                        <div className="text-right">
                          <span className="text-xl font-black text-slate-700 tracking-tighter">{activeDays}</span>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1.5">Active Days</p>
                        </div>
                      </div>
                    </div>

                    {/* Moved Activity Timeline to below heatmap */}
                    <div className="mt-10 pt-8 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Recent Activity Period</h4>
                        </div>
                        <div className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{learningData?.activityLog?.length || 0} Total Events Sync</span>
                        </div>
                      </div>
                      <div className="overflow-y-auto space-y-0.5 border border-slate-100/50 rounded-3xl bg-slate-50/20 p-1" style={{ maxHeight: '240px', scrollbarWidth: 'thin' }}>
                        {(learningData?.activityLog && learningData.activityLog.length > 0) ? (
                          learningData.activityLog.map((entry: any, i: number) => (
                            <div key={i} className="flex items-center gap-5 px-6 py-4 border-b border-slate-50 last:border-0 hover:bg-white rounded-2xl transition-all group/item shadow-sm shadow-transparent hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                              <div className="relative">
                                <div className="absolute inset-0 bg-brand/10 rounded-xl blur-md opacity-0 group-hover/item:opacity-40 transition-opacity" />
                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 group-hover/item:bg-white group-hover/item:border-brand/20 transition-all relative z-10">
                                    <span className="text-lg">
                                    {entry.type === 'summary' ? '📝' : '🔬'}
                                    </span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-black text-slate-800 truncate uppercase tracking-tight group-hover/item:text-brand transition-colors">{entry.title || 'Summary Synthesis'}</p>
                                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                                  {entry.timestamp ? new Date(Number(entry.timestamp)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Real-time'}
                                  {' · '}{entry.type === 'summary' ? 'Cognitive Record' : 'Neural Node Access'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100/50 opacity-0 group-hover/item:opacity-100 transition-all scale-90 group-hover/item:scale-100">
                                <Sparkles size={10} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Verified</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">No Neural Activity Found</p>
                            <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Synthesize a new summary to initialize timeline</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Contribution Breakdown - 4 columns (LIGHT THEME) */}
          <div className="xl:col-span-4">
            <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-200 h-full flex flex-col relative overflow-hidden group hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)] transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(108,99,255,0.04),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Contribution Chart */}
              <div className="relative z-10 flex-1 flex flex-col">
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] mb-0.5">Contribution Breakdown</h3>
                <p className="text-[9px] text-slate-400 font-medium mb-3">
                  Activity as of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>

                {(() => {
                  const summaryCount = learningData?.activityLog?.length || 0;
                  const resourceCount = agent.visitedResources.length;
                  const notifCount = notifications.length;
                  const totalXP = agent.totalReward;
                  
                  const total = Math.max(1, summaryCount + resourceCount + notifCount + (totalXP > 0 ? 1 : 0));
                  const summaryPct = Math.round((summaryCount / total) * 100);
                  const resourcePct = Math.round((resourceCount / total) * 100);
                  const notifPct = Math.round((notifCount / total) * 100);
                  const xpPct = Math.max(0, 100 - summaryPct - resourcePct - notifPct);
                  
                  const cx = 180, cy = 140;
                  const maxLen = 80;
                  
                  return (
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <svg viewBox="0 0 360 280" className="w-full" style={{ maxHeight: '320px' }}>
                        <line x1={cx - maxLen - 30} y1={cy} x2={cx + maxLen + 30} y2={cy} stroke="#f1f5f9" strokeWidth="2" />
                        <line x1={cx} y1={cy - maxLen - 30} x2={cx} y2={cy + maxLen + 30} stroke="#f1f5f9" strokeWidth="2" />
                        <line x1={cx - maxLen - 30} y1={cy} x2={cx + maxLen + 30} y2={cy} stroke="#e2e8f0" strokeWidth="1" />
                        <line x1={cx} y1={cy - maxLen - 30} x2={cx} y2={cy + maxLen + 30} stroke="#e2e8f0" strokeWidth="1" />
                        
                        <motion.line x1={cx} y1={cy} x2={cx - (maxLen * summaryPct / 100)} y2={cy}
                          stroke="#40C463" strokeWidth="10" strokeLinecap="round"
                          initial={{ x2: cx }} animate={{ x2: cx - (maxLen * summaryPct / 100) }}
                          transition={{ duration: 1, ease: "easeOut" }} />
                        <motion.line x1={cx} y1={cy} x2={cx + (maxLen * resourcePct / 100)} y2={cy}
                          stroke="#40C463" strokeWidth="10" strokeLinecap="round"
                          initial={{ x2: cx }} animate={{ x2: cx + (maxLen * resourcePct / 100) }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.15 }} />
                        <motion.line x1={cx} y1={cy} x2={cx} y2={cy - (maxLen * notifPct / 100)}
                          stroke="#40C463" strokeWidth="10" strokeLinecap="round"
                          initial={{ y2: cy }} animate={{ y2: cy - (maxLen * notifPct / 100) }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }} />
                        <motion.line x1={cx} y1={cy} x2={cx} y2={cy + (maxLen * xpPct / 100)}
                          stroke="#40C463" strokeWidth="10" strokeLinecap="round"
                          initial={{ y2: cy }} animate={{ y2: cy + (maxLen * xpPct / 100) }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.45 }} />
                        
                        <circle cx={cx} cy={cy} r="8" fill="#40C463" />
                        <circle cx={cx} cy={cy} r="5" fill="white" />
                        
                        <motion.circle cx={cx - (maxLen * summaryPct / 100)} cy={cy} r="5" fill="#40C463"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} />
                        <motion.circle cx={cx + (maxLen * resourcePct / 100)} cy={cy} r="5" fill="#40C463"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.15 }} />
                        <motion.circle cx={cx} cy={cy - (maxLen * notifPct / 100)} r="5" fill="#40C463"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} />
                        <motion.circle cx={cx} cy={cy + (maxLen * xpPct / 100)} r="5" fill="#40C463"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.45 }} />
                        
                        <text x={cx - maxLen - 25} y={cy - 6} fill="#1e293b" fontSize="12" fontWeight="900" textAnchor="end">{summaryPct}%</text>
                        <text x={cx - maxLen - 25} y={cy + 8} fill="#64748b" fontSize="10" fontWeight="800" textAnchor="end">Summaries</text>
                        
                        <text x={cx + maxLen + 25} y={cy - 6} fill="#1e293b" fontSize="12" fontWeight="900" textAnchor="start">Resources</text>
                        <text x={cx + maxLen + 25} y={cy + 8} fill="#64748b" fontSize="10" fontWeight="800" textAnchor="start">{resourcePct}%</text>
                        
                        <text x={cx} y={cy - maxLen - 28} fill="#1e293b" fontSize="12" fontWeight="900" textAnchor="middle">Level Ups</text>
                        <text x={cx} y={cy - maxLen - 14} fill="#64748b" fontSize="10" fontWeight="800" textAnchor="middle">{notifPct}%</text>
                        
                        <text x={cx} y={cy + maxLen + 18} fill="#1e293b" fontSize="12" fontWeight="900" textAnchor="middle">{xpPct}%</text>
                        <text x={cx} y={cy + maxLen + 32} fill="#64748b" fontSize="10" fontWeight="800" textAnchor="middle">XP Earned</text>
                      </svg>
                    </div>
                  );
                })()}
              </div>

              {/* Bottom stat row */}
              <div className="grid grid-cols-4 gap-2 mt-auto pt-4 border-t border-slate-100 relative z-10">
                <div className="text-center">
                  <p className="text-lg font-black text-slate-900 leading-none">{learningData?.activityLog?.length || 0}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Summaries</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-slate-900 leading-none">{agent.visitedResources.length}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Resources</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-slate-900 leading-none">{notifications.length}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Level Ups</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-emerald-600 leading-none">{agent.totalReward}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">XP</p>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start mt-8">
          
          {/* Enrolled Courses Hero - 8 columns */}
          <div className="xl:col-span-8 flex flex-col gap-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                 <LayoutDashboard className="text-brand" size={24} />
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Active <span className="text-brand">Enrollments</span></h2>
              </div>
              <button 
                 onClick={() => navigate('/navigator')}
                 className="px-4 py-2 bg-white rounded-lg text-slate-500 text-[10px] font-bold uppercase tracking-widest border border-slate-200 hover:border-brand/40 transition-colors shadow-sm"
              >
                  Course Catalog
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-shadow group flex flex-col md:flex-row gap-8 relative overflow-hidden">
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand/5 rounded-full blur-3xl opacity-50 group-hover:bg-brand/10 transition-colors" />
                
                <div className="flex-1 space-y-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="px-3 py-1 bg-brand text-white text-[10px] font-bold uppercase tracking-widest rounded shadow-sm border border-brand/20 flex items-center gap-1.5"><Sparkles size={12}/> Primary Thread</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Masterclass</span>
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-4">Advances in NLP</h3>
                        <p className="text-slate-500 font-medium leading-relaxed max-w-xl">
                            Dive deep into modern Natural Language Processing. Configure parameters locally, traverse through isolated node challenges, and synthesize memory records.
                        </p>
                    </div>

                    <div className="space-y-3 pt-4">
                        <div className="flex items-end justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Neural Map Completion</span>
                            <span className="text-lg font-black text-slate-900">{completionPercentage}%</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-[1px] shadow-inner">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${completionPercentage}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-brand rounded-full relative shadow-[0_0_10px_rgba(108,99,255,0.2)]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                            </motion.div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 tracking-wide uppercase text-right w-full">
                           {agent.visitedResources.length} of 19 Nodes Unlocked
                        </p>
                    </div>
                </div>

                <div className="w-full md:w-64 shrink-0 flex flex-col justify-center gap-4 relative z-10 p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                             <Database size={16} className="text-brand" />
                             <span className="text-xs font-bold text-slate-900 uppercase">Rank Sync</span>
                        </div>
                        <span className="text-2xl font-black text-brand leading-none">S{agent.level}</span>
                    </div>
                    
                    <button 
                         onClick={() => navigate('/navigator/course')}
                         className="w-full py-4 bg-brand hover:bg-brand-dark text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 uppercase tracking-wide text-xs active:scale-95"
                    >
                         Enter Matrix <ArrowRight size={16} />
                    </button>
                    <p className="text-[9px] text-center text-slate-400 font-black tracking-widest uppercase">Launch Sandbox</p>
                </div>
            </div>
          </div>

          {/* Intelligence Hub Sidebar - 4 columns */}
          <div className="xl:col-span-4 flex flex-col gap-8">
            <StatisticCard />
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};
