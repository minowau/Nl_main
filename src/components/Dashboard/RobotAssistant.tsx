import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';

interface RobotAssistantProps {
  tutorialMessage?: string;
  layoutId?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const RobotAssistant: React.FC<RobotAssistantProps> = ({ 
  tutorialMessage,
  layoutId = "robot-assistant",
  size = 'md'
}) => {
  const [messages] = useState([
    "Careful there.",
    "Interaction registered.",
    "That was unnecessary 🙂",
    "Processing request...",
    "Scanning patterns.",
    "Always helpful.",
    "System sync: Stable.",
    "Data points collected."
  ]);
  
  const [activeMessage, setActiveMessage] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mouse tracking for eyes
  const mouseX = useSpring(0, { stiffness: 100, damping: 25 });
  const mouseY = useSpring(0, { stiffness: 100, damping: 25 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Smoother, slower tracking
        const dx = (e.clientX - centerX) / (window.innerWidth / 4);
        const dy = (e.clientY - centerY) / (window.innerHeight / 4);
        
        mouseX.set(Math.max(-8, Math.min(8, dx * 10)));
        mouseY.set(Math.max(-8, Math.min(8, dy * 10)));
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const handleClick = () => {
    const randomIndex = Math.floor(Math.random() * messages.length);
    setActiveMessage(messages[randomIndex]);
    
    // Clear message after 2s
    setTimeout(() => setActiveMessage(null), 2000);
  };

  return (
    <motion.div 
      layoutId={layoutId}
      className="relative group/robot" 
      ref={containerRef}
    >
      {/* Speech Bubble (Minimal Tooltip Style) */}
      <AnimatePresence>
        {activeMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap"
          >
            <div className="text-[10px] font-bold text-slate-600 bg-white shadow-xl shadow-slate-200/50 px-3 py-1.5 rounded-xl border border-slate-100 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
              {activeMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Robot Container */}
      <motion.div
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ y: -2 }}
        animate={{ 
          y: [-2, 2, -2],
        }}
        transition={{ 
          y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
        }}
        className="cursor-pointer flex flex-col items-center gap-4 relative group transition-all"
      >
        {/* Subtle Backdrop Glow */}
        <div className="absolute inset-0 bg-brand/3 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Robot head/SVG */}
        <div className={`relative transition-all duration-500 ${
            size === 'xl' ? 'w-80 h-80' : 
            size === 'lg' ? 'w-48 h-48' : 
            size === 'md' ? 'w-24 h-24' : 'w-12 h-12'
        }`}>
            <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible">
                {/* Robot Body (Midnight Slate) */}
                <defs>
                    <radialGradient id="robot-body-shine" cx="50%" cy="40%" r="50%" fx="50%" fy="40%">
                        <stop offset="0%" stopColor="#334155" />
                        <stop offset="100%" stopColor="#1E293B" />
                    </radialGradient>
                    <filter id="inner-glow">
                        <feFlood floodColor="#334155" floodOpacity="0.3" result="offsetColor"/>
                        <feComposite in="offsetColor" in2="SourceAlpha" operator="in" result="offsetBlur"/>
                        <feGaussianBlur in="offsetBlur" stdDeviation="2" result="blur"/>
                        <feComposite in="SourceAlpha" in2="blur" operator="out" result="glow"/>
                    </filter>
                </defs>
                <motion.rect 
                    x="20" y="30" width="80" height="70" rx="16" 
                    fill="url(#robot-body-shine)"
                    stroke="#0F172A" strokeWidth="2"
                    className="shadow-2xl"
                />
                <rect x="28" y="38" width="64" height="44" rx="10" fill="#020617" filter="url(#inner-glow)" />
                
                {/* Screen Eyes (Proper SVG Rects) */}
                <motion.g animate={{ scale: isHovered ? 1.05 : 1 }} transition={{ duration: 0.3 }}>
                    {/* Left Eye Shell */}
                    <rect x="38" y="50" width="14" height="20" rx="3" fill="#334155" />
                    <motion.rect 
                        x="41" y="54" width="8" height="12" rx="2" fill="#64748B"
                        style={{ x: mouseX, y: mouseY }}
                        animate={{ height: [12, 1, 12, 12, 12] }} 
                        transition={{ duration: 4, repeat: Infinity, times: [0, 0.05, 0.1, 0.8, 1] }} 
                    />
                    
                    {/* Right Eye Shell */}
                    <rect x="68" y="50" width="14" height="20" rx="3" fill="#334155" />
                    <motion.rect 
                        x="71" y="54" width="8" height="12" rx="2" fill="#64748B"
                        style={{ x: mouseX, y: mouseY }}
                        animate={{ height: [12, 1, 12, 12, 12] }}
                        transition={{ duration: 4, repeat: Infinity, times: [0, 0.05, 0.1, 0.8, 1] }}
                    />
                </motion.g>

                {/* Antenna */}
                <rect x="58" y="12" width="4" height="18" fill="#CBD5E1" />
                <motion.circle 
                    cx="60" cy="12" r="4" fill="#64748B"
                    animate={{ 
                        opacity: [1, 0.6, 1],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                />
            </svg>
        </div>
      </motion.div>
    </motion.div>
  );
};
