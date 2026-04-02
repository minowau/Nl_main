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
    "Ouch! 😵",
    "Hey! That tickles 😂",
    "System damage: 1% 😤",
    "I will remember this... 🤖",
    "Bro why 😭",
    "Target locked! 🎯",
    "Scanning for pizza... 🍕",
    "I'm 100% cloud-based! ☁️"
  ]);
  
  const [activeMessage, setActiveMessage] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const isAngry = clickCount >= 5;
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mouse tracking for eyes
  const mouseX = useSpring(0, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(0, { stiffness: 150, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculate normalized direction (-1 to 1) with sensitivity
        const dx = (e.clientX - centerX) / (window.innerWidth / 3);
        const dy = (e.clientY - centerY) / (window.innerHeight / 3);
        
        mouseX.set(Math.max(-10, Math.min(10, dx * 10)));
        mouseY.set(Math.max(-10, Math.min(10, dy * 10)));
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const handleClick = () => {
    setClickCount(prev => prev + 1);
    const randomIndex = Math.floor(Math.random() * messages.length);
    setActiveMessage(messages[randomIndex]);
    
    // Clear message after 2.5s
    setTimeout(() => setActiveMessage(null), 2500);
  };

  return (
    <motion.div 
      layoutId={layoutId}
      className="relative group/robot" 
      ref={containerRef}
    >
      {/* Message Integrated into Body Belly */}
      <AnimatePresence>
        {activeMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="text-[6px] font-black text-slate-900 uppercase tracking-tighter text-center bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full border border-slate-200">
              {activeMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Robot Card Container */}
      <motion.div
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.02 }}
        animate={{ 
          y: [-5, 5, -5],
          rotate: isHovered ? [0, -1, 1, 0] : 0
        }}
        transition={{ 
          y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 0.2, repeat: isHovered ? 0 : 0 }
        }}
        className="cursor-pointer flex flex-col items-center gap-4 relative group transition-all"
      >
        {/* Glow behind robot */}
        <div className="absolute inset-0 bg-brand/5 rounded-[40px] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Robot Head/Body SVG */}
        <div className={`relative transition-all duration-500 ${
            size === 'xl' ? 'w-96 h-96' : 
            size === 'lg' ? 'w-64 h-64' : 
            size === 'md' ? 'w-32 h-32' : 'w-16 h-16'
        }`}>
            <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible">
                {/* Robot Body */}
                <motion.rect 
                    x="20" y="30" width="80" height="70" rx="20" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2"
                    animate={clickCount > 0 ? { x: [-2, 2, -2, 2, 0] } : {}}
                    transition={{ duration: 0.3 }}
                />
                <rect x="30" y="40" width="60" height="40" rx="12" fill={isAngry ? "#991b1b" : "#1E293B"} />
                
                {/* Screen Eyes */}
                <motion.g animate={{ scale: isHovered ? 1.2 : 1 }}>
                    {/* Left Eye Shell */}
                    <rect x="38" y="48" width="16" height="24" rx="4" fill={isAngry ? "#7f1d1d" : "#334155"} />
                    {/* Left Pupil */}
                    {isAngry ? (
                        <motion.path 
                            d="M 42 58 L 50 54" stroke="#fca5a5" strokeWidth="4" strokeLinecap="round"
                            animate={{ rotate: [-5, 5, -5] }}
                            transition={{ duration: 0.2, repeat: Infinity }}
                        />
                    ) : (
                        <motion.rect 
                            x="42" y="54" width="8" height="12" rx="2" fill="#38BDF8"
                            style={{ x: mouseX, y: mouseY }}
                            animate={{ height: [12, 1, 12, 12, 12] }} // Occasional blink
                            transition={{ duration: 3, repeat: Infinity, times: [0, 0.05, 0.1, 0.8, 1] }} 
                        />
                    )}
                    
                    {/* Right Eye Shell */}
                    <rect x="66" y="48" width="16" height="24" rx="4" fill={isAngry ? "#7f1d1d" : "#334155"} />
                    {/* Right Pupil */}
                    {isAngry ? (
                        <motion.path 
                            d="M 70 54 L 78 58" stroke="#fca5a5" strokeWidth="4" strokeLinecap="round"
                            animate={{ rotate: [5, -5, 5] }}
                            transition={{ duration: 0.2, repeat: Infinity }}
                        />
                    ) : (
                        <motion.rect 
                            x="70" y="54" width="8" height="12" rx="2" fill="#38BDF8"
                            style={{ x: mouseX, y: mouseY }}
                            animate={{ height: [12, 1, 12, 12, 12] }} // Shared blink logic
                            transition={{ duration: 3, repeat: Infinity, times: [0, 0.05, 0.1, 0.8, 1] }}
                        />
                    )}
                </motion.g>

                {/* Neural Pulse Antenna */}
                <rect x="58" y="10" width="4" height="20" fill="#94A3B8" />
                <motion.circle 
                    cx="60" cy="10" r="4" fill={isAngry ? "#ef4444" : "#38BDF8"}
                    animate={isAngry ? {
                        scale: [1, 1.6, 1],
                        opacity: [1, 0.8, 1]
                    } : { 
                        opacity: [1, 0.4, 1],
                        scale: [1, 1.4, 1],
                        fill: ['#38BDF8', '#818CF8', '#38BDF8']
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </svg>
        </div>

      </motion.div>
    </motion.div>
  );
};
