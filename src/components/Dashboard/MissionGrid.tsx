import { motion } from 'framer-motion';
import { Trophy, ArrowUpRight, Clock, Users, Bookmark, Sparkles } from 'lucide-react';



import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

const MissionGrid = () => {
  const { resources, agent, bookmarks, toggleBookmark } = useAppContext();
  const navigate = useNavigate();

  // Dynamically map curriculum queue isolating unvisited remaining modules
  const unvisitedNodes = resources.filter(r => !agent.visitedResources.includes(r.id)).slice(0, 4);
  
  // Transform the explicit resource API payloads into compatible Mission display blocks natively synced
  const dynamicMissions = unvisitedNodes.map((r, index) => ({
    id: r.id,
    title: r.title,
    description: `Explore parameters defining the behavior surrounding ${r.module} architecture sets natively inside our remote neural matrices.`,
    image: r.youtube_url ? `https://img.youtube.com/vi/${r.youtube_url.split('v=')[1]?.split('&')[0] || r.youtube_url.split('/').pop()}/maxresdefault.jpg` : "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop",
    bannerColor: index % 2 === 0 ? 'from-brand/20 to-brand-dark/40' : 'from-slate-600/20 to-slate-900/40',
    score: r.reward || 150,
    stage: r.difficulty || 1,
    duration: "45m",
    participants: Math.floor(Math.random() * 1500) + 500,
    isBookmarked: bookmarks.includes(r.id)
  }));
  return (
    <div id="missions-matrix" className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
      {dynamicMissions.map((mission, idx) => (
        <motion.div
          key={mission.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1, duration: 0.5 }}
          className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:border-brand/40 transition-all duration-300"
        >
          {/* Card Header Image */}
          <div className="relative h-48 w-full overflow-hidden bg-slate-100">
            <img 
              src={mission.image} 
              alt={mission.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${mission.bannerColor} opacity-40`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            
            <div className="absolute top-4 left-4">
              <div className="bg-white/80 backdrop-blur-md px-3 py-1 rounded-lg flex items-center gap-2 border border-white/20 shadow-sm">
                <Sparkles size={12} className="text-brand" />
                <span className="text-[10px] font-bold uppercase text-slate-800 tracking-wider">Stage {mission.stage}</span>
              </div>
            </div>

            <div className="absolute top-4 right-4">
              <button 
                onClick={(e) => { e.stopPropagation(); toggleBookmark(mission.id); }}
                className={`w-8 h-8 ${mission.isBookmarked ? 'bg-brand/90 text-white' : 'bg-white/80 text-slate-600'} backdrop-blur-md rounded-lg flex items-center justify-center shadow-sm hover:scale-105 transition-all border border-white/20`}
              >
                <Bookmark size={14} className={mission.isBookmarked ? 'fill-current' : ''} />
              </button>
            </div>

            <div className="absolute bottom-4 left-4">
               <div className="bg-brand px-3 py-1 rounded-lg flex items-center gap-2 shadow-lg border border-white/20">
                  <Trophy size={12} className="text-white" />
                  <span className="text-[10px] font-bold text-white">+{mission.score} Score</span>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand transition-colors">
                    {mission.title}
                </h3>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] items-center font-bold text-slate-400 uppercase tracking-widest flex gap-1.5 align-middle">
                      <Clock size={12} className="text-slate-300"/> {mission.duration}
                    </span>
                    <span className="text-[10px] items-center font-bold text-slate-400 uppercase tracking-widest flex gap-1.5 align-middle">
                      <Users size={12} className="text-slate-300"/> {mission.participants.toLocaleString()} Active
                    </span>
                </div>
            </div>

            <p className="text-slate-500 text-sm leading-relaxed font-medium line-clamp-2">
              {mission.description}
            </p>

            <div className="pt-4 flex justify-end">
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/navigator/course?resource=${mission.id}`)}
                  className="bg-brand text-white px-6 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center gap-2 hover:bg-brand-dark transition-all shadow-sm shadow-brand/10 border border-white/10"
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
