import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  illustration?: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, illustration }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] overflow-hidden relative font-['Poppins']">
      {/* Dynamic Background Gradients - Lighter & Softer */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-light/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-[#E0E7FF]/20 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 z-10 flex items-center justify-center">
        <div className="flex w-full max-w-5xl bg-white/40 backdrop-blur-md rounded-[40px] border border-white/60 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
          {/* Illustration Side (Desktop) */}
          {illustration && (
            <div className="hidden lg:flex lg:w-1/2 p-12 items-center justify-center bg-gradient-to-br from-brand/5 to-brand-dark/5 border-r border-white/40">
              {illustration}
            </div>
          )}

          {/* Form Side */}
          <div className={`w-full ${illustration ? 'lg:w-1/2' : ''} p-8 lg:p-12`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
