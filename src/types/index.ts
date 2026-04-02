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
  module: string;
  description?: string;
  url?: string;
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
    reason: string;
  } | null;
}

export interface ActivityLogEntry {
  id: string;
  type: 'visit' | 'summary' | 'start' | 'optimal' | 'search';
  title: string;
  timestamp: string;
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
  activityLog?: ActivityLogEntry[];
}