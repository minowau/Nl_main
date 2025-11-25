import { useState, useEffect, useCallback } from 'react';
import { Agent, Resource, GridPosition, Polyline, LearningSummary } from '../types';

export const useDQNSimulation = () => {
  const [agent, setAgent] = useState<Agent>({
    position: { x: 0, y: 19 }, // Bottom left corner
    level: 1,
    totalReward: 0,
    visitedResources: []
  });

  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Simulate DQN decision making
  const getDQNAction = useCallback((currentPos: GridPosition, resources: Resource[]): GridPosition => {
    // Mock DQN logic: move towards nearest unvisited resource with highest reward
    const unvisitedResources = resources.filter(r => !agent.visitedResources.includes(r.id));
    
    if (unvisitedResources.length === 0) {
      return currentPos; // No more resources to visit
    }

    // Find the resource with the best reward/distance ratio
    let bestResource = unvisitedResources[0];
    let bestScore = -Infinity;

    unvisitedResources.forEach(resource => {
      const distance = Math.abs(resource.position.x - currentPos.x) + 
                      Math.abs(resource.position.y - currentPos.y);
      const score = resource.reward / (distance + 1); // Add 1 to avoid division by zero
      
      if (score > bestScore) {
        bestScore = score;
        bestResource = resource;
      }
    });

    // Move one step towards the best resource
    const dx = bestResource.position.x - currentPos.x;
    const dy = bestResource.position.y - currentPos.y;
    
    let newX = currentPos.x;
    let newY = currentPos.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      newX += dx > 0 ? 1 : -1;
    } else if (dy !== 0) {
      newY += dy > 0 ? 1 : -1;
    }

    return { x: Math.max(0, Math.min(19, newX)), y: Math.max(0, Math.min(19, newY)) };
  }, [agent.visitedResources]);

  // Generate mock DQN path for simulation
  const generateDQNPath = useCallback((startPos: GridPosition, resources: Resource[]): GridPosition[] => {
    const path: GridPosition[] = [startPos];
    let currentPos = { ...startPos };
    const unvisitedResources = resources.filter(r => !agent.visitedResources.includes(r.id));
    
    // Create a single optimal path through resources, prioritizing right and top movement
    const targetResources = unvisitedResources
      .sort((a, b) => {
        // Sort by reward first, then by position (prefer right and top)
        if (b.reward !== a.reward) return b.reward - a.reward;
        // Prefer positions that are more to the right and top
        const aScore = a.position.x + a.position.y;
        const bScore = b.position.x + b.position.y;
        return bScore - aScore;
      })
      .slice(0, Math.min(3, unvisitedResources.length));
    
    targetResources.forEach(resource => {
      // Generate path to this resource with priority: right first, then up
      while (currentPos.x !== resource.position.x || currentPos.y !== resource.position.y) {
        const dx = resource.position.x - currentPos.x;
        const dy = resource.position.y - currentPos.y;
        
        // Priority: move right first, then up
        if (dx > 0) {
          currentPos.x += dx > 0 ? 1 : -1;
        } else if (dy > 0) {
          currentPos.y += dy > 0 ? 1 : -1;
        } else if (dx < 0) {
          currentPos.x += dx > 0 ? 1 : -1;
        } else if (dy < 0) {
          currentPos.y += dy > 0 ? 1 : -1;
        }
        
        path.push({ ...currentPos });
      }
    });
    
    return path;
  }, [agent.visitedResources]);
  // Simulate BERT analysis for learning summary
  const generateLearningSummary = useCallback(async (visitedResources: Resource[]): Promise<LearningSummary> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const totalResources = 25; // Mock total
        const strengths = [
          'Strong understanding of foundational concepts',
          'Good problem-solving approach',
          'Consistent learning pattern'
        ];
        
        const recommendations = [
          'Focus on advanced topics to improve efficiency',
          'Practice more challenging exercises',
          'Review weaker areas identified by the system'
        ];

        resolve({
          totalResources,
          visitedResources: visitedResources.length,
          currentLevel: agent.level,
          strengths,
          recommendations,
          nextOptimalResource: { x: 10, y: 10 } // Mock next optimal position
        });
      }, 1500); // Simulate API delay
    });
  }, [agent.level]);

  // Generate polylines based on learning patterns
  const generatePolylines = useCallback((visitedResources: Resource[]): Polyline[] => {
    const polylines: Polyline[] = [];
    
    if (visitedResources.length >= 2) {
      // Create a polyline from the visited path
      polylines.push({
        id: 'learning-path-1',
        name: 'Current Learning Path',
        path: visitedResources.map(r => r.position),
        color: 'rgba(59, 130, 246, 0.4)',
        isActive: true,
        confidence: 0.85
      });
    }


    return polylines;
  }, [agent.position, generateDQNPath]);

  const moveAgent = useCallback((newPosition: GridPosition) => {
    setAgent(prev => ({
      ...prev,
      position: newPosition
    }));
  }, []);

  const visitResource = useCallback((resource: Resource) => {
    setAgent(prev => ({
      ...prev,
      visitedResources: [...prev.visitedResources, resource.id],
      totalReward: prev.totalReward + resource.reward,
      level: Math.floor((prev.totalReward + resource.reward) / 100) + 1
    }));
  }, []);

  // Simulation loop
  useEffect(() => {
    if (!isSimulationRunning) return;

    const interval = setInterval(() => {
      // This would integrate with your actual DQN model
      // For now, we'll use mock logic
    }, 1000);

    return () => clearInterval(interval);
  }, [isSimulationRunning, getDQNAction]);

  return {
    agent,
    isSimulationRunning,
    isLoading,
    setIsSimulationRunning,
    setIsLoading,
    moveAgent,
    visitResource,
    generateLearningSummary,
    generatePolylines,
    getDQNAction,
    generateDQNPath
  };
};