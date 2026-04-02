import React from 'react';
import { motion } from 'framer-motion';
import { Zap, PlayCircle, Trophy, Brain, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/Layout/DashboardLayout';
import MissionGrid from '../../components/Dashboard/MissionGrid';

import DashboardTutorial from '../../components/Dashboard/DashboardTutorial';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { RobotAssistant } from '../../components/Dashboard/RobotAssistant';
import { StatisticCard } from '../../components/Dashboard/StatisticCard';
import { useAppContext } from '../../context/AppContext';

export const ResourcesDashboard: React.FC = () => {
  const { resources } = useAppContext();
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const [exp] = React.useState(75);
  const [hasEntered] = React.useState(true);
  const [showTutorial, setShowTutorial] = React.useState(false);
  
  // YouTube lectures from the resources that have youtube_url
  const youtubeLectures = resources
    .filter(r => r.youtube_url)
    .slice(0, 3)
    .map(r => ({
      id: r.id,
      title: r.title,
      channel: 'NLP Academy', // Placeholder since it's not in the data
      views: '850K', // Placeholder
      url: r.youtube_url!,
      thumbnail: `https://img.youtube.com/vi/${r.youtube_url!.split('v=')[1]?.split('&')[0] || r.youtube_url!.split('/').pop()}/maxresdefault.jpg`
    }));

  return (
    <DashboardLayout>
      {/* Instant Command Hub Entry */}

      {showTutorial && <DashboardTutorial onComplete={() => setShowTutorial(false)} />}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-10 pb-12 pt-2"
      >
        {/* Mission Control Hero */}
        <motion.div variants={itemVariants} className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand to-brand-dark opacity-95 rounded-[64px] shadow-2xl shadow-brand/20 border border-white/10" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
          
          <div className="relative p-8 lg:p-14 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="flex items-center gap-4 mb-4 justify-center lg:justify-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                  <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.4em]">System Status: Ready</span>
              </div>

              <h1 id="hero-title" className="text-5xl lg:text-7xl font-black mb-6 leading-[1] text-white tracking-tighter uppercase">
                Welcome <br /><span className="text-white/40 italic">Commander</span>
              </h1>
              
              <div className="space-y-6 mb-12">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-brand-light to-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/20 border border-white/20">
                            <Trophy size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em]">Explorer Status</h3>
                            <p className="text-brand-light text-[10px] font-bold">LEVEL 24 APPRENTICE</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest block mb-0.5">Next Rank</span>
                        <span className="text-white font-black text-sm tracking-widest">LVL 25</span>
                    </div>
                </div>

                <div id="progress-bar" className="relative">
                    {/* Gamified Progress Bar */}
                    <div className="h-4 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 overflow-hidden relative group">
                        {/* Animated Glow Track */}
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${exp}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand via-brand-light to-white shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                        >
                            {/* Shimmer Effect */}
                            <motion.div 
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                            />
                        </motion.div>
                        
                        {/* Progress Text overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[8px] font-black text-white uppercase tracking-[0.3em] drop-shadow-md">{exp}% Sync Complete</span>
                        </div>
                    </div>

                    {/* Particle Emitters at end of progress bar */}
                    <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full blur-md"
                        style={{ left: `${exp}%` }}
                    />
                </div>
              </div>

              <div className="flex flex-nowrap gap-3 lg:gap-5 justify-center lg:justify-start">
                <AnimatedButton 
                    glow={true}
                    onClick={() => document.getElementById('missions')?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-6 py-3 lg:px-8 lg:py-4 text-[10px] shadow-2xl uppercase font-black tracking-[0.2em] whitespace-nowrap"
                >
                  Deploy Objective
                </AnimatedButton>
                <AnimatedButton 
                    glow={true}
                    onClick={() => setShowTutorial(true)}
                    className="px-6 py-3 lg:px-8 lg:py-4 text-[10px] shadow-2xl uppercase font-black tracking-[0.2em] whitespace-nowrap"
                >
                    Mission Guide
                </AnimatedButton>
                <AnimatedButton 
                    glow={true}
                    onClick={() => navigate('/navigator')}
                    className="px-6 py-3 lg:px-8 lg:py-4 text-[10px] shadow-2xl uppercase font-black tracking-[0.2em] whitespace-nowrap"
                >
                    Neural Matrix
                </AnimatedButton>
              </div>
            </div>
            
            <div className="hidden lg:block relative w-[400px] h-[400px] flex items-center justify-center">
                <div className="absolute inset-0 bg-white/5 rounded-[60px] blur-3xl opacity-40" />
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-[10%] border-[4px] border-brand/10 border-dashed rounded-[70px]"
                />
                
                {/* Scaled Robot to match refined typography */}
                <div className="relative z-10 scale-[1.2] drop-shadow-[0_20px_50px_rgba(99,102,241,0.3)]">
                    <RobotAssistant size={hasEntered ? "lg" : "xl"} layoutId="robot-assistant" />
                </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid - Integrated Mission Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Active Missions - Left 8 columns */}
          <div className="lg:col-span-8 space-y-12" id="missions">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Mission <span className="text-brand">Matrix</span></h2>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Select an objective to synchronize neural patterns.</p>
              </div>
              <div className="flex gap-2">
                <button className="px-5 py-2 bg-slate-100 rounded-xl text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-200">Sort: Priority</button>
              </div>
            </div>

            {/* High Fidelity Mission Cards */}
            <MissionGrid />
          </div>

          {/* Intel Feed - Right 4 columns */}
          <div className="lg:col-span-4 space-y-12">
            <StatisticCard />
            
            <div id="intel-feed">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tighter">
                    <Zap size={24} className="text-brand fill-brand" /> Intel Feed
                </h2>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              </div>
              <div className="space-y-6">
                {youtubeLectures.map((video, idx) => (
                    <motion.div
                        key={idx}
                        variants={itemVariants}
                        onClick={() => navigate(`/navigator?resource=${video.id}`)}
                        className="flex gap-4 p-4 bg-white border border-slate-100 rounded-3xl hover:border-brand/20 hover:shadow-xl hover:shadow-brand/5 transition-all group cursor-pointer relative overflow-hidden"
                    >
                        <div className="relative w-28 h-20 shrink-0 rounded-2xl overflow-hidden">
                            <img src={video.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform" onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop';
                            }} />
                            <div className="absolute inset-0 bg-brand/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <PlayCircle size={24} className="text-white" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h4 className="text-sm font-black text-slate-900 group-hover:text-brand transition-colors line-clamp-2 leading-snug">{video.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[8px] font-black uppercase">Intel</div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{video.views} Decrypted</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};
