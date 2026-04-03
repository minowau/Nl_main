import React, { useState, useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Github, Mail, Zap } from 'lucide-react';
import { AuthLayout } from '../../components/Layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Particles } from '../../components/ui/Particles';
import { Mascot } from '../../components/ui/Mascot';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  
  // High-performance mouse tracking (only for eyes now)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [mouseX, mouseY]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <AuthLayout
      illustration={
        <div className="relative w-full h-full min-h-[400px] flex items-center justify-center">
          {/* Removed Particles from illustration slot to eliminate stray dots */}
          
          {/* Animated Mascot Cluster - Central Focus */}
          <div className="relative z-20 w-full max-w-sm aspect-square flex items-center justify-center">
            {/* Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand/20 rounded-full blur-[100px] animate-pulse" />
            
            {/* The Mascots (Statics bodies, moving eyes) */}
            <div className="relative z-10 grid grid-cols-1 gap-12 items-center justify-items-center">
                <motion.div 
                    className="transform scale-[2.5]"
                >
                    <Mascot type="owl" isPasswordFocused={isPasswordFocused} mousePos={mousePos} />
                </motion.div>
                
                <div className="flex gap-20 mt-8">
                    <motion.div className="scale-[1.8] opacity-90">
                        <Mascot type="fox" isPasswordFocused={isPasswordFocused} mousePos={mousePos} />
                    </motion.div>
                    <motion.div className="scale-[1.6] opacity-70">
                        <Mascot type="robot" isPasswordFocused={isPasswordFocused} mousePos={mousePos} />
                    </motion.div>
                </div>
            </div>

            {/* Decorative Floating Elements */}
            <motion.div
                animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-10 right-10 w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center justify-center shadow-2xl"
            >
                <Zap size={24} className="text-brand-light" />
            </motion.div>
          </div>
        </div>
      }
    >
      <div className="w-full relative">
        <Particles count={15} color="rgba(15, 23, 42, 0.05)" />
        
        <div className="mb-12">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-black text-brand tracking-widest uppercase mb-2"
          >
            Navigated Learning
          </motion.h1>
          <div className="h-1 w-12 bg-brand rounded-full" />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-3 mb-3">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
                <div className="px-3 py-1 bg-brand/10 text-brand rounded-full text-[10px] font-black uppercase tracking-widest border border-brand/20">
                    Lvl 01 Required
                </div>
            </div>
            <p className="text-slate-500 mb-10 text-lg font-medium italic">"Continue your learning journey where you left off."</p>
          </motion.div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <motion.div variants={itemVariants}>
                <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsPasswordFocused(false)}
                required
                />
            </motion.div>
            
            <motion.div variants={itemVariants}>
                <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                required
                />
            </motion.div>

            <motion.div variants={itemVariants} className="flex items-center justify-between mb-8 py-2">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand accent-brand" />
                <span className="group-hover:text-brand transition-colors font-medium">Keep me signed in</span>
              </label>
              <Link to="/forgot-password" title="Forgot Password Page" className="text-sm font-semibold text-brand hover:text-brand-dark transition-colors underline-offset-4 hover:underline">
                Forgot Password?
              </Link>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Link to="/dashboard" className="block w-full">
                    <Button className="w-full py-4.5 text-lg shadow-xl shadow-brand/20">
                    Log In to Dashboard
                    </Button>
                </Link>
            </motion.div>

            <motion.div variants={itemVariants} className="relative my-12">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-6 bg-[#F8FAFC]/0 backdrop-blur-sm text-slate-400 font-medium italic">or sign in with</span>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
              <Button variant="secondary" className="w-full py-3.5">
                <Mail size={20} />
                <span className="font-semibold">Google</span>
              </Button>
              <Button variant="secondary" className="w-full py-3.5">
                <Github size={20} />
                <span className="font-semibold">GitHub</span>
              </Button>
            </motion.div>

            <motion.p variants={itemVariants} className="text-center mt-12 text-slate-500 font-medium">
              New here?{' '}
              <Link to="/signup" title="Signup Page" className="text-brand hover:text-brand-dark font-bold transition-colors">
                Create a Free Account
              </Link>
            </motion.p>
          </form>
        </motion.div>
      </div>
    </AuthLayout>
  );
};
