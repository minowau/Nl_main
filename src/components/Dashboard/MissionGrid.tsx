import { motion } from 'framer-motion';
import { Trophy, ArrowUpRight, Clock, Users, Bookmark, Sparkles, Star } from 'lucide-react';

interface Mission {
  id: string;
  title: string;
  description: string;
  image: string;
  bannerColor: string;
  xp: number;
  level: number;
  duration: string;
  participants: number;
}

const missions: Mission[] = [
  {
    id: '1',
    title: 'Pre-training Objectives',
    description: 'Master the fundamental data acquisition and cleaning strategies for LLM training.',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop',
    bannerColor: 'from-blue-600/40 to-indigo-900/60',
    xp: 200,
    level: 10,
    duration: '45m',
    participants: 1240
  },
  {
    id: '2',
    title: 'Pre-trained Models',
    description: 'Explore state-of-the-art architectures and weight initialization patterns.',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
    bannerColor: 'from-brand/40 to-brand-dark/60',
    xp: 250,
    level: 11,
    duration: '60m',
    participants: 890
  },
  {
    id: '3',
    title: 'HuggingFace Integration',
    description: 'Seamlessly deploy and manage models using the industry standard ecosystem.',
    image: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?q=80&w=800&auto=format&fit=crop',
    bannerColor: 'from-orange-500/40 to-yellow-900/60',
    xp: 300,
    level: 12,
    duration: '30m',
    participants: 2100
  },
  {
    id: '4',
    title: 'Fine-tuning LLM',
    description: 'Optimize domain-specific performance with LoRA, QLoRA and other techniques.',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop',
    bannerColor: 'from-purple-600/40 to-fuchsia-900/60',
    xp: 350,
    level: 13,
    duration: '90m',
    participants: 560
  }
];

const MissionGrid = () => {
  return (
    <div id="missions-matrix" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-12 pb-20">
      {missions.map((mission, idx) => (
        <motion.div
          key={mission.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.15, duration: 0.8, ease: "easeOut" }}
          className="group relative bg-white rounded-[32px] overflow-hidden shadow-[0_16px_32px_-16px_rgba(0,0,0,0.1)] border border-slate-100 hover:border-brand/40 transition-all duration-700 hover:-translate-y-3"
        >
          {/* Card Image Header - Compact Tactical Banner */}
          <div className="relative h-[200px] w-full overflow-hidden">
            <img 
              src={mission.image} 
              alt={mission.title}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            {/* The Dynamic Banner Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-b ${mission.bannerColor} mix-blend-multiply opacity-50 group-hover:opacity-30 transition-opacity`} />
            <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/20 to-transparent" />
            
            {/* Conditional 'Pre-Trained Models' Featured Banner */}
            {mission.id === '2' && (
              <div className="absolute top-0 right-0 z-30">
                <div className="bg-gradient-to-r from-orange-500 text-white to-red-500 px-6 py-1.5 shadow-lg border-b border-l border-white/20 backdrop-blur-md flex items-center gap-2 rounded-bl-3xl">
                    <Star size={12} className="fill-current animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] pt-0.5">Featured Module</span>
                </div>
              </div>
            )}
            
            {/* Top Tactical Label */}
            <div className={`absolute left-6 ${mission.id === '2' ? 'top-10' : 'top-6'}`}>
              <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg border border-white/20">
                <Sparkles size={12} className="text-white animate-pulse" />
                <span className="text-[9px] font-black uppercase text-white tracking-widest">{mission.title}</span>
              </div>
            </div>
            
            <div className={`absolute right-6 ${mission.id === '2' ? 'top-12' : 'top-6'}`}>
              <button className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg hover:bg-brand transition-colors border border-white/20">
                <Bookmark size={16} />
              </button>
            </div>
          </div>

          {/* Compact XP Reward Badge (Moved outside overflow-hidden) */}
          <motion.div 
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[180px] right-8 z-20"
          >
              <div className="bg-brand px-4 py-2 rounded-2xl flex items-center gap-2 shadow-[0_8px_16px_rgba(var(--brand-rgb),0.3)] border-2 border-white">
                  <Trophy size={14} className="text-white" />
                  <span className="text-xs font-black text-white tracking-wide">+{mission.xp}</span>
              </div>
          </motion.div>

          {/* Compact Card Body */}
          <div className="p-6 relative z-10 bg-white pt-8">
            <div className="flex items-center justify-between mb-4 mt-2">
                <div className="flex flex-col">
                    <h3 className="text-2xl font-black text-slate-900 leading-tight tracking-tight mb-1 group-hover:text-brand transition-colors">
                        {mission.title === 'Pre-trained Models' ? 'Pre-trained Models' : mission.title}
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                        <span className="text-[10px] items-center font-bold text-slate-400 uppercase tracking-widest flex gap-1"><Clock size={10}/> {mission.duration}</span>
                    </div>
                </div>
                <div className="px-4 py-2 bg-slate-50 rounded-xl flex flex-col items-center justify-center border border-slate-200 group-hover:border-brand/30 transition-colors">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">LVL</span>
                    <span className="text-lg font-black text-brand leading-none">{mission.level}</span>
                </div>
            </div>

            <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium">
              {mission.description}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-2 relative z-0">
                        {[1, 2, 3].map(i => (
                            <img 
                                key={i}
                                src={`https://i.pravatar.cc/100?u=${mission.id + i}`}
                                className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                                alt="participant"
                            />
                        ))}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Users size={12}/> {mission.participants.toLocaleString()} Active
                    </span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-brand/10 text-brand px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-2 hover:bg-brand hover:text-white transition-colors"
                >
                  Engage <ArrowUpRight size={14} />
                </motion.button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default MissionGrid;
