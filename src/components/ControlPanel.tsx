import React, { useState } from 'react';
import { LearningSummary, Polyline } from '../types';
import { Brain, TrendingUp, Map, List, Play, Pause, Send, Eye, Route, X } from 'lucide-react';

interface ControlPanelProps {
  onSummarizeLearning: () => void;
  onSummarizeLearningWithText: (summary: string) => void;
  onShowPolyline: (polylineId: string) => void;
  onToggleSimulation: () => void;
  learningData: LearningSummary;
  polylines: Polyline[];
  isSimulationRunning: boolean;
  isLoading: boolean;
  learningPath: string[];
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onSummarizeLearning,
  onSummarizeLearningWithText,
  onShowPolyline,
  onToggleSimulation,
  learningData,
  polylines,
  isSimulationRunning,
  isLoading,
  learningPath
}) => {
  const [showPolylineList, setShowPolylineList] = useState(false);
  const [selectedPolyline, setSelectedPolyline] = useState<string | null>(null);
  const [showSummaryInput, setShowSummaryInput] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [reflectionText, setReflectionText] = useState('');
  const [showPolylineModal, setShowPolylineModal] = useState(false);

  const handlePolylineSelect = (polylineId: string) => {
    setSelectedPolyline(polylineId);
    onShowPolyline(polylineId);
  };

  const handleSummarySubmit = () => {
    if (summaryText.trim() && reflectionText.trim()) {
      onSummarizeLearningWithText(`Summary: ${summaryText}\nReflection: ${reflectionText}`);
      setSummaryText('');
      setReflectionText('');
      setShowSummaryInput(false);
    }
  };

  return (
    <div className="bg-white p-4 lg:p-6 rounded-lg shadow-lg relative">
      <div className="text-center mb-6">
        <h2 className="text-base lg:text-lg font-semibold text-gray-800 mb-1">Control Center</h2>
        <p className="text-xs text-gray-600">Analyze learning patterns and control the DQN agent</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section - Learning Statistics */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            Learning Progress
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs mb-3">
            <div>
              <span className="text-blue-600">Resources Visited:</span>
              <span className="ml-2 font-semibold">{learningData.visitedResources}/{learningData.totalResources}</span>
            </div>
            <div>
              <span className="text-blue-600">Current Level:</span>
              <span className="ml-2 font-semibold">{learningData.currentLevel}</span>
            </div>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(learningData.visitedResources / learningData.totalResources) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Middle Section - Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center items-center">
          <button
            onClick={() => setShowSummaryInput(!showSummaryInput)}
            disabled={isLoading}
            className={`
              py-2 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 text-sm
              ${isLoading 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl'
              }
              transition-all duration-300 transform hover:scale-105
            `}
          >
            <Brain className="w-4 h-4" />
            <span>Summarise Learning</span>
          </button>

          <button
            onClick={() => setShowPolylineModal(true)}
            className="py-2 px-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm"
          >
            <Eye className="w-4 h-4" />
            <span>See Polyline</span>
          </button>

          <button
            onClick={() => setShowPolylineList(!showPolylineList)}
            className="py-2 px-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm"
          >
            <List className="w-4 h-4" />
            <span>Polylines List</span>
          </button>

          <button
            onClick={onToggleSimulation}
            className={`
              py-2 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 text-sm
              ${isSimulationRunning 
                ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-lg hover:shadow-xl' 
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-xl'
              }
              text-white transition-all duration-300 transform hover:scale-105
            `}
          >
            {isSimulationRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isSimulationRunning ? 'Pause DQN' : 'Start DQN'}</span>
          </button>
        </div>

        {/* Right Section - Learning Path & Recommendations */}
        <div className="space-y-3">
          {/* Learning Path */}
          {learningPath.length > 0 && (
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2 text-sm flex items-center">
                <Route className="w-4 h-4 mr-2" />
                Learning Path
              </h4>
              <div className="text-xs text-yellow-700">
                {learningPath.slice(-3).join(' → ')}
                {learningPath.length > 3 && '...'}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {learningData.recommendations.length > 0 && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2 text-sm">DQN Recommendations</h4>
              <ul className="text-xs text-green-700 space-y-1">
                {learningData.recommendations.slice(0, 1).map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-2 h-2 bg-green-400 rounded-full mt-1 mr-2 flex-shrink-0"></span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Summary Input Modal */}
      {showSummaryInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Learning Summary</h3>
                <button
                  onClick={() => setShowSummaryInput(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What did you learn? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={summaryText}
                    onChange={(e) => setSummaryText(e.target.value)}
                    placeholder="Describe the key concepts and knowledge you gained from the resources..."
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How will you apply this knowledge? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                    placeholder="Reflect on how you'll use this knowledge in practice or future learning..."
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleSummarySubmit}
                  disabled={!summaryText.trim() || !reflectionText.trim() || isLoading}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-lg text-sm font-medium flex items-center justify-center space-x-2 transition-all duration-200"
                >
                  <Send className="w-4 h-4" />
                  <span>{isLoading ? 'Processing...' : 'Generate Polyline'}</span>
                </button>
                <button
                  onClick={() => setShowSummaryInput(false)}
                  className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Polyline Modal */}
      {showPolylineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Current Polyline</h3>
                <button
                  onClick={() => setShowPolylineModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {polylines.find(p => p.isActive) ? (
                <div className="space-y-3">
                  {polylines.filter(p => p.isActive).map(polyline => (
                    <div key={polyline.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-800">{polyline.name}</h4>
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: polyline.color }}
                        ></div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Confidence: {Math.round(polyline.confidence * 100)}%</p>
                        <p>Path Length: {polyline.path.length} steps</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Map className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No active polyline to display</p>
                  <p className="text-sm text-gray-400 mt-1">Submit a learning summary to generate your first polyline</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Polylines List Popup */}
      {showPolylineList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Map className="w-5 h-5 mr-2" />
                  All Polylines
                </h3>
                <button
                  onClick={() => setShowPolylineList(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {polylines.length === 0 ? (
                <div className="text-center py-8">
                  <Map className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No polylines generated yet</p>
                  <p className="text-sm text-gray-400 mt-1">Submit learning summaries to create polylines</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {polylines.map((polyline) => (
                    <button
                      key={polyline.id}
                      onClick={() => handlePolylineSelect(polyline.id)}
                      className={`
                        w-full text-left p-4 rounded-lg transition-all duration-200
                        ${selectedPolyline === polyline.id 
                          ? 'bg-blue-50 border-2 border-blue-300 shadow-md' 
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:shadow-md'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{polyline.name}</span>
                        <div 
                          className="w-4 h-4 rounded-full shadow-sm"
                          style={{ backgroundColor: polyline.color }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Confidence: {Math.round(polyline.confidence * 100)}%</span>
                          <span>Length: {polyline.path.length} steps</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Status: {polyline.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};