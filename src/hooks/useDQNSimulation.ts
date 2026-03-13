import { useState, useEffect, useCallback } from 'react';
import { Agent, Resource, GridPosition, Polyline, LearningSummary } from '../types';
import { nlpApi } from '../services/nlpApi';

export const useDQNSimulation = () => {
  const [agent, setAgent] = useState<Agent>({
    position: { x: 10, y: 10 },
    level: 1,
    totalReward: 0,
    visitedResources: []
  });

  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Generate DQN path using backend API
  const generateDQNPath = useCallback(async (startPos: GridPosition, resources: Resource[]): Promise<{ path: GridPosition[], finalResource: Resource | null, totalReward: number }> => {
    try {
      const unvisitedIds = resources.filter(r => !r.visited).map(r => r.id);
      const result = await nlpApi.generateDQNPath('default', startPos, unvisitedIds);
      return result;
    } catch (error) {
      console.error('Error generating DQN path:', error);
      return { path: [startPos], finalResource: null, totalReward: 0 };
    }
  }, []);

  // Generate learning summary from backend
  const generateLearningSummary = useCallback(async (visitedResources: Resource[]): Promise<LearningSummary> => {
    try {
      const learningData = await nlpApi.getLearningData('default');
      return {
        totalResources: learningData.totalResources,
        visitedResources: learningData.visitedResources,
        currentLevel: learningData.currentLevel,
        strengths: learningData.strengths,
        recommendations: learningData.recommendations,
        nextOptimalResource: learningData.nextOptimalResource
      };
    } catch (error) {
      console.error('Error generating learning summary:', error);
      return {
        totalResources: 0,
        visitedResources: visitedResources.length,
        currentLevel: agent.level,
        strengths: [],
        recommendations: [],
        nextOptimalResource: null
      };
    }
  }, [agent.level]);

  // Generate polylines from visited resources
  const generatePolylines = useCallback((visitedResources: Resource[]): Polyline[] => {
    const polylines: Polyline[] = [];

    if (visitedResources.length >= 2) {
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
  }, []);

  const moveAgent = useCallback((newPosition: GridPosition) => {
    setAgent(prev => ({
      ...prev,
      position: newPosition
    }));

    // Sync with backend
    nlpApi.moveAgent('default', newPosition).catch(err => console.error('Error moving agent:', err));
  }, []);

  const visitResource = useCallback((resource: Resource) => {
    setAgent(prev => ({
      ...prev,
      visitedResources: [...prev.visitedResources, resource.id],
      totalReward: prev.totalReward + resource.reward,
      level: Math.min(5, 1 + Math.floor((prev.totalReward + resource.reward) / 100))
    }));

    // Sync with backend
    nlpApi.visitResource('default', resource.id).catch(err => console.error('Error visiting resource:', err));
  }, []);

  // Simulation loop for DQN
  useEffect(() => {
    if (!isSimulationRunning) return;

    const interval = setInterval(() => {
      // DQN simulation could be enhanced here
    }, 1000);

    return () => clearInterval(interval);
  }, [isSimulationRunning]);

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
    generateDQNPath
  };
};