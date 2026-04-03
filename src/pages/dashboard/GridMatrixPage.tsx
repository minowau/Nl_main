import React, { useState, useCallback, useEffect } from 'react';
import { GridVisualization } from '../../components/GridVisualization';
import { ControlPanel } from '../../components/ControlPanel';
import { useDQNSimulation } from '../../hooks/useDQNSimulation';
import { Resource, Polyline, LearningSummary, GridPosition } from '../../types';
import { nlpApi } from '../../services/nlpApi';
import { useAppContext } from '../../context/AppContext';
import { ChevronLeft } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import DashboardTutorial from '../../components/Dashboard/DashboardTutorial';

const GridMatrixPage: React.FC = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const queryResourceId = new URLSearchParams(search).get('resource');
  
  const {
    agent: globalAgent,
    bookmarks,
    toggleBookmark,
    updateAgentPosition,
    visitResource: globalVisitResource
  } = useAppContext();

  const {
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
    nextOptimalResource: null,
    activityLog: []
  });
  const [showTutorial, setShowTutorial] = useState(false);

  // Sync local agent with global agent on mount
  useEffect(() => {
    setAgent(globalAgent);
  }, [globalAgent, setAgent]);

  // Handle deep-linked resource from query parameter
  useEffect(() => {
    if (queryResourceId && resources.length > 0) {
      const targetResource = resources.find(r => r.id === queryResourceId);
      if (targetResource) {
        // Use timeout to ensure grid is ready for movement animation
        const timer = setTimeout(() => {
          handleResourceClick(targetResource);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [queryResourceId, resources]);

  // Load resources and history from backend on mount
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      try {
        const [resourceData, polylineData, learningStats] = await Promise.all([
          nlpApi.getResources(),
          nlpApi.getPolylines(),
          nlpApi.getLearningData('default')
        ]);

        setResources(resourceData);
        setPolylines(polylineData);
        setLearningData({
          ...learningStats,
          totalResources: resourceData.length
        });

        // Initialize resources and history from backend on mount

      } catch (error) {
        console.error('Failed to initialize app data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, [setIsLoading]);

  const handleResourceClick = useCallback(async (resource: Resource) => {
    // Always move agent to the resource position
    moveAgent(resource.position);
    await updateAgentPosition(resource.position);
    
    // Update URL to match current resource for deep-linking/persistence
    navigate(`/navigator?resource=${resource.id}`, { replace: true });

    if (!resource.visited) {
      setResources(prev => prev.map(r =>
        r.id === resource.id ? { ...r, visited: true } : r
      ));

      visitResource(resource.id, resource.reward);
      await globalVisitResource(resource.id);
      
      setLearningPath(prev => [...prev, resource.title]);

      setLearningData(prev => ({
        ...prev,
        visitedResources: prev.visitedResources + 1,
        activityLog: [
          {
            id: `log-${Date.now()}`,
            type: 'visit',
            title: `Visited: ${resource.title}`,
            timestamp: new Date().toLocaleTimeString()
          },
          ...(prev.activityLog || [])
        ]
      }));
    } else {
      setLearningData(prev => ({
        ...prev,
        activityLog: [
          {
            id: `log-${Date.now()}`,
            type: 'start',
            title: `Reviewed Lesson: ${resource.title}`,
            timestamp: new Date().toLocaleTimeString()
          },
          ...(prev.activityLog || [])
        ]
      }));
    }
  }, [visitResource, moveAgent, updateAgentPosition, globalVisitResource]);

  const handleSummarizeLearning = useCallback(async (title: string, summary: string) => {
    setIsLoading(true);
    try {
      const visitedIds = resources.filter(r => r.visited).map(r => r.id);
      const result = await nlpApi.createLearningSummary('default', title, summary, visitedIds);

      // Move agent to DQN-recommended resource or fallback to nearest unvisited

      // Move agent to DQN-recommended resource or fallback to nearest unvisited
      const nextRecPos = result.next_recommendation?.position;
      if (nextRecPos) {
        moveAgent(nextRecPos);
        await updateAgentPosition(nextRecPos);
      } else {
        const unvisited = resources.filter(r => !r.visited);
        if (unvisited.length > 0) {
          moveAgent(unvisited[0].position);
          await updateAgentPosition(unvisited[0].position);
        }
      }

      const visitedResources = resources.filter(r => r.visited);
      const stats = await generateLearningSummary(visitedResources);

      // Surface next recommendation and update activity log in a single state update
      const nextRecTitle = result.next_recommendation?.title;
      setLearningData(prev => ({
        ...stats,
        recommendations: nextRecTitle
          ? [nextRecTitle, ...stats.recommendations.filter(r => r !== nextRecTitle)].slice(0, 3)
          : stats.recommendations,
        activityLog: [
          {
            id: `log-${Date.now()}`,
            type: 'summary',
            title: `Completed Summary: ${title}`,
            timestamp: new Date().toLocaleTimeString()
          },
          ...(prev.activityLog || [])
        ]
      }));

      // ONLY add the backend summary polyline to the state (don't add redundant 'Current Learning Path')
      setPolylines(prev => {
        // Keep existing summaries and only remove temporary paths
        const base = prev.filter(p => p.id !== 'learning-path-1' && p.id !== 'dqn-simulation');
        return [...base, result.polyline];
      });

    } catch (error) {
      console.error('Error processing learning summary:', error);
    } finally {
      setIsLoading(false);
    }
  }, [resources, generateLearningSummary, moveAgent, updateAgentPosition, setIsLoading]);

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

  const handleAgentMove = useCallback(async (position: GridPosition, title?: string) => {
    moveAgent(position);
    await updateAgentPosition(position);
    
    if (title) {
        setLearningData(prev => ({
          ...prev,
          activityLog: [
            {
              id: `log-${Date.now()}`,
              type: 'search',
              title: `Jumped to Module: ${title}`,
              timestamp: new Date().toLocaleTimeString()
            },
            ...(prev.activityLog || [])
          ]
        }));
    }
  }, [moveAgent, updateAgentPosition]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPath, setPlaybackPath] = useState<GridPosition[]>([]);

  const handlePlayPath = useCallback(() => {
    if (learningPath.length < 2) return;

    // Reconstruct path from titles
    const path: GridPosition[] = [];
    learningPath.forEach(title => {
      const resource = resources.find(r => r.title === title);
      const pos = resource ? resource.position : null;
      if (pos) path.push(pos);
    });

    if (path.length > 0) {
      setPlaybackPath(path);
      setIsPlaying(true);
    }
  }, [learningPath, resources]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-900 relative">
      {showTutorial && <DashboardTutorial onComplete={() => setShowTutorial(false)} page="navigator" />}
      
      {/* Precision Floating Back Button */}
      <div className="fixed top-6 left-6 z-[60]">
        <Link 
          to="/dashboard"
          className="flex items-center gap-3 px-5 py-3 bg-white/80 backdrop-blur-md hover:bg-white text-slate-600 rounded-2xl transition-all shadow-xl shadow-slate-200/50 border border-slate-200 group active:scale-95"
          title="Return to Command Center"
        >
          <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em]">Exit Matrix</span>
        </Link>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1700px] mx-auto w-full px-6 pt-20 pb-6">
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-5rem)] min-h-[600px]">
          {/* Left Panel - Grid Visualization */}
          <div id="matrix-grid" className="flex-1 overflow-hidden flex flex-col rounded-2xl bg-white shadow-xl border border-gray-200">
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
          <div id="control-center" className="w-full lg:w-96 flex-shrink-0 flex flex-col rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden">
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
              bookmarks={bookmarks}
              toggleBookmark={toggleBookmark}
              resources={resources}
              onResourceClick={handleResourceClick}
              onStartTutorial={() => setShowTutorial(true)}
              agent={agent}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default GridMatrixPage;
