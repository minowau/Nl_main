import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  animate?: any;
  transition?: any;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', ...props }) => {
  return (
    <motion.div
      {...props}
      className={`
        bg-white/70 backdrop-blur-xl border border-white/40 
        shadow-[0_8px_32px_0_rgba(108,99,255,0.1)] 
        rounded-3xl p-8 ${className}
      `}
    >
      {children}
    </motion.div>
  );
};
