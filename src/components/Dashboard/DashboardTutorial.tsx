import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RobotAssistant } from './RobotAssistant';
import { X, ChevronRight, CheckCircle2 } from 'lucide-react';

interface TutorialStep {
  targetId: string;
  title: string;
  description: string;
  robotMessage: string;
  offset: { x: number; y: number };
}

const dashboardSteps: TutorialStep[] = [
  {
    targetId: 'hero-title',
    title: 'Mission Control',
    description: 'Welcome to your central command. This is where high-level objectives are deployed.',
    robotMessage: "Systems ONLINE! I'm your tactical interface. Let's start the tour!",
    offset: { x: 50, y: 150 }
  },
  {
    targetId: 'progress-bar',
    title: 'Neural Synchronization',
    description: 'Your level progress represents your synchronization with the core matrix.',
    robotMessage: "Keep this bar full! We need maximum sync for deep-dive missions.",
    offset: { x: 50, y: 100 }
  },
  {
    targetId: 'missions-matrix',
    title: 'Mission Matrix',
    description: 'Select a node to begin deployment. Each card acts as a secure cover page for your mission intel.',
    robotMessage: "The Matrix is loaded with fresh intel! Overload these nodes to gain XP.",
    offset: { x: -350, y: -50 }
  },
  {
    targetId: 'intel-feed',
    title: 'Intel Feed',
    description: 'Direct streams from the NLP Academy. Stay sharp with decrypted field reports.',
    robotMessage: "Intel is power, recruit! Check the feed before every mission.",
    offset: { x: 50, y: -250 }
  }
];

const navigatorSteps: TutorialStep[] = [
  {
    targetId: 'matrix-grid',
    title: 'Navigator Matrix',
    description: 'Interact with the 2D grid to navigate through complex neural architectures.',
    robotMessage: "Check the grid! We use DQN algorithms here to find the optimal learning path.",
    offset: { x: 200, y: 200 }
  },
  {
    targetId: 'control-center',
    title: 'Control Center',
    description: 'Analyze your progress, manage bookmarks, and run simulations.',
    robotMessage: "This is the brain! Run simulations to see how the agent optimizes objectives.",
    offset: { x: -400, y: 100 }
  }
];

interface DashboardTutorialProps {
  onComplete: () => void;
  page?: 'dashboard' | 'navigator';
}

const DashboardTutorial: React.FC<DashboardTutorialProps> = ({ onComplete, page = 'dashboard' }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [robotPos, setRobotPos] = useState({ x: 0, y: 0 });
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const steps = page === 'dashboard' ? dashboardSteps : navigatorSteps;

  useEffect(() => {
    const updatePosition = () => {
      const step = steps[currentStep];
      if (!step) return;
      
      const element = document.getElementById(step.targetId);
      if (element) {
        // Scroll element into view first
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Small delay to allow scroll to complete before measuring
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          setTargetRect(rect);
          
          // Calculate desired positions
          let nx = rect.left + step.offset.x;
          let ny = rect.top + step.offset.y;

          // Viewport clamping (Robot is ~100x100 scaled 2x = 200x200)
          const margin = 20;
          nx = Math.max(margin, Math.min(nx, window.innerWidth - 220));
          ny = Math.max(margin, Math.min(ny, window.innerHeight - 220));

          setRobotPos({ x: nx, y: ny });
        }, 600); 
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [currentStep, steps]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[110] pointer-events-none overflow-hidden">
      {/* Dynamic Reveal Highlight */}
      <AnimatePresence>
          {targetRect && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] pointer-events-auto"
                style={{
                    clipPath: `polygon(
                        0% 0%, 0% 100%, 
                        ${targetRect.left - 20}px 100%, 
                        ${targetRect.left - 20}px ${targetRect.top - 20}px, 
                        ${targetRect.right + 20}px ${targetRect.top - 20}px, 
                        ${targetRect.right + 20}px ${targetRect.bottom + 20}px, 
                        ${targetRect.left - 20}px ${targetRect.bottom + 20}px, 
                        ${targetRect.left - 20}px 100%, 
                        100% 100%, 100% 0%
                    )`
                }}
                onClick={onComplete}
              />
          )}
      </AnimatePresence>

      {/* Moving Robot Assistant */}
      <motion.div 
        animate={{ 
            x: robotPos.x, 
            y: robotPos.y,
            scale: 2
        }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="absolute top-0 left-0"
      >
        <RobotAssistant tutorialMessage={step?.robotMessage || "Synchronizing..."} />
      </motion.div>

      {/* Instructional Speech Bubble */}
      <motion.div 
        animate={{ 
            x: Math.max(20, Math.min(robotPos.x + 100, window.innerWidth - 340)), 
            y: Math.max(20, Math.min(robotPos.y - 180, window.innerHeight - 250))
        }}
        transition={{ type: "spring", stiffness: 80, damping: 20 }}
        className="absolute top-0 left-0 w-80 bg-white rounded-[32px] p-6 shadow-2xl border-4 border-brand/20 pointer-events-auto"
      >
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">{step?.title}</h3>
            <button onClick={onComplete} className="text-slate-300 hover:text-brand transition-colors">
                <X size={16} />
            </button>
        </div>
        
        <p className="text-slate-500 text-sm italic mb-6">"{step?.description}"</p>

        <div className="flex items-center justify-between">
            <div className="flex gap-1">
                {steps.map((_, idx) => (
                    <div 
                        key={idx}
                        className={`h-1 rounded-full transition-all ${idx === currentStep ? 'w-4 bg-brand' : 'w-1 bg-slate-200'}`}
                    />
                ))}
            </div>
            <button 
                onClick={nextStep}
                className="bg-brand text-white px-5 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 hover:bg-brand-light transition-all shadow-lg active:scale-95"
            >
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'} 
                {currentStep === steps.length - 1 ? <CheckCircle2 size={12} /> : <ChevronRight size={12} />}
            </button>
        </div>

        {/* Tail for the speech bubble */}
        <div className="absolute -bottom-4 left-10 w-8 h-8 bg-white border-b-4 border-l-4 border-brand/20 rotate-[-45deg] rounded-bl-xl" />
      </motion.div>

      {/* Skip Button */}
      <button 
        onClick={onComplete}
        className="absolute bottom-12 right-12 px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white border border-white/5 pointer-events-auto"
      >
        Skip Tutorial
      </button>
    </div>
  );
};

export default DashboardTutorial;
