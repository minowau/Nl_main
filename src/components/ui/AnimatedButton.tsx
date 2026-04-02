import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  icon?: LucideIcon;
  className?: string;
  id?: string;
  glow?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  icon: Icon,
  className = '',
  id,
  glow = false
}) => {
  const isPrimary = variant === 'primary';
  const [clickParticles, setClickParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleInternalClick = (e: React.MouseEvent) => {
    const newId = Date.now();
    // Spawn multiple particles for a "sparkle" effect
    const particles = Array.from({ length: 3 }).map((_, i) => ({
        id: newId + i,
        x: e.clientX + (Math.random() - 0.5) * 40,
        y: e.clientY + (Math.random() - 0.5) * 40,
        delay: i * 0.1
    }));
    
    setClickParticles(prev => [...prev, ...particles]);
    setTimeout(() => setClickParticles(prev => prev.filter(p => !particles.find(part => part.id === p.id))), 1000);
    
    if (onClick) onClick();
  };

  return (
    <>
      <motion.button
        id={id}
        onClick={handleInternalClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          boxShadow: glow ? [
            "0 0 15px rgba(99, 102, 241, 0.4)",
            "0 0 30px rgba(99, 102, 241, 0.8)",
            "0 0 15px rgba(99, 102, 241, 0.4)"
          ] : "0 0 0px rgba(0,0,0,0)"
        }}
        transition={{
          boxShadow: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          },
          opacity: { duration: 0.5 },
          y: { duration: 0.5 }
        }}
        className={`
          relative overflow-hidden group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-300
          ${isPrimary 
            ? 'bg-gradient-to-r from-brand to-indigo-600 text-white shadow-xl shadow-brand/20 border border-white/10' 
            : 'bg-white/10 backdrop-blur-xl border border-white/20 text-slate-800 hover:text-brand'
          }
          ${className}
        `}
      >
        {/* Glow Effect Surround (Primary) */}
        {isPrimary && (
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
        )}

        {/* Shine Sweep (Secondary) */}
        {!isPrimary && (
          <motion.div 
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full skew-x-12"
          />
        )}

        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {Icon && <Icon size={18} className="transition-transform group-hover:rotate-12" />}
          {children}
        </span>

        {/* Animated Border Gradient Overlay (Subtle) */}
        {isPrimary && (
          <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
        )}
      </motion.button>
      
      <AnimatePresence>
        {clickParticles.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, y: p.y, x: p.x, scale: 0 }}
            animate={{ opacity: 0, y: p.y - 100, scale: 1.2, rotate: 15 }}
            exit={{ opacity: 0 }}
            className="fixed pointer-events-none z-[9999] flex items-center gap-1"
          >
            <div className="w-2 h-2 bg-brand-light rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            <span className="text-white font-black text-[10px] px-2 py-0.5 bg-brand rounded-full shadow-2xl border border-white/20">+10 XP</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  );
};
