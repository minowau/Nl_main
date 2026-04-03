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
  ChevronRight,
  TrendingUp,
  User,
  Activity,
  Award
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

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
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { agent, levelUpMessage, setLevelUpMessage, notifications, markNotificationsAsRead } = useAppContext();
  
  const progressPercent = agent.totalReward % 100;
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSignOut = () => {
    // Basic sign out
    navigate('/login');
  };

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
                onClick={(e) => {
                if (item.label === 'Settings') {
                  e.preventDefault();
                  setIsSettingsOpen(true);
                }
              }}
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
          <button 
           onClick={handleSignOut}
           className="flex items-center gap-4 px-4 py-3 w-full rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all duration-300 font-bold">
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
            <button 
               onClick={() => {
                 setIsNotificationsOpen(!isNotificationsOpen);
                 if (!isNotificationsOpen) markNotificationsAsRead();
               }}
               className="relative p-2.5 bg-white border border-slate-100 rounded-xl text-slate-500 hover:text-brand hover:border-brand/20 transition-all group shadow-sm"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-brand rounded-full ring-4 ring-white" />
              )}
            </button>
            
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            
            <div className="flex items-center gap-4 pl-2 group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-extrabold text-slate-900 group-hover:text-brand transition-colors">Learner</p>
                <div className="flex items-center gap-2 justify-end mt-0.5">
                   <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        className="h-full bg-brand"
                      />
                   </div>
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{progressPercent}% SYNC</p>
                </div>
              </div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                onClick={() => setIsProfileOpen(true)}
                className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand to-brand-light p-0.5 shadow-lg shadow-brand/20 cursor-pointer"
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

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <>
            <div className="fixed inset-0 z-[140]" onClick={() => setIsNotificationsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="fixed top-24 right-12 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-[150] overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Intelligence Briefing</h3>
                <span className="text-[10px] font-black text-brand uppercase tracking-widest">{notifications.length} Events</span>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div key={n.id} className="p-5 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                      <div className="flex gap-4">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.type === 'success' ? 'bg-green-500' : 'bg-brand'}`} />
                        <div>
                          <p className="text-xs font-medium text-slate-700 leading-relaxed">{n.message}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-2">{new Date(n.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center text-slate-400">
                    <p className="text-xs font-bold uppercase tracking-widest">Awaiting Intel...</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {isProfileOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden relative border border-white/20"
            >
              {/* Profile Background Header */}
              <div className="h-40 bg-gradient-to-br from-brand to-brand-dark relative">
                 <button 
                  onClick={() => setIsProfileOpen(false)}
                  className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-all"
                 >
                    <X size={20} />
                 </button>
              </div>

              <div className="px-10 pb-10 -mt-16 relative">
                 <div className="flex items-end justify-between mb-8">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-white p-1.5 shadow-2xl border border-slate-100">
                       <div className="w-full h-full rounded-[2rem] overflow-hidden bg-slate-50">
                          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Profile" className="w-full h-full object-cover" />
                       </div>
                    </div>
                    <div className="flex flex-col items-end pb-2">
                       <span className="px-4 py-1.5 bg-brand text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand/20">Stage {agent.level} Explorer</span>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">ID: Learner_NL_01</p>
                    </div>
                 </div>

                 <div className="mb-8">
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Learner</h2>
                    <p className="text-slate-500 font-medium mt-1">Neural Architect & NLP Specialist</p>
                 </div>

                 <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                       <div className="flex items-center gap-2 text-brand mb-2">
                          <Activity size={16} />
                          <span className="text-[9px] font-black uppercase tracking-widest">Total XP</span>
                       </div>
                       <p className="text-2xl font-black text-slate-900 tracking-tight">{agent.totalReward}</p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                       <div className="flex items-center gap-2 text-green-500 mb-2">
                          <Award size={16} />
                          <span className="text-[9px] font-black uppercase tracking-widest">Matrix Clear</span>
                       </div>
                       <p className="text-2xl font-black text-slate-900 tracking-tight">{agent.visitedResources.length}/18</p>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <div className="flex justify-between items-end">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Stage Synchronization</span>
                       <span className="text-lg font-black text-brand tracking-tighter">{progressPercent}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        className="h-full bg-brand"
                       />
                    </div>
                 </div>

                 <div className="mt-10 flex gap-4">
                    <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                       Edit Profile <TrendingUp size={18} />
                    </button>
                    <button 
                      onClick={handleSignOut}
                      className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-95"
                    >
                       <LogOut size={20} />
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden relative"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-200/50 rounded-xl text-slate-600">
                    <Settings size={20} />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">Preferences</h3>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6 bg-white">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Neural Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/50">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">High-Performance Engine</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Accelerate matrix polyline generation</p>
                      </div>
                      <div className="w-10 h-6 bg-brand rounded-full relative cursor-pointer shadow-inner">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Danger Zone</h4>
                  <button 
                    onClick={async () => {
                      try {
                        const res = await fetch('http://localhost:5000/api/reset', { method: 'POST' });
                        if (res.ok) window.location.reload();
                      } catch (e) {
                         console.error(e);
                      }
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-red-100 bg-red-50 hover:bg-red-100 transition-colors group"
                  >
                    <div className="text-left">
                      <p className="text-sm font-semibold text-red-600 group-hover:text-red-700">Wipe Database Memory</p>
                      <p className="text-[10px] text-red-400 mt-0.5">Permanently resets all learning progress & histories</p>
                    </div>
                    <LogOut size={18} className="text-red-400 group-hover:text-red-600" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Level Up Toast Notification */}
      <AnimatePresence>
        {levelUpMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] bg-[#0f111a] text-white px-8 py-5 rounded-[2rem] shadow-[0_0_80px_-15px_rgba(79,70,229,0.5)] border border-white/10 flex items-center gap-6"
          >
             <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand via-purple-500 to-pink-500 flex items-center justify-center shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%,transparent_100%)] bg-[length:200%_200%] animate-[shine_2s_infinite]" />
                <span className="text-xl font-black drop-shadow-md">{agent.level}</span>
             </div>
             <div>
                <p className="text-[10px] font-bold text-brand uppercase tracking-[0.3em] mb-1">Rank Up</p>
                <h3 className="text-xl font-bold tracking-tight">{levelUpMessage}</h3>
             </div>
             <button onClick={() => setLevelUpMessage(null)} className="ml-4 p-2 text-white/50 hover:text-white transition-colors">
                <X size={20} />
             </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
