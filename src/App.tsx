import React, { useState, useCallback, useEffect } from 'react';
import { GridVisualization } from './components/GridVisualization';
import { ControlPanel } from './components/ControlPanel';
import { useDQNSimulation } from './hooks/useDQNSimulation';
import { Resource, Polyline, LearningSummary } from './types';
import { nlpApi } from './services/nlpApi';

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

  const [resources, setResources] = useState<Resource[]>([]);
  const [polylines, setPolylines] = useState<Polyline[]>([]);
  const [learningPath, setLearningPath] = useState<string[]>([]);
  const [dqnPathInfo, setDqnPathInfo] = useState<{ resource: Resource | null, reward: number } | null>(null);
  const [learningData, setLearningData] = useState<LearningSummary>({
    totalResources: 0,
    visitedResources: 0,
    currentLevel: 1,
    strengths: [],
    recommendations: [],
    nextOptimalResource: null
  });

  // Load resources from backend on mount
  useEffect(() => {
    const loadResources = async () => {
      try {
        const data = await nlpApi.getResources();
        setResources(data);
        setLearningData(prev => ({
          ...prev,
          totalResources: data.length
        }));
      } catch (error) {
        console.error('Failed to load resources:', error);
      }
    };
    loadResources();
  }, []);

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
      const visitedIds = resources.filter(r => r.visited).map(r => r.id);
      const result = await nlpApi.createLearnningSummary('default', title, summary, visitedIds);
      
      // Move agent to next unvisited resource or random resource if all visited
      const unvisited = resources.filter(r => !r.visited);
      let targetPos;
      
      if (unvisited.length > 0) {
        // Find nearest unvisited (simple heuristic: first one)
        targetPos = unvisited[0].position;
      } else {
        // If all visited, pick a random resource
        const randomResource = resources[Math.floor(Math.random() * resources.length)];
        targetPos = randomResource.position;
      }
      
      moveAgent(targetPos);

      const visitedResources = resources.filter(r => r.visited);
      const learningSummary = await generateLearningSummary(visitedResources);
      const newPolylines = generatePolylines(visitedResources);
      
      setLearningData(learningSummary);
      setPolylines(prev => [...prev, result.polyline, ...newPolylines]);
      
    } catch (error) {
      console.error('Error processing learning summary:', error);
    } finally {
      setIsLoading(false);
    }
  }, [resources, generateLearningSummary, generatePolylines, moveAgent, setIsLoading]);

  const handleShowPolyline = useCallback((polylineId: string) => {
    setPolylines(prev => prev.map(p => ({
      ...p,
      isActive: p.id === polylineId
    })));
  }, []);

  const handleToggleSimulation = useCallback(async () => {
    if (!isSimulationRunning) {
      try {
        const dqnResult = await generateDQNPath(agent.position, resources);

        const simulationPolyline: Polyline = {
          id: 'dqn-simulation',
          name: 'DQN Optimal Path',
          path: dqnResult.path,
          color: 'rgba(239, 68, 68, 0.5)',
          isActive: true,
          confidence: 0.95
        };

        setPolylines(prev => [...prev.filter(p => p.id !== 'dqn-simulation'), simulationPolyline]);
        setDqnPathInfo({
          resource: dqnResult.finalResource,
          reward: dqnResult.totalReward
        });
      } catch (error) {
        console.error('Error starting DQN simulation:', error);
      }
    } else {
      setPolylines(prev => prev.filter(p => p.id !== 'dqn-simulation'));
      setDqnPathInfo(null);
    }
    setIsSimulationRunning(!isSimulationRunning);
  }, [isSimulationRunning, setIsSimulationRunning, generateDQNPath, agent.position, resources]);

  const handleRefreshDQNPath = useCallback(async () => {
    if (isSimulationRunning) {
      try {
        const dqnResult = await generateDQNPath(agent.position, resources);

        const simulationPolyline: Polyline = {
          id: 'dqn-simulation',
          name: 'DQN Optimal Path',
          path: dqnResult.path,
          color: 'rgba(239, 68, 68, 0.5)',
          isActive: true,
          confidence: 0.95
        };

        setPolylines(prev => [...prev.filter(p => p.id !== 'dqn-simulation'), simulationPolyline]);
        setDqnPathInfo({
          resource: dqnResult.finalResource,
          reward: dqnResult.totalReward
        });
      } catch (error) {
        console.error('Error refreshing DQN path:', error);
      }
    }
  }, [isSimulationRunning, generateDQNPath, agent.position, resources]);

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
              Advance NLP
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
              isSimulationRunning={isSimulationRunning}
              dqnPathInfo={dqnPathInfo}
              onRefreshDQNPath={handleRefreshDQNPath}
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