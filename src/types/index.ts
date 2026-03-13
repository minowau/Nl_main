export interface GridPosition {
  x: number;
  y: number;
}

export interface Resource {
  id: string;
  position: GridPosition;
  type: 'book' | 'quiz' | 'video' | 'assignment';
  title: string;
  visited: boolean;
  difficulty: number;
  reward: number;
  youtube_url?: string;
}

export interface Agent {
  position: GridPosition;
  level: number;
  totalReward: number;
  visitedResources: string[];
}

export interface Polyline {
  id: string;
  name: string;
  path: GridPosition[];
  color: string;
  isActive: boolean;
  confidence: number;
  summary?: string;
  keywords_found?: string[];
  module_scores?: number[];
  strengths?: string[];
  dominant_topics?: string[];
  ai_analysis?: string;
  assimilation_position?: GridPosition;
  next_recommendation?: {
    id: string;
    title: string;
    position: GridPosition;
    module: string;
    reason: 'dqn' | 'fallback';
  };
}

export interface LearningActivity {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  difficulty: number;
  prerequisites: string[];
  estimatedTime: string;
}

export interface LearningMap {
  activities: LearningActivity[];
  currentActivity: string | null;
  progressPercentage: number;
}

export interface LearningSummary {
  totalResources: number;
  visitedResources: number;
  currentLevel: number;
  strengths: string[];
  recommendations: string[];
  ai_analysis?: string;
  nextOptimalResource: GridPosition | null;
  mostVisitedModule?: string;
  totalReward?: number;
}