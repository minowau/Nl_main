import React, { useState, useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Github, Mail, UserPlus } from 'lucide-react';
import { AuthLayout } from '../../components/Layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Particles } from '../../components/ui/Particles';
import { Mascot } from '../../components/ui/Mascot';

export const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  
  // High-performance mouse tracking (only for eyes)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let strength = 0;
    if (formData.password.length > 6) strength += 25;
    if (/[A-Z]/.test(formData.password)) strength += 25;
    if (/[0-9]/.test(formData.password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(formData.password)) strength += 25;
    setPasswordStrength(strength);
  }, [formData.password]);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [mouseX, mouseY]);

  const strengthColor = passwordStrength <= 25 ? 'bg-red-500' : passwordStrength <= 50 ? 'bg-orange-500' : passwordStrength <= 75 ? 'bg-yellow-500' : 'bg-green-500';

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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-brand-light/20 rounded-full blur-[100px] animate-pulse" />
            
            {/* The Mascots (Static bodies, moving eyes) */}
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
                animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-10 left-10 w-16 h-16 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 flex items-center justify-center shadow-2xl"
            >
                <UserPlus size={28} className="text-brand-dark" />
            </motion.div>
          </div>
        </div>
      }
    >
      <div className="w-full relative">
        <Particles count={15} color="rgba(15, 23, 42, 0.05)" />

        <div className="mb-10">
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
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Initiation</h2>
                <div className="px-3 py-1 bg-brand-light text-brand-dark rounded-full text-[10px] font-black uppercase tracking-widest border border-brand/20">
                    Create Account
                </div>
            </div>
            <p className="text-slate-500 mb-8 text-lg font-medium italic">"Every expert was once a recruit. Your journey begins here."</p>
          </motion.div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <motion.div variants={itemVariants}>
                <Input
                label="Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                onFocus={() => setIsPasswordFocused(false)}
                required
                />
            </motion.div>

            <motion.div variants={itemVariants}>
                <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onFocus={() => setIsPasswordFocused(false)}
                required
                />
            </motion.div>
            
            <motion.div variants={itemVariants} className="space-y-2 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    required
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    required
                  />
                </div>
                
                <div className="px-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                    <span>Password Security</span>
                    <span>{passwordStrength}%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full ${strengthColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="pt-2">
                <Link to="/dashboard" className="block w-full">
                    <Button className="w-full py-4.5 text-lg shadow-xl shadow-brand/20 uppercase font-black tracking-widest">
                        Create Profile
                    </Button>
                </Link>
            </motion.div>

            <motion.div variants={itemVariants} className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-6 bg-[#F8FAFC]/0 backdrop-blur-sm text-slate-400 font-medium italic">or join with</span>
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

            <motion.p variants={itemVariants} className="text-center mt-10 text-slate-500 font-medium">
              Already a member?{' '}
              <Link to="/login" title="Login Page" className="text-brand hover:text-brand-dark font-bold transition-colors">
                Get Started
              </Link>
            </motion.p>
          </form>
        </motion.div>
      </div>
    </AuthLayout>
  );
};
