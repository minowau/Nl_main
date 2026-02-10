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
  onRefreshDQNPath
}) => {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [animatingAgent, setAnimatingAgent] = useState(false);

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

  const renderGrid = () => {
    const cells = [];

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const resource = resources.find(r => r.position.x === x && r.position.y === y);
        const isAgent = agent.position.x === x && agent.position.y === y;
        const isPath = isPathCell(x, y);

        cells.push(
          <div
            key={`${x}-${y}`}
            className={`
              relative border border-gray-100 transition-all duration-300
              ${isPath ? 'bg-opacity-20 backdrop-blur-sm' : 'bg-gray-50/50 hover:bg-gray-100'}
              ${isAgent ? 'z-20' : 'z-0'}
              ${resource ? 'z-10' : ''}
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
              <div className={`
                absolute inset-0 m-auto flex items-center justify-center
                w-7 h-7 rounded-xl shadow-sm transform transition-all duration-300
                ${resource.visited
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-200 ring-2 ring-green-100'
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200 ring-2 ring-blue-100'}
                ${selectedResource?.id === resource.id ? 'ring-2 ring-yellow-400 scale-110 shadow-md' : 'hover:scale-105 hover:shadow-md'}
              `}>
                <ResourceIcon type={resource.type} />
              </div>
            )}

            {isAgent && (
              <div className={`
                absolute inset-0 m-auto w-8 h-8 flex items-center justify-center
                ${animatingAgent ? 'scale-110' : 'scale-100'}
                transition-all duration-300
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
            className="grid gap-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4 shrink-0 transition-all duration-300"
            style={{
              width: '1000px',
              height: '1000px',
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
            }}
          >
            {renderGrid()}
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