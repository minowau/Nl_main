import React, { useState } from 'react';
import { LearningSummary, Polyline } from '../types';
import { X } from 'lucide-react';

interface ControlPanelProps {
  onSummarizeLearning: (title: string, summary: string) => void;
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
  onShowPolyline,
  onToggleSimulation,
  learningData,
  polylines,
  isSimulationRunning,
  isLoading,
  learningPath
}) => {
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showPolylineModal, setShowPolylineModal] = useState(false);
  const [showPolylineListModal, setShowPolylineListModal] = useState(false);
  const [showModelSelectModal, setShowModelSelectModal] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [selectedPolyline, setSelectedPolyline] = useState<Polyline | null>(null);
  const [availableModels] = useState(['model1.pth', 'model2.pth', 'model3.pth', 'advanced_model.pth']);
  const [selectedModel, setSelectedModel] = useState('model2.pth');

  const handleSummarySubmit = () => {
    if (title.trim() && summary.trim()) {
      onSummarizeLearning(title, summary);
      setTitle('');
      setSummary('');
      setShowSummaryModal(false);
    }
  };

  const handleShowPolyline = () => {
    const activePolyline = polylines.find(p => p.isActive);
    if (activePolyline) {
      setSelectedPolyline(activePolyline);
      setShowPolylineModal(true);
    }
  };

  // Generate mock chart data for polyline visualization
  const generateChartData = (polyline: Polyline) => {
    const data = [];
    for (let i = 1; i <= 12; i++) {
      data.push({
        x: i,
        y: 0.5 + (Math.random() - 0.5) * 0.1 + Math.sin(i * 0.5) * 0.05
      });
    }
    return data;
  };

  const topicLegend = "Propositional Logic: 1  Predicate Logic: 2  Proof Strategies and Induction: 3  Sets and Relations: 4  Equivalence Relations: 5  Partitions: 6  Partial Orderings and Functions: 7  Theory of Countability: 8  Combinatorics: 9  Graph Theory: 10  Number theory: 11  Abstract Algebra: 12";

  return (
    <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">My Learning Map</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Need help ?</span>
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-sm">?</span>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="p-6 space-y-3">
        <button
          onClick={() => setShowSummaryModal(true)}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          Summarise My Learning
        </button>

        <button
          onClick={handleShowPolyline}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          See polyline
        </button>

        <button
          onClick={() => setShowPolylineListModal(true)}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Polylines List
        </button>

        <button
          onClick={() => setShowModelSelectModal(true)}
          className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
          Select DQN Model
        </button>

        <button
          onClick={onToggleSimulation}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          {isSimulationRunning ? 'Stop DQN' : 'Start DQN'}
        </button>
      </div>

      {/* Learning Timeline */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Beginning of Activities</span>
              <span className="text-xs text-gray-500">Start</span>
            </div>
          </div>

          {/* Timeline items */}
          <div className="space-y-4 overflow-y-auto flex-1 max-h-64 pr-2">
            {learningPath.slice(-3).map((item, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded"></div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">{item}</div>
                  <div className="text-xs text-gray-500">
                    Fri, 11 Apr, 2025, 06:04:{40 + index * 6} pm IST
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Resource https://www.youtube.com/watch?v=example{index}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Learning Summary</h3>
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter the title"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Summary
                  </label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Enter the summary or upload a pdf"
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex justify-start mt-6">
                <button
                  onClick={handleSummarySubmit}
                  disabled={!title.trim() || !summary.trim() || isLoading}
                  className="py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {isLoading ? 'Processing...' : 'Update My Position'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Polyline Chart Modal */}
      {showPolylineModal && selectedPolyline && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Learner Polyline</h3>
                <button
                  onClick={() => setShowPolylineModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Chart Container */}
              <div className="border border-gray-300 rounded-lg p-6 mb-4">
                <div className="relative h-80">
                  <svg width="100%" height="100%" viewBox="0 0 600 300">
                    {/* Grid lines */}
                    <defs>
                      <pattern id="grid" width="50" height="25" patternUnits="userSpaceOnUse">
                        <path d="M 50 0 L 0 0 0 25" fill="none" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    {/* Y-axis labels */}
                    <text x="20" y="50" fontSize="12" fill="#6b7280">0.59</text>
                    <text x="20" y="100" fontSize="12" fill="#6b7280">0.58</text>
                    <text x="20" y="150" fontSize="12" fill="#6b7280">0.57</text>
                    <text x="20" y="200" fontSize="12" fill="#6b7280">0.56</text>
                    <text x="20" y="250" fontSize="12" fill="#6b7280">0.55</text>
                    <text x="20" y="290" fontSize="12" fill="#6b7280">0.54</text>
                    
                    {/* X-axis labels */}
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                      <text key={i} x={40 + i * 45} y="290" fontSize="12" fill="#6b7280" textAnchor="middle">{i}</text>
                    ))}
                    
                    {/* Chart line */}
                    <polyline
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3"
                      points="85,80 130,120 175,110 220,100 265,60 310,90 355,80 400,50 445,140 490,110 535,70 580,60"
                    />
                    
                    {/* Data points */}
                    {[
                      {x: 85, y: 80}, {x: 130, y: 120}, {x: 175, y: 110}, {x: 220, y: 100},
                      {x: 265, y: 60}, {x: 310, y: 90}, {x: 355, y: 80}, {x: 400, y: 50},
                      {x: 445, y: 140}, {x: 490, y: 110}, {x: 535, y: 70}, {x: 580, y: 60}
                    ].map((point, i) => (
                      <circle key={i} cx={point.x} cy={point.y} r="4" fill="#2563eb" />
                    ))}
                  </svg>
                  
                  {/* Axis labels */}
                  <div className="absolute left-4 top-1/2 transform -rotate-90 -translate-y-1/2 text-sm text-gray-600">
                    Assimilation
                  </div>
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm text-gray-600">
                    Topic Index
                  </div>
                </div>
              </div>
              
              {/* Topic Legend */}
              <div className="text-sm text-gray-700">
                <div className="font-medium mb-2">Topic Legend:</div>
                <div className="text-xs leading-relaxed">
                  {topicLegend}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Polylines List Modal */}
      {showPolylineListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">My Learning Journey</h3>
                <button
                  onClick={() => setShowPolylineListModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-8">
                {polylines.map((polyline, index) => (
                  <div key={polyline.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-800">
                        {index === 0 ? 'Initial Polyline' : `After ${index} Contribution${index > 1 ? 's' : ''}`}
                      </h4>
                      <button
                        onClick={() => {
                          onShowPolyline(polyline.id);
                          setSelectedPolyline(polyline);
                          setShowPolylineListModal(false);
                          setShowPolylineModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>
                    
                    {/* Mini Chart */}
                    <div className="border border-gray-300 rounded p-4 mb-3">
                      <svg width="100%" height="200" viewBox="0 0 400 200">
                        {/* Grid */}
                        <defs>
                          <pattern id={`grid-${index}`} width="33" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 33 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="1,1"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill={`url(#grid-${index})`} />
                        
                        {/* Y-axis */}
                        <line x1="30" y1="20" x2="30" y2="180" stroke="#6b7280" strokeWidth="1"/>
                        <text x="25" y="25" fontSize="10" fill="#6b7280" textAnchor="end">0.58</text>
                        <text x="25" y="60" fontSize="10" fill="#6b7280" textAnchor="end">0.57</text>
                        <text x="25" y="100" fontSize="10" fill="#6b7280" textAnchor="end">0.56</text>
                        <text x="25" y="140" fontSize="10" fill="#6b7280" textAnchor="end">0.54</text>
                        <text x="25" y="175" fontSize="10" fill="#6b7280" textAnchor="end">0.50</text>
                        
                        {/* X-axis */}
                        <line x1="30" y1="180" x2="370" y2="180" stroke="#6b7280" strokeWidth="1"/>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                          <text key={i} x={30 + i * 28} y="195" fontSize="10" fill="#6b7280" textAnchor="middle">{i}</text>
                        ))}
                        
                        {/* Data line */}
                        <polyline
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="2"
                          points={generateChartData(polyline).map((point, i) => 
                            `${30 + (i + 1) * 28},${180 - (point.y - 0.4) * 400}`
                          ).join(' ')}
                        />
                        
                        {/* Data points */}
                        {generateChartData(polyline).map((point, i) => (
                          <circle 
                            key={i} 
                            cx={30 + (i + 1) * 28} 
                            cy={180 - (point.y - 0.4) * 400} 
                            r="3" 
                            fill="#2563eb" 
                          />
                        ))}
                      </svg>
                      
                      <div className="text-center mt-2">
                        <div className="text-xs text-gray-600">Topic Index</div>
                      </div>
                    </div>
                    
                    {/* Legend */}
                    <div className="text-xs text-gray-600 leading-relaxed">
                      <div className="font-medium mb-1">Topic Legend:</div>
                      {topicLegend}
                    </div>
                  </div>
                ))}
                
                {polylines.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No polylines generated yet. Create a learning summary to generate your first polyline.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Select DQN Model Modal */}
      {showModelSelectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Select DQN Model</h3>
                <button
                  onClick={() => setShowModelSelectModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Models
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    {availableModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-start mt-6">
                <button
                  onClick={() => {
                    // Handle model selection logic here
                    console.log('Selected model:', selectedModel);
                    setShowModelSelectModal(false);
                  }}
                  className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Select Model
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};