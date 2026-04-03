import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface MascotProps {
  type: 'fox' | 'owl' | 'robot';
  isPasswordFocused: boolean;
  mousePos: { x: number; y: number };
}

export const Mascot: React.FC<MascotProps> = ({ type, isPasswordFocused, mousePos }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate pixel distance for more responsive tracking
      const distX = mousePos.x - centerX;
      const distY = mousePos.y - centerY;
      
      // Max displacement 
      const maxMove = 12;
      const dx = Math.max(-maxMove, Math.min(maxMove, distX / 30));
      const dy = Math.max(-maxMove, Math.min(maxMove, distY / 30));
      
      setTargetPos({ x: dx, y: dy });
    }
  }, [mousePos]);

  const x = useSpring(targetPos.x, { stiffness: 100, damping: 25 });
  const y = useSpring(targetPos.y, { stiffness: 100, damping: 25 });

  const renderMascot = () => {
    switch (type) {
      case 'fox':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl overflow-visible">
            <defs>
              <clipPath id="fox-eye-left">
                <circle cx="40" cy="62" r="6" />
              </clipPath>
              <clipPath id="fox-eye-right">
                <circle cx="60" cy="62" r="6" />
              </clipPath>
            </defs>
            {/* Body */}
            <motion.path 
                d="M20 80 Q50 95 80 80 Q90 60 80 40 Q50 30 20 40 Q10 60 20 80" 
                fill="#FF6B35" 
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
            />
            {/* Ears */}
            <path d="M25 45 L15 20 L40 35" fill="#FF6B35" />
            <path d="M75 45 L85 20 L60 35" fill="#FF6B35" />
            
            {/* Face White */}
            <path d="M30 65 Q50 75 70 65 Q65 50 35 50 Z" fill="white" />

            {/* Eyes */}
            <motion.g animate={isPasswordFocused ? { scaleY: 0, scaleX: 1.2 } : { scaleY: 1, scaleX: 1 }}>
                {/* Left Eye */}
                <circle cx="40" cy="62" r="6" fill="white" />
                <motion.circle 
                    cx={40} cy={62} r="3.5" fill="#1A1A1A" 
                    clipPath="url(#fox-eye-left)"
                    style={{ x: useTransform(x, v => v * 0.4), y: useTransform(y, v => v * 0.4) }} 
                />
                {/* Right Eye */}
                <circle cx="60" cy="62" r="6" fill="white" />
                <motion.circle 
                    cx={60} cy={62} r="3.5" fill="#1A1A1A"
                    clipPath="url(#fox-eye-right)"
                    style={{ x: useTransform(x, v => v * 0.4), y: useTransform(y, v => v * 0.4) }}
                />
            </motion.g>

            <motion.g 
                initial={{ y: 20, opacity: 0 }}
                animate={isPasswordFocused ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                <path d="M30 85 Q35 70 45 75" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" fill="none" />
                <path d="M70 85 Q65 70 55 75" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" fill="none" />
            </motion.g>
          </svg>
        );
      case 'owl':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl overflow-visible">
            <defs>
              <clipPath id="owl-eye-left">
                <circle cx="35" cy="50" r="15" />
              </clipPath>
              <clipPath id="owl-eye-right">
                <circle cx="65" cy="50" r="15" />
              </clipPath>
            </defs>
            {/* Body */}
            <motion.ellipse 
                cx="50" cy="60" rx="35" ry="30" fill="#4A4E69"
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
            />
            {/* Big Eyes Shell */}
            <circle cx="35" cy="50" r="15" fill="white" />
            <circle cx="65" cy="50" r="15" fill="white" />
            
            {/* Pupils */}
            <motion.g animate={isPasswordFocused ? { scaleY: 0.1 } : { scaleY: 1 }}>
                <motion.circle 
                    cx="35" cy="50" r="9" fill="#22223B"
                    clipPath="url(#owl-eye-left)"
                    style={{ x: useTransform(x, v => v * 0.6), y: useTransform(y, val => val * 0.8) }}
                />
                <motion.circle 
                    cx="65" cy="50" r="9" fill="#22223B"
                    clipPath="url(#owl-eye-right)"
                    style={{ x: useTransform(x, v => v * 0.6), y: useTransform(y, val => val * 0.8) }}
                />
            </motion.g>
            
            <path d="M45 60 L50 70 L55 60" fill="#F4A261" />

            <motion.path 
                d="M15 60 Q0 40 35 45" 
                fill="none" stroke="#4A4E69" strokeWidth="8" strokeLinecap="round"
                animate={isPasswordFocused ? { d: "M15 60 Q20 30 40 45" } : { d: "M15 60 Q0 40 35 45" }}
            />
            <motion.path 
                d="M85 60 Q100 40 65 45" 
                fill="none" stroke="#4A4E69" strokeWidth="8" strokeLinecap="round"
                animate={isPasswordFocused ? { d: "M85 60 Q80 30 60 45" } : { d: "M85 60 Q100 40 65 45" }}
            />
          </svg>
        );
      case 'robot':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl overflow-visible">
            <defs>
              <clipPath id="robot-screen">
                <rect x="25" y="35" width="50" height="40" rx="8" />
              </clipPath>
            </defs>
            {/* Case (Midnight Slate) */}
            <defs>
                <radialGradient id="robot-mascot-shine" cx="50%" cy="40%" r="50%" fx="50%" fy="40%">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#1E293B" />
                </radialGradient>
            </defs>
            <motion.rect 
                x="20" y="30" width="60" height="50" rx="12" 
                fill="url(#robot-mascot-shine)"
                stroke="#0F172A" strokeWidth="2"
                animate={{ rotate: [-0.5, 0.5, -0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <rect x="25" y="35" width="50" height="40" rx="8" fill="#020617" />
            
            {/* Screen Eyes (Proper SVG Rects) */}
            <motion.g 
                clipPath="url(#robot-screen)"
                animate={isPasswordFocused ? { opacity: 0 } : { opacity: 1 }}
            >
                {/* Left Eye */}
                <motion.rect 
                    x="35" y="48" width="8" height="12" rx="2" fill="#64748B"
                    style={{ x: useTransform(x, v => v * 0.4), y: useTransform(y, v => v * 0.4) }}
                    animate={{ height: [12, 1, 12] }}
                    transition={{ times: [0, 0.05, 0.1], duration: 3, repeat: Infinity, repeatDelay: 2 }}
                />
                {/* Right Eye */}
                <motion.rect 
                    x="57" y="48" width="8" height="12" rx="2" fill="#64748B"
                    style={{ x: useTransform(x, v => v * 0.4), y: useTransform(y, v => v * 0.4) }}
                    animate={{ height: [12, 1, 12] }}
                    transition={{ times: [0, 0.05, 0.1], duration: 3, repeat: Infinity, repeatDelay: 2 }}
                />
            </motion.g>

            <motion.text 
                x="50" y="60" textAnchor="middle" fill="#EF4444" fontSize="10" fontWeight="black"
                initial={{ opacity: 0 }}
                animate={isPasswordFocused ? { opacity: 1 } : { opacity: 0 }}
            >
                ENCRYPTED
            </motion.text>
            
            <rect x="48" y="15" width="4" height="15" fill="#94A3B8" />
            <motion.circle 
                cx="50" cy="15" r="4" fill="#64748B"
                animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            />
          </svg>
        );
    }
  };

  return (
    <motion.div 
      ref={containerRef}
      className="w-32 h-32 lg:w-48 lg:h-48 flex items-center justify-center pointer-events-none"
      style={{
        x: useTransform(x, v => v * 0.6),
        y: useTransform(y, v => v * 0.6),
        rotate: useTransform(x, v => v * 0.3),
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {renderMascot()}
    </motion.div>
  );
};
