import React, { useState } from 'react';
import { Resource, Agent, GridPosition, Polyline } from '../types';
import { BookOpen, Play, FileText, PenTool, RefreshCw, MapPin, Sparkles } from 'lucide-react';
import { nlpApi } from '../services/nlpApi';

interface GridVisualizationProps {
  resources: Resource[];
  agent: Agent;
  polylines: Polyline[];
  onResourceClick: (resource: Resource) => void;
  onAgentMove: (position: GridPosition) => void;
  isSimulationRunning: boolean;
  dqnPathInfo: { resource: Resource | null, reward: number } | null;
  onRefreshDQNPath: () => void;
  isPlaying?: boolean;
  playbackPath?: GridPosition[];
  onPlaybackComplete?: () => void;
  assimilationPositions?: GridPosition[];
}

const GRID_SIZE = 20;

const ResourceIcon = ({ type }: { type: Resource['type'] }) => {
  const iconProps = { size: 14, className: "text-white drop-shadow-sm" };

  switch (type) {
    case 'book':
      return <BookOpen {...iconProps} />;
    case 'video':
      return <Play {...iconProps} />;
    case 'quiz':
      return <FileText {...iconProps} />;
    case 'assignment':
      return <PenTool {...iconProps} />;
    default:
      return <BookOpen {...iconProps} />;
  }
};

export const GridVisualization: React.FC<GridVisualizationProps> = ({
  resources,
  agent,
  polylines,
  onResourceClick,
  onAgentMove,
  isSimulationRunning,
  dqnPathInfo,
  onRefreshDQNPath,
  isPlaying = false,
  playbackPath = [],
  onPlaybackComplete,
  assimilationPositions = []
}) => {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [hoveredResource, setHoveredResource] = useState<string | null>(null);
  const hoverTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const [animatingAgent, setAnimatingAgent] = useState(false);
  const [pathProgress, setPathProgress] = useState(0);
  const [videoResource, setVideoResource] = useState<Resource | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = React.useRef<HTMLDivElement | null>(null);

  // Convert YouTube URL to embed URL
  const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    // Handle youtu.be/ID and youtube.com/watch?v=ID formats
    let videoId = '';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split(/[?&#]/)[0] || '';
    } else if (url.includes('watch?v=')) {
      videoId = url.split('watch?v=')[1]?.split(/[?&#]/)[0] || '';
    } else if (url.includes('youtube.com/embed/')) {
      return url; // Already embed URL
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : null;
  };

  const handleMouseEnter = (id: string) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoveredResource(id);
  };

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => {
      setHoveredResource(null);
    }, 200);
  };

  // Handle Playback Animation
  React.useEffect(() => {
    if (isPlaying && playbackPath.length > 1) {
      setPathProgress(0);
      const totalDuration = playbackPath.length * 800; // 800ms per segment
      const startTime = Date.now();

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / totalDuration, 1);
        setPathProgress(progress);

        if (progress >= 1) {
          clearInterval(interval);
          if (onPlaybackComplete) onPlaybackComplete();
        }
      }, 16);

      return () => clearInterval(interval);
    }
  }, [isPlaying, playbackPath]);

  const handleCellClick = (x: number, y: number) => {
    const resource = resources.find(r => r.position.x === x && r.position.y === y);
    if (resource) {
      setSelectedResource(resource);
      onResourceClick(resource);
    } else {
      // Move agent to clicked position
      setAnimatingAgent(true);
      setTimeout(() => {
        onAgentMove({ x, y });
        setAnimatingAgent(false);
      }, 200);
    }
  };

  const isPathCell = (x: number, y: number) => {
    return polylines.some(polyline =>
      polyline.isActive && polyline.path.some(pos => pos.x === x && pos.y === y)
    );
  };

  const getPathColor = (x: number, y: number) => {
    const polyline = polylines.find(p =>
      p.isActive && p.path.some(pos => pos.x === x && pos.y === y)
    );
    return polyline?.color || 'rgba(59, 130, 246, 0.3)';
  };

  const renderPlaybackOverlay = () => {
    if (!isPlaying || playbackPath.length < 2) return null;

    // Convert grid coordinates to percentages (assuming 1fr grid)
    // Grid matches 1000x1000px container
    const CELL_SIZE = 1000 / GRID_SIZE;
    const HALF_CELL = CELL_SIZE / 2;

    const pathSegments = [];
    for (let i = 0; i < playbackPath.length - 1; i++) {
      const start = playbackPath[i];
      const end = playbackPath[i + 1];

      const x1 = start.x * CELL_SIZE + HALF_CELL;
      const y1 = start.y * CELL_SIZE + HALF_CELL;
      const x2 = end.x * CELL_SIZE + HALF_CELL;
      const y2 = end.y * CELL_SIZE + HALF_CELL;

      // Calculate control point for arc
      // Midpoint
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      // Vector
      const dx = x2 - x1;
      const dy = y2 - y1;
      // Perpendicular vector (scaled) - Fixed arc height
      const arcHeight = 30;
      // Normalize
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const px = -dy / len * arcHeight;
      const py = dx / len * arcHeight;

      const cx = mx + px;
      const cy = my + py;

      const d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
      pathSegments.push({ d, id: i }); // Add index to stagger animation
    }

    return (
      <div className="absolute inset-0 z-50 pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 1000 1000" className="overflow-visible">
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>
            <marker id="arrowhead-swallowtail" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M 0 0 L 6 3 L 0 6 L 2 3 z" fill="#d946ef" />
            </marker>
          </defs>
          {pathSegments.map((seg, idx) => {
            const segmentProgress = Math.max(0, Math.min(1, (pathProgress * playbackPath.length) - idx));
            const dashLen = 1000;

            if (segmentProgress <= 0) return null;

            return (
              <g key={idx}>
                {/* Background trace */}
                <path d={seg.d} fill="none" stroke="rgba(139, 92, 246, 0.1)" strokeWidth="4" strokeLinecap="round" />

                {/* Animated Glowing Line */}
                <path
                  d={seg.d}
                  fill="none"
                  stroke="url(#pathGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="8 6"
                  markerEnd="url(#arrowhead-swallowtail)"
                  filter="url(#glow)"
                  // We simulate the 'drawing' of the dashed line by masking it
                  // But for simplicity with dasharray, let's just clip it or use the dashoffset trick 
                  // on a solid line and mask the dashed one? 
                  // Actually, just standard strokeDashoffset works on dashed lines too, 
                  // it just moves the dashes. 
                  // To "reveal" a dashed line, we need a mask.
                  // Let's stick to the previous "solid line" reveal for simplicity but add a dashed pattern *on top*?
                  // No, let's just make it a simple dashed line that reveals.
                  // If we use strokeDasharray="8 6", and we animate strokeDashoffset from HUGE to 0, 
                  // the dashes will "march" in. That might look cool.
                  strokeDashoffset={dashLen * (1 - segmentProgress)}
                />
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const isAssimilationCell = (x: number, y: number) =>
    assimilationPositions.some(p => p.x === x && p.y === y);

  const renderGrid = () => {
    const cells = [];

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const resource = resources.find(r => r.position.x === x && r.position.y === y);
        const isAgent = agent.position.x === x && agent.position.y === y;
        const isPath = isPathCell(x, y);
        const isAssimilation = isAssimilationCell(x, y);

        // Dynamic Tooltip Positioning
        // JS Hover: Use margin for visual gap, no padding bridge needed
        let tooltipClass = "absolute bottom-full left-1/2 -translate-x-1/2 mb-2";
        let arrowClass = "absolute left-1/2 -translate-x-1/2 -bottom-2";

        if (x < 4) {
          tooltipClass = "absolute bottom-full left-0 mb-2";
          arrowClass = "absolute left-4 -bottom-2";
        } else if (x > 15) {
          tooltipClass = "absolute bottom-full right-0 mb-2";
          arrowClass = "absolute right-4 -bottom-2";
        }

        // Vertical Flip (if at top)
        if (y < 4) {
          if (x < 4) {
            tooltipClass = "absolute top-full left-0 mt-2";
            arrowClass = "absolute left-4 -top-2";
          } else if (x > 15) {
            tooltipClass = "absolute top-full right-0 mt-2";
            arrowClass = "absolute right-4 -top-2";
          } else {
            tooltipClass = "absolute top-full left-1/2 -translate-x-1/2 mt-2";
            arrowClass = "absolute left-1/2 -translate-x-1/2 -top-2";
          }
        }

        const showTooltip = resource && hoveredResource === resource.id;

        cells.push(
          <div
            key={`${x}-${y}`}
            className={`
              relative border border-gray-100 transition-all duration-300
              ${isPath ? 'bg-opacity-20 backdrop-blur-sm' : 'bg-gray-50/50 hover:bg-gray-100'}
              ${isAgent ? 'z-20' : 'z-0'}
              ${showTooltip ? 'z-[100]' : (resource ? 'z-10' : '')}
              ${resource?.visited ? 'bg-green-50/30' : ''}
            `}
            style={{
              backgroundColor: isPath ? getPathColor(x, y) : undefined,
              gridColumn: x + 1,
              gridRow: y + 1,
              borderRadius: '6px',
              margin: '1px'
            }}
            onClick={() => handleCellClick(x, y)}
          >
            {resource && (
              <div
                className="absolute inset-0 m-auto flex items-center justify-center w-full h-full"
                onMouseEnter={() => handleMouseEnter(resource.id)}
                onMouseLeave={handleMouseLeave}
              >
                <div className={`
                  relative flex items-center justify-center
                  w-8 h-8 rounded-xl shadow-lg transform transition-all duration-300
                  ${resource.visited
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/30'
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30'}
                  ${selectedResource?.id === resource.id ? 'ring-4 ring-yellow-400/50 scale-110' : 'hover:scale-110 hover:-translate-y-1'}
                `}>
                  <ResourceIcon type={resource.type} />

                  {/* Modern Tooltip with JS Interaction Support */}
                  <div
                    className={`${tooltipClass} w-72 transition-opacity duration-200 z-50 ${showTooltip ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                    onMouseEnter={() => handleMouseEnter(resource.id)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden cursor-default" onClick={(e) => e.stopPropagation()}>
                      {/* Mock Image Header */}
                      <div className={`h-32 w-full relative ${resource.visited ? 'bg-gradient-to-tr from-emerald-500 to-teal-400' : 'bg-gradient-to-tr from-blue-600 to-indigo-500'}`}>
                        {/* Decorative pattern overlay */}
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ResourceIcon type={resource.type} />
                          {/* Make icon huge for background effect */}
                          <div className="absolute transform scale-[5] opacity-10"><ResourceIcon type={resource.type} /></div>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 text-left">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2">{resource.title}</h4>
                          {resource.visited && (
                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide shrink-0 ml-2">
                              Completed
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                          <span className="capitalize">{resource.type} Lesson</span>
                          <span>•</span>
                          <span>{['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'][resource.difficulty - 1] || 'Intermediate'}</span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500 font-medium mb-4">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">⏱</span>
                            <span>{10 + (resource.title.length % 20)} mins</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">▶</span>
                            <span>Video {resource.id.replace(/\D/g, '') || '01'}</span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isAgent && resource.youtube_url) {
                              setVideoResource(resource);
                              setHoveredResource(null);
                            } else {
                              handleCellClick(x, y);
                            }
                          }}
                          className={`w-full py-2.5 ${isAgent ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-500/20 shadow-indigo-500/20' : 'bg-blue-600 hover:bg-blue-700 border-blue-500/20 shadow-blue-500/10'} text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 transform duration-100 border`}
                        >
                          {isAgent ? '▶ Start Lesson' : 'Travel to Lesson'}
                          <span className="text-lg leading-none">→</span>
                        </button>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className={`w-4 h-4 bg-white transform rotate-45 shadow-lg z-[-1] ${arrowClass}`}></div>
                  </div>
                </div>
              </div>
            )}

            {isAssimilation && !isAgent && (
              <div className="absolute inset-0 m-auto w-8 h-8 flex items-center justify-center pointer-events-none z-10">
                <span className="relative flex h-full w-full items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-amber-400 opacity-40"></span>
                  <div className="relative w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-lg shadow-amber-200 border-2 border-white flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                </span>
              </div>
            )}

            {isAgent && (
              <div className={`
                absolute inset-0 m-auto w-8 h-8 flex items-center justify-center
                ${animatingAgent ? 'scale-110' : 'scale-100'}
                transition-all duration-300
                pointer-events-none
              `}>
                <span className="relative flex h-full w-full items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-20"></span>
                  <div className="relative w-6 h-6 bg-gradient-to-br from-red-500 to-pink-600 rounded-full shadow-lg shadow-red-200 border-2 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </span>
              </div>
            )}
          </div>
        );
      }
    }

    return cells;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/30 overflow-hidden">
      {/* Static Header */}
      <div className="flex-none px-6 py-4 bg-white/90 backdrop-blur-sm border-b border-gray-100 flex justify-between items-center z-10">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Learning Environment
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Explore resources and track your journey</p>
        </div>

        <div className="flex items-center gap-4">
          {isSimulationRunning && (
            <button
              onClick={onRefreshDQNPath}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-lg transition-all shadow-sm group"
              title="Find Optimal Path"
            >
              <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
              <span>Optimize Path</span>
            </button>
          )}

          <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-gradient-to-br from-red-500 to-pink-600 rounded-full"></div>
              <span className="text-xs font-medium text-gray-600">You</span>
            </div>
            <div className="w-px h-3 bg-gray-200"></div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-sm"></div>
              <span className="text-xs font-medium text-gray-600">Resource</span>
            </div>
            <div className="w-px h-3 bg-gray-200"></div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full"></div>
              <span className="text-xs font-medium text-gray-600">Done</span>
            </div>
            <div className="w-px h-3 bg-gray-200"></div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full ring-1 ring-amber-300"></div>
              <span className="text-xs font-medium text-gray-600">Assimilation</span>
            </div>
          </div>
        </div>
      </div>

      {/* DQN Overlay Notification */}
      {isSimulationRunning && dqnPathInfo?.resource && (
        <div className="absolute top-20 right-6 z-20 animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-red-100 ring-1 ring-red-50 w-64 pointer-events-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-red-500 uppercase">Recommendation</span>
                <h3 className="text-sm font-semibold text-gray-900 mt-0.5 line-clamp-1">{dqnPathInfo.resource.title}</h3>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-lg font-bold text-red-600 leading-none">+{dqnPathInfo.reward}</span>
                <span className="text-[9px] text-gray-400 font-medium lowercase">pts</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area - Scrollable Grid */}
      <div className="flex-1 w-full relative overflow-auto bg-gray-50/30">
        <div className="min-w-full min-h-full flex items-center justify-center p-8">
          {/* The Grid - Fixed Large Size for Clarity */}
          <div
            className="grid gap-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4 shrink-0 transition-all duration-300 relative"
            style={{
              width: '1000px',
              height: '1000px',
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
            }}
          >
            {renderGrid()}
            {renderPlaybackOverlay()}
          </div>
        </div>
      </div>

      {/* Static Footer for Selected Resource */}
      {selectedResource && (
        <div className="flex-none w-full bg-white/95 backdrop-blur-md p-4 border-t border-blue-100 z-10 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <div className={`p-3 rounded-lg ${selectedResource.visited ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
              <ResourceIcon type={selectedResource.type} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{selectedResource.title}</h3>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium uppercase tracking-wide">{selectedResource.type}</span>
                <span className="flex items-center gap-1">
                  <span>Difficulty:</span>
                  <span className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < selectedResource.difficulty ? 'bg-blue-500' : 'bg-gray-200'}`} />
                    ))}
                  </span>
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end border-l border-gray-100 pl-4">
              <span className="text-xs text-gray-400 uppercase font-semibold">Reward</span>
              <span className="text-xl font-bold text-gray-900">+{selectedResource.reward}</span>
            </div>
          </div>
        </div>
      )}
      {/* YouTube Video + AI Sider Premium Split Panel */}
      {videoResource && videoResource.youtube_url && (
        <div
          className="fixed inset-0 bg-gray-950/80 backdrop-blur-3xl flex items-center justify-center z-[200] p-4 sm:p-8"
          onClick={() => { setVideoResource(null); setChatMessages([]); setChatInput(''); }}
        >
          {/* Subtle Dynamic Ambient Light behind the Modal */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-screen" />

          <div
            className="bg-[#0f111a]/95 backdrop-blur-md rounded-[2.5rem] shadow-[0_0_80px_-15px_rgba(79,70,229,0.25)] w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col border border-white/10 animate-in zoom-in-90 fade-in duration-500 ease-out relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glossy Top Header */}
            <div className="bg-[#131620]/80 backdrop-blur-3xl px-8 py-5 flex items-center justify-between border-b border-white/5 flex-shrink-0 relative z-20">
              <div className="flex items-center gap-5 text-white min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/30 border border-white/10">
                  <Play size={20} className="text-white fill-current ml-0.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-lg truncate text-white tracking-tight drop-shadow-sm">{videoResource.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-black px-2 py-0.5 bg-white/10 text-white rounded-md uppercase tracking-widest border border-white/5 shadow-inner">Lesson {videoResource.id}</span>
                    <span className="text-indigo-400/50">•</span>
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">{['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'][videoResource.difficulty - 1]}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="hidden md:flex flex-col items-end px-6 border-r border-white/10">
                  <span className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Reward</span>
                  <span className="text-base font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">+{videoResource.reward} PTS</span>
                </div>
                <button
                  onClick={() => { setVideoResource(null); setChatMessages([]); setChatInput(''); }}
                  className="w-12 h-12 rounded-full bg-white/5 hover:bg-red-500/20 hover:border-red-500/30 text-gray-400 hover:text-red-400 transition-all flex items-center justify-center border border-white/5 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:rotate-90 transition-transform duration-300">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            {/* Split Panel: Video + AI Sider */}
            <div className="flex flex-1 min-h-0 bg-[#090b10]">
              {/* Left: Video Canvas */}
              <div className="flex-[65] relative bg-black rounded-bl-[2.5rem] overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] z-10">
                <iframe
                  className="w-full h-full"
                  src={getYouTubeEmbedUrl(videoResource.youtube_url) || ''}
                  title={videoResource.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              {/* Right: Premium AI Sider */}
              <div className="flex-[35] flex flex-col bg-[#0f111a] border-l border-white/5 relative overflow-hidden z-20">
                {/* Decorative Background Glows */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 blur-[100px] pointer-events-none rounded-full" />
                <div className="absolute bottom-[-100px] left-[-100px] w-80 h-80 bg-purple-600/10 blur-[120px] pointer-events-none rounded-full" />

                {/* Sider Header */}
                <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-2xl px-6 py-5 flex items-center gap-4 border-b border-white/5 flex-shrink-0 relative z-30">
                  <div className="w-10 h-10 rounded-[14px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/10 ring-2 ring-white/5">
                    <Sparkles size={18} className="text-white drop-shadow-md" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-[15px] tracking-tight">Learning Assistant</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </div>
                      <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-black">AI Active</span>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar relative z-20" style={{ minHeight: 0 }}>
                  {chatMessages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(99,102,241,0.15)] relative">
                        <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full" />
                        <Sparkles size={36} className="text-indigo-400 relative z-10" />
                      </div>
                      <h5 className="text-xl font-extrabold text-white mb-2 tracking-tight">Ready to assist</h5>
                      <p className="text-sm text-gray-400 mb-8 max-w-[260px] leading-relaxed">I'm connected to the lesson transcript. Ask me for a summary, definitions, or code examples.</p>

                      <div className="w-full space-y-3">
                        <div className="text-[10px] uppercase tracking-widest font-black text-gray-600 mb-4">Suggested Hooks</div>
                        {['Summarize this lesson', 'What are the key concepts?', 'Give me a real-world example'].map((question, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setChatInput('');
                              setChatMessages(prev => [...prev, { role: 'user', content: question }]);
                              setChatLoading(true);
                              nlpApi.chat(videoResource.title, question, [])
                                .then((data: { answer: string; source: string }) => {
                                  setChatMessages(prev => [...prev, { role: 'ai', content: data.answer }]);
                                  setChatLoading(false);
                                })
                                .catch(() => {
                                  setChatMessages(prev => [...prev, { role: 'ai', content: 'Connection lost. Please check your network and try again.' }]);
                                  setChatLoading(false);
                                });
                            }}
                            className="w-full text-center px-5 py-4 bg-white/[0.03] border border-white/[0.05] text-gray-300 rounded-2xl hover:bg-white/[0.08] hover:border-indigo-500/30 hover:shadow-[0_4px_20px_rgba(99,102,241,0.1)] hover:-translate-y-0.5 transition-all text-sm font-medium active:scale-[0.98]"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed relative ${msg.role === 'user'
                        ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 text-white rounded-br-sm shadow-[0_4px_20px_rgba(99,102,241,0.25)] border border-white/10'
                        : 'bg-white/5 backdrop-blur-3xl border border-white/10 text-gray-200 rounded-bl-sm shadow-xl'
                        }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="flex justify-start animate-in fade-in duration-300">
                      <div className="bg-white/5 backdrop-blur-3xl border border-white/10 px-6 py-4 rounded-2xl rounded-bl-sm shadow-xl">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} className="h-2" />
                </div>

                {/* AI Chat Input - Glossy Glass */}
                <div className="p-5 bg-[#0f111a]/95 backdrop-blur-3xl border-t border-white/5 flex-shrink-0 relative z-30">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!chatInput.trim() || chatLoading) return;
                      const question = chatInput.trim();
                      setChatMessages(prev => [...prev, { role: 'user', content: question }]);
                      setChatInput('');
                      setChatLoading(true);
                      nlpApi.chat(videoResource.title, question, chatMessages)
                        .then((data: { answer: string; source: string }) => {
                          setChatMessages(prev => [...prev, { role: 'ai', content: data.answer }]);
                          setChatLoading(false);
                          setTimeout(() => {
                            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        })
                        .catch(() => {
                          setChatMessages(prev => [...prev, { role: 'ai', content: 'Connection lost. Please check your network and try again.' }]);
                          setChatLoading(false);
                        });
                    }}
                    className="flex gap-3 relative"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Message the assistant..."
                      className="flex-1 px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-[15px] text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/20 hover:border-white/20 transition-all font-medium shadow-inner"
                      disabled={chatLoading}
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || chatLoading}
                      className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:from-white/5 disabled:to-white/5 disabled:text-gray-600 text-white rounded-2xl transition-all flex items-center justify-center shadow-[0_4px_20px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_25px_rgba(99,102,241,0.5)] active:scale-90 flex-shrink-0 border border-white/10 disabled:border-white/5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`${!chatInput.trim() || chatLoading ? '' : 'translate-x-0.5 -translate-y-0.5'} transition-transform`}>
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </button>
                  </form>
                  <p className="text-[10px] text-center text-gray-500 mt-3 uppercase tracking-widest font-black">AI powered by Groq & Llama</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};