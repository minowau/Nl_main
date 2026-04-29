import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  illustration?: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, illustration }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0ea5e9] p-4 sm:p-8 font-['Poppins'] relative overflow-hidden">
      {/* Dynamic Background Arcs & Accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[80%] h-[120%] rounded-full border-[80px] border-[#0284c7]/20 opacity-60" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[100%] rounded-full border-[60px] border-[#0284c7]/20 opacity-60" />
        <div className="absolute top-1/4 left-1/4 w-[40%] h-[60%] rounded-full border-[40px] border-[#38bdf8]/10 opacity-50" />
      </div>

      {/* Lanyard/Strap Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-0 w-full max-w-5xl">
        <div className="relative w-full flex justify-center">
            {/* Left Strap */}
            <div className="absolute top-0 w-12 h-32 bg-slate-200 transform origin-top -rotate-[25deg] shadow-[0_10px_20px_rgba(0,0,0,0.15)] rounded-b-md z-0" style={{ left: '42%' }} />
            {/* Right Strap */}
            <div className="absolute top-0 w-12 h-32 bg-slate-100 transform origin-top rotate-[25deg] shadow-[0_10px_20px_rgba(0,0,0,0.1)] rounded-b-md z-0" style={{ right: '42%' }} />
        </div>
      </div>

      {/* ID Card Container */}
      <div className="relative z-10 w-full max-w-5xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[700px] mt-12 border-4 border-white">
        
        {/* Card Hole (Badge Slot) */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#0ea5e9] rounded-full shadow-[inset_0_3px_6px_rgba(0,0,0,0.3)] z-20 border-b-2 border-slate-200" />
        
        {/* Left Side (Illustration + Barcode) */}
        {illustration && (
          <div className="w-full lg:w-1/2 p-10 flex flex-col justify-between relative bg-white overflow-hidden">
             
             {/* Faint Arcs on the ID Card Background */}
             <div className="absolute top-[-20%] left-[-30%] w-[150%] h-[120%] rounded-full border-[60px] border-[#f8fafc] opacity-80 pointer-events-none z-0" />
             <div className="absolute top-[30%] left-[-40%] w-[120%] h-[100%] rounded-full border-[40px] border-[#f1f5f9] opacity-60 pointer-events-none z-0" />

             {/* Logo/Heading */}
             <div className="flex items-center gap-3 mb-4 pt-4 pl-4 relative z-10">
                 <div className="w-8 h-8 bg-slate-200 rotate-45 rounded-sm flex items-center justify-center shadow-sm">
                    <div className="w-4 h-4 bg-slate-400 -rotate-45" />
                 </div>
                 <h1 className="text-xl font-bold text-slate-400 tracking-wider uppercase drop-shadow-sm">Navigated Learning</h1>
             </div>
             
             {/* Illustration Area with Dashed Bounding Box */}
             <div className="flex-1 flex flex-col items-center justify-center relative mt-4 mb-4 w-full z-10">
               <div className="relative w-full max-w-[360px] aspect-square flex items-center justify-center">
                 {/* The Crop Marks & Dashed Border Container */}
                 <div className="absolute inset-[-16px] pointer-events-none z-20">
                   {/* Crop Marks (corners) */}
                   <div className="absolute top-0 left-0 w-6 h-6 border-t-[2.5px] border-l-[2.5px] border-slate-400 rounded-tl-sm" />
                   <div className="absolute top-0 right-0 w-6 h-6 border-t-[2.5px] border-r-[2.5px] border-slate-400 rounded-tr-sm" />
                   <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[2.5px] border-l-[2.5px] border-slate-400 rounded-bl-sm" />
                   <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[2.5px] border-r-[2.5px] border-slate-400 rounded-br-sm" />
                   
                   {/* Dashed Border sitting perfectly on the edge of the image */}
                   {/* Since the image is inset by 16px relative to this container, the dashed border should be inset by 16px as well to touch the image */}
                   <div className="absolute inset-[16px] border-[2px] border-dashed border-slate-300 rounded-sm" />
                 </div>
                 
                 {/* Illustration bounded perfectly inside the box */}
                 <div className="relative z-10 w-full h-full">
                    {illustration}
                 </div>
               </div>
             </div>

             {/* Barcode */}
             <div className="mt-8 mb-4 flex justify-center w-full relative z-10">
                <div className="w-4/5 h-10 flex justify-between items-end opacity-25 drop-shadow-sm">
                  {Array.from({ length: 45 }).map((_, i) => {
                    const isThick = Math.random() > 0.7;
                    const isTall = Math.random() > 0.3;
                    return (
                      <div 
                        key={i} 
                        className="bg-slate-800 rounded-sm" 
                        style={{ 
                          width: isThick ? '4px' : '2px', 
                          height: isTall ? '100%' : '70%' 
                        }} 
                      />
                    );
                  })}
                </div>
             </div>
          </div>
        )}

        {/* Right Side (Form) */}
        <div className={`w-full ${illustration ? 'lg:w-1/2' : ''} px-10 py-12 lg:px-16 flex flex-col bg-white pt-24 relative z-10`}>
          {children}
        </div>
      </div>
    </div>
  );
};
