import React, { useState } from 'react';
import { Resource, Agent, GridPosition, Polyline } from '../types';
import { BookOpen, Play, FileText, PenTool, RefreshCw, MapPin } from 'lucide-react';

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
  onPlaybackComplete
}) => {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [hoveredResource, setHoveredResource] = useState<string | null>(null);
  const hoverTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const [animatingAgent, setAnimatingAgent] = useState(false);
  const [pathProgress, setPathProgress] = useState(0);

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

  const renderGrid = () => {
    const cells = [];

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const resource = resources.find(r => r.position.x === x && r.position.y === y);
        const isAgent = agent.position.x === x && agent.position.y === y;
        const isPath = isPathCell(x, y);

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
                            handleCellClick(x, y);
                          }}
                          className={`w-full py-2.5 ${isAgent ? 'bg-green-600 hover:bg-green-700 border-green-500/20' : 'bg-blue-600 hover:bg-blue-700 border-blue-500/20'} text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 transform duration-100 border`}
                        >
                          {isAgent ? "Open Lesson" : "Travel to Lesson"}
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
    </div>
  );
};