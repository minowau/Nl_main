/**
 * NLP Learning Grid API Service
 * Handles all backend communication
 */

// Use relative URL in production (since frontend is served by the backend)
// but keep localhost:5000 for local Vite development
const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';

export interface Position {
  x: number;
  y: number;
}

export interface Resource {
  id: string;
  position: Position;
  type: 'book' | 'video' | 'quiz' | 'assignment';
  title: string;
  visited: boolean;
  difficulty: number;
  reward: number;
  url?: string;
  description?: string;
}

export interface AgentState {
  position: Position;
  level: number;
  totalReward: number;
  visitedResources: string[];
}

export interface Polyline {
  id: string;
  name: string;
  path: Position[];
  color: string;
  isActive: boolean;
  confidence: number;
  summary?: string;
  keywords_found?: string[];
  module_scores?: number[];
}

export interface LearningData {
  totalResources: number;
  visitedResources: number;
  currentLevel: number;
  strengths: string[];
  recommendations: string[];
  nextOptimalResource: Position | null;
  totalReward: number;
}

export interface DQNPath {
  path: Position[];
  finalResource: Resource | null;
  totalReward: number;
  pathLength: number;
}

export interface LearningPlannerAPI {
  // Resources
  getResources(): Promise<Resource[]>;
  getResource(id: string): Promise<Resource>;

  // Agent State
  getAgentState(sessionId: string): Promise<AgentState>;
  moveAgent(sessionId: string, position: Position): Promise<AgentState>;

  // Resource Interaction
  visitResource(sessionId: string, resourceId: string): Promise<AgentState>;

  // Learning Summary
  createLearningSummary(
    sessionId: string,
    title: string,
    summary: string,
    visitedResources: string[]
  ): Promise<{
    summary: any;
    polyline: Polyline;
    assimilation_position?: { x: number; y: number };
    next_recommendation?: { id: string; title: string; position: { x: number; y: number }; module: string; reason: string } | null;
  }>;

  // Polylines
  getPolylines(): Promise<Polyline[]>;
  getPolyline(id: string): Promise<Polyline>;
  togglePolyline(id: string, isActive: boolean): Promise<Polyline>;

  // DQN
  generateDQNPath(
    sessionId: string,
    agentPosition: Position,
    visitedIds: string[]
  ): Promise<DQNPath>;

  // Learning Data
  getLearningData(sessionId: string): Promise<LearningData>;
}

class NLPLearningAPI implements LearningPlannerAPI {
  private sessionId: string;

  constructor(sessionId: string = 'default') {
    this.sessionId = sessionId;
  }

  async getResources(): Promise<Resource[]> {
    const response = await fetch(`${API_BASE}/resources`);
    if (!response.ok) throw new Error('Failed to fetch resources');
    return response.json();
  }

  async getResource(id: string): Promise<Resource> {
    const response = await fetch(`${API_BASE}/resources/${id}`);
    if (!response.ok) throw new Error('Failed to fetch resource');
    return response.json();
  }

  async getAgentState(sessionId: string = this.sessionId): Promise<AgentState> {
    const response = await fetch(`${API_BASE}/agent?session_id=${sessionId}`);
    if (!response.ok) throw new Error('Failed to fetch agent state');
    return response.json();
  }

  async moveAgent(
    sessionId: string = this.sessionId,
    position: Position
  ): Promise<AgentState> {
    const response = await fetch(`${API_BASE}/agent/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, position })
    });
    if (!response.ok) throw new Error('Failed to move agent');
    return response.json();
  }

  async visitResource(
    sessionId: string = this.sessionId,
    resourceId: string
  ): Promise<AgentState> {
    const response = await fetch(`${API_BASE}/resource/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, resource_id: resourceId })
    });
    if (!response.ok) throw new Error('Failed to visit resource');
    return response.json();
  }

  async createLearningSummary(
    sessionId: string = this.sessionId,
    title: string,
    summary: string,
    visitedResources: string[]
  ): Promise<{
    summary: any;
    polyline: Polyline;
    assimilation_position?: { x: number; y: number };
    next_recommendation?: { id: string; title: string; position: { x: number; y: number }; module: string; reason: string } | null;
  }> {
    const response = await fetch(`${API_BASE}/summary/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        title,
        summary,
        visited_resources: visitedResources
      })
    });
    if (!response.ok) throw new Error('Failed to create learning summary');
    return response.json();
  }

  async getPolylines(): Promise<Polyline[]> {
    const response = await fetch(`${API_BASE}/polylines`);
    if (!response.ok) throw new Error('Failed to fetch polylines');
    return response.json();
  }

  async getPolyline(id: string): Promise<Polyline> {
    const response = await fetch(`${API_BASE}/polylines/${id}`);
    if (!response.ok) throw new Error('Failed to fetch polyline');
    return response.json();
  }

  async togglePolyline(id: string, isActive: boolean): Promise<Polyline> {
    const response = await fetch(`${API_BASE}/polylines/${id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive })
    });
    if (!response.ok) throw new Error('Failed to toggle polyline');
    return response.json();
  }

  async generateDQNPath(
    sessionId: string = this.sessionId,
    agentPosition: Position,
    visitedIds: string[]
  ): Promise<DQNPath> {
    const response = await fetch(`${API_BASE}/dqn-path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        agent_position: agentPosition,
        visited_resource_ids: visitedIds
      })
    });
    if (!response.ok) throw new Error('Failed to generate DQN path');
    return response.json();
  }

  async getLearningData(sessionId: string = this.sessionId): Promise<LearningData> {
    const response = await fetch(`${API_BASE}/learning-data?session_id=${sessionId}`);
    if (!response.ok) throw new Error('Failed to fetch learning data');
    return response.json();
  }
}

// Export singleton instance
export const nlpApi = new NLPLearningAPI('default');

export default NLPLearningAPI;
