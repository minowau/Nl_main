import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '../../components/Layout/DashboardLayout';
import {
  PlayCircle,
  ArrowUpRight,
  Clock,
  Sparkles,
  Star,
  Zap,
  BookOpen,
  FileText,
  Download,
  Plus,
  CheckCircle2
} from 'lucide-react';
import { StatisticCard } from '../../components/Dashboard/StatisticCard';
import { nlpApi, Resource, Note } from '../../services/nlpApi';
import { useNavigate } from 'react-router-dom';

const KnowledgeHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'missions' | 'notes' | 'resources'>('missions');
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'discrete' | 'nlp'>('nlp');
  const [hubResources, setHubResources] = useState<Resource[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resourcesData, bookmarksData, notesData] = await Promise.all([
          nlpApi.getResources(),
          nlpApi.getBookmarks('default'),
          nlpApi.getNotes('default')
        ]);
        setHubResources(resourcesData);
        setBookmarks(bookmarksData || []);
        setNotes(notesData || []);
      } catch (error) {
        console.error("Failed to fetch Knowledge Hub data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const handleAddNote = async () => {
    if (!newNote.title || !newNote.content) return;
    try {
      const addedNote = await nlpApi.addNote('default', {
        ...newNote,
        section: activeSection
      } as any);
      setNotes([...notes, addedNote]);
      setNewNote({ title: '', content: '' });
      setShowNoteModal(false);
    } catch (error) {
      console.error("Failed to add note:", error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  // Filter resources based on NLP section (currently all 18 natively default to NLP)
  const sectionResources = activeSection === 'nlp' ? hubResources : [];
  const sectionNotes = notes.filter(n => n.section === activeSection);

  const missions = sectionResources.map(r => ({
    id: r.id,
    title: r.title,
    section: 'nlp',
    isBookmarked: bookmarks.includes(r.id),
    xp: r.reward || 50,
    level: r.difficulty || 1,
    participants: Math.floor(Math.random() * 1000) + 500,
    duration: "45m",
    image: r.youtube_url ? `https://img.youtube.com/vi/${r.youtube_url.split('v=')[1]?.split('&')[0] || r.youtube_url.split('/').pop()}/maxresdefault.jpg` : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
    bannerColor: 'from-brand/40 to-brand-dark/60'
  }));

  // Map high-priority offline materials dynamically from highest difficulty NLP nodes
  const pdfResources = sectionResources.filter(r => r.difficulty >= 6).slice(0, 3).map((r, i) => ({
    id: `pdf-${r.id}`,
    title: `${r.title} Handbook`,
    type: 'Reference Protocol',
    size: `${(2.4 + i).toFixed(1)} MB`
  }));

  return (
    <DashboardLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[1700px] mx-auto space-y-8 pb-12 pt-2 px-4 lg:px-8"
      >
        {/* Hub Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-4">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
              <span className="text-[10px] font-black text-brand uppercase tracking-[0.4em]">Integrated Intelligence</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">
              Knowledge <br /><span className="text-brand">Hub</span>
            </h1>
          </div>

          {/* Global Sector Switcher */}
          <div className="bg-white/60 backdrop-blur-md p-1.5 rounded-[28px] border border-white/50 shadow-sm flex gap-2">
            <button
              onClick={() => setActiveSection('nlp')}
              className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === 'nlp' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-500 hover:bg-white'}`}
            >
              Advances in NLP
            </button>
            <button
              onClick={() => setActiveSection('discrete')}
              className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === 'discrete' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-500 hover:bg-white'}`}
            >
              Discrete Maths
            </button>
          </div>
        </motion.div>

        {/* Tab Switcher */}
        <motion.div variants={itemVariants} className="flex gap-4 p-2 bg-slate-100/50 backdrop-blur-xl rounded-[32px] border border-white w-fit mx-auto lg:mx-0">
          {[
            { id: 'missions', label: 'Video Lectures', icon: PlayCircle },
            { id: 'notes', label: 'Study Notes', icon: BookOpen },
            { id: 'resources', label: 'Study Materials', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-8 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${activeTab === tab.id ? 'bg-white text-brand shadow-xl scale-105 border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content Area (8 cols) */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {activeTab === 'missions' && (
                <motion.div
                  key="missions-tab"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                  {loading ? (
                    [1, 2, 3, 4].map(i => <div key={i} className="h-[400px] bg-white rounded-[32px] animate-pulse shadow-sm" />)
                  ) : (
                    missions.map((mission) => (
                      <motion.div
                        key={mission.id}
                        variants={itemVariants}
                        whileHover={{ y: -10 }}
                        className="group relative bg-white rounded-[32px] overflow-hidden shadow-[0_16px_32px_-16px_rgba(0,0,0,0.1)] border border-slate-100 hover:border-brand/40 transition-all duration-500"
                      >
                        {/* Card Image Header */}
                        <div className="relative h-[220px] w-full overflow-hidden">
                          <img
                            src={mission.image}
                            alt={mission.title}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                          />
                          <div className={`absolute inset-0 bg-gradient-to-b ${mission.bannerColor} mix-blend-multiply opacity-50 group-hover:opacity-30 transition-opacity`} />
                          <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/20 to-transparent" />

                          {mission.isBookmarked && (
                            <div className="absolute top-0 right-0 z-30">
                              <div className="bg-gradient-to-r from-brand text-white to-brand-dark px-6 py-2 shadow-lg border-b border-l border-white/20 backdrop-blur-md flex items-center gap-2 rounded-bl-3xl">
                                <Star size={12} className="fill-current animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest pt-0.5">Bookmarked</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="p-8 relative z-10 bg-white">
                          <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 group-hover:text-brand transition-colors uppercase tracking-tight">{mission.title}</h3>
                          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                            <span className="flex items-center gap-1.5"><Clock size={12} className="text-brand" /> {mission.duration}</span>
                            <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                            <span className="flex items-center gap-1.5 text-brand"><Zap size={12} /> Priority</span>
                          </div>
                          <button
                            onClick={() => navigate(`/navigator/course?resource=${mission.id}`)}
                            className="w-full py-4 bg-brand/10 text-brand rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand hover:text-white transition-all flex items-center justify-center gap-2"
                          >
                            Play Resource <ArrowUpRight size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}

              {activeTab === 'notes' && (
                <motion.div
                  key="notes-tab"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm mb-8">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Study Notes</h2>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Organize and review your study notes.</p>
                    </div>
                    <button
                      onClick={() => setShowNoteModal(true)}
                      className="px-6 py-3 bg-brand text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20 hover:scale-105 transition-all flex items-center gap-2"
                    >
                      <Plus size={16} /> Add Intel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sectionNotes.length > 0 ? (
                      sectionNotes.map(note => (
                        <div key={note.id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-[0_8px_16px_rgba(0,0,0,0.02)] group hover:border-brand/30 transition-all cursor-pointer">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                              <BookOpen size={16} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry: {new Date(note.createdAt).toLocaleDateString()}</span>
                          </div>
                          <h4 className="text-lg font-black text-slate-800 mb-2 group-hover:text-brand transition-colors uppercase tracking-tight">{note.title}</h4>
                          <p className="text-sm text-slate-500 leading-relaxed line-clamp-4">{note.content}</p>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-20 text-center bg-white rounded-[32px] border border-slate-100 border-dashed">
                        <Sparkles size={48} className="text-slate-200 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-slate-400 uppercase">No notes found in this sector</h3>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'resources' && (
                <motion.div
                  key="resources-tab"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-12"
                >
                  {/* PDF Section */}
                  <div>
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-1.5 h-12 bg-brand rounded-full" />
                      <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Lecture Materials</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {pdfResources.map(pdf => (
                        <div key={pdf.id} className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-brand transition-all cursor-pointer">
                          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center scale-110 shadow-lg shadow-red-500/10">
                            <FileText size={20} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-black text-slate-800 text-xs truncate uppercase tracking-tight">{pdf.title}</h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{pdf.type} • {pdf.size}</p>
                          </div>
                          <button className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-brand hover:text-white transition-all">
                            <Download size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Briefings */}
                  <div>
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-1.5 h-12 bg-slate-200 rounded-full" />
                      <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Additional Briefings</h3>
                    </div>
                    <div className="space-y-4">
                      {missions.slice(0, 4).map(lec => (
                        <div key={`res-${lec.id}`}
                          onClick={() => navigate(`/navigator/course?resource=${lec.id}`)}
                          className="flex items-center gap-6 bg-white p-4 rounded-[28px] border border-slate-100 hover:shadow-lg transition-all group cursor-pointer"
                        >
                          <div className="w-40 h-24 rounded-2xl overflow-hidden relative shrink-0">
                            <img src={lec.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
                            <div className="absolute inset-0 bg-brand/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <PlayCircle size={24} className="text-white" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-black text-slate-800 group-hover:text-brand transition-colors text-sm uppercase tracking-tight">{lec.title}</h4>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[8px] font-black uppercase tracking-widest">{lec.section} Resource</span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase">{lec.duration} Duration</span>
                            </div>
                          </div>
                          <ArrowUpRight size={20} className="text-slate-300 group-hover:text-brand mr-4" />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar (4 cols) */}
          <div className="lg:col-span-4">
            <div className="sticky top-8">
              <StatisticCard />
            </div>
          </div>
        </div>

        {/* Create Note Modal Overlay */}
        <AnimatePresence>
          {showNoteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                className="bg-white w-full max-w-xl rounded-[40px] p-10 shadow-2xl relative border border-white/20"
              >
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-8">Add Study Note</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-2">Note Title</label>
                    <input
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5"
                      placeholder="Enter note title..."
                      value={newNote.title}
                      onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-2">Note Content</label>
                    <textarea
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 min-h-[150px] resize-none"
                      placeholder="Write your study observations..."
                      value={newNote.content}
                      onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => setShowNoteModal(false)}
                      className="flex-1 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600"
                    >
                      Abort
                    </button>
                    <button
                      onClick={handleAddNote}
                      className="flex-2 px-12 py-4 bg-brand text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand/20 hover:scale-105 transition-all flex items-center justify-center gap-3"
                    >
                      Save Note <CheckCircle2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  );
};

export default KnowledgeHubPage;
