import React, { useState } from 'react';
import { LearningSummary, Polyline } from '../types';
import { X, BookOpen, Activity, Map, PlayCircle, HelpCircle } from 'lucide-react';

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
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [selectedPolyline, setSelectedPolyline] = useState<Polyline | null>(null);

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

  // Generate chart data for polyline visualization
  const generateChartData = (polyline: Polyline) => {
    if (polyline.module_scores && polyline.module_scores.length > 0) {
      return polyline.module_scores.map((score, index) => ({
        x: index + 1,
        y: score
      }));
    }

    const data = [];
    for (let i = 1; i <= 18; i++) {
      data.push({
        x: i,
        y: 0.5 + (Math.random() - 0.5) * 0.1 + Math.sin(i * 0.5) * 0.05
      });
    }
    return data;
  };

  const topicLegendItems = [
    "Pre training objectives", "Pre trained models", "Tutorial: Introduction to huggingface",
    "Fine tuning LLM", "Instruction tuning", "Prompt based learning",
    "Parameter efficient fine tuning", "Incontext Learning", "Prompting methods",
    "Retrieval Methods", "Retrieval Augmented Generation", "Quantization",
    "Mixture of Experts Model", "Agentic AI", "Multimodal LLMs",
    "Vision Language Models", "Policy learning using DQN", "RLHF"
  ];

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-gray-900">Control Center</h2>
          <button className="text-gray-400 hover:text-blue-600 transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500">Manage your learning journey and analysis</p>
      </div>

      {/* Control Actions */}
      <div className="p-6 space-y-3 bg-gray-50/50 border-b border-gray-100">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Actions</label>
        <button
          onClick={() => setShowSummaryModal(true)}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
        >
          <BookOpen className="w-4 h-4" />
          Summarize Learning
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleShowPolyline}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm rounded-xl font-medium transition-all"
          >
            <Activity className="w-4 h-4 text-blue-500" />
            Current Polyline
          </button>

          <button
            onClick={() => setShowPolylineListModal(true)}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm rounded-xl font-medium transition-all"
          >
            <Map className="w-4 h-4 text-purple-500" />
            History
          </button>
        </div>

        <button
          onClick={onToggleSimulation}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 border text-sm rounded-xl font-medium transition-all ${isSimulationRunning
            ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
            : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'
            }`}
        >
          <PlayCircle className="w-4 h-4" />
          {isSimulationRunning ? 'Stop DQN Simulation' : 'Start DQN Simulation'}
        </button>
      </div>

      {/* Learning Stats */}
      {(learningData.strengths.length > 0 || learningData.recommendations.length > 0) && (
        <div className="px-6 py-4 bg-white border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Insights</h3>

          {learningData.strengths.length > 0 && (
            <div className="mb-3">
              <span className="text-xs font-semibold text-green-600 mb-1 block">Strengths</span>
              <div className="flex flex-wrap gap-1.5">
                {learningData.strengths.slice(0, 3).map((strength, i) => (
                  <span key={i} className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-medium rounded border border-green-100">
                    {strength}
                  </span>
                ))}
              </div>
            </div>
          )}

          {learningData.recommendations.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-blue-600 mb-1 block">Recommended</span>
              <div className="flex flex-wrap gap-1.5">
                {learningData.recommendations.slice(0, 2).map((rec, i) => (
                  <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded border border-blue-100">
                    {rec}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Learning Timeline */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col min-h-0 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900">Activity Log</h3>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{learningPath.length} items</span>
        </div>

        <div className="space-y-0 overflow-y-auto flex-1 pr-2 -mr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <div className="relative pl-4 border-l-2 border-gray-100 space-y-6 py-2">
            {[...learningPath].reverse().slice(0, 10).map((item, index) => (
              <div key={index} className="relative group">
                <div className="absolute -left-[21px] top-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full group-hover:scale-125 transition-transform duration-200"></div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 mb-0.5">Just now</span>
                  <span className="text-sm font-medium text-gray-800 leading-tight group-hover:text-blue-600 transition-colors">{item}</span>
                </div>
              </div>
            ))}

            <div className="relative">
              <div className="absolute -left-[21px] top-1.5 w-3 h-3 bg-gray-200 rounded-full"></div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400">Session Start</span>
                <span className="text-sm text-gray-500">Initialized learning environment</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Summarize Learning</h3>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Introduction to Transformers"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Key Takeaways</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Describe what you learned..."
                  className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200/50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSummarySubmit}
                disabled={!title.trim() || !summary.trim() || isLoading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-sm shadow-blue-200 transition-all transform active:scale-95"
              >
                {isLoading ? 'Processing...' : 'Save Summary'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Polyline Chart Modal */}
      {showPolylineModal && selectedPolyline && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Learning Analysis</h3>
                <p className="text-sm text-gray-500">Polyline visualization of your learning path</p>
              </div>
              <button
                onClick={() => setShowPolylineModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Keywords Detected */}
              {selectedPolyline.keywords_found && selectedPolyline.keywords_found.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Detected Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPolyline.keywords_found.map((keyword, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-100">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Chart Container */}
              <div className="bg-gray-50/50 border border-gray-200 rounded-2xl p-6 mb-6">
                <div className="relative h-80 w-full">
                  <svg width="100%" height="100%" viewBox="0 0 600 300" className="overflow-visible">
                    {/* Grid lines */}
                    <defs>
                      <pattern id="grid" width="33.33" height="50" patternUnits="userSpaceOnUse">
                        <path d="M 33.33 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,3" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" opacity="0.6" />

                    {/* Y-axis labels */}
                    <g className="text-[10px] fill-gray-400">
                      <text x="-10" y="30" textAnchor="end">1.0</text>
                      <text x="-10" y="155" textAnchor="end">0.5</text>
                      <text x="-10" y="280" textAnchor="end">0.0</text>
                    </g>

                    {/* X-axis labels */}
                    {Array.from({ length: 18 }, (_, i) => i + 1).map(i => (
                      <text key={i} x={33.33 * i - 16} y="315" fontSize="10" fill="#9ca3af" textAnchor="middle">{i}</text>
                    ))}

                    {/* Chart area */}
                    <path
                      d={`M 0 300 ${generateChartData(selectedPolyline).map((point, i) =>
                        `L ${33.33 * (i + 1)} ${280 - point.y * 250}`
                      ).join(' ')} L 600 300 Z`}
                      fill="url(#gradient)"
                      opacity="0.1"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    <polyline
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={generateChartData(selectedPolyline).map((point, i) =>
                        `${33.33 * (i + 1)},${280 - point.y * 250}`
                      ).join(' ')}
                      className="drop-shadow-sm"
                    />

                    {/* Data points */}
                    {generateChartData(selectedPolyline).map((point, i) => (
                      <circle
                        key={i}
                        cx={33.33 * (i + 1)}
                        cy={280 - point.y * 250}
                        r="4"
                        className="fill-white stroke-blue-600 stroke-2 hover:r-6 hover:stroke-4 transition-all cursor-pointer"
                      />
                    ))}
                  </svg>

                  {/* Axis titles */}
                  <div className="absolute -left-12 top-1/2 transform -rotate-90 -translate-y-1/2 text-xs font-semibold text-gray-400 tracking-wider">
                    ASSIMILATION SCORE
                  </div>
                  <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-400 tracking-wider">
                    TOPIC INDEX
                  </div>
                </div>
              </div>

              {/* Topic Legend */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {topicLegendItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 bg-gray-100 rounded text-[10px] font-bold text-gray-600">
                      {index + 1}
                    </span>
                    <span className="text-xs text-gray-600 leading-tight" title={item}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Polylines List Modal */}
      {showPolylineListModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Journey History</h3>
                <p className="text-sm text-gray-500">Track how your knowledge map evolved</p>
              </div>
              <button
                onClick={() => setShowPolylineListModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 grid gap-6 md:grid-cols-2">
              {polylines.map((polyline, index) => (
                <div key={polyline.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {index === 0 ? 'Initial State' : `Contribution #${index}`}
                    </h4>
                    <span className="text-xs text-gray-500">{polyline.confidence ? `${(polyline.confidence * 100).toFixed(0)}% Confidence` : 'N/A'}</span>
                  </div>

                  <div className="p-4 relative">
                    <svg width="100%" height="80" viewBox="0 0 300 80" className="overflow-visible">
                      <polyline
                        fill="none"
                        stroke={index === polylines.length - 1 ? "#2563eb" : "#9ca3af"}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={generateChartData(polyline).map((point, i) =>
                          `${(300 / 18) * (i + 1)},${80 - point.y * 60}`
                        ).join(' ')}
                      />
                    </svg>

                    <button
                      onClick={() => {
                        onShowPolyline(polyline.id);
                        setSelectedPolyline(polyline);
                        setShowPolylineListModal(false);
                        setShowPolylineModal(true);
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-white/0 group-hover:bg-white/80 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <span className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                        Analyze Details
                      </span>
                    </button>
                  </div>
                </div>
              ))}

              {polylines.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <BookOpen className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                  <p>No history available yet.</p>
                  <p className="text-sm mt-1">Submit a learning summary to start tracking.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};