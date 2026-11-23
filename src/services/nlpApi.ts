/**
 * NLP Learning Grid API Service
 * Handles all backend communication
 */

// Use relative URL in production (since frontend is served by the backend)
// but keep localhost:5000 for local Vite development
const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';

const apiFetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
  const token = localStorage.getItem('nl_auth_token');
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
};

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
  xp_earned?: number;
  mostVisitedModule?: string;
  persona?: {
    id: number;
    name: string;
    description: string;
    color: string;
  } | null;
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
  signup(data: { full_name: string; identifier: string; password: string; school_code: string }): Promise<AuthUser>;
  login(identifier: string, password: string): Promise<AuthUser>;
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
    average_polyline?: Polyline;
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
  resetSession(sessionId: string): Promise<any>;
}

export interface AuthUser {
  id: string;
  fullName: string;
  identifier: string;
  schoolCode: string;
  token: string;
}

class NLPLearningAPI implements LearningPlannerAPI {
  private sessionId: string;

  constructor(sessionId: string = 'default') {
    this.sessionId = sessionId;
  }

  async signup(data: { full_name: string; identifier: string; password: string; school_code: string }): Promise<AuthUser> {
    const response = await fetch(`${API_BASE}/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!response.ok) throw new Error((await response.json()).error || 'Failed to sign up');
    const user = await response.json();
    localStorage.setItem('nl_auth_token', user.token);
    localStorage.setItem('nl_user', JSON.stringify(user));
    return user;
  }

  async login(identifier: string, password: string): Promise<AuthUser> {
    const response = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier, password }) });
    if (!response.ok) throw new Error((await response.json()).error || 'Failed to sign in');
    const user = await response.json();
    localStorage.setItem('nl_auth_token', user.token);
    localStorage.setItem('nl_user', JSON.stringify(user));
    return user;
  }

  async getResources(): Promise<Resource[]> {
    const response = await apiFetch(`${API_BASE}/resources`);
    if (!response.ok) throw new Error('Failed to fetch resources');
    return response.json();
  }

  async getResource(id: string): Promise<Resource> {
    const response = await apiFetch(`${API_BASE}/resources/${id}`);
    if (!response.ok) throw new Error('Failed to fetch resource');
    return response.json();
  }

  async getAgentState(sessionId: string = this.sessionId): Promise<AgentState> {
    const response = await apiFetch(`${API_BASE}/agent?session_id=${sessionId}`);
    if (!response.ok) throw new Error('Failed to fetch agent state');
    return response.json();
  }

  async moveAgent(
    sessionId: string = this.sessionId,
    position: Position
  ): Promise<AgentState> {
    const response = await apiFetch(`${API_BASE}/agent/move`, {
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
    const response = await apiFetch(`${API_BASE}/resource/visit`, {
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
    average_polyline?: Polyline;
    assimilation_position?: { x: number; y: number };
    next_recommendation?: { id: string; title: string; position: { x: number; y: number }; module: string; reason: string } | null;
  }> {
    const response = await apiFetch(`${API_BASE}/summary/create`, {
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
    const response = await apiFetch(`${API_BASE}/polylines`);
    if (!response.ok) throw new Error('Failed to fetch polylines');
    return response.json();
  }

  async getPolyline(id: string): Promise<Polyline> {
    const response = await apiFetch(`${API_BASE}/polylines/${id}`);
    if (!response.ok) throw new Error('Failed to fetch polyline');
    return response.json();
  }

  async togglePolyline(id: string, isActive: boolean): Promise<Polyline> {
    const response = await apiFetch(`${API_BASE}/polylines/${id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive })
    });
    if (!response.ok) throw new Error('Failed to toggle polyline');
    return response.json();
  }

  async getBookmarks(sessionId: string = this.sessionId): Promise<string[]> {
    const response = await apiFetch(`${API_BASE}/bookmarks?session_id=${sessionId}`);
    if (!response.ok) throw new Error('Failed to fetch bookmarks');
    return response.json();
  }

  async addBookmark(sessionId: string = this.sessionId, resourceId: string): Promise<any> {
    const response = await apiFetch(`${API_BASE}/bookmarks/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, resource_id: resourceId })
    });
    if (!response.ok) throw new Error('Failed to add bookmark');
    return response.json();
  }

  async removeBookmark(sessionId: string = this.sessionId, resourceId: string): Promise<any> {
    const response = await apiFetch(`${API_BASE}/bookmarks/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, resource_id: resourceId })
    });
    if (!response.ok) throw new Error('Failed to remove bookmark');
    return response.json();
  }

  async getNotes(sessionId: string = this.sessionId): Promise<Note[]> {
    const response = await apiFetch(`${API_BASE}/notes?session_id=${sessionId}`);
    if (!response.ok) throw new Error('Failed to fetch notes');
    return response.json();
  }

  async addNote(sessionId: string = this.sessionId, note: Partial<Note>): Promise<Note> {
    const response = await apiFetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, note })
    });
    if (!response.ok) throw new Error('Failed to add note');
    return response.json();
  }

  async getLectures(): Promise<Lecture[]> {
    const response = await apiFetch(`${API_BASE}/lectures`);
    if (!response.ok) throw new Error('Failed to fetch lectures');
    return response.json();
  }

  async generateDQNPath(
    sessionId: string = this.sessionId,
    agentPosition: Position,
    visitedIds: string[]
  ): Promise<DQNPath> {
    const response = await apiFetch(`${API_BASE}/dqn-path`, {
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
    const response = await apiFetch(`${API_BASE}/learning-data?session_id=${sessionId}`);
    if (!response.ok) throw new Error('Failed to fetch learning data');
    const data = await response.json();
    return data;
  }

  async chat(
    module: string,
    question: string,
    history: { role: string; content: string }[]
  ): Promise<{ answer: string; source: string }> {
    const response = await apiFetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module, question, history })
    });
    if (!response.ok) throw new Error('Failed to chat with AI');
    return response.json();
  }

  async getNotifications(sessionId: string = this.sessionId): Promise<Notification[]> {
    const response = await apiFetch(`${API_BASE}/notifications?session_id=${sessionId}`);
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  }

  async addNotification(sessionId: string = this.sessionId, message: string, type: string = 'info'): Promise<Notification> {
    const response = await apiFetch(`${API_BASE}/notifications/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, message, type })
    });
    if (!response.ok) throw new Error('Failed to add notification');
    return response.json();
  }

  async markNotificationsRead(sessionId: string = this.sessionId): Promise<any> {
    const response = await apiFetch(`${API_BASE}/notifications/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });
    if (!response.ok) throw new Error('Failed to mark notifications read');
    return response.json();
  }

  async resetSession(sessionId: string = this.sessionId): Promise<any> {
    const response = await apiFetch(`${API_BASE}/reset_session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });
    if (!response.ok) throw new Error('Failed to reset session');
    return response.json();
  }

  async orchestrateStudyAgents(
    module: string,
    visitedModules: string[] = [],
    studentLevel: number = 1,
    activeSubagent?: 'coach' | 'notes' | 'flashcards' | 'quiz'
  ): Promise<{
    orchestrator: {
      lessonProfile: {
        id: string;
        title: string;
        module: string;
        difficulty: number;
        nature: string;
        isVisited: boolean;
      };
      primaryAgent: 'coach' | 'notes' | 'flashcards' | 'quiz';
      activeAgent: 'coach' | 'notes' | 'flashcards' | 'quiz';
      recommendedSequence: ('coach' | 'notes' | 'flashcards' | 'quiz')[];
      reasoning: string;
      source: string;
      subagents: {
        id: 'coach' | 'notes' | 'flashcards' | 'quiz';
        name: string;
        role: string;
        directive: string;
        status: 'primary' | 'allocated';
        source: string;
      }[];
    };
    outputs: {
      coach: {
        agentId: string;
        agentName: string;
        directive: string;
        intuition: string;
        prerequisiteBridge: string;
        realWorldAnalogy: string;
        stepByStepBreakdown: string[];
        source: string;
      };
      notes: {
        agentId: string;
        agentName: string;
        directive: string;
        module: string;
        title: string;
        lessonTitle: string;
        overview: string;
        takeaways: string[];
        examTip?: string;
        formattedNote: string;
        source: string;
      };
      flashcards: {
        agentId: string;
        agentName: string;
        directive: string;
        flashcards: { front: string; back: string; tag?: string }[];
        source: string;
      };
      quiz: {
        agentId: string;
        agentName: string;
        directive: string;
        module: string;
        title: string;
        source: string;
        questions: {
          id: string;
          question: string;
          options: string[];
          correctIndex: number;
          explanation: string;
        }[];
      };
    };
  }> {
    const response = await apiFetch(`${API_BASE}/agent/orchestrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module,
        visited_modules: visitedModules,
        student_level: studentLevel,
        active_subagent: activeSubagent
      })
    });
    if (!response.ok) throw new Error('Failed to orchestrate study agents');
    return response.json();
  }

  async generateAgentQuiz(
    module: string,
    numQuestions: number = 3
  ): Promise<{
    module: string;
    title: string;
    source: string;
    questions: {
      id: string;
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }[];
  }> {
    const response = await apiFetch(`${API_BASE}/agent/quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module, num_questions: numQuestions })
    });
    if (!response.ok) throw new Error('Failed to generate quiz');
    return response.json();
  }

  async generateAgentStudyNotes(
    module: string,
    saveToHub: boolean = false
  ): Promise<{
    module: string;
    title: string;
    lessonTitle: string;
    overview: string;
    takeaways: string[];
    flashcards: { front: string; back: string }[];
    formattedNote: string;
    source: string;
    savedNote?: Note;
  }> {
    const response = await apiFetch(`${API_BASE}/agent/study-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module, save_to_hub: saveToHub })
    });
    if (!response.ok) throw new Error('Failed to generate study notes');
    return response.json();
  }
}

// Export singleton instance
export const nlpApi = new NLPLearningAPI('default');

export default NLPLearningAPI;
