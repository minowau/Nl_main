import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export const CustomCursor: React.FC = () => {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const [isHovering, setIsHovering] = useState(false);

  // Trailing Effect - Create 4 dots with staggered spring physics
  const trail1X = useSpring(cursorX, { damping: 20, stiffness: 200 });
  const trail1Y = useSpring(cursorY, { damping: 20, stiffness: 200 });
  
  const trail2X = useSpring(cursorX, { damping: 30, stiffness: 150 });
  const trail2Y = useSpring(cursorY, { damping: 30, stiffness: 150 });
  
  const trail3X = useSpring(cursorX, { damping: 40, stiffness: 100 });
  const trail3Y = useSpring(cursorY, { damping: 40, stiffness: 100 });

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isClickable = target.closest('button, a, input, select, [role="button"]');
      setIsHovering(!!isClickable);
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [cursorX, cursorY]);

  const trails = [
    { x: trail1X, y: trail1Y, scale: 0.8, opacity: 0.6, delay: 0 },
    { x: trail2X, y: trail2Y, scale: 0.6, opacity: 0.4, delay: 0.05 },
    { x: trail3X, y: trail3Y, scale: 0.4, opacity: 0.2, delay: 0.1 },
  ];

  return (
    <>
      <style>{`
        body, a, button, input, select {
          cursor: none !important;
        }
      `}</style>
      
      {/* Trailing Dots (The "Dragging" effect) */}
      {trails.map((trail, i) => (
        <motion.div
            key={i}
            className="fixed top-0 left-0 bg-brand rounded-full pointer-events-none z-[9996]"
            style={{
                width: 12,
                height: 12,
                x: trail.x,
                y: trail.y,
                scale: trail.scale,
                opacity: trail.opacity,
                translateX: '-50%',
                translateY: '-50%',
            }}
        />
      ))}

      {/* Main Lead Dot */}
      <motion.div
        className="fixed top-0 left-0 w-3 h-3 bg-brand rounded-full pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />

      {/* Pulsing Outer Ring */}
      <motion.div
        className="fixed top-0 left-0 w-10 h-10 border-2 border-brand/40 rounded-full pointer-events-none z-[9998]"
        animate={{
          scale: isHovering ? 1.6 : 1,
          borderColor: isHovering ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.3)',
          backgroundColor: isHovering ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0,0,0,0)',
        }}
        style={{
          x: trail1X,
          y: trail1Y,
          translateX: '-50%',
          translateY: '-50%',
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 150 }}
      />

      {/* Technical HUD Crosshair (Centered on lead) */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9997]"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-[1px] bg-brand/30"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-[1px] bg-brand/30"></div>
      </motion.div>
    </>
  );
};
