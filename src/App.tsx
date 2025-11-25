import React, { useState, useCallback } from 'react';
import { GridVisualization } from './components/GridVisualization';
import { ControlPanel } from './components/ControlPanel';
import { useDQNSimulation } from './hooks/useDQNSimulation';
import { mockResources } from './data/mockData';
import { Resource, Polyline, LearningSummary } from './types';

function App() {
  const {
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
  } = useDQNSimulation();

  const [resources, setResources] = useState<Resource[]>(mockResources);
  const [polylines, setPolylines] = useState<Polyline[]>([]);
  const [learningPath, setLearningPath] = useState<string[]>([]);
  const [learningData, setLearningData] = useState<LearningSummary>({
    totalResources: mockResources.length,
    visitedResources: 0,
    currentLevel: 1,
    strengths: [],
    recommendations: [],
    nextOptimalResource: null
  });

  const handleResourceClick = useCallback((resource: Resource) => {
    if (!resource.visited) {
      setResources(prev => prev.map(r => 
        r.id === resource.id ? { ...r, visited: true } : r
      ));
      
      visitResource(resource);
      moveAgent(resource.position);
      setLearningPath(prev => [...prev, resource.title]);
      
      setLearningData(prev => ({
        ...prev,
        visitedResources: prev.visitedResources + 1
      }));
    }
  }, [visitResource, moveAgent]);

  const handleSummarizeLearning = useCallback(async (title: string, summary: string) => {
    setIsLoading(true);
    try {
      // Move agent to random position
      const randomX = Math.floor(Math.random() * 20);
      const randomY = Math.floor(Math.random() * 20);
      moveAgent({ x: randomX, y: randomY });

      const visitedResources = resources.filter(r => r.visited);
      const learningSummary = await generateLearningSummary(visitedResources);
      const newPolylines = generatePolylines(visitedResources);
      
      // Create a new polyline based on the summary
      const summaryPolyline: Polyline = {
        id: `summary-${Date.now()}`,
        name: title || `Learning Summary ${polylines.length + 1}`,
        path: visitedResources.map(r => r.position),
        color: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.4)`,
        isActive: false,
        confidence: 0.75 + Math.random() * 0.2,
        summary: summary
      };
      
      setLearningData(learningSummary);
      setPolylines(prev => [...prev, ...newPolylines, summaryPolyline]);
      
    } catch (error) {
      console.error('Error processing learning summary:', error);
    } finally {
      setIsLoading(false);
    }
  }, [resources, generateLearningSummary, generatePolylines, polylines.length, moveAgent]);

  const handleShowPolyline = useCallback((polylineId: string) => {
    setPolylines(prev => prev.map(p => ({
      ...p,
      isActive: p.id === polylineId
    })));
  }, []);

  const handleToggleSimulation = useCallback(() => {
    if (!isSimulationRunning) {
      const dqnPath = generateDQNPath(agent.position, resources);
      
      const simulationPolyline: Polyline = {
        id: 'dqn-simulation',
        name: 'DQN Simulation Path',
        path: dqnPath,
        color: 'rgba(239, 68, 68, 0.5)',
        isActive: true,
        confidence: 0.95
      };
      
      setPolylines(prev => [...prev.filter(p => p.id !== 'dqn-simulation'), simulationPolyline]);
    }
    setIsSimulationRunning(!isSimulationRunning);
  }, [isSimulationRunning, setIsSimulationRunning, generateDQNPath, agent.position, resources]);

  const handleAgentMove = useCallback((position: { x: number; y: number }) => {
    moveAgent(position);
  }, [moveAgent]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Discrete Mathematics
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span>Agent Level:</span>
                <span className="font-semibold text-blue-600">{agent.level}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>Total Reward:</span>
                <span className="font-semibold text-green-600">{agent.totalReward}</span>
              </div>
              <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                learner
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6 h-[calc(100vh-140px)]">
          {/* Left Panel - 2D Grid Environment */}
          <div className="flex-1">
            <GridVisualization
              resources={resources}
              agent={agent}
              polylines={polylines}
              onResourceClick={handleResourceClick}
              onAgentMove={handleAgentMove}
            />
          </div>

          {/* Right Panel - Control Center */}
          <div className="w-80 flex-shrink-0">
            <ControlPanel
              onSummarizeLearning={handleSummarizeLearning}
              onShowPolyline={handleShowPolyline}
              onToggleSimulation={handleToggleSimulation}
              learningData={learningData}
              polylines={polylines}
              isSimulationRunning={isSimulationRunning}
              isLoading={isLoading}
              learningPath={learningPath}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;