import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  icon?: LucideIcon;
  className?: string;
  id?: string;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  icon: Icon,
  className = '',
  id
}) => {
  const isPrimary = variant === 'primary';

  return (
    <>
      <motion.button
        id={id}
        onClick={onClick}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ 
          opacity: 1, 
          y: 0,
        }}
        transition={{
          opacity: { duration: 0.4 },
          y: { duration: 0.4, ease: "easeOut" }
        }}
        className={`
          relative overflow-hidden group flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl font-bold uppercase tracking-wider text-[11px] transition-all duration-300
          ${isPrimary 
            ? 'bg-brand hover:bg-brand-dark text-white shadow-lg shadow-brand/10 border border-white/10' 
            : 'bg-white border border-slate-200 text-slate-600 hover:border-brand/40 hover:text-brand shadow-sm'
          }
          ${className}
        `}
      >
        {/* Subtle Highlight (Primary) */}
        {isPrimary && (
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}

        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {Icon && <Icon size={16} className="transition-transform group-hover:rotate-0" />}
          {children}
        </span>

        {/* Professional Border Highlight */}
        {isPrimary && (
          <div className="absolute inset-x-0 inset-y-0 border border-white/20 rounded-xl pointer-events-none" />
        )}
      </motion.button>
    </>
  );
};
