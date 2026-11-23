import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { GridVisualization } from '../../components/GridVisualization';
import { ControlPanel } from '../../components/ControlPanel';
import { useDQNSimulation } from '../../hooks/useDQNSimulation';
import { Resource, Polyline, LearningSummary, GridPosition } from '../../types';
import { nlpApi } from '../../services/nlpApi';
import { useAppContext } from '../../context/AppContext';
import { ChevronLeft, Sparkles, X, PlayCircle, MapPin } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import DashboardTutorial from '../../components/Dashboard/DashboardTutorial';

const GridMatrixPage: React.FC = () => {
  // const navigate = useNavigate();
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
  const [learningPath, setLearningPath] = useState<GridPosition[]>([]);
  const [dqnPathInfo, setDqnPathInfo] = useState<{ resource: Resource | null, reward: number } | null>(null);
  const [nextRecommendation, setNextRecommendation] = useState<NonNullable<Polyline['next_recommendation']> | null>(null);
  const [showRecommendationAlert, setShowRecommendationAlert] = useState(false);
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

  const assimilationPoints = useMemo(() => {
    const points = [];
    
    const highLine = polylines.find(p => p.id === 'high_line');

    if (highLine && highLine.assimilation_position) {
      points.push({ id: highLine.id, position: highLine.assimilation_position, label: 'Peak Potential', color: '#ef4444' });
    }
    
    return points;
  }, [polylines]);

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
          handleResourceClick(targetResource, true);
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

        const historyWithRec = polylineData.filter(
          p => !['high_line', 'current_average', 'dqn-simulation', 'learning-path-1'].includes(p.id) && p.next_recommendation
        );
        const latestRec = historyWithRec.length > 0
          ? historyWithRec[historyWithRec.length - 1].next_recommendation || null
          : null;
        if (latestRec) {
          setNextRecommendation(latestRec);
        }

        setLearningData({
          ...learningStats,
          recommendations: latestRec?.title
            ? [latestRec.title, ...(learningStats.recommendations || []).filter(r => r !== latestRec.title)].slice(0, 3)
            : (learningStats.recommendations || []),
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

  const handleResourceClick = useCallback(async (resource: Resource, skipMove: boolean = false) => {
    // If skipMove is true, we don't displace the agent icon
    if (!skipMove) {
      moveAgent(resource.position);
      await updateAgentPosition(resource.position);
    }
    
    // Reset the summary flag (removed logic)
    
    // navigate(`/navigator?resource=${resource.id}`, { replace: true });

    if (!resource.visited) {
      setResources(prev => prev.map(r =>
        r.id === resource.id ? { ...r, visited: true } : r
      ));

      visitResource(resource.id, resource.reward);
      await globalVisitResource(resource.id);
      
      setLearningPath(prev => [...prev, resource.position]);

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
      // Ensure if the user summarized a lesson matching by title or module, it is counted as visited
      const matchedResource = resources.find(
        r =>
          r.title.toLowerCase() === title.trim().toLowerCase() ||
          r.module.toLowerCase() === title.trim().toLowerCase()
      );
      if (matchedResource && !matchedResource.visited) {
        setResources(prev =>
          prev.map(r => (r.id === matchedResource.id ? { ...r, visited: true } : r))
        );
        visitResource(matchedResource.id, matchedResource.reward);
        await globalVisitResource(matchedResource.id);
      }

      const visitedIds = Array.from(
        new Set([
          ...resources.filter(r => r.visited).map(r => r.id),
          ...(matchedResource ? [matchedResource.id] : [])
        ])
      );
      const result = await nlpApi.createLearningSummary('default', title, summary, visitedIds);

      // Determine recommended next lesson from DQN navigator or fallback to next unvisited
      const unvisited = resources.filter(r => !visitedIds.includes(r.id));
      const rec = result.next_recommendation || (unvisited.length > 0 ? {
        id: unvisited[0].id,
        title: unvisited[0].title,
        position: unvisited[0].position,
        module: unvisited[0].module,
        reason: 'fallback'
      } : null);

      setNextRecommendation(rec);
      if (rec) {
        setShowRecommendationAlert(true);
      }

      // Move agent to DQN-recommended resource or fallback to nearest unvisited
      const nextRecPos = rec?.position;
      if (nextRecPos) {
        moveAgent(nextRecPos);
        await updateAgentPosition(nextRecPos);
      }

      const visitedResources = resources.filter(r => visitedIds.includes(r.id));
      const stats = await generateLearningSummary(visitedResources);

      // Surface next recommendation and update activity log in a single state update
      const nextRecTitle = rec?.title;
      setLearningData(prev => ({
        ...stats,
        visitedResources: visitedIds.length,
        recommendations: nextRecTitle
          ? [nextRecTitle, ...stats.recommendations.filter(r => r !== nextRecTitle)].slice(0, 3)
          : stats.recommendations,
        activityLog: [
          ...(rec ? [{
            id: `log-rec-${Date.now()}`,
            type: 'optimal' as const,
            title: `Next Recommended: ${rec.title}`,
            timestamp: new Date().toLocaleTimeString()
          }] : []),
          {
            id: `log-${Date.now()}`,
            type: 'summary' as const,
            title: `Completed Summary: ${title}`,
            timestamp: new Date().toLocaleTimeString()
          },
          ...(prev.activityLog || [])
        ]
      }));

      // Update polylines with both the new summary and the updated average
      setPolylines(prev => {
        const base = prev.filter(p => !['learning-path-1', 'dqn-simulation', 'current_average'].includes(p.id));
        const updates: Polyline[] = [];
        if (result.polyline) {
          updates.push({
            ...result.polyline,
            path: Array.isArray(result.polyline.path) ? result.polyline.path : []
          });
        }
        if (result.average_polyline) {
          updates.push({
            ...result.average_polyline,
            path: Array.isArray(result.average_polyline.path) ? result.average_polyline.path : []
          });
        }
        return [...base, ...updates];
      });

    } catch (error) {
      console.error('Error processing learning summary:', error);
    } finally {
      setIsLoading(false);
    }
  }, [resources, generateLearningSummary, moveAgent, updateAgentPosition, setIsLoading, visitResource, globalVisitResource]);

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

  const handleAgentMove = useCallback(async (_position: GridPosition, title?: string) => {
    // moveAgent(_position);
    // await updateAgentPosition(_position);
    
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

    if (learningPath.length > 1) {
      setPlaybackPath(learningPath);
      setIsPlaying(true);
    }
  }, [learningPath]);

  const handleRestartJourney = useCallback(async () => {
    if (!window.confirm("Are you sure you want to restart your Intelligence Journey? This will clear all learning progress and summaries.")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await nlpApi.resetSession('default');
      
      // Update local state based on reset
      setAgent(response.session);
      setNextRecommendation(null);
      setShowRecommendationAlert(false);
      
      // Re-fetch everything to ensure synchronization
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
      setLearningPath([]);

    } catch (error) {
      console.error('Failed to reset journey:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setAgent]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-900 relative">
      {showTutorial && <DashboardTutorial onComplete={() => setShowTutorial(false)} page="navigator" />}

      {/* Prominent Alert for Next Recommended Lesson after Summarizing */}
      {showRecommendationAlert && nextRecommendation && (
        <div
          role="alert"
          className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-brand rounded-xl">
                  <Sparkles className="w-5 h-5 text-brand fill-brand" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand block">
                    {nextRecommendation.reason === 'dqn' ? 'RL / DQN Recommendation' : 'Navigator Recommendation'}
                  </span>
                  <h3 className="text-base font-bold text-gray-900">Next Recommended Lesson</h3>
                </div>
              </div>
              <button
                onClick={() => setShowRecommendationAlert(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Close Alert"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1">
                  Recommended Lecture to Watch Next
                </span>
                <h4 className="text-base font-bold text-gray-900 leading-snug">
                  {nextRecommendation.title}
                </h4>
                {nextRecommendation.module && (
                  <p className="text-xs font-medium text-gray-600 mt-1">
                    Module: <span className="text-brand font-semibold">{nextRecommendation.module}</span>
                  </p>
                )}
                {nextRecommendation.position && (
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-mono font-bold text-brand bg-white px-2.5 py-1 rounded-lg border border-blue-100 shadow-xs">
                    <MapPin className="w-3.5 h-3.5 text-brand" />
                    Matrix Coordinates: ({Math.round(nextRecommendation.position.x)}, {Math.round(nextRecommendation.position.y)})
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  onClick={() => setShowRecommendationAlert(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => {
                    const target = resources.find(
                      r => r.id === nextRecommendation.id || r.title === nextRecommendation.title
                    );
                    if (target) {
                      handleResourceClick(target, true);
                    }
                    setShowRecommendationAlert(false);
                  }}
                  className="px-5 py-2 bg-brand hover:bg-brand-dark text-white text-xs font-medium rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <PlayCircle className="w-4 h-4" />
                  View on Matrix
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Precision Floating Back Button */}
      <div className="fixed top-4 left-6 z-[60]">
        <Link 
          to="/dashboard"
          className="flex items-center gap-2.5 px-4 py-2.5 bg-white/90 backdrop-blur-md hover:bg-white text-slate-700 rounded-xl transition-all shadow-md shadow-slate-200/60 border border-slate-200/80 group active:scale-95"
          title="Return to Command Center"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform text-slate-500" />
          <span className="text-[11px] font-extrabold uppercase tracking-[0.15em]">Exit Matrix</span>
        </Link>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1720px] mx-auto w-full px-5 pt-16 pb-5">
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-5.25rem)] min-h-[620px]">
          {/* Left Panel - Grid Visualization */}
          <div id="matrix-grid" className="relative flex-1 overflow-hidden flex flex-col rounded-2xl bg-white shadow-lg shadow-slate-200/60 border border-slate-200/80">
            <GridVisualization
              resources={resources}
              agent={agent}
              polylines={polylines}
              onResourceClick={(res, skip) => handleResourceClick(res, skip)}
              onAgentMove={handleAgentMove}
              isSimulationRunning={isSimulationRunning}
              dqnPathInfo={dqnPathInfo}
              onRefreshDQNPath={handleRefreshDQNPath}
              isPlaying={isPlaying}
              playbackPath={playbackPath}
              onPlaybackComplete={() => setIsPlaying(false)}
              assimilationPoints={assimilationPoints}
              nextRecommendation={nextRecommendation}
            />
          </div>

          {/* Right Panel - Control Center */}
          <div id="control-center" className="w-full lg:w-[390px] flex-shrink-0 flex flex-col rounded-2xl bg-white shadow-lg shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
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
              onResourceClick={(res) => handleResourceClick(res, true)}
              onStartTutorial={() => setShowTutorial(true)}
              agent={agent}
              onRestartJourney={handleRestartJourney}
              nextRecommendation={nextRecommendation}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default GridMatrixPage;
