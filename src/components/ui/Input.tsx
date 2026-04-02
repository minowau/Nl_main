import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  type?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, type = 'text', className = '', ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={`relative w-full mb-6 ${className}`}>
      <div className={`
        relative flex items-center transition-all duration-300 rounded-2xl border
        ${isFocused ? 'border-brand ring-4 ring-brand/10' : 'border-slate-200'}
        bg-white/60 backdrop-blur-md overflow-hidden
      `}>
        <input
          {...props}
          type={isPassword && showPassword ? 'text' : type}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className="peer w-full px-4 py-3 bg-transparent text-slate-800 outline-none placeholder-transparent"
          placeholder={label}
        />
        
        <label className={`
          absolute left-4 transition-all duration-300 pointer-events-none text-slate-400
          ${(isFocused || props.value) ? '-top-2 text-xs text-brand font-bold bg-white px-2 rounded-full shadow-sm' : 'top-3.5 text-base'}
        `}>
          {label}
        </label>

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="p-3 text-slate-400 hover:text-brand transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-red-400 text-sm mt-1 px-2"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};
