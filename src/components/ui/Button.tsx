import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = "px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-brand to-brand-dark text-white shadow-lg shadow-brand/30 hover:shadow-brand/50 hover:scale-[1.02]",
    secondary: "bg-white/40 backdrop-blur-md text-brand border border-brand/20 hover:bg-white/60 hover:border-brand/40 shadow-sm",
    outline: "border-2 border-brand text-brand hover:bg-brand hover:text-white",
    ghost: "text-brand hover:bg-brand/10"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : children}
    </motion.button>
  );
};
