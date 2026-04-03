import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Send } from 'lucide-react';
import { AuthLayout } from '../../components/Layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1500));
    setIsLoading(false);
    setStep(2);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto">
        <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-brand transition-all mb-10 group font-semibold"
            title="Back to Login"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Return to Login
        </Link>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
            >
              <motion.div variants={itemVariants}>
                <h2 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Forgot Password? 🔒</h2>
                <p className="text-slate-500 mb-10 text-lg">
                  Don't worry, even geniuses forget! Enter your email to recover your account.
                </p>
              </motion.div>

              <form onSubmit={handleSendLink} className="space-y-8">
                <motion.div variants={itemVariants}>
                    <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    />
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Button className="w-full py-4.5 text-lg shadow-xl shadow-brand/10" isLoading={isLoading}>
                    <Send size={18} />
                    Send Reset Connection
                    </Button>
                </motion.div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <motion.div variants={itemVariants} className="flex justify-center mb-8">
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-green-500"
                >
                  <CheckCircle2 size={56} />
                </motion.div>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <h2 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Check Your Inbox</h2>
                <p className="text-slate-500 mb-10 text-lg px-2">
                  We've beamed a secure 6-digit code to <br />
                  <span className="text-brand font-bold">{email}</span>
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="flex justify-between gap-3 mb-10">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    className="w-full aspect-square bg-white border-2 border-slate-200 rounded-2xl text-center text-2xl font-bold text-slate-800 focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all shadow-sm"
                  />
                ))}
              </motion.div>

              <motion.div variants={itemVariants}>
                <Button className="w-full py-4.5 text-lg shadow-xl shadow-brand/20 mb-6">
                    Verify & Reset
                </Button>
              </motion.div>

              <motion.p variants={itemVariants} className="text-slate-400 font-medium">
                Resend code in <span className="text-brand font-bold">59s</span>
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
};
