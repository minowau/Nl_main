import { useState, useCallback, useEffect } from 'react';
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

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPath, setPlaybackPath] = useState<{ x: number, y: number }[]>([]);

  const handlePlayPath = useCallback(() => {
    if (learningPath.length < 2) return;

    // Reconstruct path from titles
    const path: { x: number, y: number }[] = [];
    learningPath.forEach(title => {
      const resource = resources.find(r => r.title === title);
      const pos = resource ? resource.position : null;
      if (pos) path.push(pos);
    });

    if (path.length > 0) {
      setPlaybackPath(path);
      setIsPlaying(true);
      // Auto-reset after animation duration (estimated 1s per step or just let Grid handle it)
      // For now, we'll let GridVisualization handle the visual state, 
      // but we can look for a callback to reset isPlaying if needed.
    }
  }, [learningPath, resources]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl text-gray-900 font-medium">
              Navigated Learning
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Agent Level</span>
                <span className="font-bold text-blue-600 text-lg leading-none">{agent.level}</span>
              </div>
              <div className="h-8 w-px bg-gray-200"></div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Reward</span>
                <span className="font-bold text-green-600 text-lg leading-none">{agent.totalReward}</span>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-8rem)] min-h-[600px]">
          {/* Left Panel - Grid Visualization */}
          <div className="flex-1 overflow-hidden flex flex-col rounded-2xl bg-white shadow-sm border border-gray-200">
            <GridVisualization
              resources={resources}
              agent={agent}
              polylines={polylines}
              onResourceClick={handleResourceClick}
              onAgentMove={handleAgentMove}
              isSimulationRunning={isSimulationRunning}
              dqnPathInfo={dqnPathInfo}
              onRefreshDQNPath={handleRefreshDQNPath}
              isPlaying={isPlaying}
              playbackPath={playbackPath}
              onPlaybackComplete={() => setIsPlaying(false)}
            />
          </div>

          {/* Right Panel - Control Center */}
          <div className="w-full lg:w-96 flex-shrink-0 flex flex-col rounded-2xl bg-white shadow-sm border border-gray-200 overflow-hidden">
            <ControlPanel
              onSummarizeLearning={handleSummarizeLearning}
              onShowPolyline={handleShowPolyline}
              onToggleSimulation={handleToggleSimulation}
              onPlayPath={handlePlayPath}
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