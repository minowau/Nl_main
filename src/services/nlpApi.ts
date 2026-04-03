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
  youtube_url?: string;
  module: string;
  description?: string;
  url?: string;
  high_line?: number;
  base_points?: number;
}

export interface AgentState {
  position: Position;
  level: number;
  totalReward: number;
  visitedResources: string[];
  notifications?: Notification[];
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning';
  message: string;
  timestamp: number;
  read: boolean;
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
  dominant_topics?: string[];
  ai_analysis?: string;
  assimilation_position?: Position;
  next_recommendation?: {
    id: string;
    title: string;
    position: Position;
    module: string;
    reason: string;
  } | null;
}

export interface LearningData {
  totalResources: number;
  visitedResources: number;
  currentLevel: number;
  strengths: string[];
  recommendations: string[];
  nextOptimalResource: Position | null;
  totalReward: number;
  activityLog?: any[];
  activityHeatmap?: Record<string, number>;
  ai_analysis?: string;
  xp_earned?: number;
  mostVisitedModule?: string;
}

export interface Note {
  id: string;
  section: 'discrete' | 'nlp';
  title: string;
  content: string;
  createdAt: string;
}

export interface Lecture {
  id: string;
  section: 'discrete' | 'nlp';
  title: string;
  url: string;
  thumbnail?: string;
  duration?: string;
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

  // Bookmarks
  getBookmarks(sessionId: string): Promise<string[]>;
  addBookmark(sessionId: string, resourceId: string): Promise<any>;
  removeBookmark(sessionId: string, resourceId: string): Promise<any>;

  // Notes
  getNotes(sessionId: string): Promise<Note[]>;
  addNote(sessionId: string, note: Partial<Note>): Promise<Note>;

  // Lectures
  getLectures(): Promise<Lecture[]>;

  // DQN
  generateDQNPath(
    sessionId: string,
    agentPosition: Position,
    visitedIds: string[]
  ): Promise<DQNPath>;

  // ChatGPT
  chat(
    module: string,
    question: string,
    history: { role: string; content: string }[]
  ): Promise<{ answer: string; source: string }>;

  // Learning Data
  getLearningData(sessionId: string): Promise<LearningData>;

  // Notifications
  getNotifications(sessionId: string): Promise<Notification[]>;
  addNotification(sessionId: string, message: string, type?: string): Promise<Notification>;
  markNotificationsRead(sessionId: string): Promise<any>;
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

  async getBookmarks(sessionId: string = this.sessionId): Promise<string[]> {
    const response = await fetch(`${API_BASE}/bookmarks?session_id=${sessionId}`);
    if (!response.ok) throw new Error('Failed to fetch bookmarks');
    return response.json();
  }

  async addBookmark(sessionId: string = this.sessionId, resourceId: string): Promise<any> {
    const response = await fetch(`${API_BASE}/bookmarks/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, resource_id: resourceId })
    });
    if (!response.ok) throw new Error('Failed to add bookmark');
    return response.json();
  }

  async removeBookmark(sessionId: string = this.sessionId, resourceId: string): Promise<any> {
    const response = await fetch(`${API_BASE}/bookmarks/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, resource_id: resourceId })
    });
    if (!response.ok) throw new Error('Failed to remove bookmark');
    return response.json();
  }

  async getNotes(sessionId: string = this.sessionId): Promise<Note[]> {
    const response = await fetch(`${API_BASE}/notes?session_id=${sessionId}`);
    if (!response.ok) throw new Error('Failed to fetch notes');
    return response.json();
  }

  async addNote(sessionId: string = this.sessionId, note: Partial<Note>): Promise<Note> {
    const response = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, note })
    });
    if (!response.ok) throw new Error('Failed to add note');
    return response.json();
  }

  async getLectures(): Promise<Lecture[]> {
    const response = await fetch(`${API_BASE}/lectures`);
    if (!response.ok) throw new Error('Failed to fetch lectures');
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
    const data = await response.json();
    return data;
  }

  async chat(
    module: string,
    question: string,
    history: { role: string; content: string }[]
  ): Promise<{ answer: string; source: string }> {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module, question, history })
    });
    if (!response.ok) throw new Error('Failed to chat with AI');
    return response.json();
  }

  async getNotifications(sessionId: string = this.sessionId): Promise<Notification[]> {
    const response = await fetch(`${API_BASE}/notifications?session_id=${sessionId}`);
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  }

  async addNotification(sessionId: string = this.sessionId, message: string, type: string = 'info'): Promise<Notification> {
    const response = await fetch(`${API_BASE}/notifications/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, message, type })
    });
    if (!response.ok) throw new Error('Failed to add notification');
    return response.json();
  }

  async markNotificationsRead(sessionId: string = this.sessionId): Promise<any> {
    const response = await fetch(`${API_BASE}/notifications/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });
    if (!response.ok) throw new Error('Failed to mark notifications read');
    return response.json();
  }
}

// Export singleton instance
export const nlpApi = new NLPLearningAPI('default');

export default NLPLearningAPI;
