import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export const Particles: React.FC<{ count?: number; color?: string }> = ({ 
  count = 20, 
  color = 'rgba(59, 130, 246, 0.1)' 
}) => {
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 10,
    }));
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ 
            opacity: 0, 
            x: `${p.x}%`, 
            y: `${p.y}%` 
          }}
          animate={{
            opacity: [0, 1, 0],
            y: [`${p.y}%`, `${p.y - 20}%`],
            x: [`${p.x}%`, `${p.x + (Math.random() - 0.5) * 10}%`]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear"
          }}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}`
          }}
        />
      ))}
    </div>
  );
};
