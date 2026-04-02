import React, { useState } from 'react';
import { LearningActivity, LearningMap } from '../types';
import { CheckCircle, Clock, Lock, ArrowDown, Target } from 'lucide-react';

interface LearningRoadmapProps {
  learningMap: LearningMap;
  onActivitySelect: (activityId: string) => void;
}

export const LearningRoadmap: React.FC<LearningRoadmapProps> = ({
  learningMap,
  onActivitySelect
}) => {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  const isActivityUnlocked = (activity: LearningActivity) => {
    if (activity.prerequisites.length === 0) return true;
    return activity.prerequisites.every(prereqId =>
      learningMap.activities.find(a => a.id === prereqId)?.completed
    );
  };

  const getActivityIcon = (activity: LearningActivity) => {
    if (activity.completed) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (isActivityUnlocked(activity)) {
      return <Target className="w-5 h-5 text-blue-500" />;
    } else {
      return <Lock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getActivityStyle = (activity: LearningActivity) => {
    if (activity.completed) {
      return 'bg-green-50 border-green-200 text-green-800 shadow-sm';
    } else if (isActivityUnlocked(activity)) {
      return 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100 cursor-pointer shadow-sm hover:shadow-md transform hover:scale-[1.02] transition-all duration-200';
    } else {
      return 'bg-gray-50 border-gray-200 text-gray-500';
    }
  };

  const handleActivityClick = (activity: LearningActivity) => {
    if (isActivityUnlocked(activity) && !activity.completed) {
      setSelectedActivity(activity.id);
      onActivitySelect(activity.id);
    }
  };

  return (
    <div className="bg-white p-3 lg:p-4 rounded-lg shadow-lg h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-sm lg:text-base font-semibold text-gray-800 mb-2">Learning Roadmap</h2>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600">Track your learning journey</p>
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-600">Progress:</div>
            <div className="text-xs font-semibold text-blue-600">
              {Math.round(learningMap.progressPercentage)}%
            </div>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${learningMap.progressPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto">
        {learningMap.activities.map((activity, index) => (
          <div key={activity.id} className="relative">
            <div
              className={`
                p-4 rounded-lg border-2 transition-all duration-300 
                ${getActivityStyle(activity)}
                ${selectedActivity === activity.id ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
              `}
              onClick={() => handleActivityClick(activity)}
            >
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-1">{activity.name}</h3>
                  <p className="text-xs opacity-80 mb-2">{activity.description}</p>
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{activity.estimatedTime}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className={`
                          w-3 h-3 rounded-full shadow-sm
                          ${activity.difficulty <= 2 ? 'bg-green-400' : 
                            activity.difficulty <= 4 ? 'bg-yellow-400' : 'bg-red-400'}
                        `}></div>
                        <span>Level {activity.difficulty}</span>
                      </div>
                    </div>
                    
                    {activity.prerequisites.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Prerequisites: {activity.prerequisites.length}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {learningMap.currentActivity === activity.id && (
                <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full shadow-sm"></div>
                </div>
              )}
            </div>
            
            {index < learningMap.activities.length - 1 && (
              <div className="flex justify-center py-2">
                <div className="flex flex-col items-center">
                  <div className="w-px h-4 bg-gray-300"></div>
                  <ArrowDown className="w-4 h-4 text-gray-400" />
                  <div className="w-px h-4 bg-gray-300"></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Legend</h4>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center space-x-1">
            <Target className="w-3 h-3 text-blue-500" />
            <span className="text-gray-600">Available</span>
          </div>
          <div className="flex items-center space-x-1">
            <Lock className="w-3 h-3 text-gray-400" />
            <span className="text-gray-600">Locked</span>
          </div>
        </div>
      </div>
    </div>
  );
};