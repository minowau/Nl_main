import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Resource, Agent, GridPosition, Polyline } from '../types';
import { BookOpen, Play, FileText, PenTool, RefreshCw, MapPin, Search, X, ChevronRight, ZoomIn, ZoomOut, Diamond } from 'lucide-react';
const avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=f1f5f9";

interface AssimilationPoint {
  id: string;
  position: GridPosition;
  label: string;
  color: string;
}

interface GridVisualizationProps {
  resources: Resource[];
  agent: Agent;
  polylines: Polyline[];
  onResourceClick: (resource: Resource, skipMove?: boolean) => void;
  onAgentMove: (position: GridPosition) => void;
  isSimulationRunning: boolean;
  dqnPathInfo: { resource: Resource | null, reward: number } | null;
  onRefreshDQNPath: () => void;
  isPlaying?: boolean;
  playbackPath?: GridPosition[];
  onPlaybackComplete?: () => void;
  assimilationPoints?: AssimilationPoint[];
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

const SocialAgent: React.FC<{ isMoving: boolean }> = ({ isMoving }) => {
  return (
    <motion.div
      className="relative flex flex-col items-center justify-center -translate-y-4"
      animate={isMoving ? {
        scale: [1, 1.1, 1],
        rotateY: 0
      } : { rotateY: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Tooltip */}
      <div className="absolute -bottom-8 bg-[#1A1F2E] text-white text-[10px] font-medium px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-50">
        You are here
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-[#1A1F2E]" />
      </div>

      {/* Main Avatar Container */}
      <div className="relative w-12 h-12 rounded-full border-2 border-white shadow-xl overflow-visible p-0.5 bg-white">
        <img
          src={avatar}
          alt="User Profile"
          className="w-full h-full rounded-full object-cover"
        />
        {/* Online Indicator */}
        <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm animate-pulse" />
      </div>
    </motion.div>
  );
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
  assimilationPoints = []
}) => {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [hoveredResource, setHoveredResource] = useState<string | null>(null);
  const hoverTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const [pathProgress, setPathProgress] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showAssimilationPath, setShowAssimilationPath] = useState(false);
  const gridRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to agent on load or movement
  React.useEffect(() => {
    if (gridRef.current && agent.position) {
      const scrollY = (agent.position.y * (1000 / GRID_SIZE) * zoomLevel) - (gridRef.current.clientHeight / 2);
      const scrollX = (agent.position.x * (1000 / GRID_SIZE) * zoomLevel) - (gridRef.current.clientWidth / 2);

      gridRef.current.scrollTo({
        top: scrollY,
        left: scrollX,
        behavior: 'smooth'
      });
    }
  }, [agent.position.x, agent.position.y, zoomLevel]);

  // Build the assimilation path from polyline assimilation positions
  // This traces how the user's average assimilation evolved over time
  const assimilationPath = React.useMemo(() => {
    return polylines
      .filter(p => !['learning-path-1', 'dqn-simulation', 'high_line', 'current_average'].includes(p.id))
      .filter(p => p.assimilation_position && p.assimilation_position.x !== undefined)
      .map(p => p.assimilation_position!)
  }, [polylines]);

  // Find the resource the agent is currently sitting on
  const currentResource = React.useMemo(() => {
    return resources.find(
      r => r.position.x === agent.position.x && r.position.y === agent.position.y
    ) || null;
  }, [resources, agent.position]);

  const [videoResource, setVideoResource] = useState<Resource | null>(null);
  // @ts-ignore
  const chatEndRef = React.useRef<HTMLDivElement | null>(null);

  // Tracking agent movement for animation
  const [prevPosition, setPrevPosition] = useState<GridPosition>(agent.position);
  const [showTravelArrow, setShowTravelArrow] = useState(false);

  React.useEffect(() => {
    if (agent.position.x !== prevPosition.x || agent.position.y !== prevPosition.y) {
      setShowTravelArrow(true);
      const timer = setTimeout(() => {
        setShowTravelArrow(false);
        setPrevPosition(agent.position);
      }, 1500); // Duration of arrow visibility
      return () => clearTimeout(timer);
    }
  }, [agent.position, prevPosition]);

  // Convert YouTube URL to embed URL
  const getYouTubeEmbedUrl = (url: string): string | null => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : null;
  };

  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    let videoId = '';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split(/[?&#]/)[0] || '';
    } else if (url.includes('watch?v=')) {
      videoId = url.split('watch?v=')[1]?.split(/[?&#]/)[0] || '';
    }
    return videoId || null;
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
  }, [isPlaying, playbackPath, onPlaybackComplete]);

  const handleCellClick = (x: number, y: number) => {
    const resource = resources.find(r => r.position.x === x && r.position.y === y);
    if (resource) {
      setSelectedResource(resource);

      // Always show video directly without moving the agent on manual click
      if (resource.youtube_url) {
        setVideoResource(resource);
        setHoveredResource(null);
      }
      onResourceClick(resource, true); // Always skipMove = true for manual clicks
    } else {
      // Clicks on empty cells no longer move the agent (logic moved to GridMatrixPage to ignore)
      onAgentMove({ x, y });
    }
  };

  const renderNeuralRoad = () => {
    return polylines.filter(p => p.isActive).map(polyline => (
      <svg key={polyline.id} className="absolute inset-0 w-full h-full pointer-events-none z-10">
        <path
          d={polyline.path.map((pos, i) =>
            `${i === 0 ? 'M' : 'L'} ${(pos.x + 0.5) * 50} ${(pos.y + 0.5) * 50}`
          ).join(' ')}
          fill="none"
          stroke={polyline.color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-20 filter blur-[2px]"
        />
        <path
          d={polyline.path.map((pos, i) =>
            `${i === 0 ? 'M' : 'L'} ${(pos.x + 0.5) * 50} ${(pos.y + 0.5) * 50}`
          ).join(' ')}
          fill="none"
          stroke={polyline.color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1 8"
          className="opacity-40"
        />
      </svg>
    ));
  };

  // Render the Assimilation Path — animated trail through visited resources
  const renderAssimilationPath = () => {
    if (assimilationPath.length < 2) return null;

    const CELL_SIZE = 1000 / GRID_SIZE;
    const HALF_CELL = CELL_SIZE / 2;

    // Build quadratic Bézier segments between consecutive visited resources
    const segments: { d: string; idx: number }[] = [];
    for (let i = 0; i < assimilationPath.length - 1; i++) {
      const p1 = assimilationPath[i];
      const p2 = assimilationPath[i + 1];
      const x1 = p1.x * CELL_SIZE + HALF_CELL;
      const y1 = p1.y * CELL_SIZE + HALF_CELL;
      const x2 = p2.x * CELL_SIZE + HALF_CELL;
      const y2 = p2.y * CELL_SIZE + HALF_CELL;

      // Arc perpendicular offset
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const arcH = 20;
      const cx = (x1 + x2) / 2 + (-dy / len) * arcH;
      const cy = (y1 + y2) / 2 + (dx / len) * arcH;

      segments.push({ d: `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`, idx: i });
    }

    // Full polyline path for the moving dot
    const fullPath = assimilationPath.map((p, i) => {
      const px = p.x * CELL_SIZE + HALF_CELL;
      const py = p.y * CELL_SIZE + HALF_CELL;
      return `${i === 0 ? 'M' : 'L'} ${px} ${py}`;
    }).join(' ');

    return (
      <div className="absolute inset-0 z-15 pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 1000 1000" className="overflow-visible">
          <defs>
            <linearGradient id="assimPathGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <filter id="assimGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <marker id="assimArrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
              <path d="M 0 0 L 5 2.5 L 0 5 L 1.5 2.5 Z" fill="#8b5cf6" />
            </marker>
          </defs>

          {/* Background glow trail */}
          {segments.map((seg) => (
            <path
              key={`assimBg-${seg.idx}`}
              d={seg.d}
              fill="none"
              stroke="url(#assimPathGrad)"
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.12"
            />
          ))}

          {/* Main animated dashed path */}
          {segments.map((seg) => (
            <path
              key={`assimLine-${seg.idx}`}
              d={seg.d}
              fill="none"
              stroke="url(#assimPathGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="6 4"
              markerEnd="url(#assimArrow)"
              filter="url(#assimGlow)"
              opacity="0.7"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="20"
                to="0"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </path>
          ))}

          {/* Waypoint dots at each visited resource */}
          {assimilationPath.map((p, i) => {
            const px = p.x * CELL_SIZE + HALF_CELL;
            const py = p.y * CELL_SIZE + HALF_CELL;
            return (
              <g key={`wp-${i}`}>
                <circle cx={px} cy={py} r="5" fill="white" stroke="#8b5cf6" strokeWidth="2" opacity="0.9" />
                <text x={px} y={py + 1} textAnchor="middle" dominantBaseline="middle" fontSize="7" fontWeight="bold" fill="#6d28d9">
                  {i + 1}
                </text>
              </g>
            );
          })}

          {/* Animated traveling dot along the full path */}
          <circle r="4" fill="#ec4899" filter="url(#assimGlow)">
            <animateMotion dur={`${Math.max(3, assimilationPath.length * 1.2)}s`} repeatCount="indefinite">
              <mpath href="#assimFullPath" />
            </animateMotion>
          </circle>
          <path id="assimFullPath" d={fullPath} fill="none" stroke="none" />
        </svg>
      </div>
    );
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
                  strokeDashoffset={dashLen * (1 - segmentProgress)}
                />
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const renderGrid = () => {
    const cells = [];

    // 1. Render interactive background cells for clicking
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const isAgent = Math.round(agent.position.x) === x && Math.round(agent.position.y) === y;

        cells.push(
          <div
            key={`cell-${x}-${y}`}
            className={`
              relative transition-all duration-300
              ${isAgent ? 'z-40' : 'z-10'}
            `}
            style={{
              gridColumn: x + 1,
              gridRow: y + 1,
            }}
            onClick={() => handleCellClick(x, y)}
          />
        );
      }
    }

    // 2. Render actual resource nodes as absolute-positioned overlays
    const resourceNodes = resources.map(resource => {
      // Dynamic Tooltip Positioning
      let tooltipClass = "absolute bottom-full left-1/2 -translate-x-1/2 mb-2";
      let arrowClass = "absolute left-1/2 -translate-x-1/2 -bottom-2";

      if (resource.position.x < 4) {
        tooltipClass = "absolute bottom-full left-0 mb-2";
        arrowClass = "absolute left-4 -bottom-2";
      } else if (resource.position.x > 15) {
        tooltipClass = "absolute bottom-full right-0 mb-2";
        arrowClass = "absolute right-4 -bottom-2";
      }

      if (resource.position.y < 4) {
        if (resource.position.x < 4) {
          tooltipClass = "absolute top-full left-0 mt-2";
          arrowClass = "absolute left-4 -top-2";
        } else if (resource.position.x > 15) {
          tooltipClass = "absolute top-full right-0 mt-2";
          arrowClass = "absolute right-4 -top-2";
        } else {
          tooltipClass = "absolute top-full left-1/2 -translate-x-1/2 mt-2";
          arrowClass = "absolute left-1/2 -translate-x-1/2 -top-2";
        }
      }

      const showTooltip = hoveredResource === resource.id;
      const isCurrent = currentResource?.id === resource.id;

      return (
        <div
          key={`res-${resource.id}`}
          className={`absolute transition-all duration-500 ${showTooltip ? 'z-[100]' : 'z-30'}`}
          style={{
            left: `${(resource.position.x + 0.5) * (100 / GRID_SIZE)}%`,
            top: `${(resource.position.y + 0.5) * (100 / GRID_SIZE)}%`,
            width: `${100 / GRID_SIZE}%`,
            height: `${100 / GRID_SIZE}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div
            className="absolute inset-0 m-auto flex items-center justify-center w-full h-full"
            onMouseEnter={() => handleMouseEnter(resource.id)}
            onMouseLeave={handleMouseLeave}
          >
            {/* Circular Reference Marker */}
            <div className={`
              relative flex items-center justify-center
              w-10 h-10 transform transition-all duration-300
              ${isCurrent ? 'scale-150 z-50 animate-pulse' : (selectedResource?.id === resource.id ? 'scale-110' : 'hover:scale-110 hover:-translate-y-1')}
            `}>
              {/* Outer Glow */}
              <div className={`absolute inset-0 rounded-full blur-[8px] opacity-25 ${resource.visited ? 'bg-green-400' :
                resource.difficulty <= 2 ? 'bg-purple-400' :
                  resource.difficulty <= 4 ? 'bg-blue-400' :
                    resource.difficulty <= 6 ? 'bg-amber-400' : 'bg-red-400'
                }`} />

              {/* Pin Head */}
              <div className={`
                w-8 h-8 rounded-full shadow-lg flex items-center justify-center border-2 border-white
                transition-colors duration-500
                ${resource.visited ? 'bg-emerald-500' :
                  resource.difficulty <= 2 ? 'bg-[#A855F7]' :
                    resource.difficulty <= 4 ? 'bg-[#3B82F6]' :
                      resource.difficulty <= 6 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'}
              `}>
                <ResourceIcon type={resource.type} />
              </div>

              {/* Highlight - pulsing golden ring */}
              {isCurrent && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-40" style={{ animationDuration: '2s' }} />
                  <div className="absolute inset-[-3px] rounded-full border-2 border-amber-400 opacity-80" />
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[6px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full shadow-md whitespace-nowrap leading-none">
                    CURRENT
                  </div>
                </>
              )}

              {/* Tooltip */}
              <div
                className={`${tooltipClass} w-72 transition-opacity duration-200 z-50 ${showTooltip ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onMouseEnter={() => handleMouseEnter(resource.id)}
                onMouseLeave={handleMouseLeave}
              >
                <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden cursor-default" onClick={(e) => e.stopPropagation()}>
                  <div className={`h-32 w-full relative overflow-hidden ${resource.visited ? 'bg-gradient-to-tr from-emerald-500 to-teal-400' : 'bg-gradient-to-tr from-blue-600 to-indigo-500'}`}>
                    {resource.youtube_url ? (
                      <img
                        src={`https://img.youtube.com/vi/${getYouTubeVideoId(resource.youtube_url)}/hqdefault.jpg`}
                        alt="Preview"
                        className="w-full h-full object-cover opacity-90 transition-opacity hover:opacity-100"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ResourceIcon type={resource.type} />
                      </div>
                    )}
                  </div>
                  <div className="p-4 text-left">
                    <h4 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2 mb-1">{resource.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      <span className="capitalize">{resource.type} Lesson</span>
                      <span>•</span>
                      <span>{['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'][resource.difficulty - 1] || 'Intermediate'}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (resource.youtube_url) {
                          setVideoResource(resource);
                          setHoveredResource(null);
                        }
                      }}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-200"
                    >
                      Open Lesson
                    </button>
                  </div>
                </div>
                <div className={`w-4 h-4 bg-white transform rotate-45 shadow-lg z-[-1] ${arrowClass}`}></div>
              </div>
            </div>
          </div>
        </div>
      );
    });

    return [...cells, ...resourceNodes];
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/30 overflow-hidden">
      <div className="flex-none px-6 py-4 bg-white/90 backdrop-blur-sm border-b border-gray-100 flex justify-between items-center z-10">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Learning Environment
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Explore resources and track your journey</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white border border-gray-100 rounded-lg shadow-sm p-1">
            <button
              onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.25))}
              className="p-1.5 hover:bg-gray-50 text-gray-500 transition-colors rounded-md"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <div className="w-px h-4 bg-gray-100 mx-1"></div>
            <button
              onClick={() => setZoomLevel(1.5)}
              className="px-2 py-1 hover:bg-gray-50 text-gray-400 text-[10px] font-bold transition-colors rounded-md"
              title="Reset Zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <div className="w-px h-4 bg-gray-100 mx-1"></div>
            <button
              onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
              className="p-1.5 hover:bg-gray-50 text-gray-500 transition-colors rounded-md"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          <button
            onClick={() => setIsSearching(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-200 hover:bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg transition-all shadow-sm"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>

          {isSimulationRunning && (
            <button
              onClick={onRefreshDQNPath}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-lg transition-all shadow-sm group"
            >
              <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
              <span>Optimize Path</span>
            </button>
          )}

          <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border border-blue-200 overflow-hidden bg-white shadow-sm">
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <span className="text-xs font-medium text-gray-600">You (Agent)</span>
            </div>
            <div className="w-px h-3 bg-gray-200"></div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-[#A855F7] rounded-full"></div>
              <span className="text-xs font-medium text-gray-600">Resource</span>
            </div>
            {assimilationPoints.length > 0 && (
              <>
                <div className="w-px h-3 bg-gray-200"></div>
                <div className="flex items-center gap-1.5">
                  <Diamond className="w-3 h-3 text-cyan-500 fill-cyan-400" />
                  <span className="text-xs font-medium text-gray-600">Assimilation</span>
                </div>
              </>
            )}
            {assimilationPath.length >= 2 && (
              <>
                <div className="w-px h-3 bg-gray-200"></div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-600">Path</span>
                  <button
                    onClick={() => setShowAssimilationPath(prev => !prev)}
                    className={`relative w-7 h-4 rounded-full transition-colors duration-200 ${showAssimilationPath ? 'bg-purple-500' : 'bg-gray-300'}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 ${showAssimilationPath ? 'translate-x-3' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

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
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 w-full relative overflow-auto bg-gray-50/30" ref={gridRef}>
        <div className="min-w-full min-h-full flex items-center justify-center p-8">
          <div
            className="grid gap-0 bg-[#F8FAFC] rounded-3xl shadow-2xl p-4 shrink-0 relative overflow-hidden"
            style={{
              width: `${1000 * zoomLevel}px`,
              height: `${1000 * zoomLevel}px`,
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
              backgroundImage: `radial-gradient(#E2E8F0 1.5px, transparent 1.5px)`,
              backgroundSize: `${24 * zoomLevel}px ${24 * zoomLevel}px`,
              transition: 'width 0.3s ease-out, height 0.3s ease-out'
            }}
          >
            {/* Map Terrain: color-coded 0°-90° quarter-circle arcs with hover tooltips */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
                {/* Color-coded concentric arcs — each arc belongs to a tier */}
                {(() => {
                  // Tier boundaries based on radii 3,7,11,15 grid units × 50px/unit
                  // Boundaries (midpoints between radii): 0-250, 250-450, 450-650, 650-900
                  const tierDefs = [
                    { name: 'Fundamentals', color: '#A855F7', from: 0, to: 250 },
                    { name: 'Intermediate', color: '#3B82F6', from: 250, to: 450 },
                    { name: 'Advance', color: '#F59E0B', from: 450, to: 650 },
                    { name: 'Mastery', color: '#EF4444', from: 650, to: 900 },
                  ];
                  const allArcs = [100, 200, 300, 400, 500, 600, 700, 800, 900];
                  return allArcs.map((r) => {
                    const tier = tierDefs.find(t => r > t.from && r <= t.to) || tierDefs[tierDefs.length - 1];
                    return (
                      <path key={`arc-${r}`}
                        d={`M ${r} 1000 A ${r} ${r} 0 0 0 0 ${1000 - r}`}
                        fill="none"
                        stroke={tier.color}
                        strokeWidth="1.5"
                        strokeDasharray="5 7"
                        opacity="0.5"
                        style={{ pointerEvents: 'stroke', cursor: 'default' }}
                      >
                        <title>{tier.name}</title>
                      </path>
                    );
                  });
                })()}
                {/* Radial spokes every 10° */}
                {[10, 20, 30, 40, 50, 60, 70, 80].map((deg) => {
                  const rad = (deg * Math.PI) / 180;
                  return <line key={`sp-${deg}`}
                    x1={0} y1={1000}
                    x2={950 * Math.cos(rad)}
                    y2={1000 - 950 * Math.sin(rad)}
                    stroke="#94A3B8" strokeWidth="0.8"
                    strokeDasharray="4 7" opacity="0.35"
                  />;
                })}
                {/* X-axis (bottom) and Y-axis (left) */}
                <line x1="0" y1="999" x2="980" y2="999" stroke="#94A3B8" strokeWidth="1.5" />
                <line x1="1" y1="1000" x2="1" y2="20" stroke="#94A3B8" strokeWidth="1.5" />
                {/* Tier boundary tick marks */}
                {[250, 450, 650].map(x => (
                  <line key={`tick-${x}`} x1={x} y1={992} x2={x} y2={1000} stroke="#94A3B8" strokeWidth="1.5" />
                ))}
              </svg>
              {/* Bottom tier labels aligned to arc radii */}
              <div className="absolute bottom-1 left-0 w-full pointer-events-none">
                {[
                  { label: 'FUNDAMENTALS', pct: '12.5%', color: 'text-purple-400' },
                  { label: 'INTERMEDIATE', pct: '35%', color: 'text-blue-400' },
                  { label: 'ADVANCE', pct: '55%', color: 'text-amber-400' },
                  { label: 'MASTERY', pct: '77.5%', color: 'text-red-400' },
                ].map((t) => (
                  <span key={t.label}
                    className={`absolute text-[9px] font-black uppercase tracking-[0.15em] -translate-x-1/2 ${t.color}`}
                    style={{ left: t.pct, bottom: 0 }}>
                    {t.label}
                  </span>
                ))}
              </div>
            </div>


            {/* {renderNeuralRoad()} */}
            {showAssimilationPath && renderAssimilationPath()}
            {renderGrid()}
            {renderPlaybackOverlay()}

            {/* Assimilation Point Markers */}
            {assimilationPoints.map((point) => (
              <motion.div
                key={`assim-${point.id}`}
                className="absolute z-35 pointer-events-none flex items-center justify-center"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  left: `${(point.position.x + 0.5) * (100 / GRID_SIZE)}%`,
                  top: `${(point.position.y + 0.5) * (100 / GRID_SIZE)}%`,
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 0.2 }}
                style={{
                  width: `${100 / GRID_SIZE}%`,
                  height: `${100 / GRID_SIZE}%`,
                  x: '-50%',
                  y: '-50%',
                }}
              >
                {/* Outer animated glow ring */}
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    width: '36px',
                    height: '36px',
                    background: `radial-gradient(circle, ${point.color}40 0%, transparent 70%)`,
                  }}
                  animate={{
                    scale: [1, 1.6, 1],
                    opacity: [0.6, 0.15, 0.6],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Icon/Marker Rendering */}
                {point.id === 'current_average' ? (
                  /* Avatar Icon for Average Knowledge */
                  <div className="relative w-10 h-10 rounded-full border-2 border-white shadow-xl overflow-hidden bg-white p-0.5 animate-in zoom-in-50 duration-500">
                    <img
                      src={avatar}
                      alt="Current Average"
                      className="w-full h-full rounded-full object-cover"
                    />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-blue-500 border border-white rounded-full shadow-sm" />
                  </div>
                ) : (
                  /* Standard Diamond for Peak Potential */
                  <div
                    className="relative w-5 h-5 flex items-center justify-center"
                    style={{ transform: 'rotate(45deg)' }}
                  >
                    <div
                      className="w-4 h-4 rounded-sm shadow-lg border-2 border-white"
                      style={{ backgroundColor: point.color }}
                    />
                  </div>
                )}
                {/* Label tooltip below */}
                <div
                  className="absolute top-[calc(100%+2px)] left-1/2 -translate-x-1/2 whitespace-nowrap"
                >
                  <span
                    className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md shadow-sm border"
                    style={{
                      color: point.color,
                      backgroundColor: `${point.color}10`,
                      borderColor: `${point.color}30`,
                    }}
                  >
                    {point.label}
                  </span>
                </div>
              </motion.div>
            ))}

            {/* Animated Student Agent Marker - Removed per user request */}
            {/* 
            <motion.div
              key={`agent-at-${agent.position.x}-${agent.position.y}`}
              className="absolute pointer-events-none z-40 flex items-center justify-center"
              initial={false}
              transition={{
                left: { type: "spring", damping: 25, stiffness: 120 },
                top: { type: "spring", damping: 25, stiffness: 120 },
                scale: { duration: 0.4 },
                rotate: { duration: 0.4 }
              }}
              animate={{
                left: `${(agent.position.x + 0.5) * (100 / GRID_SIZE)}%`,
                top: `${(agent.position.y + 0.5) * (100 / GRID_SIZE)}%`,
                scale: isPlaying ? [1, 1.15, 1] : 1, // Subtle bounce effect during playback
                rotateY: 0 // Force orientation reset to clear potential mirrored state
              }}
              style={{
                width: `${100 / GRID_SIZE}%`,
                height: `${100 / GRID_SIZE}%`,
                x: '-50%',
                y: '-50%',
              }}
            >
              <SocialAgent isMoving={isPlaying} />
            </motion.div>
            */}

            {showTravelArrow && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
                <defs>
                  <linearGradient id="travelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
                  </linearGradient>
                  <marker id="travel-arrowhead" markerWidth="12" markerHeight="8" refX="10" refY="4" orient="auto">
                    <path d="M0,0 L12,4 L0,8 Z" fill="#ef4444" />
                  </marker>
                </defs>
                <line
                  x1={`${(prevPosition.x + 0.5) * (100 / GRID_SIZE)}%`}
                  y1={`${(prevPosition.y + 0.5) * (100 / GRID_SIZE)}%`}
                  x2={`${(agent.position.x + 0.5) * (100 / GRID_SIZE)}%`}
                  y2={`${(agent.position.y + 0.5) * (100 / GRID_SIZE)}%`}
                  stroke="url(#travelGradient)"
                  strokeWidth="4"
                  strokeDasharray="12 6"
                  className="animate-pulse"
                  markerEnd="url(#travel-arrowhead)"
                  opacity="0.8"
                >
                  <animate attributeName="stroke-dashoffset" from="100" to="0" dur="2s" repeatCount="indefinite" />
                </line>
              </svg>
            )}
          </div>
        </div>
      </div>

      {selectedResource && (
        <div className="flex-none w-full bg-white/95 backdrop-blur-md p-4 border-t border-blue-100 z-10 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <div className={`p-3 rounded-lg ${selectedResource.visited ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
              <ResourceIcon type={selectedResource.type} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{selectedResource.title}</h3>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-600">{selectedResource.type}</span>
              </div>
            </div>

            <div className="flex flex-col items-end border-l border-gray-100 pl-8 ml-auto">
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">Potential Reward</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-blue-600 tracking-tighter">+{selectedResource.reward}</span>
                <span className="text-sm font-black text-blue-500/60 uppercase tracking-widest">pts</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSearching && (
        <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-md flex items-center justify-center z-[250] p-4 animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Resource Navigator</h3>
                </div>
              </div>
              <button
                onClick={() => setIsSearching(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Filter resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-800"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {resources
                .filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(resource => (
                  <button
                    key={resource.id}
                    onClick={() => {
                      onAgentMove(resource.position);
                      onResourceClick(resource);
                      setIsSearching(false);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-blue-50/50 border border-transparent hover:border-blue-100 transition-all group text-left"
                  >
                    <div className={`p-2.5 rounded-xl ${resource.visited ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'} group-hover:scale-110 transition-transform`}>
                      <ResourceIcon type={resource.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">{resource.title}</h4>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {videoResource && videoResource.youtube_url && (
        <div
          className="fixed inset-0 bg-gray-950/80 backdrop-blur-3xl flex items-center justify-center z-[200] p-4 sm:p-8"
          onClick={() => { setVideoResource(null); }}
        >
          <div
            className="bg-[#0f111a]/95 backdrop-blur-md rounded-[2.5rem] shadow-[0_0_80px_-15px_rgba(79,70,229,0.25)] w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col border border-white/10 animate-in zoom-in-90 fade-in duration-500 ease-out relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#131620]/80 backdrop-blur-3xl px-8 py-5 flex items-center justify-between border-b border-white/5 flex-shrink-0 relative z-20">
              <div className="flex items-center gap-5 text-white min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/30 border border-white/10">
                  <Play size={20} className="text-white fill-current ml-0.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-lg truncate text-white tracking-tight drop-shadow-sm">{videoResource.title}</h3>
                </div>
              </div>
              <button
                onClick={() => { setVideoResource(null); }}
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-red-500/20 hover:border-red-500/30 text-gray-400 hover:text-red-400 transition-all flex items-center justify-center border border-white/5 group"
              >
                <X size={22} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            <div className="flex flex-1 min-h-0 bg-[#090b10]">
              <div className="flex-1 relative bg-black overflow-hidden z-10">
                <iframe
                  className="w-full h-full"
                  src={getYouTubeEmbedUrl(videoResource.youtube_url) || ''}
                  title={videoResource.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};