import React, { useState, useEffect } from 'react';
import { Resource, Agent, GridPosition, Polyline } from '../types';
import { BookOpen, Play, FileText, PenTool } from 'lucide-react';

interface GridVisualizationProps {
  resources: Resource[];
  agent: Agent;
  polylines: Polyline[];
  onResourceClick: (resource: Resource) => void;
  onAgentMove: (position: GridPosition) => void;
}

const GRID_SIZE = 10; // Changed to 10x10 grid to match App.js
const CELL_SIZE = 40; // Increased cell size for better visibility

const ResourceIcon = ({ type }: { type: Resource['type'] }) => {
  const iconProps = { size: 12, className: "text-white w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" };
  
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
  onAgentMove
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
              border border-gray-300 cursor-pointer transition-all duration-200 relative
              ${isPath ? 'bg-opacity-30' : 'bg-white hover:bg-gray-50'}
              ${isAgent ? 'ring-2 ring-red-500 ring-offset-1' : ''}
              ${resource?.visited ? 'bg-green-100' : ''}
            `}
            style={{
              width: `${CELL_SIZE}px`,
              height: `${CELL_SIZE}px`,
              backgroundColor: isPath ? getPathColor(x, y) : undefined,
              gridColumn: x + 1,
              gridRow: y + 1,
            }}
            onClick={() => handleCellClick(x, y)}
          >
            {resource && (
              <div className={`
                w-8 h-8 rounded-md flex items-center justify-center absolute inset-0 m-auto shadow-sm
                ${resource.visited ? 'bg-green-600 shadow-green-200' : 'bg-blue-600 shadow-blue-200'}
                ${selectedResource?.id === resource.id ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}
                hover:scale-110 hover:shadow-lg transition-all duration-200
              `}>
                <span className="text-white text-lg font-bold">📚</span>
              </div>
            )}
            
            {isAgent && (
              <div className={`
                w-8 h-8 bg-red-500 rounded-full absolute inset-0 m-auto shadow-lg
                flex items-center justify-center z-10
                ${animatingAgent ? 'scale-110' : 'scale-100'}
                transition-all duration-300 shadow-red-200
              `}>
                <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
              </div>
            )}
          </div>
        );
      }
    }
    
    return cells;
  };

  return (
    <div className="bg-white p-4 lg:p-6 rounded-lg shadow-lg h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base lg:text-lg font-semibold text-gray-800">Learning Environment</h2>
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
            <span>Agent</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-600 rounded-sm shadow-sm"></div>
            <span>Resources</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-600 rounded-sm shadow-sm"></div>
            <span>Visited</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center overflow-auto">
        <div 
          className="grid gap-1 border-2 border-gray-800 bg-gray-100 p-3 rounded-lg mx-auto shadow-inner"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        >
          {renderGrid()}
        </div>
      </div>
      
      {selectedResource && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 shadow-sm">
          <h3 className="font-semibold text-blue-900 text-sm">{selectedResource.title}</h3>
          <p className="text-xs text-blue-700 mt-1">
            Type: {selectedResource.type} | Difficulty: {selectedResource.difficulty}/5 | 
            Reward: {selectedResource.reward} points
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Status: {selectedResource.visited ? 'Completed' : 'Not visited'}
          </p>
        </div>
      )}
    </div>
  );
};