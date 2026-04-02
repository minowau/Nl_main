import React from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Flame } from 'lucide-react';

interface StatisticCardProps {
  progress?: number;
  userName?: string;
  data?: { label: string; value: number; active?: boolean }[];
}

export const StatisticCard: React.FC<StatisticCardProps> = ({ 
  progress = 32, 
  userName = "Alex", 
  data = [
    { label: "1-10 Aug", value: 35 },
    { label: "11-20 Aug", value: 48, active: true },
    { label: "11-20 Aug", value: 35 },
    { label: "21-30 Aug", value: 62, active: true },
    { label: "21-30 Aug", value: 32 },
  ] 
}) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 w-full max-w-sm flex flex-col items-center relative overflow-hidden"
    >
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6">
        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Statistic</h3>
        <button className="text-slate-300 hover:text-brand transition-colors p-1">
          <MoreVertical size={24} />
        </button>
      </div>

      {/* Circular Progress with Avatar */}
      <div className="relative w-48 h-48 flex items-center justify-center mb-6">
        <svg className="w-full h-full transform -rotate-90 overflow-visible">
          {/* Background Circle */}
          <circle
            cx="96"
            cy="96"
            r={radius}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth="12"
          />
          {/* Progress Circle */}
          <motion.circle
            cx="96"
            cy="96"
            r={radius}
            fill="none"
            stroke="url(#gradient-stat)"
            strokeWidth="12"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="gradient-stat" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
          </defs>
        </svg>

        {/* Avatar Container */}
        <div className="absolute inset-4 rounded-full bg-slate-50 flex items-center justify-center overflow-hidden border-8 border-white shadow-inner">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=f1f5f9" 
            alt="User Avatar" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Percentage Badge */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, type: 'spring' }}
          className="absolute top-2 right-4 bg-brand text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-white"
        >
          {progress}%
        </motion.div>
      </div>

      {/* Greeting */}
      <div className="text-center mb-8">
        <h4 className="text-2xl font-black text-slate-900 flex items-center justify-center gap-2 mb-1">
          Good Morning {userName} <Flame size={24} className="text-orange-500 fill-orange-500" />
        </h4>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-loose">
          Continue your learning to <br />achieve your target!
        </p>
      </div>

      {/* Mini Bar Chart */}
      <div className="w-full bg-slate-50/50 rounded-[32px] p-6 border border-slate-100">
        <div className="flex items-end justify-between h-24 mb-4 gap-2">
          {data.map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full">
              <div className="flex-1 w-full bg-slate-100 rounded-t-xl relative overflow-hidden flex items-end">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${item.value}%` }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                  className={`w-full rounded-t-xl shadow-lg transition-colors ${item.active ? 'bg-gradient-to-t from-brand to-indigo-400' : 'bg-brand/20'}`}
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Label Row */}
        <div className="flex justify-between px-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
          <span>1-10 Aug</span>
          <span>11-20 Aug</span>
          <span>21-30 Aug</span>
        </div>
      </div>
    </motion.div>
  );
};
