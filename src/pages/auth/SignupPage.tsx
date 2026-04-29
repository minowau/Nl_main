import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/Layout/AuthLayout';

// Import the generated illustration
import educationIllustration from '../../assets/education_illustration.png';

export const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    schoolCode: ''
  });

  return (
    <AuthLayout
      illustration={
        <img src={educationIllustration} alt="Education Illustration" className="w-full h-full object-cover rounded-[2px]" />
      }
    >
      <div className="w-full h-full flex flex-col justify-center">
        <div className="flex justify-between items-center mb-8">
           <h2 className="text-3xl font-bold text-slate-800">Sign up</h2>
           <div className="text-sm text-slate-500">
             Already a member? <Link to="/login" className="text-[#1a73e8] font-semibold hover:underline">Sign In</Link>
           </div>
        </div>

        {/* Social Login Buttons */}
        <div className="flex gap-3 mb-8">
            <button className="flex-1 py-2 px-4 border border-slate-200 rounded-md flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-600">
               Sign up with Google
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
              <label className="text-sm font-bold text-slate-700">Full Name *</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                className="w-full px-4 py-3 bg-slate-200/60 rounded-md border-none focus:ring-2 focus:ring-[#1a73e8] outline-none text-slate-700 font-medium transition-all"
              />
          </div>

          <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">Phone/ Email/ Admission No *</label>
              <input
                type="text"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-3 bg-slate-200/60 rounded-md border-none focus:ring-2 focus:ring-[#1a73e8] outline-none text-slate-700 font-medium transition-all"
              />
          </div>
          
          <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">Password/ OTP *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="8+ characters"
                className="w-full px-4 py-3 bg-slate-200/60 rounded-md border-none focus:ring-2 focus:ring-[#1a73e8] outline-none text-slate-700 font-medium transition-all placeholder:text-slate-400 placeholder:font-normal"
              />
          </div>

          <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">School Code *</label>
              <input
                type="text"
                value={formData.schoolCode}
                onChange={(e) => setFormData({ ...formData, schoolCode: e.target.value })}
                required
                className="w-full px-4 py-3 bg-slate-200/60 rounded-md border-none focus:ring-2 focus:ring-[#1a73e8] outline-none text-slate-700 font-medium transition-all"
              />
          </div>

          <div className="flex items-start gap-2 py-2">
            <input type="checkbox" className="mt-1 w-4 h-4 rounded border-slate-300 text-[#1a73e8] focus:ring-[#1a73e8] accent-[#1a73e8]" />
            <span className="text-xs text-slate-500 leading-tight">
              Creating an account means you're okay with our <a href="#" className="text-[#1a73e8]">Terms of Service</a>, <a href="#" className="text-[#1a73e8]">Privacy Policy</a>, and our default <a href="#" className="text-[#1a73e8]">Notification Settings</a>.
            </span>
          </div>

          <div className="pt-2">
              <Link to="/dashboard" className="block w-full">
                  <button className="w-max px-8 py-3.5 text-base font-bold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-sm rounded-md transition-colors">
                    Create Account
                  </button>
              </Link>
          </div>
        </form>
        
        <div className="mt-auto pt-8 text-xs text-slate-400">
            This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.
        </div>
      </div>
    </AuthLayout>
  );
};
