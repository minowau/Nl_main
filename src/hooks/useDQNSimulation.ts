import { useState, useCallback } from 'react';
import { nlpApi, Position, Resource, AgentState, LearningData, DQNPath } from '../services/nlpApi';

export interface Agent extends AgentState {}

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
  const generateDQNPath = useCallback(async (startPos: Position, resources: Resource[]): Promise<DQNPath> => {
    try {
      const unvisitedIds = resources.filter(r => !r.visited).map(r => r.id);
      const result = await nlpApi.generateDQNPath('default', startPos, unvisitedIds);
      return result;
    } catch (error) {
      console.error('Error generating DQN path:', error);
      return { path: [startPos], finalResource: null, totalReward: 0, pathLength: 1 };
    }
  }, []);

  // Generate learning summary from backend
  const generateLearningSummary = useCallback(async (visitedResources: Resource[]): Promise<LearningData> => {
    try {
      const learningData = await nlpApi.getLearningData('default');
      return learningData;
    } catch (error) {
      console.error('Error generating learning summary:', error);
      return {
        totalResources: 0,
        visitedResources: visitedResources.length,
        currentLevel: agent.level,
        strengths: [],
        recommendations: [],
        nextOptimalResource: null,
        totalReward: agent.totalReward
      };
    }
  }, [agent.level, agent.totalReward]);

  const moveAgent = useCallback((newPosition: Position) => {
    setAgent(prev => ({
      ...prev,
      position: newPosition
    }));
    
    // Sync with backend
    nlpApi.moveAgent('default', newPosition).catch(err => console.error('Error moving agent:', err));
  }, []);

  const visitResource = useCallback((resourceId: string, reward: number) => {
    setAgent(prev => {
      const newReward = prev.totalReward + reward;
      return {
        ...prev,
        visitedResources: [...prev.visitedResources, resourceId],
        totalReward: newReward,
        level: Math.min(5, 1 + Math.floor(newReward / 100))
      };
    });
    
    // Sync with backend
    nlpApi.visitResource('default', resourceId).catch(err => console.error('Error visiting resource:', err));
  }, []);

  return {
    agent,
    setAgent,
    isSimulationRunning,
    isLoading,
    setIsSimulationRunning,
    setIsLoading,
    moveAgent,
    visitResource,
    generateLearningSummary,
    generateDQNPath
  };
};