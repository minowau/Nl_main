import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/Layout/AuthLayout';

// Import the generated illustration
import { educationIllustration } from '../../assets/education_illustration';

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [schoolCode, setSchoolCode] = useState('');

  return (
    <AuthLayout
      illustration={
        <img src={educationIllustration} alt="Education Illustration" className="w-full h-full object-cover rounded-[2px]" />
      }
    >
      <div className="w-full h-full flex flex-col justify-center">
        <div className="flex justify-between items-center mb-8">
           <h2 className="text-3xl font-bold text-slate-800">Sign In</h2>
           <div className="text-sm text-slate-500">
             New member? <Link to="/signup" className="text-[#1a73e8] font-semibold hover:underline">Sign Up</Link>
           </div>
        </div>

        {/* Social Login Buttons */}
        <div className="flex gap-3 mb-8">
            <button className="flex-1 py-2 px-4 border border-slate-200 rounded-md flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-600">
               Sign in with Google
            </button>
            <button className="py-2 px-4 border border-slate-200 rounded-md flex items-center justify-center hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-600">
               GitHub
            </button>
        </div>

        <div className="flex items-center gap-4 mb-8">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-sm text-slate-400 font-medium">Or</span>
            <div className="h-px bg-slate-200 flex-1"></div>
        </div>

        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">Phone/ Email/ Admission No *</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-200/60 rounded-md border-none focus:ring-2 focus:ring-[#1a73e8] outline-none text-slate-700 font-medium transition-all"
              />
          </div>
          
          <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">Password/ OTP *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-200/60 rounded-md border-none focus:ring-2 focus:ring-[#1a73e8] outline-none text-slate-700 font-medium transition-all"
              />
          </div>

          <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">School Code *</label>
              <input
                type="text"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-200/60 rounded-md border-none focus:ring-2 focus:ring-[#1a73e8] outline-none text-slate-700 font-medium transition-all"
              />
          </div>

          <div className="flex items-center justify-between py-2">
            <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#1a73e8] focus:ring-[#1a73e8] accent-[#1a73e8]" />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" title="Forgot Password Page" className="text-sm font-semibold text-[#1a73e8] hover:underline">
              Forgot Password?
            </Link>
          </div>

          <div className="pt-4">
              <Link to="/dashboard" className="block w-full">
                  <button className="w-full py-3.5 text-base font-bold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-sm rounded-md transition-colors">
                    Sign In
                  </button>
              </Link>
          </div>
        </form>
        
        <div className="mt-auto pt-8 text-xs text-slate-400 text-center">
            This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.
        </div>
      </div>
    </AuthLayout>
  );
};
