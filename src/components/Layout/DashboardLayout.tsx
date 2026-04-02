import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  BookOpen, 
  Bookmark, 
  Settings, 
  LogOut, 
  Search, 
  Bell, 
  Menu, 
  X,
  ChevronRight
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: BookOpen, label: 'Navigator', path: '/navigator' },
  { icon: Bookmark, label: 'Resources', path: '/resources' },
  { icon: Settings, label: 'Settings', path: '#' },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-800 font-['Poppins'] overflow-hidden flex transition-colors duration-500">
      {/* Background Blobs - Subtle & Airy */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-light/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar - Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 88 }}
        className="hidden lg:flex flex-col bg-white/60 backdrop-blur-xl border-r border-slate-200 relative z-30 h-screen transition-all duration-300 shadow-xl shadow-slate-200/50"
      >
        <div className="p-6 flex items-center gap-3">
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-xl font-extrabold whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-brand to-brand-dark uppercase tracking-tighter"
              >
                Navigated Learning
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 px-4 py-10 space-y-3">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative
                  ${isActive ? 'bg-white text-brand shadow-lg shadow-brand/10' : 'text-slate-500 hover:bg-white/40 hover:text-brand'}
                `}
              >
                {isActive && (
                    <motion.div layoutId="activePill" className="absolute left-0 w-1.5 h-6 bg-brand rounded-full" />
                )}
                <item.icon size={22} className={`${isActive ? 'text-brand' : 'group-hover:scale-110 transition-transform'}`} />
                {isSidebarOpen && <span className="font-bold">{item.label}</span>}
                {isActive && isSidebarOpen && (
                  <motion.div layoutId="activeTab" className="ml-auto">
                    <ChevronRight size={16} />
                  </motion.div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-100">
          <button className="flex items-center gap-4 px-4 py-3 w-full rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all duration-300 font-bold">
            <LogOut size={22} />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 w-7 h-7 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-xl hover:scale-110 hover:border-brand transition-all group"
        >
          <ChevronRight size={14} className={`text-slate-400 group-hover:text-brand transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} />
        </button>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Navbar */}
        <header className="h-20 bg-white/40 backdrop-blur-md border-b border-white/80 flex items-center justify-between px-6 lg:px-12 shrink-0 z-20">
          <div className="flex items-center gap-4 flex-1">
            <button 
                className="lg:hidden p-2 text-slate-500 hover:text-brand transition-colors"
                onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Find a module or project..."
                className="w-full bg-white/80 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all text-sm shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-8">
            <button className="relative p-2.5 bg-white border border-slate-100 rounded-xl text-slate-500 hover:text-brand hover:border-brand/20 transition-all group shadow-sm">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-brand rounded-full ring-4 ring-white" />
            </button>
            
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            
            <div className="flex items-center gap-4 pl-2 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-extrabold text-slate-900 group-hover:text-brand transition-colors">Alex Rivera</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Level 24 Explorer</p>
              </div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand to-brand-light p-0.5 shadow-lg shadow-brand/20"
              >
                <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center overflow-hidden">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" className="w-full h-full object-cover" />
                </div>
              </motion.div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-50 lg:hidden p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black text-brand uppercase tracking-tighter">Navigated Learning</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-brand transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <nav className="space-y-3">
                {sidebarItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${isActive ? 'bg-brand/10 text-brand font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      <item.icon size={20} className={isActive ? 'text-brand' : ''} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />
    </div>
  );
};
